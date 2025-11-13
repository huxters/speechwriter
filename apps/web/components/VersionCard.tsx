'use client';

import React, { useState } from 'react';
import VersionToolbar from '@/components/VersionToolbar';

export type DraftsVM = {
  draft1: string;
  draft2: string;
  winnerLabel: 'draft1' | 'draft2';
};

export type JudgeVM = {
  winner: 1 | 2;
  reason: string;
};

export type GuardrailVM = {
  ok: boolean;
  message: string;
};

export type TraceEntryVM = {
  stage: string;
  message: string;
};

export type VersionVM = {
  index: number;
  createdAt: Date;
  text: string;
  drafts: DraftsVM | null;
  judge: JudgeVM | null;
  guardrail: GuardrailVM | null;
  trace: TraceEntryVM[];
  // NEW: the prompt / revision request that produced this version
  requestText?: string | null;
};

type Props = {
  version: VersionVM;
  expanded: boolean;
  onCopy: () => void;
  onExportPdf: () => void;
  onSpeak: () => void;
  onShare?: () => void;
};

export default function VersionCard({
  version,
  expanded,
  onCopy,
  onExportPdf,
  onSpeak,
  onShare,
}: Props): JSX.Element {
  const [open, setOpen] = useState<boolean>(expanded);
  const [showDetails, setShowDetails] = useState<boolean>(false);
  const [requestExpanded, setRequestExpanded] = useState<boolean>(false);

  const createdLabel = formatVersionTimestamp(version.createdAt);

  // ---- Request strip helpers ----
  const hasRequest = !!(version.requestText && version.requestText.trim().length > 0);
  const MAX_REQUEST_CHARS = 180;

  const fullRequest = (version.requestText || '').trim();
  const needsTruncate = hasRequest && !requestExpanded && fullRequest.length > MAX_REQUEST_CHARS;
  const requestDisplay = hasRequest
    ? needsTruncate
      ? `${fullRequest.slice(0, MAX_REQUEST_CHARS).trimEnd()}…`
      : fullRequest
    : '';

  function handleCopyRequest() {
    if (!hasRequest || !navigator?.clipboard) return;
    navigator.clipboard.writeText(fullRequest).catch(() => {});
  }

  return (
    <div
      style={{
        border: '1px solid #e5e7eb',
        borderRadius: 12,
        background: '#ffffff',
        boxShadow: '0 6px 18px rgba(17,24,39,0.06)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '10px 12px', // slightly taller to avoid icon clipping
          borderBottom: '1px solid #f3f4f6',
        }}
      >
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          style={{
            border: 'none',
            background: 'transparent',
            padding: 0,
            margin: 0,
            display: 'flex',
            alignItems: 'center',
            cursor: 'pointer',
            color: '#111827',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              fontSize: 13,
              fontWeight: 500,
            }}
          >
            <ChevronIcon open={open} />
            <span style={{ marginLeft: 6 }}>{`Suggested Output — v${version.index}`}</span>
          </span>
        </button>

        <span
          style={{
            marginLeft: 10,
            fontSize: 11,
            color: '#6b7280',
          }}
        >
          {createdLabel}
        </span>

        <VersionToolbar
          onCopy={onCopy}
          onExportPdf={onExportPdf}
          onSpeak={onSpeak}
          onShare={onShare}
        />
      </div>

      {/* Body */}
      {open && (
        <div style={{ padding: '10px 12px 12px' }}>
          {/* Request strip (if present) */}
          {hasRequest && (
            <div
              style={{
                marginBottom: 8,
                padding: 8,
                borderRadius: 8,
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  justifyContent: 'space-between',
                  gap: 8,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: '#4b5563',
                  }}
                >
                  {`Request — v${version.index}`}
                </span>

                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    fontSize: 11,
                  }}
                >
                  {fullRequest.length > MAX_REQUEST_CHARS && (
                    <button
                      type="button"
                      onClick={() => setRequestExpanded(v => !v)}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        padding: 0,
                        margin: 0,
                        cursor: 'pointer',
                        color: '#4b5563',
                        textDecoration: 'underline',
                      }}
                    >
                      {requestExpanded ? 'Show less' : 'Show full'}
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={handleCopyRequest}
                    style={{
                      border: 'none',
                      background: 'transparent',
                      padding: 0,
                      margin: 0,
                      cursor: 'pointer',
                      color: '#4b5563',
                      textDecoration: 'underline',
                    }}
                  >
                    Copy
                  </button>
                </div>
              </div>

              <div
                style={{
                  marginTop: 4,
                  fontSize: 12,
                  color: '#4b5563',
                  whiteSpace: 'pre-wrap',
                }}
              >
                {requestDisplay}
              </div>
            </div>
          )}

          {/* Main text */}
          <div
            style={{
              marginBottom: 8,
              fontSize: 15,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
              color: '#111827',
            }}
          >
            {version.text || <em style={{ color: '#9ca3af' }}>No text available.</em>}
          </div>

          {/* Details toggle */}
          {(version.drafts || version.judge || version.guardrail || version.trace.length > 0) && (
            <div style={{ marginTop: 6 }}>
              <button
                type="button"
                onClick={() => setShowDetails(v => !v)}
                style={{
                  fontSize: 12,
                  border: 'none',
                  background: 'transparent',
                  color: '#4b5563',
                  cursor: 'pointer',
                  padding: 0,
                  display: 'inline-flex',
                  alignItems: 'center',
                }}
              >
                <ChevronIcon small open={showDetails} />
                <span style={{ marginLeft: 4 }}>
                  {showDetails ? 'Hide pipeline details' : 'Show pipeline details'}
                </span>
              </button>
            </div>
          )}

          {/* Details section */}
          {showDetails && (
            <div
              style={{
                marginTop: 8,
                padding: 10,
                borderRadius: 8,
                background: '#f9fafb',
                border: '1px solid #e5e7eb',
                fontSize: 13,
                color: '#374151',
              }}
            >
              {/* Drafts + judge */}
              {version.drafts && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>Drafts & Judge</div>
                  <div style={{ marginBottom: 4 }}>
                    <strong>Draft 1</strong>{' '}
                    {version.drafts.winnerLabel === 'draft1' && (
                      <span style={{ color: '#15803d' }}>(judge choice)</span>
                    )}
                  </div>
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      margin: 0,
                      marginBottom: 6,
                      fontFamily:
                        'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
                      fontSize: 13,
                    }}
                  >
                    {version.drafts.draft1}
                  </pre>
                  <div style={{ marginBottom: 4 }}>
                    <strong>Draft 2</strong>{' '}
                    {version.drafts.winnerLabel === 'draft2' && (
                      <span style={{ color: '#15803d' }}>(judge choice)</span>
                    )}
                  </div>
                  <pre
                    style={{
                      whiteSpace: 'pre-wrap',
                      margin: 0,
                      marginBottom: 6,
                      fontFamily:
                        'system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
                      fontSize: 13,
                    }}
                  >
                    {version.drafts.draft2}
                  </pre>
                  {version.judge && (
                    <div style={{ marginTop: 4 }}>
                      <div style={{ fontWeight: 500, marginBottom: 2 }}>Judge reasoning</div>
                      <div>{version.judge.reason}</div>
                    </div>
                  )}
                </div>
              )}

              {/* Guardrail */}
              {version.guardrail && (
                <div style={{ marginBottom: 8 }}>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>Guardrail</div>
                  <div>
                    <span
                      style={{
                        display: 'inline-block',
                        padding: '2px 8px',
                        borderRadius: 9999,
                        fontSize: 11,
                        fontWeight: 500,
                        backgroundColor: version.guardrail.ok ? '#ecfdf3' : '#fef2f2',
                        color: version.guardrail.ok ? '#166534' : '#b91c1c',
                        marginRight: 6,
                      }}
                    >
                      {version.guardrail.ok ? 'OK' : 'Flagged'}
                    </span>
                    <span>{version.guardrail.message}</span>
                  </div>
                </div>
              )}

              {/* Trace */}
              {version.trace && version.trace.length > 0 && (
                <div>
                  <div style={{ fontWeight: 500, marginBottom: 4 }}>Pipeline trace</div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 18,
                    }}
                  >
                    {version.trace.map((t, i) => (
                      <li key={`${t.stage}-${i}`} style={{ marginBottom: 2 }}>
                        <strong>[{t.stage}]</strong> {t.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

type ChevronIconProps = {
  open: boolean;
  small?: boolean;
};

function ChevronIcon({ open, small }: ChevronIconProps): JSX.Element {
  const size = small ? 12 : 14;
  const style: React.CSSProperties = {
    display: 'inline-block',
    transition: 'transform 120ms ease',
    transform: open ? 'rotate(90deg)' : 'rotate(0deg)',
    color: '#6b7280',
  };

  return (
    <span style={style}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 20 20"
        aria-hidden="true"
        focusable="false"
        style={{ display: 'block' }}
      >
        <path
          d="M7 5l6 5-6 5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </span>
  );
}

function formatVersionTimestamp(d: Date): string {
  try {
    const date = d instanceof Date ? d : new Date(d as unknown as string | number | Date);
    if (Number.isNaN(date.getTime())) return '';
    return date.toLocaleString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: 'short',
    });
  } catch {
    return '';
  }
}
