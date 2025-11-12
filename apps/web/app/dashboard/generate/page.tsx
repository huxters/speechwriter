'use client';

import React, { useEffect, useRef, useState } from 'react';
import PromptBar from '@/components/PromptBar';
import OutputPanel from '@/components/OutputPanel';
import NarrationFeed from '@/components/NarrationFeed';

type TraceEntry = { stage: string; message: string };
type JudgeInfo = { winner: 1 | 2; reason: string };
type GuardrailInfo = { ok: boolean; message: string };

type Drafts = {
  draft1: string;
  draft2: string;
  winnerLabel: 'draft1' | 'draft2';
};

type PipelineResult = {
  finalSpeech: string | null; // editor output (Final Output)
  drafts: Drafts | null; // both drafts + winner label
  judge: JudgeInfo | null;
  guardrail: GuardrailInfo | null;
  trace: TraceEntry[];
};

export default function DashboardGeneratePage(): JSX.Element {
  // Conversational input
  const [rawBrief, setRawBrief] = useState('');

  // Optional constraints (collapsed by default)
  const [audience, setAudience] = useState('');
  const [eventContext, setEventContext] = useState('');
  const [tone, setTone] = useState('');
  const [duration, setDuration] = useState('');
  const [mustInclude, setMustInclude] = useState('');
  const [mustAvoid, setMustAvoid] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Pipeline state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trace, setTrace] = useState<TraceEntry[]>([]);

  // Results (hidden until we have them)
  const [hasResults, setHasResults] = useState(false);
  const [draft1, setDraft1] = useState<string>('');
  const [draft2, setDraft2] = useState<string>('');
  const [winnerLabel, setWinnerLabel] = useState<'draft1' | 'draft2' | null>(null);
  const [finalText, setFinalText] = useState<string>('');

  // Narration (single-line, overwriting)
  const [narration, setNarration] = useState<string>('');
  const timersRef = useRef<number[]>([]);

  function clearTimers() {
    timersRef.current.forEach(id => window.clearTimeout(id));
    timersRef.current = [];
  }

  async function runPipeline() {
    if (!rawBrief.trim()) {
      setError('Please describe what you want to create.');
      return;
    }

    setLoading(true);
    setError(null);
    setTrace([]);
    setHasResults(false);
    setDraft1('');
    setDraft2('');
    setWinnerLabel(null);
    setFinalText('');
    setNarration('Planning your speech structure and core arguments…');

    // Time-gated narration for C.1; replaced by real stage sync in C.2
    clearTimers();
    timersRef.current.push(
      window.setTimeout(
        () => setNarration('Writing two alternative drafts with different tones…'),
        900
      )
    );
    timersRef.current.push(
      window.setTimeout(
        () => setNarration('Comparing drafts for clarity, tone, and persuasion…'),
        1900
      )
    );
    timersRef.current.push(
      window.setTimeout(
        () => setNarration('Checking the winning version for restricted or taboo content…'),
        2900
      )
    );
    timersRef.current.push(
      window.setTimeout(
        () => setNarration('Polishing language and rhythm for spoken delivery…'),
        3900
      )
    );

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
        const msg = await res.text();
        throw new Error(msg || `API error (${res.status})`);
      }

      const data: PipelineResult = await res.json();

      // Trace
      setTrace(Array.isArray(data.trace) ? data.trace : []);

      // Drafts
      if (data.drafts) {
        setDraft1(data.drafts.draft1 || '');
        setDraft2(data.drafts.draft2 || '');
        setWinnerLabel(data.drafts.winnerLabel || null);
      }

      // Final Output
      const final = data.finalSpeech ?? '';
      setFinalText(final);

      setHasResults(Boolean(final || (data.drafts && (data.drafts.draft1 || data.drafts.draft2))));

      if (!final) {
        setError('Pipeline completed without a final draft. Please try again.');
      } else {
        setNarration('Finished — here’s your final speech.');
      }
    } catch (e: any) {
      setError(e?.message || 'Internal error running Speechwriter pipeline.');
      setNarration(''); // clear narration on hard error
    } finally {
      clearTimers();
      setLoading(false);
    }
  }

  // Cleanup timers if component unmounts
  useEffect(() => clearTimers, []);

  // Actions wired to OutputPanel
  function handleCopy() {
    if (!finalText) return;
    navigator.clipboard.writeText(finalText).catch(() => {});
  }

  function handleExportPdf() {
    if (!finalText) return;
    import('jspdf')
      .then(({ jsPDF }) => {
        const doc = new jsPDF();
        const lines = doc.splitTextToSize(finalText, 180);
        doc.text(lines, 15, 20);
        doc.save('speechwriter-output.pdf');
      })
      .catch(() => {
        const w = window.open('', '_blank');
        if (w) {
          w.document.write(
            `<pre style="white-space:pre-wrap;font:14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">${escapeHtml(
              finalText
            )}</pre>`
          );
          w.document.close();
          w.focus();
          w.print();
        }
      });
  }

  function handleSpeak() {
    if (!finalText) return;
    const u = new SpeechSynthesisUtterance(finalText);
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(u);
  }

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '24px 20px 60px' }}>
      <h1 style={{ fontSize: 22, margin: '4px 0 8px' }}>New Speech</h1>
      <p style={{ margin: '0 0 14px', color: '#6b7280', fontSize: 13 }}>
        Describe what you want to create in one natural message. We’ll plan, draft, judge,
        guardrail, and edit — then show you the recommended version and how we got there.
      </p>

      {/* Lozenge — now full container width with in-lozenge arrow */}
      <PromptBar
        value={rawBrief}
        onChange={setRawBrief}
        onSubmit={runPipeline}
        disabled={loading}
        placeholder="Describe the speech you want to create…"
      />

      {/* Single-line narration that overwrites itself */}
      <NarrationFeed message={narration} visible={loading || !!narration} />

      {/* Advanced constraints toggle */}
      <div style={{ marginTop: 10 }}>
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          disabled={loading}
          style={{
            fontSize: 12,
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            background: '#f9fafb',
            color: '#6b7280',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.6 : 1,
          }}
        >
          {showAdvanced ? 'Hide' : 'Show'} advanced fields (optional constraints)
        </button>
      </div>

      {/* Advanced constraints (collapsed by default) */}
      {showAdvanced && (
        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginTop: 10 }}
        >
          <input
            placeholder="Audience (optional)"
            value={audience}
            onChange={e => setAudience(e.target.value)}
            disabled={loading}
          />
          <input
            placeholder="Context (optional)"
            value={eventContext}
            onChange={e => setEventContext(e.target.value)}
            disabled={loading}
          />
          <input
            placeholder="Tone (optional)"
            value={tone}
            onChange={e => setTone(e.target.value)}
            disabled={loading}
          />
          <input
            placeholder="Duration (e.g. 5 minutes)"
            value={duration}
            onChange={e => setDuration(e.target.value)}
            disabled={loading}
          />
          <input
            placeholder="Must include (comma-separated)"
            value={mustInclude}
            onChange={e => setMustInclude(e.target.value)}
            disabled={loading}
          />
          <input
            placeholder="Must avoid (comma-separated)"
            value={mustAvoid}
            onChange={e => setMustAvoid(e.target.value)}
            disabled={loading}
          />
        </div>
      )}

      {/* RESULTS — only render after a run returns something */}
      {hasResults && (
        <>
          {/* Drafts row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 18 }}>
            <div style={cardStyle}>
              <h3 style={cardTitle}>
                Draft 1 {winnerLabel === 'draft1' ? '✓ (judge choice)' : ''}
              </h3>
              <div style={cardBody}>
                {draft1 ? <pre style={preStyle}>{draft1}</pre> : <em>—</em>}
              </div>
            </div>
            <div style={cardStyle}>
              <h3 style={cardTitle}>
                Draft 2 {winnerLabel === 'draft2' ? '✓ (judge choice)' : ''}
              </h3>
              <div style={cardBody}>
                {draft2 ? <pre style={preStyle}>{draft2}</pre> : <em>—</em>}
              </div>
            </div>
          </div>

          {/* Final Output */}
          <div style={{ ...cardStyle, marginTop: 18 }}>
            <OutputPanel
              finalText={finalText}
              onCopy={handleCopy}
              onExportPdf={handleExportPdf}
              onSpeak={handleSpeak}
            />
          </div>

          {/* Trace */}
          <div style={{ ...cardStyle, marginTop: 16 }}>
            <h3 style={cardTitle}>Pipeline Trace (internal)</h3>
            <div style={traceBox}>
              {trace.length === 0 ? (
                <em>—</em>
              ) : (
                <ul style={{ margin: 0, paddingLeft: 18 }}>
                  {trace.map((t, i) => (
                    <li key={`${t.stage}-${i}`} style={{ marginBottom: 4 }}>
                      <strong>[{t.stage}]</strong> {t.message}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            {error && <div style={{ marginTop: 10, color: '#b91c1c', fontSize: 13 }}>{error}</div>}
          </div>
        </>
      )}
    </div>
  );
}

// styles
const cardStyle: React.CSSProperties = {
  border: '1px solid #e5e7eb',
  borderRadius: 12,
  background: '#ffffff',
  boxShadow: '0 6px 18px rgba(17,24,39,0.06)',
};

const cardTitle: React.CSSProperties = {
  margin: '10px 12px 6px',
  fontSize: 14,
  color: '#111827',
};

const cardBody: React.CSSProperties = {
  padding: '0 12px 12px',
};

const preStyle: React.CSSProperties = {
  whiteSpace: 'pre-wrap',
  margin: 0,
  font: '14px/1.5 system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif',
};

const traceBox: React.CSSProperties = {
  padding: 12,
  background: '#f9fafb',
  borderTop: '1px solid #f3f4f6',
  borderBottomLeftRadius: 12,
  borderBottomRightRadius: 12,
};

// HTML escape for print fallback
function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
