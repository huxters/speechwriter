'use client';

import React, { useState } from 'react';

type Drafts = { draft1: string; draft2: string; winnerLabel: 'draft1' | 'draft2' } | null;
type Judge = { winner: 1 | 2; reason: string } | null;
type Guardrail = { ok: boolean; message: string } | null;

export default function DraftsToggle({
  drafts,
  judge,
  guardrail,
}: {
  drafts: Drafts;
  judge: Judge;
  guardrail: Guardrail;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        style={{
          padding: '6px 10px',
          borderRadius: 8,
          border: '1px solid #e5e7eb',
          background: '#f9fafb',
          fontSize: 12,
          color: '#374151',
          cursor: 'pointer',
        }}
      >
        {open ? 'Hide drafts & judge' : 'View drafts & judge'}
      </button>

      {open && (
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
          <div style={pane}>
            <h4 style={paneTitle}>
              Draft 1 {drafts?.winnerLabel === 'draft1' ? '✓ (judge choice)' : ''}
            </h4>
            {drafts?.draft1 ? <pre style={panePre}>{drafts.draft1}</pre> : <em>—</em>}
          </div>

          <div style={pane}>
            <h4 style={paneTitle}>
              Draft 2 {drafts?.winnerLabel === 'draft2' ? '✓ (judge choice)' : ''}
            </h4>
            {drafts?.draft2 ? <pre style={panePre}>{drafts.draft2}</pre> : <em>—</em>}
          </div>

          <div style={{ gridColumn: '1 / -1' }}>
            <div style={{ ...metaBox }}>
              <strong style={{ fontSize: 13, color: '#111827' }}>Judge:</strong>{' '}
              <span style={metaText}>
                {judge ? `winner=${judge.winner} — ${judge.reason}` : '—'}
              </span>
            </div>
            <div style={{ ...metaBox, marginTop: 6 }}>
              <strong style={{ fontSize: 13, color: '#111827' }}>Guardrail:</strong>{' '}
              <span style={metaText}>
                {guardrail ? (guardrail.ok ? 'ok' : `blocked — ${guardrail.message}`) : '—'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

const pane: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  background: '#ffffff',
  boxShadow: '0 6px 18px rgba(17,24,39,0.06)',
  padding: 12,
};

const paneTitle: React.CSSProperties = { margin: '0 0 6px', fontSize: 14, color: '#111827' };

const panePre: React.CSSProperties = {
  whiteSpace: 'pre-wrap',
  margin: 0,
  font: '14px/1.5 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
};

const metaBox: React.CSSProperties = {
  border: '1px solid #f3f4f6',
  background: '#f9fafb',
  borderRadius: 10,
  padding: '8px 10px',
};

const metaText: React.CSSProperties = { fontSize: 13, color: '#6b7280' };
