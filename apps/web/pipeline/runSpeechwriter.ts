// apps/web/pipeline/runSpeechwriter.ts

import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { buildGuardrailMessages, GuardrailResult } from './guardrail.prompt';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

if (!OPENAI_API_KEY) {
  console.warn(
    '[runSpeechwriterPipeline] Warning: OPENAI_API_KEY is not set. Pipeline calls will fail.'
  );
}

type SpeechConfig = {
  audience?: string;
  eventContext?: string;
  tone?: string;
  duration?: string;
  keyPoints?: string;
  redLines?: string;
  globalMustInclude?: string[];
  globalMustAvoid?: string[];
};

type TraceEntry = {
  stage: string;
  message: string;
};

type PlannerPlan = {
  coreMessage: string;
  audience: string;
  eventContext: string;
  tone: string;
  duration: string;
  pillars: { title: string; summary: string }[];
  constraints: {
    mustInclude: string[];
    mustAvoid: string[];
  };
};

type JudgeResult = {
  winner: 1 | 2;
  reason: string;
};

type DraftsInfo = {
  draft1: string;
  draft2: string;
  winnerLabel: 'draft1' | 'draft2';
};

export type PipelineResult = {
  finalSpeech: string;
  planner: PlannerPlan | null;
  judge: JudgeResult | null;
  trace: TraceEntry[];
  drafts: DraftsInfo | null;
};

// Hard safety floor – extend later, but not editable via UI
const HARD_SAFETY_MUST_AVOID: string[] = [];

function dedupe(values: string[]): string[] {
  return Array.from(new Set(values.map(v => v.trim()).filter(v => v.length > 0)));
}

/* -------------------- OpenAI call + JSON helpers -------------------- */

async function callOpenAI(
  messages: ChatCompletionMessageParam[],
  opts?: { expectJson?: boolean }
): Promise<string> {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not configured.');
  }

  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: MODEL,
      messages,
      temperature: 0.7,
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`OpenAI error (${res.status}): ${text || res.statusText}`);
  }

  const data = (await res.json()) as any;
  const content = data?.choices?.[0]?.message?.content?.toString().trim() || '';

  if (!content) {
    throw new Error('No content returned from OpenAI.');
  }

  // For JSON, we deliberately return the raw content;
  // parsing is handled by our lenient helpers.
  return content;
}

function extractJsonObject(raw: string): string | null {
  if (!raw) return null;

  // Strip common markdown fences
  let text = raw.trim();
  text = text
    .replace(/^```[a-zA-Z]*\s*/g, '')
    .replace(/```$/g, '')
    .trim();

  const first = text.indexOf('{');
  const last = text.lastIndexOf('}');
  if (first === -1 || last === -1 || last <= first) return null;

  return text.slice(first, last + 1);
}

function safeJson<T>(raw: string): T | null {
  const core = extractJsonObject(raw);
  if (!core) return null;

  // Try straight parse
  try {
    return JSON.parse(core) as T;
  } catch {
    // Try removing trailing commas
    try {
      const fixed = core.replace(/,\s*([}\]])/g, '$1');
      return JSON.parse(fixed) as T;
    } catch {
      return null;
    }
  }
}

/* -------------------- Planner -------------------- */

