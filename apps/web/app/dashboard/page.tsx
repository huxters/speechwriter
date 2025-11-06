import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

export default async function DashboardPage(): Promise<JSX.Element> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) redirect('/login');

  return (
    <main
      style={{
        padding: '2rem',
        maxWidth: 900,
        margin: '0 auto',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>Dashboard</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>Welcome to Speechwriter! You’re signed in.</p>

      <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
        <Link
          href="/dashboard/generate"
          style={{
            padding: '12px 18px',
            background: '#111',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
          }}
        >
          ➕ New Speech (Generate)
        </Link>

        <Link
          href="/dashboard/history"
          style={{
            padding: '12px 18px',
            background: '#eee',
            color: '#111',
            borderRadius: 8,
            textDecoration: 'none',
          }}
        >
          📜 View Saved Speeches
        </Link>
      </div>
    </main>
  );
}
