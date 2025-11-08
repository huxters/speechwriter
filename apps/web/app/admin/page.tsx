import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';

type TraceEntry = { stage: string; message: string };

type SpeechRow = {
  id: string;
  created_at: string;
  user_id: string;
  brief: string;
  final_speech: string;
  planner: any;
  judge: { winner: number; reason: string } | null;
  trace: TraceEntry[] | null;
};

function isAdmin(email: string | undefined | null): boolean {
  if (!email) return false;
  const raw = process.env.ADMIN_EMAILS || '';
  const allowed = raw
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.toLowerCase());
}

function getLastJudgeSummary(trace: TraceEntry[] | null | undefined): string {
  if (!trace || trace.length === 0) return 'no judge trace';
  const judgeEntries = trace.filter(t => t.stage === 'judge');
  if (judgeEntries.length === 0) return 'no judge trace';
  // Use the LAST judge entry, which contains the actual selection.
  return judgeEntries[judgeEntries.length - 1].message;
}

function getGuardrailSummary(trace: TraceEntry[] | null | undefined): string {
  if (!trace || trace.length === 0) return 'no guardrail trace';
  const guardrailEntry = trace.find(t => t.stage === 'guardrail');
  return guardrailEntry?.message || 'no guardrail trace';
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const email = (session.user.email as string | undefined | null) || null;

  if (!isAdmin(email)) {
    redirect('/dashboard');
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
      trace
    `
    )
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Admin load error:', error);
    return (
      <main
        style={{
          padding: '2rem',
          maxWidth: 960,
          margin: '0 auto',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
        }}
      >
        <h1>Admin / Observer</h1>
        <p style={{ color: '#b91c1c', fontSize: 13 }}>Failed to load speeches: {error.message}</p>
      </main>
    );
  }

  const rows: SpeechRow[] = data || [];

  return (
    <main
      style={{
        minHeight: '100vh',
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
        Admin / Observer
      </p>
      <h1
        style={{
          fontSize: 26,
          fontWeight: 600,
          margin: 0,
          marginBottom: 8,
        }}
      >
        Pipeline Runs Overview
      </h1>
      <p
        style={{
          fontSize: 12,
          color: '#6b7280',
          marginBottom: 18,
        }}
      >
        Read-only view of recent Speechwriter runs: judge decisions, guardrail behaviour, and final
        outputs. Use this to verify the ensemble is doing real work.
      </p>

      {rows.length === 0 ? (
        <p
          style={{
            fontSize: 12,
            color: '#9ca3af',
          }}
        >
          No runs recorded yet.
        </p>
      ) : (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
          }}
        >
          {rows.map(row => {
            const created = new Date(row.created_at);
            const createdLabel = created.toLocaleString(undefined, {
              year: 'numeric',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            });

            const briefPreview = row.brief.length > 120 ? row.brief.slice(0, 120) + '…' : row.brief;

            const judgeSummary = getLastJudgeSummary(row.trace);
            const guardrailSummary = getGuardrailSummary(row.trace);

            return (
              <div
                key={row.id}
                style={{
                  padding: '10px 12px',
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  background: '#ffffff',
                  boxShadow: '0 4px 14px rgba(15,23,42,0.04)',
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 2.2fr) minmax(0, 2fr)',
                  gap: 10,
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <div
                    style={{
                      fontSize: 10,
                      color: '#9ca3af',
                      marginBottom: 2,
                    }}
                  >
                    {createdLabel}
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 600,
                      color: '#111827',
                      marginBottom: 4,
                    }}
                  >
                    {briefPreview}
                  </div>
                  <div
                    style={{
                      fontSize: 10,
                      color: '#9ca3af',
                    }}
                  >
                    user: {row.user_id}
                  </div>
                  <div
                    style={{
                      marginTop: 6,
                      fontSize: 10,
                      color: '#6b7280',
                    }}
                  >
                    <strong>Judge:</strong> {judgeSummary}
                    <br />
                    <strong>Guardrail:</strong> {guardrailSummary}
                  </div>
                </div>

                <div
                  style={{
                    fontSize: 10,
                    color: '#6b7280',
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  <div
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#111827',
                      marginBottom: 2,
                    }}
                  >
                    Final Speech (preview)
                  </div>
                  {row.final_speech
                    ? row.final_speech.slice(0, 420) + (row.final_speech.length > 420 ? '…' : '')
                    : '(none)'}
                  <div
                    style={{
                      marginTop: 6,
                    }}
                  >
                    <Link
                      href={`/dashboard/history/${row.id}`}
                      style={{
                        fontSize: 10,
                        textDecoration: 'none',
                        color: '#111827',
                        padding: '4px 8px',
                        borderRadius: 999,
                        border: '1px solid #e5e7eb',
                        background: '#f9fafb',
                      }}
                    >
                      View full run →
                    </Link>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}
