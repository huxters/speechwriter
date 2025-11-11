'use client';

import React, { useState } from 'react';

type TraceEntry = {
  stage: string;
  message: string;
};

type Drafts = {
  draft1: string;
  draft2: string;
  winnerLabel: 'draft1' | 'draft2';
};

type JudgeInfo = {
  winner: 1 | 2;
  reason: string;
};

type GuardrailInfo = {
  ok: boolean;
  message: string;
};

type PipelineResult = {
  finalSpeech: string | null;
  drafts: Drafts | null;
  judge: JudgeInfo | null;
  guardrail: GuardrailInfo | null;
  trace: TraceEntry[];
};

export default function DashboardGeneratePage(): JSX.Element {
  const [rawBrief, setRawBrief] = useState('');
  const [audience, setAudience] = useState('');
  const [eventContext, setEventContext] = useState('');
  const [tone, setTone] = useState('');
  const [duration, setDuration] = useState('');
  const [mustInclude, setMustInclude] = useState('');
  const [mustAvoid, setMustAvoid] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trace, setTrace] = useState<TraceEntry[]>([]);
  const [drafts, setDrafts] = useState<Drafts | null>(null);
  const [finalSpeech, setFinalSpeech] = useState<string | null>(null);
  const [judge, setJudge] = useState<JudgeInfo | null>(null);
  const [guardrail, setGuardrail] = useState<GuardrailInfo | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);

  async function runPipeline() {
    if (!rawBrief.trim()) {
      setError('Please tell us what you want to create.');
      return;
    }

    setLoading(true);
    setError(null);
    setTrace([]);
    setDrafts(null);
    setFinalSpeech(null);
    setJudge(null);
    setGuardrail(null);

    try {
      const res = await fetch('/api/speechwriter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawBrief,
          audience,
          eventContext,
          tone,
          duration,
          mustInclude,
          mustAvoid,
        }),
      });

      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || `API error (${res.status})`);
      }

      const data: PipelineResult = await res.json();

      setTrace(data.trace || []);
      setDrafts(data.drafts || null);
      setFinalSpeech(data.finalSpeech || null);
      setJudge(data.judge || null);
      setGuardrail(data.guardrail || null);

      if (!data.finalSpeech) {
        setError('Pipeline completed without a final draft. Please try again.');
      }
    } catch (err: any) {
      console.error('Error running pipeline', err);
      setError('Internal error running Speechwriter pipeline.');
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!loading) runPipeline();
    }
  }

  // --- styles ---

  const pageStyle: React.CSSProperties = {
    minHeight: 'calc(100vh - 56px)',
    padding: '40px 24px 48px',
    boxSizing: 'border-box',
    fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
    backgroundColor: '#f5f5f7',
    color: '#111827',
    display: 'flex',
    justifyContent: 'center',
  };

  const contentStyle: React.CSSProperties = {
    width: '100%',
    maxWidth: 1040,
  };

  const titleStyle: React.CSSProperties = {
    fontSize: 24,
    fontWeight: 600,
    marginBottom: 6,
  };

  const subtitleStyle: React.CSSProperties = {
    fontSize: 13,
    color: '#6b7280',
    marginBottom: 18,
  };

  const lozengeWrapper: React.CSSProperties = {
    display: 'flex',
    alignItems: 'stretch',
    gap: 12,
  };

  const lozengeStyle: React.CSSProperties = {
    flex: 1,
    backgroundColor: '#f9fafb',
    borderRadius: 18,
    border: '1px solid #e5e7eb',
    boxShadow: '0 4px 14px rgba(15,23,42,0.08)',
    padding: '14px 16px 10px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    gap: 8,
  };

  const textareaStyle: React.CSSProperties = {
    width: '100%',
    minHeight: 64,
    resize: 'none',
    border: 'none',
    outline: 'none',
    background: 'transparent',
    fontSize: 14,
    lineHeight: 1.5,
    color: '#111827',
  };

  const helperTextStyle: React.CSSProperties = {
    fontSize: 11,
    color: '#9ca3af',
  };

  const bottomRowStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  };

  const iconRowStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
  };

  const roundIconButton: React.CSSProperties = {
    width: 26,
    height: 26,
    borderRadius: '999px',
    border: '1px solid #d1d5db',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 14,
    color: '#4b5563',
    cursor: 'default',
    backgroundColor: '#ffffff',
  };

  const primaryIconButton: React.CSSProperties = {
    ...roundIconButton,
    backgroundColor: '#111827',
    color: '#ffffff',
    borderColor: '#111827',
  };

  const generateButtonStyle: React.CSSProperties = {
    alignSelf: 'center',
    padding: '10px 22px',
    borderRadius: 999,
    border: 'none',
    backgroundColor: '#111827',
    color: '#ffffff',
    fontSize: 13,
    fontWeight: 500,
    cursor: loading ? 'default' : 'pointer',
    opacity: loading ? 0.7 : 1,
  };

  const advancedLinkStyle: React.CSSProperties = {
    marginTop: 10,
    fontSize: 10,
    color: '#6b7280',
    cursor: 'pointer',
    display: 'inline-block',
  };

  const advancedGrid: React.CSSProperties = {
    marginTop: 8,
    display: 'grid',
    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
    gap: 8,
    fontSize: 11,
  };

  const advInputStyle: React.CSSProperties = {
    width: '100%',
    padding: '6px 8px',
    borderRadius: 8,
    border: '1px solid #e5e7eb',
    fontSize: 11,
    boxSizing: 'border-box',
  };

  const errorStyle: React.CSSProperties = {
    marginTop: 14,
    padding: '10px 12px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    borderRadius: 10,
    fontSize: 11,
  };

  const traceBoxStyle: React.CSSProperties = {
    marginTop: 18,
    padding: '12px 14px',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    border: '1px solid #e5e7eb',
    fontSize: 11,
    color: '#374151',
  };

  const draftsWrapperStyle: React.CSSProperties = {
    marginTop: 18,
    display: 'grid',
    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
    gap: 14,
  };

  const draftCardStyle: React.CSSProperties = {
    padding: '12px 14px',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    border: '1px solid #e5e7eb',
    fontSize: 12,
    lineHeight: 1.5,
    whiteSpace: 'pre-wrap',
  };

  const finalCardStyle: React.CSSProperties = {
    marginTop: 16,
    padding: '14px 16px',
    backgroundColor: '#ffffff',
    borderRadius: 14,
    border: '1px solid #e5e7eb',
    fontSize: 13,
    lineHeight: 1.6,
    whiteSpace: 'pre-wrap',
  };

  // --- render ---

  return (
    <main style={pageStyle}>
      <div style={contentStyle}>
        <h1 style={titleStyle}>New Speech</h1>
        <p style={subtitleStyle}>
          Describe what you want to create in one natural message. We’ll plan, draft, judge,
          guardrail, and edit — then show you the recommended version and how we got there.
        </p>

        {/* Lozenge + Generate */}
        <div style={lozengeWrapper}>
          <div style={lozengeStyle}>
            <textarea
              style={textareaStyle}
              placeholder={'What do you want to create?\nWho is it for, and what must it achieve?'}
              value={rawBrief}
              onChange={e => setRawBrief(e.target.value)}
              onKeyDown={handleKeyDown}
            />

            <div style={bottomRowStyle}>
              <div style={helperTextStyle}>
                Press Enter for a quick run. Upload, voice, and live conversation will be enabled in
                later versions.
              </div>
              <div style={iconRowStyle}>
                {/* plus icon */}
                <div style={roundIconButton}>+</div>
                {/* mic icon */}
                <div style={roundIconButton}>
                  <span
                    style={{
                      width: 10,
                      height: 14,
                      borderRadius: 6,
                      border: '2px solid #4b5563',
                      borderTop: 'none',
                    }}
                  />
                </div>
                {/* "voice" pill */}
                <div style={primaryIconButton}>
                  <span
                    style={{
                      display: 'flex',
                      gap: 2,
                      alignItems: 'center',
                    }}
                  >
                    <span
                      style={{
                        width: 2,
                        height: 8,
                        backgroundColor: '#ffffff',
                        borderRadius: 2,
                      }}
                    />
                    <span
                      style={{
                        width: 2,
                        height: 12,
                        backgroundColor: '#ffffff',
                        borderRadius: 2,
                      }}
                    />
                    <span
                      style={{
                        width: 2,
                        height: 8,
                        backgroundColor: '#ffffff',
                        borderRadius: 2,
                      }}
                    />
                  </span>
                </div>
              </div>
            </div>
          </div>

          <button style={generateButtonStyle} onClick={runPipeline} disabled={loading}>
            {loading ? 'Working…' : 'Generate'}
          </button>
        </div>

        <div style={advancedLinkStyle} onClick={() => setShowAdvanced(v => !v)}>
          {showAdvanced ? 'Hide advanced fields' : 'Show advanced fields (optional constraints)'}
        </div>

        {showAdvanced && (
          <div style={advancedGrid}>
            <input
              style={advInputStyle}
              placeholder="Audience"
              value={audience}
              onChange={e => setAudience(e.target.value)}
            />
            <input
              style={advInputStyle}
              placeholder="Event / context"
              value={eventContext}
              onChange={e => setEventContext(e.target.value)}
            />
            <input
              style={advInputStyle}
              placeholder="Tone / style"
              value={tone}
              onChange={e => setTone(e.target.value)}
            />
            <input
              style={advInputStyle}
              placeholder="Target length (e.g. 5 mins, 600 words)"
              value={duration}
              onChange={e => setDuration(e.target.value)}
            />
            <input
              style={advInputStyle}
              placeholder="Must-include points"
              value={mustInclude}
              onChange={e => setMustInclude(e.target.value)}
            />
            <input
              style={advInputStyle}
              placeholder="Red lines / must-avoid"
              value={mustAvoid}
              onChange={e => setMustAvoid(e.target.value)}
            />
          </div>
        )}

        {error && <div style={errorStyle}>{error}</div>}

        {trace.length > 0 && (
          <div style={traceBoxStyle}>
            <strong>Pipeline Trace (internal)</strong>
            <ul style={{ paddingLeft: 18, margin: '6px 0 0', listStyle: 'disc' }}>
              {trace.map((t, i) => (
                <li key={i}>
                  <strong>[{t.stage}]</strong> {t.message}
                </li>
              ))}
            </ul>
          </div>
        )}

        {drafts && (
          <div style={draftsWrapperStyle}>
            <div style={draftCardStyle}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                Draft 1{drafts.winnerLabel === 'draft1' ? ' (judge pick)' : ''}
              </div>
              {drafts.draft1 || '—'}
            </div>
            <div style={draftCardStyle}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                Draft 2{drafts.winnerLabel === 'draft2' ? ' (judge pick)' : ''}
              </div>
              {drafts.draft2 || '—'}
            </div>
          </div>
        )}

        {finalSpeech && (
          <div style={finalCardStyle}>
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Final Speech (edited)</div>
            {finalSpeech}
          </div>
        )}
      </div>
    </main>
  );
}
