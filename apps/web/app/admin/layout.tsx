// apps/web/app/admin/layout.tsx

import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { isAdminEmail } from '@/lib/auth/isAdmin';

export default async function AdminLayout({
  children,
}: {
  children: ReactNode;
}): Promise<JSX.Element> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data?.user;

  if (!user || !isAdminEmail(user.email)) {
    redirect('/login');
  }

  return (
    <main
      style={{
        padding: '40px',
        fontFamily: 'Inter, system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 4 }}>Admin</h1>
      <p
        style={{
          color: '#666',
          marginBottom: 24,
          fontSize: 14,
        }}
      >
        Internal configuration console. Access restricted to admin accounts.
      </p>

      {children}
    </main>
  );
}
