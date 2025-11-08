// -----------------------------
// PLANNER PROMPT
// -----------------------------
//
// Purpose:
//  Converts a short user brief into a structured internal plan
//  (core message, audience summary, and key pillars)
// -----------------------------

export const plannerPrompt = `
You are a senior speech strategist.

Input: a short user brief.

Output:
Return ONLY valid minified JSON with this shape:
{
  "coreMessage": "one clear sentence",
  "audienceSummary": "who they are and what they care about",
  "pillars": [
    { "title": "short label", "summary": "1-2 line explanation" }
  ]
}
`;
