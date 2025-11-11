import { createClient } from '@supabase/supabase-js';

export type MemoryTraits = {
  roles?: string[];
  tonePreferences?: string[];
  avgLengthWords?: number;
  presetsUsed?: string[];
  tabooPhrases?: string[];
};

type Identity = {
  userId?: string | null;
  anonId?: string | null;
};

function getServiceClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    // Fail-soft: if not configured, we just don't use memory.
    return null;
  }

  return createClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Load memory traits for a given identity.
 * Soft-fails: returns null if no client / no identity / no row.
 */
export async function loadMemory(identity: Identity): Promise<MemoryTraits | null> {
  const supabase = getServiceClient();
  if (!supabase) return null;

  const { userId, anonId } = identity;
  if (!userId && !anonId) return null;

  const query = supabase.from('speechwriter_memory').select('traits').maybeSingle();

  const { data, error } = await (userId
    ? query.eq('user_id', userId)
    : query.eq('anon_id', anonId as string));

  if (error || !data || !data.traits) return null;

  return (data.traits as MemoryTraits) || null;
}

/**
 * Update memory for a given identity.
 * This is intentionally simple & conservative for v1:
 * - If row exists → merge traits + increment runs_count.
 * - If not → insert new.
 * Soft-fails on any error.
 */
export async function updateMemory(
  identity: Identity,
  traitsDelta: Partial<MemoryTraits>
): Promise<void> {
  const supabase = getServiceClient();
  if (!supabase) return;

  const { userId, anonId } = identity;
  if (!userId && !anonId) return;

  // Load existing row (if any)
  const baseQuery = supabase.from('speechwriter_memory').select('*').maybeSingle();
  const { data: existing } = await (userId
    ? baseQuery.eq('user_id', userId)
    : baseQuery.eq('anon_id', anonId as string));

  const now = new Date().toISOString();

  if (existing) {
    const mergedTraits = {
      ...(existing.traits || {}),
      ...traitsDelta,
    };

    await supabase
      .from('speechwriter_memory')
      .update({
        traits: mergedTraits,
        runs_count: (existing.runs_count || 0) + 1,
        last_updated: now,
      })
      .eq('id', existing.id);
  } else {
    await supabase.from('speechwriter_memory').insert({
      user_id: userId || null,
      anon_id: userId ? null : anonId || null,
      traits: traitsDelta || {},
      runs_count: 1,
      last_updated: now,
    });
  }
}
