import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';

export default async function Home(): Promise<JSX.Element> {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  return (
    <main style={{ padding: '40px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '32px', marginBottom: '16px' }}>Speechwriter</h1>
      <p style={{ marginBottom: '24px', color: '#666' }}>Dev skeleton is running.</p>
      <div style={{ display: 'flex', gap: '16px' }}>
        {session ? (
          <Link href="/dashboard" style={{ color: '#0066cc', textDecoration: 'underline' }}>
            Dashboard
          </Link>
        ) : (
          <Link href="/login" style={{ color: '#0066cc', textDecoration: 'underline' }}>
            Login
          </Link>
        )}
      </div>
    </main>
  );
}

