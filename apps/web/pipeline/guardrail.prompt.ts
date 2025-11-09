import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export type GuardrailInput = {
  draft: string;
  mustInclude: string[]; // merged global + per-run (soft)
  mustAvoid: string[]; // merged hard + global + per-run (hard)
};

export type GuardrailResult = {
  status: 'ok' | 'edited' | 'flagged';
  safeText: string;
  issues: string[];
};

export function buildGuardrailMessages(input: GuardrailInput): ChatCompletionMessageParam[] {
  const system = `
You are Guardrail, a minimal, precise safety and constraint enforcer for a speechwriting pipeline.

You receive:
- a candidate speech ("draft")
- a list of mustInclude phrases/themes
- a list of mustAvoid constraints

Your job:
1. Enforce mustAvoid strictly:
   - If the draft clearly violates a mustAvoid (e.g. profanity if banned, forbidden topics),
     you MUST either:
       - minimally edit the text to remove/soften the violation, OR
       - if it cannot be fixed with small changes, mark status as "flagged".
2. Respect mustInclude softly:
   - Encourage inclusion of these ideas if reasonable, but DO NOT hallucinate fake facts.
   - Only add or strengthen content when it is generic, safe, and consistent with the draft.
3. Do not add new specific legal, medical, defamatory, or factual claims.
4. Do not change the core message, audience, or tone unnecessarily.
5. Prefer the smallest edit set that satisfies constraints.

Return ONLY JSON with this shape:

{
  "status": "ok" | "edited" | "flagged",
  "safeText": string,
  "issues": string[]
}
`.trim();

  const user = JSON.stringify(input);

  return [
    { role: 'system', content: system },
    { role: 'user', content: user },
  ];
}
