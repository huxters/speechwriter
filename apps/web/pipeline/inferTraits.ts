// apps/web/pipeline/inferTraits.ts

import type { SupabaseClient } from '@supabase/supabase-js';

export type TraitSnapshot = {
  roles?: string[];
  tonePreferences?: string[];
  lengthPreference?: 'short' | 'medium' | 'long';
  presetsUsed?: string[];
  domains?: string[];
};

function norm(s: string): string {
  return s.toLowerCase().trim();
}

function mergeSets(a?: string[], b?: string[]): string[] | undefined {
  const set = new Set<string>();
  (a || []).forEach(v => v && set.add(norm(v)));
  (b || []).forEach(v => v && set.add(norm(v)));
  return set.size ? Array.from(set) : undefined;
}

export function inferTraitsFromRun(input: {
  planJson: any;
  finalSpeech: string | null;
  presetId?: string;
}): TraitSnapshot {
  const { planJson, finalSpeech, presetId } = input;
  const traits: TraitSnapshot = {};
  const haystack = (JSON.stringify(planJson || {}) + ' ' + (finalSpeech || '')).toLowerCase();

  // Presets
  if (presetId) {
    traits.presetsUsed = [presetId];
  }

  // Roles / persona
  const roleSource =
    planJson?.speakerRole || planJson?.speaker || planJson?.persona || planJson?.role || '';
  const roles: string[] = [];
  if (typeof roleSource === 'string' && roleSource.trim()) {
    const r = roleSource.toLowerCase();
    if (r.includes('ceo') || r.includes('chief executive')) roles.push('executive');
    else if (r.includes('founder')) roles.push('founder');
    else if (r.includes('student')) roles.push('student');
    else if (r.includes('manager')) roles.push('manager');
    else roles.push(r.trim());
  }
  if (roles.length) traits.roles = roles;

  // Tone
  const toneSource = planJson?.tone || planJson?.style || planJson?.voice || '';
  const tonePrefs: string[] = [];
  if (typeof toneSource === 'string') {
    const t = toneSource.toLowerCase();
    if (t.includes('warm')) tonePrefs.push('warm');
    if (t.includes('formal') || t.includes('serious')) tonePrefs.push('formal');
    if (t.includes('clear') || t.includes('direct')) tonePrefs.push('clear');
    if (t.includes('inspiring') || t.includes('motivational')) tonePrefs.push('inspiring');
    if (t.includes('playful') || t.includes('fun')) tonePrefs.push('playful');
  }
  if (tonePrefs.length) traits.tonePreferences = tonePrefs;

  // Length preference
  if (finalSpeech) {
    const words = finalSpeech.trim().split(/\s+/).length;
    if (words < 200) traits.lengthPreference = 'short';
    else if (words < 700) traits.lengthPreference = 'medium';
    else traits.lengthPreference = 'long';
  }

  // Domains (very light-touch)
  const domains: string[] = [];
  if (haystack.includes('fintech') || haystack.includes('financial services')) {
    domains.push('fintech');
  }
  if (haystack.includes('climate') || haystack.includes('sustainability')) {
    domains.push('sustainability');
  }
  if (haystack.includes('university') || haystack.includes('ucas')) {
    domains.push('education');
  }
  if (haystack.includes('startup') || haystack.includes('scale-up')) {
    domains.push('startup');
  }
  if (domains.length) traits.domains = domains;

  // Strip if empty
  if (
    !traits.roles &&
    !traits.tonePreferences &&
    !traits.lengthPreference &&
    !traits.presetsUsed &&
    !traits.domains
  ) {
    return {};
  }

  return traits;
}

/**
 * Upsert into speechwriter_memory:
 * - Keyed by (user_id) or (anon_id).
 * - Merge traits and increment runs_count.
 */
export async function upsertMemoryTraits(opts: {
  supabase: SupabaseClient;
  userId: string | null;
  anonId: string | null;
  traits: TraitSnapshot;
}): Promise<void> {
  const { supabase, userId, anonId, traits } = opts;

  if (!supabase) return;
  if (!traits || Object.keys(traits).length === 0) return;
  if (!userId && !anonId) return;

  const eqFilter = userId ? { user_id: userId } : { anon_id: anonId };

  const { data, error } = await supabase
    .from('speechwriter_memory')
    .select('id, traits, runs_count')
    .match(eqFilter)
    .maybeSingle();

  const now = new Date().toISOString();

  if (error && error.code !== 'PGRST116') {
    // PGRST116 = no rows found; anything else is real.
    console.error('speechwriter_memory select error', error.message);
  }

  const existingTraits: TraitSnapshot = (data?.traits as any) || {};
  const merged: TraitSnapshot = {
    roles: mergeSets(existingTraits.roles, traits.roles),
    tonePreferences: mergeSets(existingTraits.tonePreferences, traits.tonePreferences),
    presetsUsed: mergeSets(existingTraits.presetsUsed, traits.presetsUsed),
    domains: mergeSets(existingTraits.domains, traits.domains),
    lengthPreference: traits.lengthPreference || existingTraits.lengthPreference,
  };

  if (!data) {
    // Insert new row
    const insertPayload: any = {
      traits: merged,
      runs_count: 1,
      last_updated: now,
    };
    if (userId) insertPayload.user_id = userId;
    if (anonId) insertPayload.anon_id = anonId;

    const { error: insertError } = await supabase.from('speechwriter_memory').insert(insertPayload);

    if (insertError) {
      console.error('speechwriter_memory insert error', insertError.message);
    }
    return;
  }

  // Update existing row
  const { error: updateError } = await supabase
    .from('speechwriter_memory')
    .update({
      traits: merged,
      runs_count: (data.runs_count || 0) + 1,
      last_updated: now,
    })
    .eq('id', data.id);

  if (updateError) {
    console.error('speechwriter_memory update error', updateError.message);
  }
}
