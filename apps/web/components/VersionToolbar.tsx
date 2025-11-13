'use client';

import React from 'react';

type Props = {
  onCopy: () => void;
  onExportPdf: () => void;
  onSpeak: () => void;
  onShare?: () => void;
};

export default function VersionToolbar({
  onCopy,
  onExportPdf,
  onSpeak,
  onShare,
}: Props): JSX.Element {
  const buttonStyle: React.CSSProperties = {
    border: 'none',
    background: 'transparent',
    padding: 4,
    marginLeft: 8,
    borderRadius: 8,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
    transition: 'background-color 120ms ease, color 120ms ease',
    color: '#6b7280',
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

  const handleKey = (e: React.KeyboardEvent<HTMLButtonElement>, fn?: () => void) => {
    if ((e.key === 'Enter' || e.key === ' ') && fn) {
      e.preventDefault();
      fn();
    }
  };

  const handleEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = '#f3f4f6';
    e.currentTarget.style.color = '#111827';
  };

  const handleLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.currentTarget.style.backgroundColor = 'transparent';
    e.currentTarget.style.color = '#6b7280';
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        marginLeft: 'auto',
      }}
    >
      {/* Copy */}
      <button
        type="button"
        aria-label="Copy speech"
        title="Copy"
        onClick={onCopy}
        onKeyDown={e => handleKey(e, onCopy)}
        style={buttonStyle}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <svg {...iconCommon} aria-hidden="true" focusable="false" title="Copy">
          <rect x="6" y="6" width="10" height="12" rx="2" ry="2" />
          <rect x="10" y="4" width="8" height="12" rx="2" ry="2" />
        </svg>
      </button>

      {/* Export PDF / Download */}
      <button
        type="button"
        aria-label="Export as PDF"
        title="Export PDF"
        onClick={onExportPdf}
        onKeyDown={e => handleKey(e, onExportPdf)}
        style={buttonStyle}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <svg {...iconCommon} aria-hidden="true" focusable="false" title="Export PDF">
          <path d="M6 15h12l-1.5 4H7.5L6 15z" />
          <path d="M12 5v8" />
          <path d="M9.5 10.5 12 13l2.5-2.5" />
        </svg>
      </button>

      {/* Speak */}
      <button
        type="button"
        aria-label="Read aloud"
        title="Read aloud"
        onClick={onSpeak}
        onKeyDown={e => handleKey(e, onSpeak)}
        style={buttonStyle}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <svg {...iconCommon} aria-hidden="true" focusable="false" title="Read aloud">
          <path d="M6 11v4h3l4 3V8l-4 3H6z" />
          <path d="M17 11a3 3 0 0 1 0 4" />
          <path d="M19 10a5 5 0 0 1 0 6" />
        </svg>
      </button>

      {/* Share (stub) */}
      <button
        type="button"
        aria-label="Share link (coming soon)"
        title="Share (coming soon)"
        onClick={() => {
          if (onShare) {
            onShare();
          } else if (typeof window !== 'undefined') {
            // eslint-disable-next-line no-console
            console.log('Share stub clicked (no implementation yet).');
          }
        }}
        onKeyDown={e => handleKey(e, onShare)}
        style={buttonStyle}
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        <svg {...iconCommon} aria-hidden="true" focusable="false" title="Share (coming soon)">
          <circle cx="18" cy="6" r="2" />
          <circle cx="7" cy="12" r="2" />
          <circle cx="18" cy="18" r="2" />
          <path d="M9 11 16 7" />
          <path d="M9 13 16 17" />
        </svg>
      </button>
    </div>
  );
}
