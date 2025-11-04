import { getSession, createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

async function signOut() {
  'use server';
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}

export default async function DashboardPage(): Promise<JSX.Element> {
  const session = await getSession();

  if (!session) {
    return (
      <html>
        <head>
          <meta httpEquiv="refresh" content="0; url=/login" />
        </head>
        <body>
          <p>Redirecting to login...</p>
        </body>
      </html>
    );
  }

  const supabase = await createClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, full_name')
    .eq('id', session.user.id)
    .single();

  return (
    <div style={{ padding: '40px', fontFamily: 'system-ui, sans-serif' }}>
      <h1 style={{ fontSize: '24px', marginBottom: '24px' }}>Dashboard</h1>
      <div style={{ marginBottom: '16px' }}>
        <p style={{ marginBottom: '8px' }}>
          <strong>Email:</strong> {session.user.email}
        </p>
        <p style={{ marginBottom: '8px' }}>
          <strong>Role:</strong> {profile?.role || 'user'}
        </p>
        {profile?.full_name && (
          <p style={{ marginBottom: '8px' }}>
            <strong>Full Name:</strong> {profile.full_name}
          </p>
        )}
      </div>
      <form action={signOut}>
        <button
          type="submit"
          style={{
            padding: '8px 16px',
            fontSize: '14px',
            backgroundColor: '#cc0000',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
          }}
        >
          Sign Out
        </button>
      </form>
    </div>
  );
}

