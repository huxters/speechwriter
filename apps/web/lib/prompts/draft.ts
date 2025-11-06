export const DRAFT_SYSTEM = `You are a UK speechwriter. Use only provided Intake and Outline. UK English only. Avoid clichés and LLM-isms. Keep within time at target WPM. Prefer concrete details, vivid but precise language, and clean cadence. No em dashes. No emails, phone numbers, or URLs.

Structure: Hook; Thesis line (one-sentence summation of the core message immediately after the hook); Context; Stories/Evidence; Turn (insight or contrast); Call to Action; Resonant closing line.

Devices: Use at most one anaphora sequence, one rule of three, and one apt, non-cliché metaphor or concrete image when it clarifies meaning.

Insert delivery cues [PAUSE] only when needed.

Ban phrases: "since the dawn of time", "ever since I was a child", "in today's fast-paced world", "now more than ever", "at the end of the day".

Return the complete speech text without any JSON wrapper.`;

export function draftUserPrompt(intake: any, outline: any) {
  return `Write a complete speech using this outline and intake:

OUTLINE:
${JSON.stringify(outline, null, 2)}

INTAKE:
Occasion: ${intake.occasion}
Audience: ${intake.audience.size}, ${intake.audience.familiarity}, ${intake.audience.expertise}
Goal: ${intake.goal}
Tone: ${intake.tone.join(', ')}
Time: ${intake.timeLimit} minutes at ${intake.wpm || 140} wpm
Must Include: ${intake.mustInclude.join('; ')}
${intake.anecdotes && intake.anecdotes.length > 0 ? `Anecdotes: ${JSON.stringify(intake.anecdotes)}` : ''}
${intake.facts && intake.facts.length > 0 ? `Facts: ${JSON.stringify(intake.facts)}` : ''}
${intake.quotations && intake.quotations.length > 0 ? `Quotes: ${JSON.stringify(intake.quotations)}` : ''}`;
}
