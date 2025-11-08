import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';

type SpeechRow = {
  id: string;
  created_at: string;
  brief: string;
  audience: string | null;
  event_context: string | null;
  tone: string | null;
  duration: string | null;
  key_points: string | null;
  red_lines: string | null;
  final_speech: string;
};

interface PageProps {
  params: { id: string };
}

export default async function SpeechDetailPage({ params }: PageProps) {
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
      brief,
      audience,
      event_context,
      tone,
      duration,
      key_points,
      red_lines,
      final_speech
    `
    )
    .eq('id', params.id)
    .eq('user_id', session.user.id)
    .maybeSingle();

  if (error) {
    console.error('Error loading speech:', error);
    // Avoid leaking internals; just show not found.
    notFound();
  }

  if (!data) {
    notFound();
  }

  const speech = data as SpeechRow;
  const created = new Date(speech.created_at);
  const createdLabel = created.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  const Section = ({ label, value }: { label: string; value: string | null }) => {
    if (!value || !value.trim()) return null;
    return (
      <div style={{ marginBottom: 8 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 600,
            textTransform: 'uppercase',
            letterSpacing: '0.14em',
            color: '#9ca3af',
            marginBottom: 2,
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 12,
            color: '#374151',
            whiteSpace: 'pre-wrap',
          }}
        >
          {value}
        </div>
      </div>
    );
  };

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
        Dashboard / History / {speech.id.slice(0, 6)}
      </p>

      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 12,
          alignItems: 'baseline',
          marginBottom: 8,
        }}
      >
        <h1
          style={{
            fontSize: 24,
            fontWeight: 600,
            margin: 0,
          }}
        >
          Saved Speech
        </h1>
        <div
          style={{
            fontSize: 10,
            color: '#9ca3af',
          }}
        >
          Created {createdLabel}
        </div>
      </div>

      <div
        style={{
          marginBottom: 16,
          fontSize: 11,
          color: '#6b7280',
        }}
      >
        This is a snapshot of what the system generated at the time. Use it as a working draft; you
        can always create new versions from{' '}
        <Link href="/dashboard/generate" style={{ color: '#111827', textDecoration: 'underline' }}>
          New Speech
        </Link>
        .
      </div>

      {/* Input summary card */}
      <section
        style={{
          marginBottom: 16,
          padding: '12px 14px',
          borderRadius: 14,
          border: '1px solid #e5e7eb',
          backgroundColor: '#f9fafb',
          boxShadow: '0 4px 14px rgba(15,23,42,0.03)',
        }}
      >
        <Section label="Core Brief" value={speech.brief} />
        <Section label="Audience" value={speech.audience} />
        <Section label="Event / Moment Context" value={speech.event_context} />
        <Section label="Tone / Style" value={speech.tone} />
        <Section label="Target Duration / Length" value={speech.duration} />
        <Section label="Must-Include Points" value={speech.key_points} />
        <Section label="Red Lines / Must-Avoid" value={speech.red_lines} />
      </section>

      {/* Final speech card */}
      <section
        style={{
          padding: '14px 16px',
          borderRadius: 14,
          border: '1px solid #e5e7eb',
          backgroundColor: '#ffffff',
          boxShadow: '0 6px 18px rgba(15,23,42,0.05)',
        }}
      >
        <div
          style={{
            fontSize: 12,
            fontWeight: 600,
            marginBottom: 6,
            color: '#111827',
          }}
        >
          Final Speech
        </div>
        <div
          style={{
            fontSize: 13,
            lineHeight: 1.6,
            color: '#111827',
            whiteSpace: 'pre-wrap',
          }}
        >
          {speech.final_speech}
        </div>
      </section>

      <div
        style={{
          marginTop: 18,
          fontSize: 10,
          display: 'flex',
          gap: 12,
        }}
      >
        <Link
          href="/dashboard/history"
          style={{
            textDecoration: 'none',
            color: '#111827',
            padding: '6px 10px',
            borderRadius: 999,
            border: '1px solid #e5e7eb',
            background: '#ffffff',
          }}
        >
          ← Back to history
        </Link>
        <Link
          href="/dashboard/generate"
          style={{
            textDecoration: 'none',
            color: '#ffffff',
            padding: '6px 12px',
            borderRadius: 999,
            background: '#111827',
            border: '1px solid #111827',
          }}
        >
          New speech
        </Link>
      </div>
    </main>
  );
}
