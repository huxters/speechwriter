'use client';

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { isAdminEmail } from '@/lib/auth/isAdmin';

type UserState = {
  email: string | null;
};

export default function Header(): JSX.Element {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  const [user, setUser] = useState<UserState>({ email: null });
  const [isReady, setIsReady] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const email = data.user?.email ?? null;
      setUser({ email });
      setIsAdmin(!!email && isAdminEmail(email));
      setIsReady(true);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
    // hard reload to be absolutely sure client+server state are clean
    window.location.reload();
  };

  const onLoginPage = pathname === '/login' || pathname.startsWith('/callback');

  // Nav only when:
  // - we’ve checked auth (isReady)
  // - and user is logged in
  // - and we’re not on the login/callback screens
  const showNav = isReady && !!user.email && !onLoginPage;

  const linkClass = (href: string) => {
    const active = pathname === href || (href !== '/dashboard' && pathname.startsWith(href));
    return 'nav-link' + (active ? ' nav-link-active' : '');
  };

  return (
    <header className="header">
      <div className="header-left">
        <Link href={user.email ? '/dashboard' : '/login'} className="logo">
          <div className="logo-dot" />
          <div className="logo-text">
            <span className="logo-title">Speechwriter</span>
            <span className="logo-sub">by Halo MicroFactory</span>
          </div>
        </Link>
      </div>

      {showNav && (
        <nav className="header-nav">
          <Link href="/dashboard" className={linkClass('/dashboard')}>
            Dashboard
          </Link>
          <Link href="/generate" className={linkClass('/generate')}>
            New Speech
          </Link>
          <Link href="/history" className={linkClass('/history')}>
            History
          </Link>
          {isAdmin && (
            <Link href="/admin" className={linkClass('/admin')}>
              Admin
            </Link>
          )}
          <button className="nav-logout" onClick={handleLogout}>
            Logout
          </button>
        </nav>
      )}
    </header>
  );
}
