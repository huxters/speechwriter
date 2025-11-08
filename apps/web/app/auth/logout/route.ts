// apps/web/app/auth/logout/route.ts

import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function POST() {
  const supabase = await createClient();

  // Clear Supabase auth session
  await supabase.auth.signOut();

  // After logout, always go to the login page
  const url = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, '') || 'http://localhost:3000';

  return NextResponse.redirect(`${url}/login`, {
    headers: {
      // (Next/Supabase client code is already wired to manage cookies.
      // We just return a redirect; cookies are updated via the client helpers.)
    },
  });
}
