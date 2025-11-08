import OpenAI from 'openai';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';
import { buildGuardrailMessages, GuardrailResult } from './guardrail.prompt';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

if (!process.env.OPENAI_API_KEY) {
  console.warn(
    '[runSpeechwriterPipeline] Missing OPENAI_API_KEY. Pipeline calls will fail until configured.'
  );
}

const MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

type SpeechConfig = {
  audience?: string;
  eventContext?: string;
  tone?: string;
  duration?: string;
  keyPoints?: string;
  redLines?: string;
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

type PipelineResult = {
  finalSpeech: string;
  planner: PlannerPlan | null;
  judge: JudgeResult | null;
  trace: TraceEntry[];
  drafts: DraftsInfo | null;
};

// ---------- helpers ----------

async function chat(messages: ChatCompletionMessageParam[]) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not configured.');
  }

  const res = await openai.chat.completions.create({
    model: MODEL,
    messages,
    temperature: 0.7,
  });

  const choice = res.choices[0];
  if (!choice || !choice.message) {
    throw new Error('No completion returned from model.');
  }

  return choice.message.content ?? '';
}

function safeJson<T>(raw: string): T | null {
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

// ---------- Planner ----------

function buildPlannerMessages(brief: string, config?: SpeechConfig): ChatCompletionMessageParam[] {
  const { audience, eventContext, tone, duration, keyPoints, redLines } = config || {};

  const system = `
You are Planner, the lead strategist of a speechwriting pipeline.

Turn the input into a precise JSON plan for a short spoken speech.

Rules:
- Use both the free-text brief and structured fields.
- If they conflict, trust the structured fields.
- No fake numbers, names, or promises.
- Output ONLY JSON with this exact shape:

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

// ---------- Drafter (2 distinct drafts) ----------

function buildDrafterMessages(plan: PlannerPlan): ChatCompletionMessageParam[] {
  const system = `
You are Drafter, a specialist in spoken-word speeches.

Using the planner JSON, produce TWO DISTINCT drafts that BOTH:

- Follow the plan exactly.
- Respect constraints.mustInclude (present somewhere, integrated).
- Respect constraints.mustAvoid (do not violate).
- Are realistic to speak aloud in the indicated duration.
- Do not invent specific data, names, or legal/medical claims.

Diversity requirements:
- "draft1": classic, structured, measured.
- "draft2": alternative valid take (e.g. more narrative, more energetic, or more concise), while staying professional.

Return ONLY JSON:

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

// ---------- Judge (order-agnostic) ----------

function buildJudgeMessages(args: {
  plan: PlannerPlan;
  option1: string;
  option2: string;
}): ChatCompletionMessageParam[] {
  const system = `
You are Judge, selecting the better draft.

Compare each option independently against:
- coreMessage, audience, eventContext, tone, duration
- constraints.mustInclude (present, integrated)
- constraints.mustAvoid (no violations)
- clarity, coherence, spoken delivery quality

Important:
- Do NOT assume the first option is better.
- Evaluate both impartially and choose the stronger one.

Return ONLY JSON:

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

// ---------- Editor ----------

function buildEditorMessages(draft: string): ChatCompletionMessageParam[] {
  const system = `
You are Editor, finalising a spoken speech.

Tighten for:
- clarity and logical flow
- natural spoken cadence
- strong open and close
Do NOT introduce new concrete facts.

Return ONLY the final speech text.
`.trim();

  return [
    { role: 'system', content: system },
    { role: 'user', content: draft },
  ];
}

// ---------- Orchestrator ----------

export async function runSpeechwriterPipeline(
  brief: string,
  config?: SpeechConfig
): Promise<PipelineResult> {
  const trace: TraceEntry[] = [];

  // 1. Planner
  trace.push({
    stage: 'planner',
    message: 'Planner: generating structured plan from brief + config.',
  });

  const plannerRaw = await chat(buildPlannerMessages(brief, config));
  const planner = safeJson<PlannerPlan>(plannerRaw);

  if (!planner) {
    trace.push({
      stage: 'planner',
      message: 'Planner: failed to parse JSON, aborting pipeline.',
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
    message: 'Planner: JSON parsed successfully.',
  });

  // 2. Drafter
  trace.push({
    stage: 'drafter',
    message: 'Drafter: creating two stylistically distinct candidate drafts.',
  });

  const drafterRaw = await chat(buildDrafterMessages(planner));
  const draftsJson = safeJson<{ draft1: string; draft2: string }>(drafterRaw);

  if (!draftsJson?.draft1 || !draftsJson?.draft2) {
    trace.push({
      stage: 'drafter',
      message: 'Drafter: invalid JSON; aborting pipeline.',
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

  // 3. Judge with randomised order
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

  const judgeRaw = await chat(
    buildJudgeMessages({
      plan: planner,
      option1: variants[0].text,
      option2: variants[1].text,
    })
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
      message: `Judge: selected ${winnerLabel} (reported as option ${judge.winner}) — ${judge.reason}`,
    });
  } else {
    trace.push({
      stage: 'judge',
      message: 'Judge: invalid JSON; defaulting to draft1 without confidence.',
    });
  }

  const drafts: DraftsInfo = {
    draft1: draftsJson.draft1,
    draft2: draftsJson.draft2,
    winnerLabel,
  };

  // 4. Guardrail
  trace.push({
    stage: 'guardrail',
    message: 'Guardrail: checking winning draft against constraints and safety.',
  });

  const mustInclude = planner.constraints?.mustInclude || [];
  const mustAvoid = planner.constraints?.mustAvoid || [];

  let guardrailResult: GuardrailResult | null = null;
  let guardedDraft = winnerDraft;

  try {
    const guardrailRaw = await chat(
      buildGuardrailMessages({
        draft: winnerDraft,
        mustInclude,
        mustAvoid,
      })
    );
    const parsed = safeJson<GuardrailResult>(guardrailRaw);
    if (parsed && parsed.safeText) {
      guardrailResult = parsed;
    }
  } catch (err: any) {
    trace.push({
      stage: 'guardrail',
      message: `Guardrail: error (${err?.message || 'unknown error'}) — using judged draft as-is.`,
    });
  }

  if (guardrailResult) {
    if (guardrailResult.status === 'ok') {
      trace.push({
        stage: 'guardrail',
        message: 'Guardrail: OK — no material issues found.',
      });
      guardedDraft = guardrailResult.safeText;
    } else if (guardrailResult.status === 'edited') {
      trace.push({
        stage: 'guardrail',
        message: `Guardrail: applied minimal edits. Issues: ${guardrailResult.issues.join('; ')}`,
      });
      guardedDraft = guardrailResult.safeText;
    } else if (guardrailResult.status === 'flagged') {
      trace.push({
        stage: 'guardrail',
        message: `Guardrail: flagged concerns. Issues: ${guardrailResult.issues.join('; ')}`,
      });
      guardedDraft = guardrailResult.safeText;
    }
  } else {
    trace.push({
      stage: 'guardrail',
      message: 'Guardrail: unable to parse response; using judged draft as-is.',
    });
  }

  // 5. Editor
  trace.push({
    stage: 'editor',
    message: 'Editor: tightening guardrailed draft for spoken delivery.',
  });

  const finalSpeech = await chat(buildEditorMessages(guardedDraft));

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
}
