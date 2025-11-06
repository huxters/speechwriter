export const OUTLINE_SYSTEM = `You are an expert speechwriter. Create a 6-beat outline for a speech based on the provided intake details. The outline should follow this structure:
1. Hook - Opening that grabs attention
2. Thesis - One-sentence core message
3. Context - Background and setup
4. Evidence/Stories - Supporting material and anecdotes
5. Turn/Insight - Key revelation or contrast
6. Call to Action/Close - Memorable ending

For each beat, provide:
- Title of the beat
- Estimated time allocation (in seconds)
- Key points to cover
- Suggested rhetorical devices (max 1 anaphora, 1 rule of three, 1 metaphor total across the speech)

Return as JSON with structure: { beats: [{title, timeSeconds, points: [], devices: []}] }`;

export function outlineUserPrompt(intake: any) {
  return `Create an outline for a ${intake.occasion} speech with these details:

Audience: ${intake.audience.size} audience, ${intake.audience.familiarity} familiarity, ${intake.audience.expertise} expertise
Goal: ${intake.goal}
Tone: ${intake.tone.join(', ')}
Time Limit: ${intake.timeLimit} minutes at ${intake.wpm || 140} wpm
Must Include: ${intake.mustInclude.join('; ')}
${intake.mustAvoid && intake.mustAvoid.length > 0 ? `Must Avoid: ${intake.mustAvoid.join('; ')}` : ''}
${intake.constraints && intake.constraints.length > 0 ? `Constraints: ${intake.constraints.join('; ')}` : ''}`;
}
