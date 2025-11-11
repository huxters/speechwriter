// apps/web/app/login/page.tsx

import { createClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

function getSiteUrl() {
  // Prefer explicit env; fall back to localhost in dev.
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.SITE_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : '');

  return fromEnv || 'http://localhost:3000';
}

export default function LoginPage() {
  // Server action to send a Supabase magic link
  const sendMagicLink = async (formData: FormData) => {
    'use server';

    const emailRaw = formData.get('email');
    const email = typeof emailRaw === 'string' ? emailRaw.trim() : '';

    if (!email) return;

    const supabase = await createClient();
    const siteUrl = getSiteUrl();

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        // After clicking the magic link, Supabase will call this route.
        // Your /auth/callback handler will set the session and redirect to "/".
        emailRedirectTo: `${siteUrl}/auth/callback`,
      },
    });

    if (error) {
      console.error('Error sending magic link', error.message);
    }
  };

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem 1.5rem',
        background:
          'radial-gradient(circle at top left, rgba(79,70,229,0.05), transparent 55%), #f3f4f6',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 420,
          padding: '2.25rem 2rem',
          borderRadius: 18,
          boxShadow: '0 18px 45px rgba(15,23,42,0.14)',
          background: '#ffffff',
          border: '1px solid rgba(148,163,253,0.18)',
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 600,
            margin: 0,
            marginBottom: 6,
          }}
        >
          Sign in to Speechwriter
        </h1>
        <p
          style={{
            margin: 0,
            marginBottom: 18,
            fontSize: 14,
            color: '#6b7280',
            lineHeight: 1.5,
          }}
        >
          Drop in your email and we&apos;ll send you a one-time magic link. No passwords.
          You&apos;ll land straight in the workspace.
        </p>

        <form action={sendMagicLink}>
          <label
            htmlFor="email"
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 500,
              color: '#4b5563',
              marginBottom: 6,
            }}
          >
            Work email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="you@example.com"
            style={{
              width: '100%',
              padding: '10px 11px',
              borderRadius: 10,
              border: '1px solid #d1d5db',
              fontSize: 14,
              outline: 'none',
              marginBottom: 14,
            }}
          />

          <button
            type="submit"
            style={{
              width: '100%',
              padding: '10px 12px',
              borderRadius: 999,
              border: 'none',
              background: 'linear-gradient(90deg, #111827 0%, #111827 40%, #4f46e5 100%)',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            Send magic link
          </button>
        </form>

        <p
          style={{
            margin: 0,
            marginTop: 14,
            fontSize: 11,
            color: '#9ca3af',
            lineHeight: 1.5,
          }}
        >
          This is a private preview. Magic links are single-use. We may limit anonymous usage to
          protect tokens.
        </p>
      </div>
    </main>
  );
}
