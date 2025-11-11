// apps/web/components/Header.tsx

import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

// Configure which emails count as admins.
const adminEmails =
  (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean) || [];

// Server action: sign out and send user back to "/"
export async function logout() {
  'use server';
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  await supabase.auth.signOut();
  redirect('/');
}

export default async function Header() {
  const cookieStore = cookies();
  const supabase = await createClient(cookieStore);

  const {
    data: { session },
  } = await supabase.auth.getSession();

  const email = session?.user?.email?.toLowerCase() || null;
  const isLoggedIn = !!session;
  const isAdmin = !!(email && adminEmails.includes(email));

  return (
    <header
      style={{
        width: '100%',
        position: 'sticky',
        top: 0,
        zIndex: 40,
        background: 'linear-gradient(90deg, #020817 0%, #111827 40%, #4f46e5 100%)',
        color: '#ffffff',
        boxShadow: '0 10px 30px rgba(15,23,42,0.25)',
      }}
    >
      <div
        style={{
          maxWidth: 1120,
          margin: '0 auto',
          padding: '0.6rem 1.75rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1.5rem',
        }}
      >
        {/* Left: brand */}
        <Link
          href="/"
          style={{
            display: 'flex',
            flexDirection: 'column',
            lineHeight: 1.15,
            textDecoration: 'none',
            color: 'inherit',
          }}
        >
          <span style={{ fontSize: 16, fontWeight: 600 }}>Speechwriter</span>
          <span
            style={{
              fontSize: 10,
              opacity: 0.75,
              letterSpacing: 0.3,
            }}
          >
            by Halo MicroFactory
          </span>
        </Link>

        {/* Right: navigation */}
        <nav
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontSize: 12,
          }}
        >
          {!isLoggedIn && (
            // Public / anonymous: just a subtle Login button
            <Link
              href="/login"
              style={{
                padding: '6px 14px',
                borderRadius: 999,
                border: '1px solid rgba(209,213,219,0.7)',
                color: '#e5e7eb',
                textDecoration: 'none',
              }}
            >
              Login
            </Link>
          )}

          {isLoggedIn && (
            <>
              <Link
                href="/"
                style={{
                  textDecoration: 'none',
                  color: '#e5e7eb',
                }}
              >
                New
              </Link>

              <Link
                href="/history"
                style={{
                  textDecoration: 'none',
                  color: '#e5e7eb',
                }}
              >
                History
              </Link>

              {isAdmin && (
                <Link
                  href="/admin"
                  style={{
                    textDecoration: 'none',
                    color: '#e5e7eb',
                  }}
                >
                  Admin
                </Link>
              )}

              <form action={logout}>
                <button
                  type="submit"
                  style={{
                    padding: '6px 14px',
                    borderRadius: 999,
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 11,
                    fontWeight: 500,
                    backgroundColor: '#111827',
                    color: '#f9fafb',
                  }}
                >
                  Logout
                </button>
              </form>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
