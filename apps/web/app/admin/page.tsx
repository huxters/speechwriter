import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';

type DraftsInfo = {
  draft1: string;
  draft2: string;
  winnerLabel: 'draft1' | 'draft2';
} | null;

type JudgeInfo = {
  winner: 1 | 2;
  reason: string;
} | null;

type TraceEntry = {
  stage: string;
  message: string;
};

type FeedbackAgg = {
  count: number;
  agreeCount: number;
};

function getAdminEmails(): string[] {
  const env = process.env.NEXT_PUBLIC_ADMIN_EMAILS || process.env.ADMIN_EMAILS || '';
  return env
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
}

export default async function AdminPage() {
  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    redirect('/login');
  }

  const adminEmails = getAdminEmails();
  const isAdmin = adminEmails.includes((session.user.email || '').toLowerCase());

  if (!isAdmin) {
    return (
      <main
        style={{
          padding: '2rem',
          maxWidth: 900,
          margin: '0 auto',
          fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
        }}
      >
        <h1 style={{ fontSize: 24, fontWeight: 600, marginBottom: 8 }}>Admin</h1>
        <p
          style={{
            fontSize: 13,
            color: '#6b7280',
            marginBottom: 16,
          }}
        >
          You are signed in but not authorised to view the admin console.
        </p>
      </main>
    );
  }

  // Load recent speeches
  const { data: speeches, error: speechesError } = await supabase
    .from('speeches')
    .select('id, created_at, brief, final_speech, drafts, judge, trace')
    .order('created_at', { ascending: false })
    .limit(30);

  // Load feedback for those speeches
  const feedbackBySpeech = new Map<string, FeedbackAgg>();

  if (!speechesError && speeches && speeches.length > 0) {
    const speechIds = speeches.map(s => s.id);

    const { data: feedback, error: feedbackError } = await supabase
      .from('speech_feedback')
      .select('speech_id, agreement')
      .in('speech_id', speechIds);

    if (!feedbackError && feedback) {
      for (const row of feedback) {
        const key = row.speech_id as string;
        const prev = feedbackBySpeech.get(key) || {
          count: 0,
          agreeCount: 0,
        };
        const next = {
          count: prev.count + 1,
          agreeCount: prev.agreeCount + (row.agreement ? 1 : 0),
        };
        feedbackBySpeech.set(key, next);
      }
    }
  }

  return (
    <main
      style={{
        padding: '2rem',
        maxWidth: 1100,
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
      }}
    >
      <p
        style={{
          fontSize: 11,
          color: '#9ca3af',
          marginBottom: 4,
          letterSpacing: 0.08,
        }}
      >
        ADMIN / OBSERVER
      </p>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        Pipeline Runs Overview
      </h1>
      <p
        style={{
          fontSize: 13,
          color: '#6b7280',
          marginBottom: 18,
          maxWidth: 760,
        }}
      >
        Read-only view of recent Speechwriter runs: judge choices, guardrail behaviour, final
        outputs, and human feedback. Use this to verify the ensemble is doing real work.
      </p>

      {speechesError && (
        <div
          style={{
            padding: 10,
            borderRadius: 8,
            background: '#fef2f2',
            color: '#991b1b',
            fontSize: 11,
            marginBottom: 16,
          }}
        >
          Error loading speeches: {speechesError.message}
        </div>
      )}

      {!speechesError && (!speeches || speeches.length === 0) && (
        <p
          style={{
            fontSize: 12,
            color: '#6b7280',
          }}
        >
          No runs yet. Generate a speech to see pipeline activity.
        </p>
      )}

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
        }}
      >
        {speeches &&
          speeches.map(run => {
            const drafts: DraftsInfo = (run.drafts as any as DraftsInfo) || null;
            const judge: JudgeInfo = (run.judge as any as JudgeInfo) || null;
            const trace: TraceEntry[] = (run.trace as any as TraceEntry[]) || [];

            const feedback = feedbackBySpeech.get(run.id) || {
              count: 0,
              agreeCount: 0,
            };
            const agreementPct =
              feedback.count > 0 ? Math.round((feedback.agreeCount / feedback.count) * 100) : null;

            const judgeLabel =
              drafts && drafts.winnerLabel
                ? drafts.winnerLabel === 'draft1'
                  ? 'Draft 1'
                  : 'Draft 2'
                : judge && judge.winner
                  ? judge.winner === 1
                    ? 'Draft 1'
                    : 'Draft 2'
                  : 'N/A';

            const created = run.created_at ? new Date(run.created_at) : null;

            const briefPreview = (run.brief as string)?.slice(0, 140) || '';
            const finalPreview = (run.final_speech as string)?.slice(0, 260) || '';

            const guardrailNote =
              trace.find(t => t.stage === 'guardrail')?.message || 'Guardrail: n/a';

            return (
              <div
                key={run.id}
                style={{
                  padding: 14,
                  borderRadius: 12,
                  border: '1px solid #e5e7eb',
                  background: '#ffffff',
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1.6fr) minmax(0, 2fr)',
                  gap: 14,
                  alignItems: 'flex-start',
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: 10,
                      color: '#9ca3af',
                      margin: 0,
                      marginBottom: 2,
                    }}
                  >
                    {created ? created.toLocaleString() : 'Unknown time'}
                  </p>
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 600,
                      margin: 0,
                      marginBottom: 4,
                    }}
                  >
                    {briefPreview || 'Untitled brief'}
                  </p>
                  <p
                    style={{
                      fontSize: 10,
                      color: '#6b7280',
                      margin: 0,
                      marginBottom: 6,
                    }}
                  >
                    Judge:{' '}
                    <span
                      style={{
                        fontWeight: 600,
                      }}
                    >
                      {judgeLabel}
                    </span>
                    {judge?.reason
                      ? ` — ${judge.reason.slice(0, 140)}${judge.reason.length > 140 ? '...' : ''}`
                      : ''}
                    <br />
                    {guardrailNote}
                  </p>
                  {feedback.count > 0 && (
                    <p
                      style={{
                        fontSize: 9,
                        color: '#4b5563',
                        margin: 0,
                        marginTop: 4,
                      }}
                    >
                      Feedback: {feedback.count} vote
                      {feedback.count > 1 ? 's' : ''},{' '}
                      {agreementPct !== null ? `${agreementPct}% agreement` : ''}
                    </p>
                  )}
                </div>

                <div>
                  <p
                    style={{
                      fontSize: 10,
                      color: '#9ca3af',
                      margin: 0,
                      marginBottom: 2,
                    }}
                  >
                    Final Speech (preview)
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      color: '#111827',
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {finalPreview || 'No final speech recorded.'}
                    {finalPreview && (finalPreview.length >= 260 ? '...' : '')}
                  </p>
                </div>
              </div>
            );
          })}
      </div>
    </main>
  );
}
