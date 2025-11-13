// apps/web/pipeline/runSpeechwriter.ts

import OpenAI from 'openai';
import { createClient as createSupabaseClient, SupabaseClient } from '@supabase/supabase-js';

import { preparseBrief, ParsedBrief } from './preparseBrief';
import { matchPreset } from './presets';
import { plannerPrompt } from './planner.prompt';
import { drafterPrompt } from './drafter.prompt';
import { judgePrompt } from './judge.prompt';
import { guardrailPrompt } from './guardrail.prompt';
import { editorPrompt } from './editor.prompt';
import { inferTraitsFromRun, upsertMemoryTraits } from './inferTraits';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export type TraceEntry = {
  stage: string;
  message: string;
};

export type Drafts = {
  draft1: string;
  draft2: string;
  winnerLabel: 'draft1' | 'draft2';
};

export type JudgeInfo = {
  winner: 1 | 2;
  reason: string;
};

export type GuardrailInfo = {
  ok: boolean;
  message: string;
};

export type PipelineResult = {
  finalSpeech: string | null;
  drafts: Drafts | null;
  judge: JudgeInfo | null;
  guardrail: GuardrailInfo | null;
  trace: TraceEntry[];
};

type RunInput = {
  rawBrief: string;
  audience?: string;
  eventContext?: string;
  tone?: string;
  duration?: string;
  mustInclude?: string;
  mustAvoid?: string;
  userId?: string | null;
  anonId?: string | null;
  // NEW: refinement context from the frontend
  previousVersionText?: string | null;
  previousRequestText?: string | null;
};

type Mode = 'generate' | 'refine';

function addTrace(trace: TraceEntry[], stage: string, message: string) {
  trace.push({ stage, message });
}

function getServiceSupabase(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createSupabaseClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

function looksLikeNewSpeechRequest(rawBrief: string): boolean {
  const lower = rawBrief.toLowerCase();
  const triggers = [
    'new speech',
    'start again',
    'fresh speech',
    'fresh talk',
    'ignore the previous',
    'ignore the last',
    'different topic',
    'different subject',
  ];
  return triggers.some(t => lower.includes(t));
}

function decideMode(rawBrief: string, previousVersionText: string | null): Mode {
  if (!previousVersionText || !previousVersionText.trim()) {
    return 'generate';
  }
  if (looksLikeNewSpeechRequest(rawBrief)) {
    return 'generate';
  }
  return 'refine';
}

async function callJsonModel(params: { system: string; user: any }): Promise<any> {
  const { system, user } = params;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          system +
          '\n\nYou MUST reply with a single valid JSON object (json only, no explanation).',
      },
      {
        role: 'user',
        content: typeof user === 'string' ? user : JSON.stringify(user),
      },
    ],
  });

  const content = completion.choices[0]?.message?.content || '{}';
  return JSON.parse(content);
}

async function callTextModel(params: { system: string; user: any }): Promise<string> {
  const { system, user } = params;

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: system },
      {
        role: 'user',
        content: typeof user === 'string' ? user : JSON.stringify(user),
      },
    ],
  });

  return completion.choices[0]?.message?.content?.trim() || '';
}

