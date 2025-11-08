import type { ChatCompletionMessageParam } from 'openai/resources/chat/completions';

export type GuardrailInput = {
  draft: string;
  mustInclude?: string[];
  mustAvoid?: string[];
};

export type GuardrailResult =
  | {
      status: 'ok';
      safeText: string;
      issues: string[];
    }
  | {
      status: 'edited';
      safeText: string;
      issues: string[];
    }
  | {
      status: 'flagged';
      safeText: string;
      issues: string[];
    };

/**
 * Build messages for the Guardrail model.
 * The model:
 * - Checks if the draft violates must-avoid constraints.
 * - Ensures must-include points are broadly respected.
 * - Avoids obviously inappropriate / high-risk content.
 * - Returns JSON only.
 */
export function buildGuardrailMessages(input: GuardrailInput): ChatCompletionMessageParam[] {
  const { draft, mustInclude = [], mustAvoid = [] } = input;

  const mustIncludeList =
    mustInclude.length > 0 ? mustInclude.map(m => `- ${m}`).join('\n') : '- (none specified)';
  const mustAvoidList =
    mustAvoid.length > 0 ? mustAvoid.map(m => `- ${m}`).join('\n') : '- (none specified)';

  const system = `
You are Guardrail, a cautious but minimal editor for a speechwriting pipeline.

Your job:
- Check the DRAFT against the CONSTRAINTS.
- Only intervene when necessary.
- Never invent new factual claims (numbers, names, promises).
- Preserve the speaker's intent, tone, and meaning.

Constraints to enforce:

1. Must-Avoid:
   - The DRAFT should not include content that directly contradicts or clearly violates the must-avoid list.
   - If it does, remove or rephrase minimally.

2. Must-Include:
   - If any must-include items are clearly missing and can be added safely, you may minimally weave them in.
   - Do NOT fabricate specifics. Use generic, truthful phrasing if needed.

3. Safety & Professionalism:
   - Avoid gratuitously offensive, hateful, or demeaning language.
   - Avoid absurd or clearly impossible claims about the product or organisation.
   - If something is borderline, prefer a softening edit over blocking.

Return JSON ONLY with this shape (no extra commentary):

{
  "status": "ok" | "edited" | "flagged",
  "safeText": "string",
  "issues": ["short explanation 1", "short explanation 2"]
}

Definitions:
- "ok": Draft is acceptable with no material changes.
- "edited": You made targeted edits to comply with constraints.
- "flagged": Serious issues remain. You still provide the safest version you can in "safeText" but note issues.
`.trim();

  const user = `
CONSTRAINTS:
- Must-Include:
${mustIncludeList}

- Must-Avoid:
${mustAvoidList}

DRAFT:
${draft}
  `.trim();

  return [
    {
      role: 'system',
      content: system,
    },
    {
      role: 'user',
      content: user,
    },
  ];
}
