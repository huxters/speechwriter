'use client';

import React, { KeyboardEvent } from 'react';

type PromptBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  loading: boolean;
};

export default function PromptBar({ value, onChange, onSubmit, loading }: PromptBarProps) {
  function handleKeyDown(e: KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading) onSubmit();
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        gap: 10,
        alignItems: 'flex-end',
        marginBottom: 8,
      }}
    >
      {/* Main lozenge container */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          padding: '12px 16px 10px',
          borderRadius: 16,
          border: '1.5px solid #d1d5db',
          backgroundColor: '#f3f4f6',
          gap: 6,
          boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)',
        }}
      >
        {/* Multi-line prompt area */}
        <textarea
          value={value}
          onChange={e => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={2}
          placeholder={
            'What do you want to create?\nWho is it for, and what must it achieve?\nAny key points, constraints, or red lines?'
          }
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            resize: 'none',
            background: 'transparent',
            fontSize: 14,
            lineHeight: 1.5,
            color: '#111827',
          }}
        />

        {/* Bottom row: icons aligned right */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 8,
            marginTop: 2,
          }}
        >
          <IconCircle title="Attach or upload (coming soon)">
            <span
              style={{
                fontSize: 18,
                lineHeight: 1,
                marginTop: -1,
              }}
            >
              +
            </span>
          </IconCircle>

          <IconCircle title="Voice input coming soon">
            <MicIcon />
          </IconCircle>

          <IconCircle title="Live conversation coming soon" dark>
            <WaveIcon contrast />
          </IconCircle>
        </div>
      </div>

      {/* Generate button (primary action) */}
      <button
        onClick={onSubmit}
        disabled={loading}
        style={{
          padding: '9px 18px',
          borderRadius: 10,
          border: 'none',
          backgroundColor: loading ? '#9ca3af' : '#111827',
          color: '#fff',
          fontSize: 14,
          fontWeight: 500,
          cursor: loading ? 'default' : 'pointer',
          whiteSpace: 'nowrap',
          boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        }}
      >
        {loading ? 'Running…' : 'Generate'}
      </button>
    </div>
  );
}

/* --- Circular icons --- */
function IconCircle({
  children,
  title,
  dark = false,
}: {
  children: React.ReactNode;
  title?: string;
  dark?: boolean;
}) {
  return (
    <div
      title={title}
      style={{
        width: 30,
        height: 30,
        borderRadius: '50%',
        border: dark ? 'none' : '1px solid #d4d4d8',
        backgroundColor: dark ? '#111827' : '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'default',
      }}
    >
      {children}
    </div>
  );
}

/* --- SVG icons (final) --- */
function MicIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" style={{ display: 'block' }}>
      <path
        d="M12 3a3 3 0 0 0-3 3v4a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z"
        fill="none"
        stroke="#111827"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
      <path
        d="M5 10a7 7 0 0 0 14 0"
        fill="none"
        stroke="#6b7280"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
      <path d="M12 17v4" fill="none" stroke="#6b7280" strokeWidth="1.4" strokeLinecap="round" />
      <path d="M8 21h8" fill="none" stroke="#6b7280" strokeWidth="1.4" strokeLinecap="round" />
    </svg>
  );
}

function WaveIcon({ contrast = false }: { contrast?: boolean }) {
  const grey = contrast ? '#ffffff' : '#6b7280';
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" style={{ display: 'block' }}>
      <rect x="3" y="11" width="2" height="4" rx="1" fill={grey} />
      <rect x="7" y="8" width="2" height="10" rx="1" fill={grey} />
      <rect x="11" y="5" width="2" height="14" rx="1" fill={grey} />
      <rect x="15" y="8" width="2" height="10" rx="1" fill={grey} />
      <rect x="19" y="11" width="2" height="4" rx="1" fill={grey} />
    </svg>
  );
}
