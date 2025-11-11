// apps/web/app/auth/callback/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
  // This route is hit by the Supabase magic link.
  // It exchanges the code for a session and sets cookies,
  // then sends the user to the main landing page (/).
  const requestUrl = new URL(req.url);
  const code = requestUrl.searchParams.get('code');

  if (!code) {
    // No code? Just bounce home.
    return NextResponse.redirect(new URL('/', requestUrl.origin));
  }

  const supabase = await createClient();

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('Supabase auth callback error:', error.message);
    return NextResponse.redirect(new URL('/login?error=auth', requestUrl.origin));
  }

  return NextResponse.redirect(new URL('/', requestUrl.origin));
}
