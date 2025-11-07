// apps/web/app/admin/page.tsx

import Link from 'next/link';

export default function AdminPage(): JSX.Element {
  return (
    <section
      style={{
        background: '#f9f9fb',
        borderRadius: 12,
        padding: 24,
        border: '1px solid #e4e4ee',
        maxWidth: 640,
        boxShadow: '0 14px 40px rgba(15,23,42,0.06)',
      }}
    >
      <h2 style={{ fontSize: 18, marginBottom: 8 }}>Admin console is live ✅</h2>
      <p style={{ fontSize: 14, marginBottom: 16 }}>
        You&apos;re authenticated as an admin. From here you can manage:
      </p>
      <ul
        style={{
          fontSize: 14,
          marginBottom: 24,
          paddingLeft: 20,
          color: '#555',
        }}
      >
        <li>Prompt profiles (outline / draft / refine)</li>
        <li>Feature flags &amp; usage limits</li>
        <li>Other MicroFactory-wide configuration</li>
      </ul>

      <Link
        href="/admin/prompts"
        style={{
          display: 'inline-block',
          background: '#111827',
          color: '#fff',
          padding: '10px 18px',
          borderRadius: 999,
          textDecoration: 'none',
          fontSize: 14,
          boxShadow: '0 10px 25px rgba(15,23,42,0.35)',
        }}
      >
        Manage Prompt Profiles →
      </Link>
    </section>
  );
}
