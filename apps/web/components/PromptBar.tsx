'use client';

import React from 'react';

type PromptBarProps = {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  disabled?: boolean;
};

export default function PromptBar({
  value,
  onChange,
  onSubmit,
  disabled = false,
}: PromptBarProps): JSX.Element {
  const isEmpty = !value.trim();
  const canSend = !disabled && !isEmpty;

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (canSend) {
        onSubmit();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const el = e.target;
    // auto-resize height as user types (roomy, multi-line)
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 140)}px`;
    onChange(el.value);
  };

  const iconCommon = {
    width: 22,
    height: 22,
    viewBox: '0 0 24 24',
    stroke: 'currentColor',
    strokeWidth: 1.5,
    fill: 'none',
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  };

  const sideButtonBase: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    padding: 4,
    borderRadius: 9999,
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    cursor: disabled ? 'default' : 'pointer',
    color: disabled ? '#9ca3af' : '#6b7280',
    transition: 'background-color 120ms ease, color 120ms ease',
    // small vertical nudge so icons align nicely with text baseline
    marginTop: 2,
  };

  return (
    <div
      style={{
        borderRadius: 9999,
        border: '1px solid #e5e7eb',
        backgroundColor: '#f9fafb',
        // more generous, symmetric padding so icons sit well inside the pill
        padding: '8px 16px',
        display: 'flex',
        alignItems: 'flex-end',
        gap: 12, // slightly roomier spacing between plus, text, and right icons
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Left: plus (upload stub) */}
      <button
        type="button"
        aria-label="Attach file (coming soon)"
        title="Attach (coming soon)"
        style={sideButtonBase}
        onMouseEnter={e => {
          if (!disabled) e.currentTarget.style.backgroundColor = '#e5e7eb';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = 'transparent';
        }}
        onClick={() => {
          if (disabled) return;
          if (typeof window !== 'undefined') {
            // eslint-disable-next-line no-console
            console.log('Attach stub clicked (no implementation yet).');
          }
        }}
      >
        <svg {...iconCommon} aria-hidden="true" focusable="false" title="Attach (coming soon)">
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
      </button>

      {/* Center: text area */}
      <textarea
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder="Describe the speech you want, or ask for changes…"
        disabled={disabled}
        rows={1}
        style={{
          flex: 1,
          border: 'none',
          outline: 'none',
          resize: 'none',
          background: 'transparent',
          color: '#111827',
          fontFamily: 'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
          fontSize: 15,
          lineHeight: 1.5,
          padding: '6px 0',
          minHeight: 24,
          maxHeight: 140,
          overflow: 'hidden',
        }}
      />

      {/* Right: microphone + send/stop */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 6, // a touch more than before, keeps mic + arrow visually grouped
          // tiny left shift of the whole right cluster for balance
          marginRight: 2,
        }}
      >
        {/* Mic stub (slightly larger visual) */}
        <button
          type="button"
          aria-label="Dictate with microphone (coming soon)"
          title="Dictate (coming soon)"
          style={sideButtonBase}
          onMouseEnter={e => {
            if (!disabled) e.currentTarget.style.backgroundColor = '#e5e7eb';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.backgroundColor = 'transparent';
          }}
          onClick={() => {
            if (disabled) return;
            if (typeof window !== 'undefined') {
              // eslint-disable-next-line no-console
              console.log('Mic stub clicked (no implementation yet).');
            }
          }}
        >
          <svg
            width={24}
            height={24}
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
            fill="none"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
            title="Dictate (coming soon)"
          >
            <path d="M12 5a2 2 0 0 1 2 2v4a2 2 0 0 1-4 0V7a2 2 0 0 1 2-2z" />
            <path d="M7 10a5 5 0 0 0 10 0" />
            <path d="M12 15v3" />
            <path d="M9 18h6" />
          </svg>
        </button>

        {/* Send / Stop */}
        <button
          type="button"
          aria-label={canSend ? 'Generate speech' : disabled ? 'Stop (running)' : 'Generate'}
          title={canSend ? 'Generate' : disabled ? 'Stop' : 'Generate'}
          style={{
            border: 'none',
            borderRadius: 9999,
            padding: 4,
            width: 32,
            height: 32,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: canSend || disabled ? 'pointer' : 'default',
            backgroundColor: disabled ? '#6b7280' : canSend ? '#111827' : '#e5e7eb',
            color: '#ffffff',
            transition: 'background-color 120ms ease, transform 120ms ease',
            marginTop: 2, // align with mic + text
          }}
          onMouseEnter={e => {
            if (disabled) return;
            if (canSend) {
              e.currentTarget.style.backgroundColor = '#000000';
            }
          }}
          onMouseLeave={e => {
            if (disabled) {
              e.currentTarget.style.backgroundColor = '#6b7280';
            } else if (canSend) {
              e.currentTarget.style.backgroundColor = '#111827';
            } else {
              e.currentTarget.style.backgroundColor = '#e5e7eb';
            }
          }}
          onClick={() => {
            if (disabled) {
              if (typeof window !== 'undefined') {
                // eslint-disable-next-line no-console
                console.log('Stop stub clicked (cancel not implemented).');
              }
              return;
            }
            if (canSend) {
              onSubmit();
            }
          }}
        >
          {disabled ? (
            // Larger stop square
            <svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
              title="Stop"
            >
              <rect x="6" y="6" width="12" height="12" rx="3" ry="3" fill="currentColor" />
            </svg>
          ) : (
            // Send arrow (paper-plane style)
            <svg
              width={18}
              height={18}
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
              title="Generate"
            >
              <path
                d="M5 12L19 5l-3.5 14L11 13l-4-1z"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
