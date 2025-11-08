import OpenAI from 'openai';
import { plannerPrompt } from './planner.prompt';
import { drafterPrompt } from './drafter.prompt';
import { judgePrompt } from './judge.prompt';
import { editorPrompt } from './editor.prompt';
import { guardrailPrompt } from './guardrail.prompt';

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

type PipelineTraceEntry = {
  stage: 'planner' | 'drafter' | 'judge' | 'guardrail' | 'editor';
  message: string;
};

export async function runSpeechwriterPipeline(userBrief: string): Promise<{
  finalSpeech: string;
  planner: any;
  judge: { winner: number; reason: string };
  trace: PipelineTraceEntry[];
}> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set');
  }

  const trace: PipelineTraceEntry[] = [];

  // 1. Planner
  trace.push({ stage: 'planner', message: 'Planner: generating structured plan from brief.' });

  const plannerRes = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: plannerPrompt },
      { role: 'user', content: userBrief },
    ],
  });

  const plannerText = plannerRes.choices[0]?.message?.content || '';
  const plannerJson = safeJson(plannerText);
  trace.push({ stage: 'planner', message: 'Planner: completed and JSON parsed.' });

  // 2. Drafter
  trace.push({ stage: 'drafter', message: 'Drafter: creating alternative speech drafts.' });

  const drafterRes = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: drafterPrompt },
      {
        role: 'user',
        content: JSON.stringify(plannerJson),
      },
    ],
  });

  const drafterText = drafterRes.choices[0]?.message?.content || '';
  const { draft1, draft2 } = extractDrafts(drafterText);
  trace.push({ stage: 'drafter', message: 'Drafter: produced 2 drafts.' });

  // 3. Judge
  trace.push({ stage: 'judge', message: 'Judge: evaluating drafts and selecting a winner.' });

  const judgeRes = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: judgePrompt },
      {
        role: 'user',
        content: JSON.stringify({
          planner: plannerJson,
          draft1,
          draft2,
        }),
      },
    ],
  });

  const judgeText = judgeRes.choices[0]?.message?.content || '';
  const judgeJson = safeJson(judgeText);
  const winnerDraft = judgeJson.winner === 2 ? draft2 : draft1;
  trace.push({
    stage: 'judge',
    message: `Judge: selected draft ${judgeJson.winner} — ${judgeJson.reason || 'no reason provided'}.`,
  });

  // 4. Guardrail (stub)
  trace.push({ stage: 'guardrail', message: 'Guardrail: stub check (always OK for MVP).' });

  const guardrailRes = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: guardrailPrompt },
      { role: 'user', content: winnerDraft },
    ],
  });

  const guardrailOutput = (guardrailRes.choices[0]?.message?.content || '').trim();
  if (guardrailOutput !== 'OK') {
    trace.push({
      stage: 'guardrail',
      message: `Guardrail: returned '${guardrailOutput}', but MVP ignores non-OK.`,
    });
  } else {
    trace.push({ stage: 'guardrail', message: 'Guardrail: OK.' });
  }

  // 5. Editor
  trace.push({ stage: 'editor', message: 'Editor: tightening winning draft for spoken delivery.' });

  const editorRes = await client.chat.completions.create({
    model: 'gpt-4.1-mini',
    messages: [
      { role: 'system', content: editorPrompt },
      {
        role: 'user',
        content: winnerDraft,
      },
    ],
  });

  const finalSpeech = editorRes.choices[0]?.message?.content || '';
  trace.push({ stage: 'editor', message: 'Editor: final speech ready.' });

  return {
    finalSpeech,
    planner: plannerJson,
    judge: {
      winner: judgeJson.winner,
      reason: judgeJson.reason,
    },
    trace,
  };
}

// --- helpers ---

function safeJson(str?: string | null): any {
  if (!str) return {};
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
}

function extractDrafts(raw: string): { draft1: string; draft2: string } {
  const d1 = raw.split('===DRAFT_1===')[1]?.split('===END_DRAFT_1===')[0] || '';
  const d2 = raw.split('===DRAFT_2===')[1]?.split('===END_DRAFT_2===')[0] || '';
  return { draft1: d1.trim(), draft2: d2.trim() };
}
