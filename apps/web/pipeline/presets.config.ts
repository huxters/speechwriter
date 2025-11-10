import { ParsedBrief } from './preparseBrief';

export type PresetId =
  | 'corporate_leadership_talk'
  | 'all_hands_update'
  | 'board_briefing'
  | 'investor_update'
  | 'student_personal_statement'
  | 'wedding_speech'
  | 'press_announcement'
  | 'fundraising_pitch'
  | 'policy_explainer';

type PresetRule = {
  id: PresetId;
  roles?: string[];
  audiences?: string[];
  intents?: string[];
  formats?: string[];
  domains?: string[];
};

const PRESET_RULES: PresetRule[] = [
  {
    id: 'corporate_leadership_talk',
    roles: ['ceo', 'founder', 'chief executive'],
    audiences: ['all-staff', 'employees', 'team'],
    domains: ['corporate', 'startup'],
    intents: ['motivate', 'thank', 'reassure', 'announce_change'],
    formats: ['speech', 'talk', 'remarks'],
  },
  {
    id: 'all_hands_update',
    audiences: ['all-staff', 'employees', 'team'],
    intents: ['update', 'motivate', 'reassure'],
    formats: ['speech', 'talk', 'remarks'],
  },
  {
    id: 'board_briefing',
    audiences: ['board'],
    intents: ['explain', 'defend', 'report'],
    formats: ['speech', 'talk', 'memo', 'briefing'],
  },
  {
    id: 'investor_update',
    audiences: ['investors'],
    intents: ['update', 'pitch', 'reassure'],
    formats: ['speech', 'email', 'deck'],
  },
  {
    id: 'student_personal_statement',
    formats: ['personal_statement'],
    domains: ['education'],
    intents: ['apply'],
  },
  {
    id: 'wedding_speech',
    domains: ['wedding'],
    formats: ['speech', 'talk'],
  },
  {
    id: 'press_announcement',
    intents: ['announce_change', 'announce'],
    formats: ['press_release', 'statement'],
  },
  {
    id: 'fundraising_pitch',
    intents: ['pitch', 'fundraise'],
    formats: ['speech', 'talk', 'deck'],
  },
  {
    id: 'policy_explainer',
    domains: ['public_sector', 'politics'],
    intents: ['explain', 'inform'],
    formats: ['speech', 'memo'],
  },
];

/**
 * Very lightweight scoring:
 * - For each preset, add points for matches on role/audience/intent/format/domain.
 * - Return presets with score >= 2, in descending score order.
 * - This is INTERNAL ONLY: used as hints for the planner.
 */
export function matchPresets(parsed: ParsedBrief): PresetId[] {
  const role = (parsed.role_inferred || '').toLowerCase();
  const audience = (parsed.audience_inferred || '').toLowerCase();
  const intent = (parsed.intent || '').toLowerCase();
  const format = (parsed.format_guess || '').toLowerCase();
  const domain = (parsed.domain || '').toLowerCase();

  const scores: { id: PresetId; score: number }[] = [];

  for (const rule of PRESET_RULES) {
    let score = 0;

    if (role && rule.roles?.some(r => role.includes(r))) score += 2;
    if (audience && rule.audiences?.some(a => audience.includes(a))) score += 2;
    if (intent && rule.intents?.some(i => intent.includes(i))) score += 1;
    if (format && rule.formats?.some(f => format.includes(f))) score += 1;
    if (domain && rule.domains?.some(d => domain.includes(d))) score += 1;

    if (score > 0) {
      scores.push({ id: rule.id, score });
    }
  }

  // Filter to reasonably strong matches
  const strong = scores
    .filter(s => s.score >= 2)
    .sort((a, b) => b.score - a.score)
    .map(s => s.id);

  // De-duplicate & cap
  return Array.from(new Set(strong)).slice(0, 3);
}
