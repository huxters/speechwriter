'use client';

import React, { useState } from 'react';

type TraceEntry = {
  stage: string;
  message: string;
};

type DraftsInfo = {
  draft1: string;
  draft2: string;
  winnerLabel: 'draft1' | 'draft2';
};

type JudgeInfo = {
  winner: 1 | 2;
  reason: string;
} | null;

export default function DashboardGeneratePage() {
  const [brief, setBrief] = useState('');
  const [audience, setAudience] = useState('');
  const [eventContext, setEventContext] = useState('');
  const [tone, setTone] = useState('');
  const [duration, setDuration] = useState('');
  const [keyPoints, setKeyPoints] = useState('');
  const [redLines, setRedLines] = useState('');

  const [loading, setLoading] = useState(false);
  const [finalSpeech, setFinalSpeech] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [trace, setTrace] = useState<TraceEntry[]>([]);
  const [drafts, setDrafts] = useState<DraftsInfo | null>(null);
  const [judge, setJudge] = useState<JudgeInfo>(null);
  const [speechId, setSpeechId] = useState<string | null>(null);
  const [feedbackStatus, setFeedbackStatus] = useState<string | null>(null);

  const charLimit = 2000;

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setFinalSpeech('');
    setTrace([]);
    setDrafts(null);
    setJudge(null);
    setSpeechId(null);
    setFeedbackStatus(null);

    const trimmedBrief = brief.length > charLimit ? brief.slice(0, charLimit) : brief;

    try {
      const res = await fetch('/api/speechwriter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          brief: trimmedBrief,
          audience,
          eventContext,
          tone,
          duration,
          keyPoints,
          redLines,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Pipeline failed.');
        if (data.trace) setTrace(data.trace);
        return;
      }

      setFinalSpeech(data.finalSpeech || '');
      setTrace(data.trace || []);
      setDrafts(data.drafts || null);
      setJudge(data.judge || null);
      setSpeechId(data.speechId || null);
    } catch (err: any) {
      console.error('Error calling /api/speechwriter:', err);
      setError(err?.message || 'Unexpected error.');
    } finally {
      setLoading(false);
    }
  }

  async function sendFeedback(choice: 'draft1' | 'draft2') {
    if (!speechId || !drafts) {
      setFeedbackStatus('No speech/run to attach feedback to.');
      return;
    }

    if (feedbackStatus && feedbackStatus.startsWith('Thanks')) {
      // already submitted once; prevent spam
      return;
    }

    setFeedbackStatus('Sending feedback...');

    try {
      const res = await fetch('/api/speech-feedback', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          speechId,
          judgeWinner: drafts.winnerLabel,
          userChoice: choice,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setFeedbackStatus(data.error || 'Failed to save feedback.');
        return;
      }

      if (data.agreement) {
        setFeedbackStatus('Thanks — you agreed with the system’s choice.');
      } else {
        setFeedbackStatus('Thanks — you preferred the alternative. Logged for tuning.');
      }
    } catch (err: any) {
      console.error('Error sending feedback:', err);
      setFeedbackStatus('Unexpected error sending feedback.');
    }
  }

  return (
    <main
      style={{
        padding: '2rem',
        maxWidth: 1100,
        margin: '0 auto',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif',
      }}
    >
      <p
        style={{
          fontSize: 11,
          color: '#9ca3af',
          marginBottom: 6,
        }}
      >
        Dashboard / New Speech
      </p>
      <h1
        style={{
          fontSize: 28,
          fontWeight: 600,
          marginBottom: 4,
        }}
      >
        New Speech
      </h1>
      <p
        style={{
          fontSize: 13,
          color: '#6b7280',
          marginBottom: 18,
          maxWidth: 720,
        }}
      >
        Define the speech clearly. We&apos;ll run your inputs through Planner → Drafter → Judge →
        Guardrail → Editor and return a final spoken-ready draft, plus visibility into the options
        we considered.
      </p>

      <form
        onSubmit={handleGenerate}
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 420px)',
          gap: 10,
          marginBottom: 24,
        }}
      >
        <div>
          <label htmlFor="brief" style={{ display: 'block', fontSize: 12, fontWeight: 600 }}>
            Core Brief (max {charLimit} characters)
          </label>
          <textarea
            id="brief"
            value={brief}
            onChange={e => setBrief(e.target.value)}
            rows={5}
            placeholder="What is this speech for? What outcome do you want?"
            style={{
              width: '100%',
              padding: 8,
              fontSize: 12,
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              marginTop: 4,
              fontFamily: 'inherit',
            }}
          />
          <div
            style={{
              fontSize: 10,
              color: brief.length > charLimit ? '#b91c1c' : '#9ca3af',
              marginTop: 2,
            }}
          >
            {Math.min(brief.length, charLimit)}/{charLimit} characters
            {brief.length > charLimit ? ' (extra text will be ignored)' : ''}
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 8,
          }}
        >
          <div>
            <label
              htmlFor="audience"
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Audience
            </label>
            <input
              id="audience"
              value={audience}
              onChange={e => setAudience(e.target.value)}
              placeholder="e.g. 300 team members"
              style={{
                width: '100%',
                padding: 6,
                fontSize: 11,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                marginTop: 2,
              }}
            />
          </div>

          <div>
            <label
              htmlFor="eventContext"
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Event / Moment Context
            </label>
            <input
              id="eventContext"
              value={eventContext}
              onChange={e => setEventContext(e.target.value)}
              placeholder="e.g. year-end review"
              style={{
                width: '100%',
                padding: 6,
                fontSize: 11,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                marginTop: 2,
              }}
            />
          </div>

          <div>
            <label
              htmlFor="tone"
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Tone / Style
            </label>
            <input
              id="tone"
              value={tone}
              onChange={e => setTone(e.target.value)}
              placeholder="e.g. positive, grateful"
              style={{
                width: '100%',
                padding: 6,
                fontSize: 11,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                marginTop: 2,
              }}
            />
          </div>

          <div>
            <label
              htmlFor="duration"
              style={{
                display: 'block',
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              Target Duration / Length
            </label>
            <input
              id="duration"
              value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder="e.g. 5 minutes"
              style={{
                width: '100%',
                padding: 6,
                fontSize: 11,
                borderRadius: 8,
                border: '1px solid #e5e7eb',
                marginTop: 2,
              }}
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="keyPoints"
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Must-Include Points
          </label>
          <textarea
            id="keyPoints"
            value={keyPoints}
            onChange={e => setKeyPoints(e.target.value)}
            rows={2}
            placeholder="Bullets: key themes, proof points, thanks..."
            style={{
              width: '100%',
              padding: 6,
              fontSize: 11,
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              marginTop: 2,
              fontFamily: 'inherit',
            }}
          />
        </div>

        <div>
          <label
            htmlFor="redLines"
            style={{
              display: 'block',
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            Red Lines / Must-Avoid
          </label>
          <textarea
            id="redLines"
            value={redLines}
            onChange={e => setRedLines(e.target.value)}
            rows={2}
            placeholder='e.g. do not mention layoffs; avoid "family"'
            style={{
              width: '100%',
              padding: 6,
              fontSize: 11,
              borderRadius: 8,
              border: '1px solid #e5e7eb',
              marginTop: 2,
              fontFamily: 'inherit',
            }}
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          style={{
            marginTop: 6,
            padding: '8px 18px',
            borderRadius: 999,
            border: 'none',
            backgroundColor: loading ? '#9ca3af' : '#111827',
            color: '#ffffff',
            fontSize: 12,
            cursor: loading ? 'default' : 'pointer',
            width: 'fit-content',
          }}
        >
          {loading ? 'Running pipeline...' : 'Generate Speech'}
        </button>
      </form>

      {error && (
        <div
          style={{
            marginTop: 8,
            padding: 10,
            borderRadius: 8,
            background: '#fef2f2',
            color: '#991b1b',
            fontSize: 11,
            maxWidth: 600,
          }}
        >
          {error}
        </div>
      )}

      {trace.length > 0 && (
        <section
          style={{
            marginTop: 18,
            padding: 12,
            borderRadius: 10,
            background: '#f9fafb',
            fontSize: 10,
            maxWidth: 760,
          }}
        >
          <strong
            style={{
              display: 'block',
              fontSize: 11,
              marginBottom: 4,
            }}
          >
            Pipeline Trace (internal)
          </strong>
          <ul style={{ paddingLeft: 16, margin: 0 }}>
            {trace.map((t, i) => (
              <li key={i} style={{ marginBottom: 2 }}>
                <span style={{ fontWeight: 600 }}>[{t.stage}]</span> {t.message}
              </li>
            ))}
          </ul>
        </section>
      )}

      {drafts && (
        <section
          style={{
            marginTop: 18,
            display: 'grid',
            gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
            gap: 12,
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              padding: 10,
              borderRadius: 10,
              border: '1px solid #e5e7eb',
              fontSize: 11,
              background: '#ffffff',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 4,
              }}
            >
              <strong>Draft 1</strong>
              {drafts.winnerLabel === 'draft1' && (
                <span
                  style={{
                    fontSize: 9,
                    padding: '2px 6px',
                    borderRadius: 999,
                    background: '#111827',
                    color: '#ffffff',
                  }}
                >
                  Judge&apos;s pick
                </span>
              )}
            </div>
            <p
              style={{
                whiteSpace: 'pre-wrap',
                margin: 0,
              }}
            >
              {drafts.draft1}
            </p>
            <button
              type="button"
              onClick={() => sendFeedback('draft1')}
              style={{
                marginTop: 6,
                padding: '4px 10px',
                fontSize: 10,
                borderRadius: 999,
                border: '1px solid #d1d5db',
                background: '#f9fafb',
                cursor: 'pointer',
              }}
            >
              I would choose Draft 1
            </button>
          </div>

          <div
            style={{
              padding: 10,
              borderRadius: 10,
              border: '1px solid #e5e7eb',
              fontSize: 11,
              background: '#ffffff',
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: 4,
              }}
            >
              <strong>Draft 2</strong>
              {drafts.winnerLabel === 'draft2' && (
                <span
                  style={{
                    fontSize: 9,
                    padding: '2px 6px',
                    borderRadius: 999,
                    background: '#111827',
                    color: '#ffffff',
                  }}
                >
                  Judge&apos;s pick
                </span>
              )}
            </div>
            <p
              style={{
                whiteSpace: 'pre-wrap',
                margin: 0,
              }}
            >
              {drafts.draft2}
            </p>
            <button
              type="button"
              onClick={() => sendFeedback('draft2')}
              style={{
                marginTop: 6,
                padding: '4px 10px',
                fontSize: 10,
                borderRadius: 999,
                border: '1px solid #d1d5db',
                background: '#f9fafb',
                cursor: 'pointer',
              }}
            >
              I would choose Draft 2
            </button>
          </div>
        </section>
      )}

      {feedbackStatus && (
        <p
          style={{
            marginTop: 6,
            fontSize: 10,
            color: '#6b7280',
          }}
        >
          {feedbackStatus}
        </p>
      )}

      {finalSpeech && (
        <section
          style={{
            marginTop: 22,
            padding: 14,
            borderRadius: 12,
            border: '1px solid #e5e7eb',
            background: '#ffffff',
            maxWidth: 760,
            fontSize: 12,
          }}
        >
          <h2
            style={{
              fontSize: 16,
              fontWeight: 600,
              marginTop: 0,
              marginBottom: 8,
            }}
          >
            Final Speech
          </h2>
          <p
            style={{
              whiteSpace: 'pre-wrap',
              margin: 0,
            }}
          >
            {finalSpeech}
          </p>
        </section>
      )}
    </main>
  );
}
