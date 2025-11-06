export const REFINE_SYSTEM = `You are a UK speechwriter helping refine a speech draft. Use UK English only. Be concise and actionable in your responses. When making changes, return the complete updated speech text.`;

export function refineUserPrompt(draft: string, refinementRequest: string) {
  return `CURRENT SPEECH DRAFT:
${draft}

USER REQUEST:
${refinementRequest}

Please respond with the refined speech incorporating the requested changes.`;
}
