// apps/web/app/admin/layout.tsx

import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/auth/isAdmin';

export const metadata = {
  title: 'Admin | Speechwriter',
};

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}): Promise<JSX.Element> {
  const supabase = await createClient();

  const { data, error } = await supabase.auth.getUser();

  if (error) {
    console.error('Error fetching user in AdminLayout:', error.message);
    redirect('/login');
  }

  const user = data.user;

  // Not logged in OR not an admin → bounce to login
  if (!user || !isAdminEmail(user.email)) {
    redirect('/login');
  }

  return (
    <main style={{ padding: '32px' }}>
      <h1 style={{ fontSize: 24, marginBottom: 4 }}>Admin</h1>
      <p
        style={{
          fontSize: 13,
          color: 'var(--text-muted)',
          marginBottom: 24,
        }}
      >
        Internal configuration console. Access restricted to admin accounts.
      </p>
      {children}
    </main>
  );
}
