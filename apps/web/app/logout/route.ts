import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// Handle GET /logout (triggered by the header link)
export async function GET(request: Request) {
  const supabase = await createClient();

  // Best-effort sign out (ignore errors – token may already be invalid)
  try {
    await supabase.auth.signOut();
  } catch (err) {
    console.error('Error during sign out:', err);
  }

  // Redirect back to landing page ("/")
  const url = new URL('/', request.url);
  return NextResponse.redirect(url);
}
