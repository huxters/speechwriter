import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

type SpeechRow = {
  id: string;
  created_at: string;
  brief: string;
  final_speech: string;
};

export default async function HistoryPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data, error } = await supabase
    .from('speeches')
    .select('id, created_at, brief, final_speech')
    .eq('user_id', session.user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error loading history:', error);
    return (
      <main
        style={{
          padding: '2rem',
          maxWidth: 800,
          margin: '0 auto',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
        }}
      >
        <h1>History</h1>
        <p style={{ color: '#b91c1c' }}>Failed to load history: {error.message}</p>
      </main>
    );
  }

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '2rem',
        maxWidth: 900,
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
      }}
    >
      <p
        style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.16em',
          color: '#9ca3af',
          marginBottom: 4,
        }}
      >
        Dashboard / History
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          alignItems: 'baseline',
          marginBottom: 12,
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 600,
            margin: 0,
          }}
        >
          Saved Speeches
        </h1>
        <Link
          href="/dashboard/generate"
          style={{
            textDecoration: 'none',
            background: '#111827',
            color: '#ffffff',
            padding: '6px 12px',
            borderRadius: 999,
            fontSize: 12,
          }}
        >
          + New Speech
        </Link>
      </div>

      {!data || data.length === 0 ? (
        <p style={{ color: '#6b7280', fontSize: 13 }}>
          No saved speeches yet. Generate one to get started.
        </p>
      ) : (
        <ul
          style={{
            listStyle: 'none',
            padding: 0,
            marginTop: 16,
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {data.map(row => {
            const created = new Date(row.created_at);
            const createdLabel = created.toLocaleString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });
            const preview = row.final_speech
              ? row.final_speech.slice(0, 160) + '…'
              : '(no content)';

            return (
              <li key={row.id}>
                <Link
                  href={`/dashboard/history/${row.id}`}
                  style={{
                    display: 'block',
                    padding: '12px 16px',
                    borderRadius: 12,
                    border: '1px solid #e5e7eb',
                    textDecoration: 'none',
                    background: '#ffffff',
                    boxShadow: '0 4px 14px rgba(15,23,42,0.04)',
                    transition: 'all 0.15s ease',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                      marginBottom: 4,
                    }}
                  >
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 600,
                        color: '#111827',
                      }}
                    >
                      {row.brief?.slice(0, 80) || '(no brief)'}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: '#9ca3af',
                      }}
                    >
                      {createdLabel}
                    </div>
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: '#4b5563',
                      lineHeight: 1.5,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {preview}
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
