import { redirect } from 'next/navigation';
import { createClient as createServiceClient } from '@supabase/supabase-js';
import { createClient as createServerClient } from '@/lib/supabase/server';

type MemoryRow = {
  id: string;
  user_id: string | null;
  anon_id: string | null;
  traits: any;
  runs_count: number;
  last_updated: string;
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
    redirect('/'); // Not an admin → bounce
  }

  return user;
}

async function fetchMemoryRows(): Promise<MemoryRow[]> {
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
    .from('speechwriter_memory')
    .select('id, user_id, anon_id, traits, runs_count, last_updated')
    .order('last_updated', { ascending: false })
    .limit(200);

  if (error || !data) {
    return [];
  }

  return data as MemoryRow[];
}

function formatIdentity(row: MemoryRow): string {
  if (row.user_id) return `user:${row.user_id}`;
  if (row.anon_id) return `anon:${row.anon_id}`;
  return 'unknown';
}

function formatTraits(traits: any): string {
  try {
    const t = traits || {};
    const parts: string[] = [];

    if (Array.isArray(t.roles) && t.roles.length) {
      parts.push(`roles: ${t.roles.join(', ')}`);
    }
    if (Array.isArray(t.tonePreferences) && t.tonePreferences.length) {
      parts.push(`tone: ${t.tonePreferences.join(', ')}`);
    }
    if (typeof t.avgLengthWords === 'number') {
      parts.push(`avgLength: ${Math.round(t.avgLengthWords)}w`);
    }
    if (Array.isArray(t.presetsUsed) && t.presetsUsed.length) {
      parts.push(`presets: ${Array.from(new Set(t.presetsUsed)).join(', ')}`);
    }

    if (!parts.length) {
      return JSON.stringify(t);
    }

    return parts.join(' • ');
  } catch {
    return JSON.stringify(traits || {});
  }
}

export default async function AdminMemoryPage() {
  await requireAdmin();
  const rows = await fetchMemoryRows();

  return (
    <main
      style={{
        padding: '24px',
        maxWidth: 1100,
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      <h1
        style={{
          fontSize: 26,
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        Admin · Memory Inspector
      </h1>
      <p
        style={{
          fontSize: 13,
          color: '#6b7280',
          marginBottom: 18,
        }}
      >
        Read-only view of inferred traits per identity. This shows what Speechwriter is quietly
        learning. Uses service role; scoped to admins only.
      </p>

      {(!rows || rows.length === 0) && (
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
          No memory rows found yet. Generate a few runs as the same user to populate this view.
        </div>
      )}

      {rows && rows.length > 0 && (
        <div
          style={{
            marginTop: 4,
            borderRadius: 10,
            border: '1px solid #e5e7eb',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(180px, 220px) 1.5fr 90px 160px',
              padding: '8px 12px',
              background: '#f3f4f6',
              fontSize: 11,
              fontWeight: 600,
              color: '#6b7280',
            }}
          >
            <div>Identity</div>
            <div>Traits (summary)</div>
            <div style={{ textAlign: 'right' }}>Runs</div>
            <div style={{ textAlign: 'right' }}>Last Updated</div>
          </div>

          {rows.map(row => (
            <div
              key={row.id}
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(180px, 220px) 1.5fr 90px 160px',
                padding: '8px 12px',
                fontSize: 12,
                borderTop: '1px solid #f3f4f6',
                background: '#ffffff',
              }}
            >
              <div
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: '#111827',
                }}
              >
                {formatIdentity(row)}
              </div>
              <div
                style={{
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  color: '#374151',
                }}
                title={JSON.stringify(row.traits || {})}
              >
                {formatTraits(row.traits)}
              </div>
              <div
                style={{
                  textAlign: 'right',
                  color: '#111827',
                }}
              >
                {row.runs_count || 0}
              </div>
              <div
                style={{
                  textAlign: 'right',
                  color: '#6b7280',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {new Date(row.last_updated).toLocaleString()}
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
