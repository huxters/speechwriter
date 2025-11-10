import OpenAI from 'openai';
import { preparseBrief, ParsedBrief } from './preparseBrief';
import { plannerPrompt } from './planner.prompt';
import { drafterPrompt } from './drafter.prompt';
import { judgePrompt } from './judge.prompt';
import { guardrailPrompt } from './guardrail.prompt';
import { editorPrompt } from './editor.prompt';
import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';
import { matchPresets, PresetId } from './presets.config';
import { loadImplicitProfile, ImplicitProfileHints } from './implicitProfile';

type TraceEntry = {
  stage: string;
  message: string;
};

type JudgeInfo = {
  winner: 1 | 2;
  reason: string;
};

type GuardrailInfo = {
  ok: boolean;
  message: string;
};

type Drafts = {
  draft1: string;
  draft2: string;
  winnerLabel: 'draft1' | 'draft2';
};

export type SpeechwriterResult = {
  finalSpeech: string | null;
  drafts: Drafts | null;
  judge: JudgeInfo | null;
  guardrail: GuardrailInfo | null;
  trace: TraceEntry[];
};

/* ---------- OpenAI helpers ---------- */

function getOpenAI() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('Missing OPENAI_API_KEY');
  }
  return new OpenAI({ apiKey });
}

async function callChat({
  system,
  user,
  temperature = 0.3,
  maxTokens,
}: {
  system: string;
  user: string;
  temperature?: number;
  maxTokens?: number;
}): Promise<string> {
  const client = getOpenAI();
  const completion = await client.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature,
    max_tokens: maxTokens,
    messages: [
      { role: 'system', content: system },
      { role: 'user', content: user },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() || '';
}

/* ---------- Helpers ---------- */

function extractMarkedDraft(raw: string, marker: string, endMarker?: string): string {
  if (!raw) return '';
  const startToken = `===${marker}===`;
  const endToken = endMarker ? `===${endMarker}===` : `===END_${marker}===`;

  const startIdx = raw.indexOf(startToken);
  if (startIdx === -1) {
    // No marker: assume whole thing is the draft.
    return raw.trim();
  }

  const contentStart = startIdx + startToken.length;
  const endIdx = raw.indexOf(endToken, contentStart);
  const slice = endIdx === -1 ? raw.slice(contentStart) : raw.slice(contentStart, endIdx);
  return slice.trim();
}

async function saveSpeechToHistory(args: {
  userId: string;
  brief: string;
  finalSpeech: string;
  trace: TraceEntry[];
}) {
  const supabase = await createSupabaseServerClient();

  const { error } = await supabase.from('speeches').insert({
    user_id: args.userId,
    brief: args.brief,
    final_speech: args.finalSpeech,
    trace: args.trace,
  });

  if (error) {
    throw error;
  }
}

/* ---------- Main pipeline ---------- */

export async function runSpeechwriterPipeline(args: {
  userId?: string | null;
  anonUserId?: string | null;
  rawBrief: string;
  audience?: string;
  eventContext?: string;
  tone?: string;
  duration?: string;
  mustInclude?: string;
  mustAvoid?: string;
}): Promise<SpeechwriterResult> {
  const trace: TraceEntry[] = [];
  const {
    userId,
    anonUserId,
    rawBrief,
    audience,
    eventContext,
    tone,
    duration,
    mustInclude,
    mustAvoid,
  } = args;

  if (!rawBrief || !rawBrief.trim()) {
    return {
      finalSpeech: null,
      drafts: null,
      judge: null,
      guardrail: null,
      trace: [
        {
          stage: 'input',
          message: 'No brief provided.',
        },
      ],
    };
  }

  /* --- Identity --- */

  if (anonUserId) {
    trace.push({
      stage: 'identity',
      message: `Anon identity present: ${anonUserId.slice(0, 8)}…`,
    });
  }

  /* --- Pre-Parser --- */

  let parsedBrief: ParsedBrief | {} = {};
  try {
    parsedBrief = await preparseBrief(rawBrief);
    trace.push({
      stage: 'preparser',
      message: 'Preparser: parsed brief into structured config.',
    });
  } catch (err: any) {
    console.error('Preparser error', err);
    trace.push({
      stage: 'preparser',
      message: `Preparser failed, continuing without structured hints: ${
        err?.message || 'unknown error'
      }`,
    });
  }

  /* --- Merge explicit overrides as soft hints --- */

  const mergedContext: ParsedBrief & {
    must_include?: string[];
    must_avoid?: string[];
  } = {
    ...(parsedBrief as ParsedBrief),
    audience_inferred: audience || (parsedBrief as ParsedBrief).audience_inferred,
    event_context: eventContext || (parsedBrief as ParsedBrief).event_context,
    tone_guess: tone || (parsedBrief as ParsedBrief).tone_guess,
    duration_hint: duration || (parsedBrief as ParsedBrief).duration_hint,
    must_include: [
      ...(((parsedBrief as ParsedBrief).must_include as string[]) || []),
      ...(mustInclude ? [mustInclude] : []),
    ],
    must_avoid: [
      ...(((parsedBrief as ParsedBrief).must_avoid as string[]) || []),
      ...(mustAvoid ? [mustAvoid] : []),
    ],
  };

  const contextSummary = JSON.stringify(mergedContext);

  /* --- Presets --- */

  let matchedPresets: PresetId[] = [];
  try {
    matchedPresets = matchPresets(mergedContext as ParsedBrief);
    if (matchedPresets.length > 0) {
      trace.push({
        stage: 'presets',
        message: `Presets matched: ${matchedPresets.join(', ')}.`,
      });
    } else {
      trace.push({
        stage: 'presets',
        message: 'Presets: no strong match; proceeding generic.',
      });
    }
  } catch (err: any) {
    console.error('Preset match error', err);
    trace.push({
      stage: 'presets',
      message: 'Presets: error in matching, ignored.',
    });
    matchedPresets = [];
  }

  /* --- Implicit profile (read-only) --- */

  let profileHints: ImplicitProfileHints | null = null;
  try {
    profileHints = await loadImplicitProfile({ userId });
    if (profileHints) {
      const parts = [
        `segment=${profileHints.segment}`,
        profileHints.toneBias ? `tone=${profileHints.toneBias}` : '',
        profileHints.formalityBias ? `formality=${profileHints.formalityBias}` : '',
        profileHints.structureBias ? `structure=${profileHints.structureBias}` : '',
      ]
        .filter(Boolean)
        .join(', ');

      trace.push({
        stage: 'profile',
        message: `Profile: loaded hints (${parts || 'no explicit biases'})`,
      });
    } else {
      trace.push({
        stage: 'profile',
        message: 'Profile: none loaded (new user or no profile set).',
      });
    }
  } catch (err: any) {
    console.warn('Profile load error', err);
    trace.push({
      stage: 'profile',
      message: 'Profile: error loading, ignored.',
    });
    profileHints = null;
  }

  /* --- Planner --- */

  let planJson = '';
  try {
    const plannerUserPrompt = `
Brief:
${rawBrief}

Context hints (may be partial):
${contextSummary}

Matched presets (hints only, may be empty):
${JSON.stringify(matchedPresets)}

Implicit profile hints (use ONLY if consistent with this specific request):
${JSON.stringify(profileHints || {})}

Using the above, produce a structured plan in JSON as described in the planner prompt.
`.trim();

    const planRaw = await callChat({
      system: plannerPrompt,
      user: plannerUserPrompt,
      temperature: 0.2,
    });

    JSON.parse(planRaw);
    planJson = planRaw;

    trace.push({
      stage: 'planner',
      message: 'Planner: generated structured plan JSON.',
    });
  } catch (err: any) {
    console.error('Planner error / JSON parse failure', err);
    trace.push({
      stage: 'planner',
      message: 'Planner: failed to produce valid JSON. Falling back to minimal implicit plan.',
    });

    planJson = JSON.stringify({
      core_message: rawBrief.slice(0, 400),
      audience: mergedContext.audience_inferred || null,
      tone: mergedContext.tone_guess || null,
      format: (mergedContext as any).format_guess || 'speech',
      sections: [],
    });
  }

  /* --- Drafter: two candidate drafts (clean) --- */

  let draft1 = '';
  let draft2 = '';

  try {
    const base = `
You are the Drafter stage.

Here is the plan (JSON):
${planJson}

Write one spoken-first draft based on this plan.
If markers like ===DRAFT_1=== / ===END_DRAFT_1=== are used, ensure ONLY one draft is inside them.
`.trim();

    const raw1 = await callChat({
      system: drafterPrompt,
      user: base + '\n\nDraft 1:',
      temperature: 0.7,
    });

    const raw2 = await callChat({
      system: drafterPrompt,
      user: base + '\n\nDraft 2 (different angle):',
      temperature: 0.9,
    });

    // Support both marker and non-marker styles safely.
    draft1 =
      extractMarkedDraft(raw1, 'DRAFT_1') || extractMarkedDraft(raw1, 'DRAFT_A') || raw1.trim();

    draft2 =
      extractMarkedDraft(raw2, 'DRAFT_2') || extractMarkedDraft(raw2, 'DRAFT_B') || raw2.trim();

    trace.push({
      stage: 'drafter',
      message: 'Drafter: produced 2 candidate drafts.',
    });
  } catch (err: any) {
    console.error('Drafter error', err);
    trace.push({
      stage: 'drafter',
      message: `Drafter failed: ${err?.message || 'unknown error'}`,
    });
  }

  if (!draft1 && !draft2) {
    return {
      finalSpeech: null,
      drafts: null,
      judge: null,
      guardrail: null,
      trace,
    };
  }

  /* --- Judge --- */

  let judge: JudgeInfo | null = null;
  let winnerLabel: 'draft1' | 'draft2' = 'draft1';
  let winningDraft = draft1 || draft2;

  try {
    const judgeInput = JSON.stringify({
      plan: JSON.parse(planJson),
      draft1,
      draft2,
    });

    const judgeRaw = await callChat({
      system: judgePrompt,
      user: judgeInput,
      temperature: 0,
    });

    const judgeParsed = JSON.parse(judgeRaw);
    const winner = judgeParsed.winner === 2 ? 2 : 1;

    judge = {
      winner,
      reason: typeof judgeParsed.reason === 'string' ? judgeParsed.reason : 'No reason provided.',
    };

    if (winner === 2 && draft2) {
      winnerLabel = 'draft2';
      winningDraft = draft2;
    } else {
      winnerLabel = 'draft1';
      winningDraft = draft1 || draft2;
    }

    trace.push({
      stage: 'judge',
      message: `Judge: selected draft ${winner} — ${judge.reason.slice(0, 180)}`,
    });
  } catch (err: any) {
    console.error('Judge error', err);
    judge = null;
    winnerLabel = draft1 ? 'draft1' : 'draft2';
    winningDraft = draft1 || draft2;
    trace.push({
      stage: 'judge',
      message: 'Judge: failed to parse decision. Defaulted to first non-empty draft.',
    });
  }

  /* --- Guardrail --- */

  let guardrail: GuardrailInfo | null = null;
  let guardedDraft = winningDraft;

  try {
    const guardrailInput = JSON.stringify({
      brief: rawBrief,
      context: mergedContext,
      draft: winningDraft,
    });

    const guardrailRaw = await callChat({
      system: guardrailPrompt,
      user: guardrailInput,
      temperature: 0,
    });

    let ok = true;
    let message = 'OK — no material issues found.';
    let edited = winningDraft;

    try {
      const g = JSON.parse(guardrailRaw);
      ok = g.ok !== false;
      message =
        typeof g.message === 'string' ? g.message : ok ? message : 'Guardrail adjustments applied.';
      edited = typeof g.draft === 'string' && g.draft.trim().length ? g.draft : winningDraft;
    } catch {
      edited = winningDraft;
      message = guardrailRaw.slice(0, 240) || message;
    }

    guardrail = { ok, message };
    guardedDraft = edited;

    trace.push({
      stage: 'guardrail',
      message: `Guardrail: ${message.slice(0, 160)}`,
    });
  } catch (err: any) {
    console.error('Guardrail error', err);
    guardrail = null;
    guardedDraft = winningDraft;
    trace.push({
      stage: 'guardrail',
      message: 'Guardrail: failed or skipped; using judge-selected draft.',
    });
  }

  /* --- Editor --- */

  let finalSpeech: string | null = null;

  try {
    const editorInput = JSON.stringify({
      brief: rawBrief,
      context: mergedContext,
      draft: guardedDraft,
    });

    const edited = await callChat({
      system: editorPrompt,
      user: editorInput,
      temperature: 0.4,
    });

    finalSpeech = edited && edited.trim().length ? edited.trim() : guardedDraft;

    trace.push({
      stage: 'editor',
      message: 'Editor: final speech ready.',
    });
  } catch (err: any) {
    console.error('Editor error', err);
    finalSpeech = guardedDraft || null;
    trace.push({
      stage: 'editor',
      message: 'Editor: failed; falling back to guardrailed draft as final speech.',
    });
  }

  /* --- Persistence --- */

  const drafts: Drafts | null = draft1 || draft2 ? { draft1, draft2, winnerLabel } : null;

  try {
    if (userId && finalSpeech) {
      await saveSpeechToHistory({
        userId,
        brief: rawBrief,
        finalSpeech,
        trace,
      });

      trace.push({
        stage: 'persistence',
        message: 'Saved speech to history for current user.',
      });
    } else if (!userId) {
      trace.push({
        stage: 'persistence',
        message: 'No user id available; run not saved to history (likely anonymous or auth issue).',
      });
    } else if (!finalSpeech) {
      trace.push({
        stage: 'persistence',
        message: 'No final speech produced; nothing saved to history.',
      });
    }
  } catch (err: any) {
    console.error('Error saving speech to history', err);
    trace.push({
      stage: 'persistence',
      message: `Failed to save: ${err?.message || 'unknown error'}`,
    });
  }

  /* --- Return --- */

  return {
    finalSpeech,
    drafts,
    judge,
    guardrail,
    trace,
  };
}
