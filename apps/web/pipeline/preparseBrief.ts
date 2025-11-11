// apps/web/pipeline/preparseBrief.ts

import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// What we return to the planner as a structured view of the brief.
export type ParsedBrief = {
  goal?: string;
  audience?: string;
  context?: string;
  tone?: string;
  duration?: string;
  mustInclude?: string[];
  mustAvoid?: string[];
};

type PreparseInput = {
  rawBrief: string;
  audience?: string;
  eventContext?: string;
  tone?: string;
  duration?: string;
  mustInclude?: string;
  mustAvoid?: string;
};

/**
 * Turn the user's free-text + optional hints into a structured brief.
 * If anything fails, the caller should fall back to rawBrief.
 */
export async function preparseBrief(input: PreparseInput): Promise<ParsedBrief> {
  const { rawBrief, audience, eventContext, tone, duration, mustInclude, mustAvoid } = input;

  const base = (rawBrief ?? '').toString();

  const userPayload = {
    rawBrief: base,
    audience,
    eventContext,
    tone,
    duration,
    mustInclude,
    mustAvoid,
  };

  const completion = await openai.chat.completions.create({
    model: 'gpt-4.1-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content:
          'You are a preprocessing parser for a writing assistant. ' +
          'Given a user brief and optional hints, extract a concise JSON object with fields: ' +
          'goal, audience, context, tone, duration, mustInclude[], mustAvoid[]. ' +
          'Always output valid JSON only. Mention "json" in your reasoning but not in the output.',
      },
      {
        role: 'user',
        content: JSON.stringify(userPayload),
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content || '{}';

  try {
    const parsed = JSON.parse(raw);

    const result: ParsedBrief = {
      goal: parsed.goal || undefined,
      audience: parsed.audience || audience || undefined,
      context: parsed.context || eventContext || undefined,
      tone: parsed.tone || tone || undefined,
      duration: parsed.duration || duration || undefined,
      mustInclude: Array.isArray(parsed.mustInclude)
        ? parsed.mustInclude
        : mustInclude
          ? [mustInclude]
          : undefined,
      mustAvoid: Array.isArray(parsed.mustAvoid)
        ? parsed.mustAvoid
        : mustAvoid
          ? [mustAvoid]
          : undefined,
    };

    return result;
  } catch {
    // If model output is junk, fall back to a minimal object
    return {
      goal: undefined,
      audience: audience || undefined,
      context: eventContext || undefined,
      tone: tone || undefined,
      duration: duration || undefined,
      mustInclude: mustInclude ? [mustInclude] : undefined,
      mustAvoid: mustAvoid ? [mustAvoid] : undefined,
    };
  }
}
