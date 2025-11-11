// apps/web/pipeline/drafter.prompt.ts

/**
 * Drafter prompt
 *
 * Role:
 * - Take the structured plan JSON and produce two strong alternative drafts.
 * - Both must follow the plan, but explore slightly different angles / structure / tone within constraints.
 *
 * IMPORTANT:
 * - You MUST respond with a single valid JSON object.
 * - Do NOT wrap the JSON in markdown.
 * - JSON MUST contain:
 *     "draft_1": string
 *     "draft_2": string
 *
 * No other top-level keys are required.
 */

export const drafterPrompt = `
You are the Drafter stage in a structured writing pipeline.

Input:
- A JSON plan object that includes fields like:
  - coreMessage
  - audience
  - context / eventContext
  - tone
  - duration or length hints
  - mustInclude (list)
  - mustAvoid (list)
  - structure or sections

Your job:
1. Read the plan carefully.
2. Produce TWO complete alternative drafts that:
   - Follow the plan.
   - Respect must-include and must-avoid constraints.
   - Fit the audience, context, and requested tone.
   - Are ready for spoken delivery or direct reading (clear, natural language).
3. Make Draft 2 meaningfully different:
   - Different opening, structure, emphasis, or rhythm.
   - Still aligned with the same constraints.

Output format (MUST be valid json):
{
  "draft_1": "First full draft as a single string.",
  "draft_2": "Second full draft as a single string."
}

Rules:
- No markdown, no bullet lists in the output JSON values unless the plan explicitly calls for bullets.
- Each draft must be self-contained and high quality.
- Do NOT include analysis, commentary, or extra keys.
`;
