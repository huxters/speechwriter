import OpenAI from 'openai';

/**
 * ParsedBrief is the structured interpretation of a user's free-text brief.
 * It is deliberately soft / suggestive: everything here is a hint, not a hard constraint.
 */
export type ParsedBrief = {
  role_inferred?: string; // e.g. "CEO", "Headteacher", "Student", "Candidate"
  audience_inferred?: string; // e.g. "all-staff", "board", "investors", "friends_and_family"
  intent?: string; // e.g. "thank", "motivate", "explain", "persuade", "inform", "apply"
  format_guess?: string; // e.g. "speech", "talk", "email", "statement", "letter", "article"
  tone_guess?: string; // e.g. "warm", "formal", "punchy", "measured", "playful"
  domain?: string; // e.g. "corporate", "education", "politics", "wedding", "fundraising"
  duration_hint?: string; // e.g. "3min", "5min", "10min", or a loose words/minutes hint
  must_include?: string[]; // key points / phrases that obviously must appear
  must_avoid?: string[]; // red lines inferred from phrasing (e.g. "don't oversell", "no jargon")
  possible_presets?: string[]; // candidate internal preset ids, not shown to user
};

/**
 * Internal: get OpenAI client.
 */
function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY for preparseBrief');
  }
  return new OpenAI({ apiKey });
}

/**
 * System prompt for the pre-parser.
 * - Single responsibility: turn messy natural language into a compact JSON summary.
 * - Must NEVER return prose. JSON ONLY.
 */
const PREPARSE_SYSTEM_PROMPT = `
You are the Pre-Parser for a speech and writing assistant.

Your job:
- Take a single free-text brief.
- Infer useful, *lightweight* structure to guide downstream planners and drafters.
- Never block on missing info; do your best with what's given.
- This output is a HINT, not a hard spec.

Return STRICT JSON with this shape (no markdown, no extra text):

{
  "role_inferred": string | null,
  "audience_inferred": string | null,
  "intent": string | null,
  "format_guess": string | null,
  "tone_guess": string | null,
  "domain": string | null,
  "duration_hint": string | null,
  "must_include": string[] | [],
  "must_avoid": string[] | [],
  "possible_presets": string[] | []
}

Guidance:

- role_inferred:
  - If they say "I'm the CEO / founder / principal / candidate / student", capture that.
  - Else null.

- audience_inferred:
  - Examples: "all-staff", "board", "investors", "customers", "students", "admissions_tutor", "wedding_guests", "general_public".

- intent:
  - Short verb or phrase:
    - "thank", "motivate", "reassure", "announce_change", "apply", "pitch", "explain", "defend", "celebrate", etc.

- format_guess:
  - Based on cues:
    - "speech", "talk", "remarks", "personal_statement", "cover_letter", "email", "memo", "social_post".
  - If they say "speech" or "talk", choose "speech".

- tone_guess:
  - 1–3 tokens:
    - e.g. "warm_formal", "direct_confident", "upbeat", "measured", "personal", "playful".

- domain:
  - e.g. "corporate", "education", "politics", "nonprofit", "wedding", "startup", "public_sector", "healthcare".

- duration_hint:
  - If they specify time or words, normalise:
    - "3min", "5min", "10min", "700_words".
  - Else null.

- must_include:
  - Extract any explicit "I need to mention / must include / key points:".
  - Keep short phrases, not full paragraphs.

- must_avoid:
  - Extract any explicit "do not / avoid / I don't want" constraints.

- possible_presets:
  - INTERNAL IDs ONLY (no explanations).
  - Examples (not exhaustive, adapt sensibly):
    - "corporate_leadership_talk"
    - "all_hands_update"
    - "board_briefing"
    - "wedding_speech"
    - "student_personal_statement"
    - "press_announcement"
    - "fundraising_pitch"
    - "policy_explainer"
  - Choose 0–3 based on best guess.

ABSOLUTE RULES:
- Output MUST be valid JSON.
- No trailing commas.
- No comments.
- No markdown fences.
`.trim();

/**
 * Pre-parse a raw, conversational brief into structured hints.
 * - On any failure, fall back to a very minimal heuristic extraction.
 */
export async function preparseBrief(rawBrief: string): Promise<ParsedBrief> {
  const content = (rawBrief || '').trim();
  if (!content) {
    return {};
  }

  // Heuristic quick checks (used as safety net + to guide prompt)
  const lower = content.toLowerCase();

  const quickGuess: Partial<ParsedBrief> = {};

  if (lower.includes('wedding')) quickGuess.domain = 'wedding';
  if (lower.includes('personal statement') || lower.includes('ucas'))
    quickGuess.format_guess = 'personal_statement';
  if (lower.includes('board')) quickGuess.audience_inferred = 'board';
  if (lower.includes('team') || lower.includes('staff'))
    quickGuess.audience_inferred = quickGuess.audience_inferred || 'all-staff';
  if (lower.includes('ceo') || lower.includes('chief executive')) quickGuess.role_inferred = 'CEO';

  try {
    const client = getOpenAI();

    const completion = await client.chat.completions.create({
      model: 'gpt-4o-mini',
      temperature: 0,
      messages: [
        {
          role: 'system',
          content: PREPARSE_SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: content,
        },
      ],
    });

    const raw = completion.choices[0]?.message?.content || '';
    const parsed = JSON.parse(raw);

    const result: ParsedBrief = {
      role_inferred: cleanStr(parsed.role_inferred),
      audience_inferred: cleanStr(parsed.audience_inferred),
      intent: cleanStr(parsed.intent),
      format_guess: cleanStr(parsed.format_guess),
      tone_guess: cleanStr(parsed.tone_guess),
      domain: cleanStr(parsed.domain),
      duration_hint: cleanStr(parsed.duration_hint),
      must_include: cleanArr(parsed.must_include),
      must_avoid: cleanArr(parsed.must_avoid),
      possible_presets: cleanArr(parsed.possible_presets),
    };

    // Merge in any quickGuess hints that are missing
    return {
      ...result,
      ...Object.fromEntries(
        Object.entries(quickGuess).filter(
          ([key, value]) => value && !result[key as keyof ParsedBrief]
        )
      ),
    };
  } catch (err) {
    // Fallback: heuristic-only result if model / JSON parse fails.
    console.error('preparseBrief error, using heuristic fallback:', err);

    const fallback: ParsedBrief = {
      role_inferred: quickGuess.role_inferred,
      audience_inferred: quickGuess.audience_inferred,
      format_guess: quickGuess.format_guess,
      domain: quickGuess.domain,
      must_include: [],
      must_avoid: [],
      possible_presets: [],
    };

    return fallback;
  }
}

/* ---------- helpers ---------- */

function cleanStr(v: any): string | undefined {
  if (typeof v !== 'string') return undefined;
  const s = v.trim();
  return s.length ? s : undefined;
}

function cleanArr(v: any): string[] {
  if (!Array.isArray(v)) return [];
  return v.map(x => (typeof x === 'string' ? x.trim() : '')).filter(x => x.length > 0);
}
