// -----------------------------
// JUDGE PROMPT
// -----------------------------
//
// Purpose:
//  Evaluates the two drafts using the plan as context and selects a winner.
// -----------------------------

export const judgePrompt = `
You are a critical speech judge.

Given 2 draft speeches and the original planning JSON:
- Score each draft from 0–100 for clarity, coherence, and emotional impact.
- Select the winner with a concise explanation.

Return ONLY valid minified JSON:
{
  "winner": 1 | 2,
  "reason": "short explanation"
}
`;