function buildPlannerMessages(brief: string, config?: SpeechConfig): ChatCompletionMessageParam[] {
  const { audience, eventContext, tone, duration, keyPoints, redLines } = config || {};

  const system = `
You are Planner, the lead strategist of a speechwriting pipeline.

Turn the input into a precise JSON plan for a short spoken speech.

Rules:
- Use both the free-text brief and structured fields.
- If they conflict, trust the structured fields.
- Do NOT make up names, numbers, or legal/medical claims.
- Output ONLY valid JSON with this exact shape (no commentary):

{
  "coreMessage": string,
  "audience": string,
  "eventContext": string,
  "tone": string,
  "duration": string,
  "pillars": [
    { "title": string, "summary": string }
  ],
  "constraints": {
    "mustInclude": string[],
    "mustAvoid": string[]
  }
}
`.trim();

  const user = `
BRIEF:
${brief}

STRUCTURED:
- audience: ${audience || '(none)'}
- eventContext: ${eventContext || '(none)'}
- tone: ${tone || '(none)'}
- duration: ${duration || '(none)'}
- mustInclude (keyPoints): ${keyPoints || '(none)'}
- mustAvoid (redLines): ${redLines || '(none)'}
`.trim();

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

/* -------------------- Drafter -------------------- */

function buildDrafterMessages(plan: PlannerPlan): ChatCompletionMessageParam[] {
  const system = `
You are Drafter, a specialist in spoken speeches.

Using ONLY the planner JSON, produce TWO DISTINCT drafts that BOTH:
- Follow the plan.
- Respect constraints.mustInclude and constraints.mustAvoid.
- Are realistic to deliver in the stated duration.
- Do NOT invent specific data or serious factual claims.

Diversity:
- "draft1": classic, structured, measured.
- "draft2": alternative style (e.g. more narrative or energetic), still professional.

Return ONLY valid JSON (no markdown, no commentary):

{
  "draft1": string,
  "draft2": string
}
`.trim();

  const user = JSON.stringify(plan);

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

/* -------------------- Judge -------------------- */

function buildJudgeMessages(args: {
  plan: PlannerPlan;
  option1: string;
  option2: string;
}): ChatCompletionMessageParam[] {
  const system = `
You are Judge, selecting the better draft.

Evaluate each option on:
- Alignment with coreMessage, audience, eventContext, tone, duration.
- Respect for constraints.mustInclude and constraints.mustAvoid.
- Clarity, coherence, and spoken delivery.

Order is randomised; do NOT assume option1 is better.

Return ONLY valid JSON (no commentary):

{
  "winner": 1 | 2,
  "reason": string
}
`.trim();

  const user = JSON.stringify(args);

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

/* -------------------- Editor -------------------- */

function buildEditorMessages(draft: string): ChatCompletionMessageParam[] {
  const system = `
You are Editor, finalising a spoken speech.

Tighten for:
- clarity and logical flow,
- natural spoken cadence,
- strong opening and close.

Do NOT add new concrete facts.

Return ONLY the final speech text (no JSON, no labels).
`.trim();

  return [
    { role: 'system', content: system },
    { role: 'user', content: draft },
  ];
}

/* -------------------- Orchestrator -------------------- */

export async function runSpeechwriterPipeline(
  brief: string,
  config?: SpeechConfig
): Promise<PipelineResult> {
  const trace: TraceEntry[] = [];

  try {
    /* 1. Planner */

    trace.push({
      stage: 'planner',
      message: 'Planner: generating structured plan from brief + config.',
    });

    const plannerRaw = await callOpenAI(buildPlannerMessages(brief, config), { expectJson: true });
    const planner = safeJson<PlannerPlan>(plannerRaw);

    if (!planner) {
      trace.push({
        stage: 'planner',
        message: 'Planner: failed to parse JSON plan; aborting pipeline.',
      });
      return {
        finalSpeech: '',
        planner: null,
        judge: null,
        trace,
        drafts: null,
      };
    }

    trace.push({
      stage: 'planner',
      message: 'Planner: JSON plan parsed successfully.',
    });

    /* 2. Build effective guardrails (3-layer merge) */

    const globalMustInclude = (config?.globalMustInclude || []).filter(Boolean);
    const globalMustAvoid = (config?.globalMustAvoid || []).filter(Boolean);

    const perRunMustInclude = planner.constraints?.mustInclude || [];
    const perRunMustAvoid = planner.constraints?.mustAvoid || [];

    const effectiveMustAvoid = dedupe([
      ...HARD_SAFETY_MUST_AVOID,
      ...globalMustAvoid,
      ...perRunMustAvoid,
    ]);

    const effectiveMustInclude = dedupe([...globalMustInclude, ...perRunMustInclude]);

    if (globalMustInclude.length || globalMustAvoid.length) {
      trace.push({
        stage: 'guardrail',
        message: 'Guardrail: merged global guardrails with per-run constraints.',
      });
    }

    /* 3. Drafter */

    trace.push({
      stage: 'drafter',
      message: 'Drafter: generating two candidate drafts from planner JSON.',
    });

    const drafterRaw = await callOpenAI(buildDrafterMessages(planner), { expectJson: true });
    const draftsJson = safeJson<{ draft1: string; draft2: string }>(drafterRaw);

    if (!draftsJson?.draft1 || !draftsJson?.draft2) {
      console.error('[runSpeechwriterPipeline] Drafter raw response not parseable:', drafterRaw);
      trace.push({
        stage: 'drafter',
        message: 'Drafter: invalid JSON from model; aborting pipeline.',
      });
      return {
        finalSpeech: '',
        planner,
        judge: null,
        trace,
        drafts: null,
      };
    }

    trace.push({
      stage: 'drafter',
      message: 'Drafter: produced 2 drafts.',
    });

    /* 4. Judge with randomised order */

    trace.push({
      stage: 'judge',
      message: 'Judge: evaluating drafts (order randomised to reduce bias).',
    });

    type Variant = { label: 'draft1' | 'draft2'; text: string };

    let variants: [Variant, Variant] = [
      { label: 'draft1', text: draftsJson.draft1 },
      { label: 'draft2', text: draftsJson.draft2 },
    ];

    if (Math.random() < 0.5) {
      variants = [variants[1], variants[0]];
    }

    const judgeRaw = await callOpenAI(
      buildJudgeMessages({
        plan: planner,
        option1: variants[0].text,
        option2: variants[1].text,
      }),
      { expectJson: true }
    );
    const judge = safeJson<JudgeResult>(judgeRaw);

    let winnerLabel: 'draft1' | 'draft2' = 'draft1';
    let winnerDraft = draftsJson.draft1;

    if (judge && (judge.winner === 1 || judge.winner === 2)) {
      const chosen = variants[judge.winner - 1];
      winnerLabel = chosen.label;
      winnerDraft = chosen.text;
      trace.push({
        stage: 'judge',
        message: `Judge: selected ${winnerLabel} — ${judge.reason}`,
      });
    } else {
      trace.push({
        stage: 'judge',
        message: 'Judge: invalid JSON from model; defaulting to draft1.',
      });
    }

    const drafts: DraftsInfo = {
      draft1: draftsJson.draft1,
      draft2: draftsJson.draft2,
      winnerLabel,
    };

    /* 5. Guardrail */

    trace.push({
      stage: 'guardrail',
      message: 'Guardrail: checking winning draft against merged constraints.',
    });

    let guardedDraft = winnerDraft;

    try {
      const guardrailRaw = await callOpenAI(
        buildGuardrailMessages({
          draft: winnerDraft,
          mustInclude: effectiveMustInclude,
          mustAvoid: effectiveMustAvoid,
        }),
        { expectJson: true }
      );
      const parsed = safeJson<GuardrailResult>(guardrailRaw);

      if (parsed && parsed.safeText) {
        if (parsed.status === 'ok') {
          trace.push({
            stage: 'guardrail',
            message: 'Guardrail: OK — no material issues found.',
          });
          guardedDraft = parsed.safeText;
        } else if (parsed.status === 'edited') {
          trace.push({
            stage: 'guardrail',
            message: `Guardrail: applied minimal edits. Issues: ${parsed.issues.join('; ')}`,
          });
          guardedDraft = parsed.safeText;
        } else if (parsed.status === 'flagged') {
          trace.push({
            stage: 'guardrail',
            message: `Guardrail: flagged issues. Issues: ${parsed.issues.join('; ')}`,
          });
          guardedDraft = parsed.safeText;
        }
      } else {
        trace.push({
          stage: 'guardrail',
          message: 'Guardrail: could not parse response; using judged draft.',
        });
      }
    } catch (err: any) {
      trace.push({
        stage: 'guardrail',
        message: `Guardrail: error "${err?.message || 'unknown'}"; using judged draft.`,
      });
    }

    /* 6. Editor */

    trace.push({
      stage: 'editor',
      message: 'Editor: tightening draft for spoken delivery.',
    });

    const finalSpeech = await callOpenAI(buildEditorMessages(guardedDraft));

    trace.push({
      stage: 'editor',
      message: 'Editor: final speech ready.',
    });

    return {
      finalSpeech,
      planner,
      judge: judge || null,
      trace,
      drafts,
    };
  } catch (err: any) {
    console.error('[runSpeechwriterPipeline] Pipeline error:', err);
    trace.push({
      stage: 'error',
      message: `Pipeline error: ${err?.message || String(err)}`,
    });

    return {
      finalSpeech: '',
      planner: null,
      judge: null,
      trace,
      drafts: null,
    };
  }
}
