'use client';

import React from 'react';

type Props = {
  finalText: string;
  onCopy: () => void;
  onExportPdf: () => void;
  onSpeak: () => void;
};

export default function OutputPanel({ finalText, onCopy, onExportPdf, onSpeak }: Props) {
  const hasText = Boolean(finalText && finalText.trim().length > 0);

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 12px',
          borderBottom: '1px solid #f3f4f6',
        }}
      >
        <h3 style={{ margin: 0, fontSize: 14, color: '#111827' }}>Final Output</h3>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          <button
            type="button"
            onClick={onExportPdf}
            disabled={!hasText}
            style={btnSecondary}
            title="Export PDF"
          >
            Export PDF
          </button>
          <button
            type="button"
            onClick={onSpeak}
            disabled={!hasText}
            style={btnSecondary}
            title="Speak"
          >
            Speak
          </button>
          <button
            type="button"
            onClick={onCopy}
            disabled={!hasText}
            style={btnSecondary}
            title="Copy"
          >
            Copy
          </button>
        </div>
      </div>
      <div style={{ padding: 12, minHeight: 120 }}>
        {hasText ? (
          <pre
            style={{
              margin: 0,
              whiteSpace: 'pre-wrap',
              font: '14px/1.5 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial',
            }}
          >
            {finalText}
          </pre>
        ) : (
          <em>Nothing to show yet.</em>
        )}
      </div>
    </div>
  );
}

const btnSecondary: React.CSSProperties = {
  padding: '6px 10px',
  borderRadius: 8,
  border: '1px solid #e5e7eb',
  background: '#f9fafb',
  color: '#374151',
  cursor: 'pointer',
};
