// apps/web/app/login/page.tsx

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function LoginPage(): Promise<JSX.Element> {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  // If already logged in, don't show the login form – send to dashboard
  if (session) {
    redirect('/dashboard');
  }

  async function sendMagicLink(formData: FormData) {
    'use server';

    const supabase = await createClient();
    const email = String(formData.get('email') || '').trim();

    if (!email) {
      // In a real app you'd surface this nicely; for now just no-op.
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'}/callback`,
      },
    });

    if (error) {
      console.error('Error sending magic link:', error.message);
      // Could render a better error via redirect or middleware if needed
    }
  }

  return (
    <main className="auth-page">
      <h1 className="auth-title">Login</h1>

      <form action={sendMagicLink}>
        <label htmlFor="email" className="auth-label">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          required
          className="auth-input"
          placeholder="you@example.com"
        />
        <button type="submit" className="auth-button">
          Send magic link
        </button>
      </form>
    </main>
  );
}
