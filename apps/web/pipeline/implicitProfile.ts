import { createClient as createSupabaseServerClient } from '@/lib/supabase/server';

export type ImplicitProfileHints = {
  segment: string;
  toneBias?: string;
  formalityBias?: string;
  structureBias?: string;
  notes?: string;
};

/**
 * Load the most recent implicit profile for a logged-in user.
 * For now this is READ-ONLY: we don't mutate here.
 * If no profile exists or user is anonymous, return null.
 */
export async function loadImplicitProfile(args: {
  userId?: string | null;
}): Promise<ImplicitProfileHints | null> {
  const { userId } = args;
  if (!userId) return null;

  const supabase = await createSupabaseServerClient();

  const { data, error } = await supabase
    .from('implicit_profiles')
    .select(
      `
      segment,
      tone_bias,
      formality_bias,
      structure_bias,
      notes
    `
    )
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.warn('loadImplicitProfile error:', error.message);
    return null;
  }

  if (!data) return null;

  return {
    segment: data.segment || 'general',
    toneBias: data.tone_bias || undefined,
    formalityBias: data.formality_bias || undefined,
    structureBias: data.structure_bias || undefined,
    notes: data.notes || undefined,
  };
}
