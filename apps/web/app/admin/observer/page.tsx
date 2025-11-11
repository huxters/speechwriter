import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

type SpeechRun = {
  id: string;
  user_id: string | null;
  anon_id: string | null;
  brief: string | null;
  final_speech: string | null;
  trace: { stage: string; message: string }[] | null;
  created_at?: string | null;
};

function getAdminEmails(): string[] {
  return (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
    .split(',')
    .map(e => e.trim().toLowerCase())
    .filter(Boolean);
}

async function requireAdmin() {
  const supabase = await createServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const adminEmails = getAdminEmails();

  if (!user || !user.email || !adminEmails.includes(user.email.toLowerCase())) {
    redirect('/');
  }

  return user;
}

async function fetchRecentRuns(): Promise<SpeechRun[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceKey) {
    return [];
  }

  const supabase = createServiceClient(url, serviceKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  const { data, error } = await supabase
    .from('speeches')
    .select('id, user_id, anon_id, brief, final_speech, trace, created_at')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error || !data) {
    return [];
  }

  return data as SpeechRun[];
}

function formatIdentity(run: SpeechRun): string {
  if (run.user_id) return `user:${run.user_id}`;
  if (run.anon_id) return `anon:${run.anon_id}`;
  return 'unknown';
}

function formatCreatedAt(run: SpeechRun): string {
  if (!run.created_at) return '';
  try {
    return new Date(run.created_at).toLocaleString();
  } catch {
    return String(run.created_at);
  }
}

function safeTrace(trace: any): { stage: string; message: string }[] {
  if (!trace) return [];
  if (Array.isArray(trace)) return trace as any;
  return [];
}

export default async function AdminObserverPage() {
  await requireAdmin();
  const runs = await fetchRecentRuns();

  return (
    <main
      style={{
        padding: '24px',
        maxWidth: 1100,
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 8,
        }}
      >
        <h1
          style={{
            fontSize: 26,
            fontWeight: 600,
          }}
        >
          Admin · Pipeline Observer
        </h1>
        <Link
          href="/admin"
          style={{
            fontSize: 11,
            color: '#6b7280',
            textDecoration: 'none',
          }}
        >
          ← Back to Admin Home
        </Link>
      </div>

      <p
        style={{
          fontSize: 13,
          color: '#6b7280',
          marginBottom: 18,
        }}
      >
        Inspect recent Speechwriter runs. This view is read-only and uses the service role to show
        internal traces: planner, drafter, judge, guardrail, editor, persistence, and memory steps.
        Helps validate behaviour and diagnose issues without touching production prompts.
      </p>

      {(!runs || runs.length === 0) && (
        <div
          style={{
            padding: '14px 16px',
            borderRadius: 8,
            background: '#f9fafb',
            border: '1px solid #e5e7eb',
            fontSize: 13,
            color: '#6b7280',
          }}
        >
          No runs found yet. Generate a few speeches to populate this view.
        </div>
      )}

      {runs && runs.length > 0 && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 12,
          }}
        >
          {runs.map(run => {
            const trace = safeTrace(run.trace);
            const lastStage = trace.length ? trace[trace.length - 1].stage : 'unknown';

            return (
              <details
                key={run.id}
                style={{
                  borderRadius: 10,
                  border: '1px solid #e5e7eb',
                  background: '#ffffff',
                  padding: '10px 12px',
                  fontSize: 12,
                }}
              >
                <summary
                  style={{
                    listStyle: 'none',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 4,
                    cursor: 'pointer',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 8,
                      alignItems: 'baseline',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 600,
                        color: '#111827',
                        maxWidth: '70%',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {run.brief ? run.brief.slice(0, 120) : '(no brief stored)'}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: '#9ca3af',
                      }}
                    >
                      {formatCreatedAt(run)}
                    </div>
                  </div>

                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      gap: 8,
                      alignItems: 'center',
                      color: '#6b7280',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 10,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                      }}
                    >
                      {formatIdentity(run)} • stages: {trace.length || 0} • last: {lastStage}
                    </div>
                    <div
                      style={{
                        fontSize: 10,
                        color: '#4b5563',
                      }}
                    >
                      Click to expand full trace & output
                    </div>
                  </div>
                </summary>

                <div
                  style={{
                    marginTop: 8,
                    paddingTop: 8,
                    borderTop: '1px solid #f3f4f6',
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1.6fr)',
                    gap: 12,
                  }}
                >
                  {/* Left: Brief + Final Speech */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 8,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: '#6b7280',
                          marginBottom: 2,
                        }}
                      >
                        Brief
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#111827',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {run.brief || '(not recorded)'}
                      </div>
                    </div>

                    <div>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: '#6b7280',
                          marginBottom: 2,
                        }}
                      >
                        Final Output
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: '#111827',
                          whiteSpace: 'pre-wrap',
                        }}
                      >
                        {run.final_speech || '(no final speech stored)'}
                      </div>
                    </div>
                  </div>

                  {/* Right: Trace */}
                  <div>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: '#6b7280',
                        marginBottom: 4,
                      }}
                    >
                      Pipeline Trace
                    </div>
                    <div
                      style={{
                        maxHeight: 220,
                        overflowY: 'auto',
                        padding: '6px 8px',
                        borderRadius: 8,
                        border: '1px solid #e5e7eb',
                        background: '#f9fafb',
                        fontFamily:
                          'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace',
                        fontSize: 10,
                        color: '#374151',
                      }}
                    >
                      {trace.length === 0 && (
                        <div
                          style={{
                            color: '#9ca3af',
                          }}
                        >
                          No trace recorded for this run.
                        </div>
                      )}
                      {trace.map((t, idx) => (
                        <div
                          key={idx}
                          style={{
                            marginBottom: 2,
                            whiteSpace: 'pre-wrap',
                          }}
                        >
                          <span
                            style={{
                              fontWeight: 600,
                              color: '#111827',
                            }}
                          >
                            [{t.stage}]
                          </span>{' '}
                          {t.message}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </details>
            );
          })}
        </div>
      )}
    </main>
  );
}
