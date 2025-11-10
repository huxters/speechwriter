'use client';

import React, { useState } from 'react';

export type TraceEntry = {
  stage: string;
  message: string;
};

export type Drafts = {
  draft1: string;
  draft2: string;
  winnerLabel: 'draft1' | 'draft2';
};

export type JudgeInfo = {
  winner: 1 | 2;
  reason: string;
};

export type GuardrailInfo = {
  ok: boolean;
  message: string;
};

type OutputPanelProps = {
  finalSpeech: string | null;
  drafts: Drafts | null;
  judge: JudgeInfo | null;
  guardrail: GuardrailInfo | null;
  trace: TraceEntry[];
  onSelectDraft: (which: 'draft1' | 'draft2') => void;
};

export default function OutputPanel({
  finalSpeech,
  drafts,
  judge,
  guardrail,
  trace,
  onSelectDraft,
}: OutputPanelProps) {
  const [showDetails, setShowDetails] = useState(false);

  if (!finalSpeech && !drafts && (!trace || trace.length === 0)) {
    return null;
  }

  return (
    <section style={{ marginTop: 8 }}>
      {/* Final Speech card */}
      {finalSpeech && (
        <section
          style={{
            marginBottom: 24,
            padding: '16px 18px',
            borderRadius: 16,
            border: '1px solid #eee',
            backgroundColor: '#fafafa',
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              gap: 12,
              marginBottom: 8,
              alignItems: 'baseline',
            }}
          >
            <div>
              <div
                style={{
                  fontSize: 11,
                  textTransform: 'uppercase',
                  letterSpacing: 0.8,
                  color: '#888',
                }}
              >
                Recommended draft
              </div>
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  margin: 0,
                }}
              >
                Final Speech
              </h2>
              {judge && (
                <p
                  style={{
                    fontSize: 11,
                    color: '#777',
                    margin: '4px 0 0',
                  }}
                >
                  Judge selected Draft {judge.winner}. Guardrail:{' '}
                  {guardrail ? (guardrail.ok ? 'passed' : 'adjusted') : 'not applied yet'}.
                </p>
              )}
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => {
                  if (!finalSpeech) return;
                  navigator.clipboard
                    .writeText(finalSpeech)
                    .catch(e => console.error('Copy failed', e));
                }}
                style={smallPillButton}
              >
                Copy
              </button>
            </div>
          </div>
          <div
            style={{
              marginTop: 8,
              fontSize: 14,
              lineHeight: 1.6,
              whiteSpace: 'pre-wrap',
              color: '#222',
            }}
          >
            {finalSpeech}
          </div>
        </section>
      )}

      {/* Toggle for details (drafts + trace) */}
      {(drafts || (trace && trace.length > 0)) && (
        <div>
          <button
            type="button"
            onClick={() => setShowDetails(v => !v)}
            style={{
              padding: '6px 10px',
              fontSize: 11,
              borderRadius: 999,
              border: '1px solid #e0e0e0',
              background: '#fff',
              cursor: 'pointer',
              color: '#555',
              marginBottom: 12,
            }}
          >
            {showDetails ? 'Hide how we got here' : 'See how we got here (drafts & pipeline trace)'}
          </button>

          {showDetails && (
            <>
              {/* Draft comparison */}
              {drafts && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 16,
                    marginBottom: 24,
                  }}
                >
                  {/* Draft 1 */}
                  <div
                    style={{
                      padding: '12px 12px 10px',
                      borderRadius: 12,
                      border: drafts.winnerLabel === 'draft1' ? '1px solid #111' : '1px solid #eee',
                      backgroundColor: drafts.winnerLabel === 'draft1' ? '#fafafa' : '#ffffff',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 8,
                        marginBottom: 6,
                        alignItems: 'center',
                      }}
                    >
                      <strong
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        Draft 1{drafts.winnerLabel === 'draft1' ? ' (Judge pick)' : ''}
                      </strong>
                      <button
                        type="button"
                        onClick={() => onSelectDraft('draft1')}
                        style={tinyOutlineButton}
                      >
                        Use this
                      </button>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        color: '#333',
                      }}
                    >
                      {drafts.draft1}
                    </div>
                  </div>

                  {/* Draft 2 */}
                  <div
                    style={{
                      padding: '12px 12px 10px',
                      borderRadius: 12,
                      border: drafts.winnerLabel === 'draft2' ? '1px solid #111' : '1px solid #eee',
                      backgroundColor: drafts.winnerLabel === 'draft2' ? '#fafafa' : '#ffffff',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 8,
                        marginBottom: 6,
                        alignItems: 'center',
                      }}
                    >
                      <strong
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                        }}
                      >
                        Draft 2{drafts.winnerLabel === 'draft2' ? ' (Judge pick)' : ''}
                      </strong>
                      <button
                        type="button"
                        onClick={() => onSelectDraft('draft2')}
                        style={tinyOutlineButton}
                      >
                        Use this
                      </button>
                    </div>
                    <div
                      style={{
                        fontSize: 13,
                        lineHeight: 1.5,
                        whiteSpace: 'pre-wrap',
                        color: '#333',
                      }}
                    >
                      {drafts.draft2}
                    </div>
                  </div>
                </div>
              )}

              {/* Pipeline trace */}
              {trace && trace.length > 0 && (
                <div
                  style={{
                    marginTop: 8,
                    padding: '12px 14px',
                    borderRadius: 12,
                    border: '1px solid #f0f0f0',
                    backgroundColor: '#fcfcfc',
                  }}
                >
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      textTransform: 'uppercase',
                      color: '#999',
                      marginBottom: 4,
                    }}
                  >
                    Pipeline Trace (internal)
                  </div>
                  <ul
                    style={{
                      margin: 0,
                      paddingLeft: 18,
                      fontSize: 12,
                      color: '#555',
                      lineHeight: 1.5,
                    }}
                  >
                    {trace.map((t, idx) => (
                      <li key={idx}>
                        <strong>[{t.stage}]</strong> {t.message}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </section>
  );
}

const smallPillButton: React.CSSProperties = {
  padding: '4px 10px',
  fontSize: 11,
  borderRadius: 999,
  border: '1px solid #ddd',
  backgroundColor: '#fff',
  cursor: 'pointer',
  color: '#333',
};

const tinyOutlineButton: React.CSSProperties = {
  padding: '2px 8px',
  fontSize: 10,
  borderRadius: 999,
  border: '1px solid #ccc',
  backgroundColor: '#fff',
  cursor: 'pointer',
  color: '#333',
};