export async function runSpeechwriterPipeline(input: RunInput): Promise<PipelineResult> {
  const trace: TraceEntry[] = [];

  const {
    rawBrief,
    audience,
    eventContext,
    tone,
    duration,
    mustInclude,
    mustAvoid,
    userId = null,
    anonId = null,
    previousVersionText = null,
    previousRequestText = null,
  } = input;

  if (!rawBrief || !rawBrief.trim()) {
    return {
      finalSpeech: null,
      drafts: null,
      judge: null,
      guardrail: null,
      trace: [{ stage: 'error', message: 'No brief provided.' }],
    };
  }

  const supabase = getServiceSupabase();

  // --- Memory: load existing traits (for observability only for now) ---
  if (supabase && (userId || anonId)) {
    try {
      const eqFilter = userId ? { user_id: userId } : { anon_id: anonId };

      const { data, error } = await supabase
        .from('speechwriter_memory')
        .select('traits, runs_count')
        .match(eqFilter)
        .maybeSingle();

      if (error && error.code !== 'PGRST116') {
        addTrace(trace, 'memory', `Memory load failed: ${error.message}`);
      } else if (data) {
        addTrace(trace, 'memory', 'Loaded prior memory traits for this identity.');
      } else {
        addTrace(trace, 'memory', 'No existing memory found for this identity.');
      }
    } catch (err: any) {
      addTrace(trace, 'memory', `Memory load exception: ${err?.message || String(err)}`);
    }
  } else {
    addTrace(trace, 'memory', 'Memory load skipped (no identity or service key).');
  }

  // Decide whether this is a fresh generation or a refinement
  const mode: Mode = decideMode(rawBrief, previousVersionText);

  if (mode === 'refine') {
    // --- REFINEMENT MODE (v1) ---
    addTrace(
      trace,
      'mode',
      `Refinement mode: editing prior version with new request "${rawBrief.slice(0, 160)}${
        rawBrief.length > 160 ? '…' : ''
      }"`
    );

    if (!previousVersionText || !previousVersionText.trim()) {
      addTrace(
        trace,
        'refiner',
        'Refinement requested but no previousVersionText provided; falling back to no-op.'
      );
      return {
        finalSpeech: previousVersionText || null,
        drafts: null,
        judge: null,
        guardrail: null,
        trace,
      };
    }

    let finalSpeech = previousVersionText;

    try {
      const systemPrompt = `
You are a careful speech editor.

You are given:
- the current version of a speech
- a user's revision request

Your job:
- Apply ONLY the requested changes.
- Keep every other sentence, paragraph, and structural element as close as possible to the original.
- Do NOT change the topic, audience, or purpose of the speech.
- Do NOT introduce new themes, sections, or digressions unless explicitly asked.
- Maintain the approximate length and tone of the original.

Output:
- The full revised speech only, as plain text paragraphs.
      `.trim();

      const userPrompt = `
[CURRENT SPEECH]
${previousVersionText}

[REVISION REQUEST]
${rawBrief}
      `.trim();

      const refined = await callTextModel({
        system: systemPrompt,
        user: userPrompt,
      });

      if (refined && refined.trim()) {
        finalSpeech = refined.trim();
        addTrace(trace, 'refiner', 'Refiner: applied requested changes to previous version.');
      } else {
        addTrace(
          trace,
          'refiner',
          'Refiner returned empty content; keeping previous version unchanged.'
        );
      }
    } catch (err: any) {
      addTrace(
        trace,
        'refiner',
        `Refiner failed; keeping previous version unchanged. ${err?.message || String(err)}`
      );
    }

    // --- Persistence: save refined speech as a new run ---
    if (supabase && (userId || anonId) && finalSpeech) {
      try {
        const insert: any = {
          brief: rawBrief,
          draft_1: null,
          draft_2: null,
          final_speech: finalSpeech,
          trace,
        };
        if (userId) insert.user_id = userId;
        if (anonId) insert.anon_id = anonId;

        const { error } = await supabase.from('speeches').insert(insert);

        if (error) {
          addTrace(trace, 'persistence', `Failed to save refinement: ${error.message}`);
        } else {
          addTrace(trace, 'persistence', 'Saved refinement run to history for current identity.');
        }
      } catch (err: any) {
        addTrace(trace, 'persistence', `Failed to save refinement: ${err?.message || String(err)}`);
      }
    } else {
      addTrace(
        trace,
        'persistence',
        'No user/anon identity or final speech; refinement run not saved.'
      );
    }

    // --- Memory: update traits (non-blocking) for refinement ---
    try {
      if (supabase && (userId || anonId) && finalSpeech) {
        const inferred = inferTraitsFromRun({
          planJson: null,
          finalSpeech,
          presetId: undefined,
        });

        if (inferred && Object.keys(inferred).length > 0) {
          await upsertMemoryTraits({
            supabase,
            userId,
            anonId,
            traits: inferred,
          });
          addTrace(trace, 'memory', 'Updated memory traits from refinement run.');
        } else {
          addTrace(trace, 'memory', 'No new traits inferred from refinement run.');
        }
      }
    } catch (err: any) {
      addTrace(
        trace,
        'memory',
        `Failed to update memory traits (refine): ${err?.message || String(err)}`
      );
    }

    return {
      finalSpeech,
      drafts: null,
      judge: null,
      guardrail: null,
      trace,
    };
  }

  // --- GENERATE MODE (existing full pipeline) ---

  // --- Preparser ---
  let parsed: ParsedBrief | null = null;
  try {
    parsed = await preparseBrief({
      rawBrief,
      audience,
      eventContext,
      tone,
      duration,
      mustInclude,
      mustAvoid,
    });
    addTrace(trace, 'preparser', 'Preparser: parsed brief into structured config.');
  } catch (err: any) {
    addTrace(
      trace,
      'preparser',
      `Preparser failed; continuing with raw brief. ${err?.message || String(err)}`
    );
  }

  // --- Preset match (soft) ---
  let presetId: string | null = null;
  try {
    const match = matchPreset({
      rawBrief,
      ...(parsed || {}),
    });
    if (match) {
      presetId = match.id;
      addTrace(trace, 'presets', `Presets matched: ${match.id}.`);
    } else {
      addTrace(trace, 'presets', 'No strong preset match; using generic planner.');
    }
  } catch (err: any) {
    addTrace(trace, 'presets', `Preset match failed (non-fatal): ${err?.message || String(err)}`);
  }

  // --- Planner ---
  let planJson: any = null;
  try {
    addTrace(trace, 'planner', 'Planner: generating structured plan JSON.');

    planJson = await callJsonModel({
      system: plannerPrompt,
      user: {
        rawBrief,
        parsedBrief: parsed,
        presetId,
      },
    });

    addTrace(trace, 'planner', 'Planner: generated structured plan JSON.');
  } catch (err: any) {
    addTrace(trace, 'planner', `Planner failed: ${err?.message || String(err)}`);
    return {
      finalSpeech: null,
      drafts: null,
      judge: null,
      guardrail: null,
      trace,
    };
  }

  // --- Drafter (two drafts) ---
  let draft1 = '';
  let draft2 = '';
  try {
    addTrace(trace, 'drafter', 'Drafter: creating two candidate drafts.');

    const draftsJson = await callJsonModel({
      system: drafterPrompt,
      user: {
        plan: planJson,
        variants: 2,
      },
    });

    draft1 = (draftsJson.draft_1 || draftsJson.draft1 || '').trim();
    draft2 = (draftsJson.draft_2 || draftsJson.draft2 || '').trim();

    if (!draft1 && !draft2) {
      throw new Error('No drafts returned from drafter.');
    }

    addTrace(trace, 'drafter', 'Drafter: produced 2 drafts.');
  } catch (err: any) {
    addTrace(trace, 'drafter', `Drafter failed: ${err?.message || String(err)}`);
    return {
      finalSpeech: null,
      drafts: null,
      judge: null,
      guardrail: null,
      trace,
    };
  }

  // --- Judge ---
  let winner: 1 | 2 = 1;
  let judgeReason = '';
  try {
    addTrace(trace, 'judge', 'Judge: evaluating drafts.');

    const judgeJson = await callJsonModel({
      system: judgePrompt,
      user: {
        plan: planJson,
        draft_1: draft1,
        draft_2: draft2,
      },
    });

    const choice = Number(judgeJson.winner || judgeJson.choice || 1);
    winner = choice === 2 ? 2 : 1;
    judgeReason = judgeJson.reason || judgeJson.justification || '';

    addTrace(
      trace,
      'judge',
      `Judge: selected draft ${winner} — ${String(judgeReason || 'no reason provided').slice(
        0,
        260
      )}`
    );
  } catch (err: any) {
    addTrace(trace, 'judge', `Judge failed; defaulting to draft 1. ${err?.message || String(err)}`);
    winner = 1;
  }

  const winnerLabel: 'draft1' | 'draft2' = winner === 2 ? 'draft2' : 'draft1';
  let workingDraft = winner === 2 ? draft2 : draft1;

  // --- Guardrail ---
  let guardrail: GuardrailInfo | null = null;
  try {
    addTrace(trace, 'guardrail', 'Guardrail: checking draft against constraints and safety.');

    const guardJson = await callJsonModel({
      system: guardrailPrompt,
      user: {
        plan: planJson,
        draft: workingDraft,
      },
    });

    const adjusted = guardJson.adjusted_draft || guardJson.safeDraft || null;
    const issues = guardJson.issues_summary || guardJson.issues || guardJson.reason || null;

    if (adjusted) {
      workingDraft = String(adjusted);
      guardrail = {
        ok: true,
        message: issues || 'Adjusted to comply with constraints / safety.',
      };
      addTrace(
        trace,
        'guardrail',
        `Guardrail: applied minimal edits. Issues: ${String(guardrail.message).slice(0, 260)}`
      );
    } else {
      guardrail = {
        ok: true,
        message: 'OK — no material issues found.',
      };
      addTrace(trace, 'guardrail', 'Guardrail: OK — no material issues found.');
    }
  } catch (err: any) {
    guardrail = {
      ok: false,
      message: 'Guardrail failed or skipped; using judge-selected draft.',
    };
    addTrace(
      trace,
      'guardrail',
      `Guardrail: failed or skipped; using judge-selected draft. ${err?.message || String(err)}`
    );
  }

  // --- Editor ---
  let finalSpeech = workingDraft;
  try {
    addTrace(trace, 'editor', 'Editor: tightening winning draft for spoken delivery.');

    const edited = await callTextModel({
      system: editorPrompt,
      user: {
        plan: planJson,
        draft: workingDraft,
      },
    });

    if (edited.trim()) {
      finalSpeech = edited.trim();
    }

    addTrace(trace, 'editor', 'Editor: final speech ready.');
  } catch (err: any) {
    addTrace(
      trace,
      'editor',
      `Editor failed; using unedited draft. ${err?.message || String(err)}`
    );
  }

  const drafts: Drafts = {
    draft1,
    draft2,
    winnerLabel,
  };

  const judgeInfo: JudgeInfo = {
    winner,
    reason: judgeReason,
  };

  // --- Persistence: speeches ---
  if (supabase && (userId || anonId) && finalSpeech) {
    try {
      const insert: any = {
        brief: rawBrief,
        draft_1: draft1,
        draft_2: draft2,
        final_speech: finalSpeech,
        trace,
      };
      if (userId) insert.user_id = userId;
      if (anonId) insert.anon_id = anonId;

      const { error } = await supabase.from('speeches').insert(insert);

      if (error) {
        addTrace(trace, 'persistence', `Failed to save: ${error.message}`);
      } else {
        addTrace(trace, 'persistence', 'Saved speech to history for current identity.');
      }
    } catch (err: any) {
      addTrace(trace, 'persistence', `Failed to save speech: ${err?.message || String(err)}`);
    }
  } else {
    addTrace(trace, 'persistence', 'No user/anon identity or final speech; run not saved.');
  }

  // --- Memory: update traits (non-blocking) ---
  try {
    if (supabase && (userId || anonId) && finalSpeech) {
      const inferred = inferTraitsFromRun({
        planJson,
        finalSpeech,
        presetId: presetId || undefined,
      });

      if (inferred && Object.keys(inferred).length > 0) {
        await upsertMemoryTraits({
          supabase,
          userId,
          anonId,
          traits: inferred,
        });
        addTrace(trace, 'memory', 'Updated memory traits for this identity.');
      } else {
        addTrace(trace, 'memory', 'No new traits inferred for this run.');
      }
    }
  } catch (err: any) {
    addTrace(trace, 'memory', `Failed to update memory traits: ${err?.message || String(err)}`);
  }

  return {
    finalSpeech,
    drafts,
    judge: judgeInfo,
    guardrail,
    trace,
  };
}

export default runSpeechwriterPipeline;
