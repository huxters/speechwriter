// apps/web/pipeline/presets.ts

export type PresetMatch = {
  id: string;
  label: string;
  confidence: number; // 0–1
};

type BriefLike = {
  rawBrief?: string;
  goal?: string;
  audience?: string;
  context?: string;
  tone?: string;
  [key: string]: any;
};

function includesAny(text: string, needles: string[]): boolean {
  const lower = text.toLowerCase();
  return needles.some(n => lower.includes(n.toLowerCase()));
}

/**
 * Very small heuristic preset matcher.
 * Returns null if we’re not confident — never blocks the pipeline.
 */
export function matchPreset(input: BriefLike): PresetMatch | null {
  const raw = (input.rawBrief || input.goal || '').toString();
  const audience = (input.audience || '').toString();
  const context = (input.context || '').toString();
  const tone = (input.tone || '').toString();

  const haystack = `${raw}\n${audience}\n${context}\n${tone}`.toLowerCase();

  // 1) Student personal statement / UCAS
  if (
    includesAny(haystack, [
      'personal statement',
      'ucas',
      'university application',
      'college application',
      'applying to university',
    ])
  ) {
    return {
      id: 'student_personal_statement',
      label: 'Student personal statement',
      confidence: 0.9,
    };
  }

  // 2) Internal thank-you / end-of-year
  if (
    includesAny(haystack, [
      'thank my team',
      'thank the team',
      'appreciation',
      'end-of-year',
      'end of year',
      'all-hands',
      'all hands',
    ])
  ) {
    return {
      id: 'team_appreciation',
      label: 'Team appreciation / end-of-year',
      confidence: 0.8,
    };
  }

  // 3) Exec / founder update
  if (
    includesAny(haystack, [
      'investor update',
      'board update',
      'board paper',
      'town hall',
      'strategy update',
      'shareholders letter',
      'founder letter',
      'ceo update',
    ])
  ) {
    return {
      id: 'exec_update',
      label: 'Executive / founder update',
      confidence: 0.78,
    };
  }

  // 4) Event speech
  if (
    includesAny(haystack, [
      'wedding speech',
      'best man',
      'maid of honor',
      'father of the bride',
      'retirement speech',
      'birthday speech',
    ])
  ) {
    return {
      id: 'event_speech',
      label: 'Personal event speech',
      confidence: 0.8,
    };
  }

  return null;
}
