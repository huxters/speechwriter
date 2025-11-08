'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { isAdminEmail } from '@/lib/auth/isAdmin';

type User = {
  email: string | null;
};

export default function Header(): JSX.Element {
  const [user, setUser] = useState<User | null>(null);
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const supabase = createClient();

    // Initial load
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        console.error('Error loading user in Header:', error.message);
        setUser(null);
        setIsAdminUser(false);
        setReady(true);
        return;
      }

      const email = data.user?.email ?? null;
      setUser({ email });
      setIsAdminUser(!!email && isAdminEmail(email));
      setReady(true);
    });

    // Keep in sync with auth state
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const email = session?.user?.email ?? null;
      setUser(email ? { email } : null);
      setIsAdminUser(!!email && isAdminEmail(email));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  };

  // Inline styles (stable, self-contained)
  const headerStyle: React.CSSProperties = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    height: 56,
    padding: '0 32px',
    background: 'linear-gradient(90deg, #111827, #111827 30%, #4f46e5 75%, #7c3aed 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    color: '#ffffff',
    boxShadow: '0 4px 16px rgba(15,23,42,0.35)',
    zIndex: 50,
  };

  const brandStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    textDecoration: 'none',
    color: 'inherit',
  };

  const brandDotStyle: React.CSSProperties = {
    width: 16,
    height: 16,
    borderRadius: '999px',
    background: 'radial-gradient(circle at 30% 0, #22c55e, #4f46e5 55%, #7c3aed 100%)',
    boxShadow: '0 0 10px rgba(129,140,248,0.9)',
  };

  const brandTitleStyle: React.CSSProperties = {
    fontSize: 16,
    fontWeight: 600,
    lineHeight: 1.1,
  };

  const brandSubStyle: React.CSSProperties = {
    fontSize: 10,
    opacity: 0.72,
  };

  const navStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 18,
    fontSize: 13,
  };

  const navLinkStyle: React.CSSProperties = {
    textDecoration: 'none',
    color: '#e5e7eb',
    padding: '6px 10px',
    borderRadius: 999,
    transition: 'all 0.18s ease',
  };

  const navLinkActiveStyle: React.CSSProperties = {
    ...navLinkStyle,
    background: 'rgba(15,23,42,0.95)',
    color: '#e5e7eb',
    boxShadow: '0 6px 16px rgba(15,23,42,0.65)',
  };

  const adminLinkStyle: React.CSSProperties = {
    ...navLinkActiveStyle,
    background: 'radial-gradient(circle at 0 0, rgba(129,140,248,0.9), #4f46e5)',
  };

  const rightStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    fontSize: 11,
  };

  const emailStyle: React.CSSProperties = {
    padding: '4px 10px',
    borderRadius: 999,
    background: 'rgba(15,23,42,0.92)',
    color: '#e5e7eb',
    maxWidth: 220,
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  };

  const logoutStyle: React.CSSProperties = {
    padding: '5px 12px',
    borderRadius: 999,
    border: '1px solid rgba(249,250,251,0.4)',
    background: 'transparent',
    color: '#e5e7eb',
    fontSize: 11,
    cursor: 'pointer',
    transition: 'all 0.18s ease',
  };

  return (
    <>
      <header style={headerStyle}>
        {/* Brand */}
        <Link href="/" style={brandStyle}>
          <span style={brandDotStyle} />
          <div>
            <div style={brandTitleStyle}>Speechwriter</div>
            <div style={brandSubStyle}>by Halo MicroFactory</div>
          </div>
        </Link>

        {/* Nav (only when logged in & ready) */}
        <nav style={navStyle}>
          {ready && user && (
            <>
              <Link href="/dashboard" style={navLinkActiveStyle}>
                Dashboard
              </Link>
              <Link href="/dashboard/generate" style={navLinkStyle}>
                New Speech
              </Link>
              <Link href="/dashboard/history" style={navLinkStyle}>
                History
              </Link>
              {isAdminUser && (
                <Link href="/admin" style={adminLinkStyle}>
                  Admin
                </Link>
              )}
            </>
          )}
        </nav>

        {/* User / Logout (only when logged in) */}
        <div style={rightStyle}>
          {ready && user && user.email && <span style={emailStyle}>{user.email}</span>}
          {ready && user && (
            <button style={logoutStyle} onClick={handleLogout}>
              Logout
            </button>
          )}
        </div>
      </header>

      {/* Spacer so content isn't hidden under fixed header */}
      <div style={{ height: 56 }} />
    </>
  );
}
