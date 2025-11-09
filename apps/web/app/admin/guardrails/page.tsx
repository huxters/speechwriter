import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

type GuardrailRow = {
  id: string;
  scope: string;
  must_include: string[] | null;
  must_avoid: string[] | null;
  updated_at: string;
  updated_by: string | null;
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

async function getCurrentGlobalGuardrails() {
  const supabase = await createClient();

  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session || !isAdmin(session.user.email || null)) {
    redirect('/dashboard');
  }

  const { data, error } = await supabase
    .from('guardrails')
    .select(
      `
      id,
      scope,
      must_include,
      must_avoid,
      updated_at,
      updated_by
    `
    )
    .eq('scope', 'global')
    .order('updated_at', { ascending: false })
    .limit(1);

  if (error) {
    console.error('Error loading guardrails:', error);
    return null;
  }

  return (data && data[0]) || null;
}

async function updateGlobalGuardrails(formData: FormData) {
  'use server';

  const mustIncludeText = (formData.get('must_include') as string | null) || '';
  const mustAvoidText = (formData.get('must_avoid') as string | null) || '';

  const supabase = await createClient();
  const {
    data: { session },
  } = await supabase.auth.getSession();

  const email = session?.user?.email || null;

  if (!session || !isAdmin(email)) {
    throw new Error('Not authorised to update guardrails.');
  }

  const must_include = mustIncludeText
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);

  const must_avoid = mustAvoidText
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean);

  const { error } = await supabase.from('guardrails').insert({
    scope: 'global',
    must_include,
    must_avoid,
    updated_by: email,
  });

  if (error) {
    console.error('Error updating guardrails:', error);
    throw new Error('Failed to update guardrails.');
  }
}

export default async function GuardrailsAdminPage() {
  const current = await getCurrentGlobalGuardrails();

  const includeText = (current?.must_include || []).join('\n');
  const avoidText = (current?.must_avoid || []).join('\n');
  const updatedLabel = current
    ? `Last updated ${new Date(
        current.updated_at
      ).toLocaleString()} by ${current.updated_by || 'unknown'}`
    : 'No global guardrails set yet.';

  return (
    <main
      style={{
        minHeight: '100vh',
        padding: '2rem',
        maxWidth: 720,
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
        Admin / Guardrails
      </p>
      <h1
        style={{
          fontSize: 24,
          fontWeight: 600,
          margin: 0,
          marginBottom: 6,
        }}
      >
        Global Guardrail Configuration
      </h1>
      <p
        style={{
          fontSize: 11,
          color: '#6b7280',
          marginBottom: 10,
        }}
      >
        Define system-wide content constraints applied to every speech, in addition to per-brief
        rules and hard safety.
      </p>
      <p
        style={{
          fontSize: 10,
          color: '#9ca3af',
          marginBottom: 16,
        }}
      >
        {updatedLabel}
      </p>

      <form
        action={updateGlobalGuardrails}
        style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
      >
        <div>
          <label
            htmlFor="must_include"
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Must Include (optional)
          </label>
          <p
            style={{
              fontSize: 10,
              color: '#9ca3af',
              marginBottom: 4,
            }}
          >
            One rule per line. These are soft global anchors (e.g. key themes or values) merged with
            per-brief requirements.
          </p>
          <textarea
            id="must_include"
            name="must_include"
            defaultValue={includeText}
            rows={4}
            style={{
              width: '100%',
              fontSize: 11,
              padding: 8,
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div>
          <label
            htmlFor="must_avoid"
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            Must Avoid (global)
          </label>
          <p
            style={{
              fontSize: 10,
              color: '#9ca3af',
              marginBottom: 4,
            }}
          >
            One rule per line. Applied to all outputs (e.g. no profanity, no direct personal
            insults, no political endorsements).
          </p>
          <textarea
            id="must_avoid"
            name="must_avoid"
            defaultValue={avoidText}
            rows={6}
            style={{
              width: '100%',
              fontSize: 11,
              padding: 8,
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              fontFamily: 'inherit',
            }}
          />
        </div>

        <button
          type="submit"
          style={{
            alignSelf: 'flex-start',
            marginTop: 4,
            padding: '8px 14px',
            borderRadius: 999,
            border: 'none',
            background: '#111827',
            color: '#ffffff',
            fontSize: 11,
            cursor: 'pointer',
          }}
        >
          Save Guardrails
        </button>

        <p
          style={{
            fontSize: 9,
            color: '#9ca3af',
            marginTop: 2,
          }}
        >
          Changes create a new version; the latest "global" record is used for all subsequent runs.
        </p>
      </form>
    </main>
  );
}
