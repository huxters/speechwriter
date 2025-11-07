// apps/web/app/api/admin/prompts/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/auth/isAdmin';

export async function PUT(req: NextRequest) {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  // Server-side admin check
  if (!user || !isAdminEmail(user.email)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const body = await req.json().catch(() => null);

  if (!body || !body.id) {
    return NextResponse.json({ error: 'Invalid payload' }, { status: 400 });
  }

  const update = {
    label: body.label,
    system_prompt: body.system_prompt,
    user_template: body.user_template,
    is_active: typeof body.is_active === 'boolean' ? body.is_active : true,
    updated_at: new Date().toISOString(),
  };

  const { error } = await supabase.from('prompt_profiles').update(update).eq('id', body.id);

  if (error) {
    console.error('Error updating prompt_profile:', error.message);
    return NextResponse.json({ error: 'Failed to update prompt profile' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
