// apps/web/app/admin/prompts/page.tsx

import { createClient } from '@/lib/supabase/server';
import PromptsEditor from './PromptsEditor';

export default async function AdminPromptsPage(): Promise<JSX.Element> {
  const supabase = await createClient();

  const { data: prompts, error } = await supabase
    .from('prompt_profiles')
    .select('*')
    .order('key', { ascending: true });

  if (error) {
    console.error('Error loading prompt_profiles:', error.message);
  }

  return (
    <section style={{ display: 'grid', gap: 16 }}>
      <h2 style={{ fontSize: 18, margin: 0 }}>Prompt profiles</h2>
      <p
        style={{
          fontSize: 13,
          color: '#666',
          margin: 0,
          marginBottom: 4,
        }}
      >
        Edit the system and user templates that control how Speechwriter behaves.
      </p>

      <PromptsEditor initialPrompts={prompts || []} />
    </section>
  );
}
