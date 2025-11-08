import OpenAI from 'openai';
import { buildGuardrailMessages, GuardrailResult } from './guardrail.prompt';
import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

if (!process.env.OPENAI_API_KEY) {
  console.warn(
    '[runSpeechwriterPipeline] Missing OPENAI_API_KEY. Pipeline calls will fail until configured.'
  );
}

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

type PipelineResult = {
  finalSpeech: string;
  planner?: PlannerPlan | null;
  judge?: JudgeResult | null;
  trace: TraceEntry[];
};

// ---- Helpers --------------------------------------------------

const MODEL = process.env.OPENAI_MODEL || 'gpt-4.1-mini';

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

function normaliseList(text?: string): string[] {
  if (!text) return [];
  return text
    .split(/[\n;]+/g)
    .map(s => s.trim())
    .filter(Boolean);
}

// ---- Prompt Builders (Planner / Drafter / Judge / Editor) ----
// For now we keep these inline for clarity. They can be split into
// separate files if needed.

function buildPlannerMessages(brief: string, config?: SpeechConfig): ChatCompletionMessageParam[] {
  const { audience, eventContext, tone, duration, keyPoints, redLines } = config || {};

  const system = `
You are Planner, the lead strategist of a speechwriting pipeline.

Turn the input and config into a precise JSON plan for a short spoken speech.

Rules:
- Use both the free-text brief and structured fields.
- If they conflict, trust the structured fields.
- No fake numbers, names, or promises.
- Output ONLY minified JSON with this shape:

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

function buildDrafterMessages(plan: PlannerPlan): ChatCompletionMessageParam[] {
  const system = `
You are Drafter, a specialist in spoken-word speeches.

Write TWO alternative drafts that:
- Follow the planner JSON exactly.
- Sound natural when spoken aloud.
- Respect constraints.mustInclude and constraints.mustAvoid.
- Fit approximately within the requested duration.
- Use clear, human language.

Return ONLY minified JSON with this shape:

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

function buildJudgeMessages(args: {
  plan: PlannerPlan;
  draft1: string;
  draft2: string;
}): ChatCompletionMessageParam[] {
  const system = `
You are Judge, selecting the better draft.

Compare each draft against:
- coreMessage, audience, eventContext, tone, duration
- constraints.mustInclude
- constraints.mustAvoid
- clarity, coherence, spoken delivery

Return ONLY minified JSON:

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

function buildEditorMessages(draft: string): ChatCompletionMessageParam[] {
  const system = `
You are Editor, finalising a spoken speech.

Tighten for:
- clarity and logical flow
- strong open and close
- natural spoken cadence
- no new facts beyond the draft

Return ONLY the final speech text (no JSON, no commentary).
`.trim();

  const user = draft;

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}

// ---- Main Orchestrator ---------------------------------------

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
    };
  }

  trace.push({
    stage: 'planner',
    message: 'Planner: JSON parsed successfully.',
  });

  // 2. Drafter
  trace.push({
    stage: 'drafter',
    message: 'Drafter: creating two candidate drafts.',
  });

  const drafterRaw = await chat(buildDrafterMessages(planner));
  const drafts = safeJson<{ draft1: string; draft2: string }>(drafterRaw);

  if (!drafts?.draft1 || !drafts?.draft2) {
    trace.push({
      stage: 'drafter',
      message: 'Drafter: invalid response; cannot continue.',
    });

    return {
      finalSpeech: '',
      planner,
      judge: null,
      trace,
    };
  }

  trace.push({
    stage: 'drafter',
    message: 'Drafter: produced 2 drafts.',
  });

  // 3. Judge
  trace.push({
    stage: 'judge',
    message: 'Judge: evaluating drafts.',
  });

  const judgeRaw = await chat(
    buildJudgeMessages({
      plan: planner,
      draft1: drafts.draft1,
      draft2: drafts.draft2,
    })
  );
  const judge = safeJson<JudgeResult>(judgeRaw);

  let winnerDraft = drafts.draft1;

  if (judge && (judge.winner === 1 || judge.winner === 2)) {
    winnerDraft = judge.winner === 1 ? drafts.draft1 : drafts.draft2;
    trace.push({
      stage: 'judge',
      message: `Judge: selected draft ${judge.winner} — ${judge.reason}`,
    });
  } else {
    trace.push({
      stage: 'judge',
      message: 'Judge: failed to return valid JSON; defaulting to draft 1.',
    });
  }

  // 4. Guardrail v1
  const mustInclude = planner.constraints?.mustInclude || [];
  const mustAvoid = planner.constraints?.mustAvoid || [];

  trace.push({
    stage: 'guardrail',
    message: 'Guardrail: checking draft against constraints and safety.',
  });

  let guardrailResult: GuardrailResult | null = null;

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

  let guardedDraft = winnerDraft;

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
      // We still pass the "safeText" variant forward, but the trace is explicit.
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
    message: 'Editor: tightening winning draft for spoken delivery.',
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
  };
}
