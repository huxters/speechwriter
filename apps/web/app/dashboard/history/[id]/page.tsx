import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

type TraceEntry = { stage: string; message: string };

type DraftsInfo = {
  draft1: string;
  draft2: string;
  winnerLabel: 'draft1' | 'draft2';
};

export default async function HistoryDetailPage({ params }: { params: { id: string } }) {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const { data, error } = await supabase
    .from('speeches')
    .select(
      `
      id,
      created_at,
      user_id,
      brief,
      final_speech,
      planner,
      judge,
      trace,
      drafts
    `
    )
    .eq('id', params.id)
    .single();

  if (error || !data) {
    console.error('History detail error:', error);
    redirect('/dashboard/history');
  }

  const trace: TraceEntry[] = data.trace || [];
  const drafts: DraftsInfo | null = data.drafts || null;

  const created = new Date(data.created_at);
  const createdLabel = created.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <main
      style={{
        padding: '2rem',
        maxWidth: 1120,
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
      }}
    >
      <p
        style={{
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.18em',
          color: '#9ca3af',
          marginBottom: 4,
        }}
      >
        Run Detail
      </p>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 600,
          margin: 0,
          marginBottom: 4,
        }}
      >
        Speech run {data.id}
      </h1>
      <p
        style={{
          fontSize: 11,
          color: '#6b7280',
          marginBottom: 18,
        }}
      >
        {createdLabel} · user {data.user_id}
      </p>

      <section
        style={{
          marginBottom: 18,
          padding: 12,
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          background: '#f9fafb',
          fontSize: 11,
        }}
      >
        <strong>Brief</strong>
        <div
          style={{
            marginTop: 4,
            whiteSpace: 'pre-wrap',
          }}
        >
          {data.brief}
        </div>
      </section>

      {drafts ? (
        <section
          style={{
            marginBottom: 18,
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 12,
          }}
        >
          <div
            style={{
              padding: 10,
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              background: drafts.winnerLabel === 'draft1' ? '#eef2ff' : '#ffffff',
              fontSize: 11,
              whiteSpace: 'pre-wrap',
            }}
          >
            <div
              style={{
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Draft 1 {drafts.winnerLabel === 'draft1' ? '(selected)' : ''}
            </div>
            {drafts.draft1}
          </div>
          <div
            style={{
              padding: 10,
              borderRadius: 12,
              border: '1px solid #e5e7eb',
              background: drafts.winnerLabel === 'draft2' ? '#eef2ff' : '#ffffff',
              fontSize: 11,
              whiteSpace: 'pre-wrap',
            }}
          >
            <div
              style={{
                fontWeight: 600,
                marginBottom: 4,
              }}
            >
              Draft 2 {drafts.winnerLabel === 'draft2' ? '(selected)' : ''}
            </div>
            {drafts.draft2}
          </div>
        </section>
      ) : (
        <section
          style={{
            marginBottom: 18,
            padding: 10,
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            fontSize: 11,
            color: '#9ca3af',
          }}
        >
          Drafts not recorded for this run (older pipeline version).
        </section>
      )}

      <section
        style={{
          marginBottom: 18,
          padding: 12,
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          fontSize: 11,
        }}
      >
        <strong>Final Speech</strong>
        <div
          style={{
            marginTop: 4,
            whiteSpace: 'pre-wrap',
          }}
        >
          {data.final_speech}
        </div>
      </section>

      <section
        style={{
          padding: 12,
          borderRadius: 12,
          border: '1px solid #e5e7eb',
          fontSize: 10,
          background: '#fafafa',
        }}
      >
        <strong>Pipeline Trace</strong>
        <ul
          style={{
            margin: 0,
            marginTop: 4,
            paddingLeft: 16,
            listStyle: 'disc',
          }}
        >
          {trace.map((t, idx) => (
            <li key={idx}>
              [{t.stage}] {t.message}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
