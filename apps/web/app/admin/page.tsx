import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient as createServerClient } from '@/lib/supabase/server';

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

export default async function AdminPage() {
  const user = await requireAdmin();

  return (
    <main
      style={{
        padding: '24px',
        maxWidth: 1000,
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <h1
        style={{
          fontSize: 26,
          fontWeight: 600,
          marginBottom: 6,
        }}
      >
        Admin · Control Panel
      </h1>

      <p
        style={{
          fontSize: 13,
          color: '#6b7280',
          marginBottom: 18,
        }}
      >
        Signed in as <span style={{ fontWeight: 500 }}>{user.email}</span>. Admin-only tools to
        inspect pipeline runs, system behaviour, and learned traits. This area is read-only and
        observability-focused in the current version.
      </p>

      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 16,
        }}
      >
        {/* Pipeline Observer */}
        <Link
          href="/admin/observer"
          style={{
            flex: '1 1 260px',
            padding: '14px 16px',
            borderRadius: 10,
            border: '1px solid #e5e7eb',
            background: '#ffffff',
            textDecoration: 'none',
            color: '#111827',
            fontSize: 13,
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            🛰 Pipeline Observer
          </div>
          <div
            style={{
              color: '#6b7280',
              fontSize: 12,
            }}
          >
            Inspect individual runs: planner/drafter/judge/guardrail/editor traces, final outputs,
            and persistence results.
          </div>
        </Link>

        {/* Memory Inspector */}
        <Link
          href="/admin/memory"
          style={{
            flex: '1 1 260px',
            padding: '14px 16px',
            borderRadius: 10,
            border: '1px solid #e5e7eb',
            background: '#ffffff',
            textDecoration: 'none',
            color: '#111827',
            fontSize: 13,
            boxShadow: '0 1px 2px rgba(0,0,0,0.03)',
          }}
        >
          <div
            style={{
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            🧠 Memory Inspector
          </div>
          <div
            style={{
              color: '#6b7280',
              fontSize: 12,
            }}
          >
            View inferred traits per identity (user or anon), runs count, and last update. Ensures
            the profile/memory layer stays transparent and auditable.
          </div>
        </Link>

        {/* Placeholder for future admin tools */}
        <div
          style={{
            flex: '1 1 260px',
            padding: '14px 16px',
            borderRadius: 10,
            border: '1px dashed #e5e7eb',
            background: '#fafafa',
            color: '#9ca3af',
            fontSize: 12,
          }}
        >
          <div
            style={{
              fontWeight: 600,
              marginBottom: 4,
            }}
          >
            🔧 Future Controls
          </div>
          <div>
            Reserved for future features: prompt set management, guardrail tuning, feature flags,
            and aggregate analytics.
          </div>
        </div>
      </div>
    </main>
  );
}
