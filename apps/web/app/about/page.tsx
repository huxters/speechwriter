export default function AboutPage() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 60px' }}>
      <h1 style={{ fontSize: 22, margin: '4px 0 8px' }}>About Speechwriter</h1>
      <p style={{ margin: '0 0 12px', color: '#6b7280', fontSize: 14 }}>
        Speechwriter helps you plan, draft, judge, guard, and edit high-stakes speeches with an
        auditable pipeline and admin observability.
      </p>
      <ul style={{ margin: 0, paddingLeft: 18, color: '#374151', fontSize: 14, lineHeight: 1.6 }}>
        <li>Pipeline: Planner → Drafter → Judge → Guardrail → Editor</li>
        <li>Persistence: Supabase (speeches + traces)</li>
        <li>Admin / Observer Console for comparisons & latency</li>
      </ul>
    </div>
  );
}
