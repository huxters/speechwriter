import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * Body:
 * {
 *   title: string,
 *   intake: any,              // JSON
 *   outline: any,             // JSON (already parsed)
 *   body: string,             // the full draft text
 *   occasion?: string
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { title, intake, outline, body, occasion } = (await req.json()) as any;

    if (!title || !body) {
      return NextResponse.json({ error: 'Missing title/body' }, { status: 400 });
    }

    // 1) create project
    const { data: project, error: pErr } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        title,
        description: '',
        occasion: occasion ?? intake?.occasion ?? null,
      })
      .select('id')
      .single();

    if (pErr) return NextResponse.json({ error: pErr.message }, { status: 500 });

    // 2) create draft
    const { data: draft, error: dErr } = await supabase
      .from('drafts')
      .insert({
        user_id: user.id,
        project_id: project!.id,
        status: 'draft',
        content: { outline, body },
        meta: { intake },
      })
      .select('id')
      .single();

    if (dErr) return NextResponse.json({ error: dErr.message }, { status: 500 });

    return NextResponse.json({ projectId: project!.id, draftId: draft!.id });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message ?? 'Unknown error' }, { status: 500 });
  }
}
