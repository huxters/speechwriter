'use client';

import React, { useState } from 'react';
import PromptBar from '@/components/PromptBar';
import OutputPanel, {
  Drafts,
  JudgeInfo,
  GuardrailInfo,
  TraceEntry,
} from '@/components/OutputPanel';

type PipelineResult = {
  finalSpeech: string | null;
  drafts: Drafts | null;
  judge: JudgeInfo | null;
  guardrail: GuardrailInfo | null;
  trace: TraceEntry[];
};

export default function DashboardGeneratePage() {
  // Core conversational brief
  const [rawBrief, setRawBrief] = useState('');

  // Optional structured constraints
  const [audience, setAudience] = useState('');
  const [eventContext, setEventContext] = useState('');
  const [tone, setTone] = useState('');
  const [duration, setDuration] = useState('');
  const [mustInclude, setMustInclude] = useState('');
  const [mustAvoid, setMustAvoid] = useState('');

  // Pipeline response state
  const [loading, setLoading] = useState(false);
  const [finalSpeech, setFinalSpeech] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<Drafts | null>(null);
  const [judge, setJudge] = useState<JudgeInfo | null>(null);
  const [guardrail, setGuardrail] = useState<GuardrailInfo | null>(null);
  const [trace, setTrace] = useState<TraceEntry[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [showAdvanced, setShowAdvanced] = useState(false);

  async function runPipeline() {
    if (!rawBrief.trim()) {
      setError('Please describe what you want to create.');
      return;
    }

    setLoading(true);
    setError(null);
    setFinalSpeech(null);
    setDrafts(null);
    setJudge(null);
    setGuardrail(null);
    setTrace([]);

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

      setFinalSpeech(data.finalSpeech || null);
      setDrafts(data.drafts || null);
      setJudge(data.judge || null);
      setGuardrail(data.guardrail || null);
      setTrace(data.trace || []);

      if (!data.finalSpeech) {
        setError('Pipeline completed without a final draft. Please try again.');
      }
    } catch (err: any) {
      console.error('Error calling /api/speechwriter', err);
      setError(err?.message || 'Internal error running Speechwriter pipeline.');
    } finally {
      setLoading(false);
    }
  }

  function handleSelectDraft(which: 'draft1' | 'draft2') {
    if (!drafts) return;
    const chosen = which === 'draft1' ? drafts.draft1 || '' : drafts.draft2 || '';
    if (!chosen.trim()) return;

    setFinalSpeech(chosen);

    // Simple instrumentation stub (to be wired to backend later)
    console.log('Judge vs User choice feedback', {
      judgeWinner: drafts.winnerLabel,
      userChoice: which,
      agreement: drafts.winnerLabel === which,
    });
  }

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '32px 24px 48px',
        fontFamily: 'system-ui, -apple-system, BlinkMacSystemFont, sans-serif',
      }}
    >
      {/* Heading */}
      <header style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 28,
            fontWeight: 600,
            marginBottom: 8,
          }}
        >
          New Speech
        </h1>
        <p
          style={{
            fontSize: 14,
            color: '#555',
            maxWidth: 720,
            lineHeight: 1.5,
          }}
        >
          Describe what you want to create in one natural message. We&apos;ll plan, draft, judge,
          guardrail, and edit — then show you the recommended version and how we got there.
        </p>
      </header>

      {/* Prompt bar (stable, shared component) */}
      <PromptBar value={rawBrief} onChange={setRawBrief} onSubmit={runPipeline} loading={loading} />

      {/* Hint below input */}
      <div
        style={{
          fontSize: 11,
          color: '#777',
          marginBottom: 16,
          marginLeft: 8,
        }}
      >
        Press Enter for a quick run. Upload, voice, and live conversation will be enabled in later
        versions.
      </div>

      {/* Advanced fields */}
      <div style={{ marginBottom: 24 }}>
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          style={{
            padding: '4px 10px',
            fontSize: 11,
            borderRadius: 999,
            border: '1px solid #e0e0e0',
            background: '#fafafa',
            cursor: 'pointer',
            color: '#666',
          }}
        >
          {showAdvanced ? 'Hide advanced fields' : 'Show advanced fields (optional constraints)'}
        </button>

        {showAdvanced && (
          <div
            style={{
              marginTop: 12,
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 12,
              alignItems: 'flex-start',
              maxWidth: 960,
            }}
          >
            <input
              value={audience}
              onChange={e => setAudience(e.target.value)}
              placeholder="Audience (optional)"
              style={advancedInputStyle}
            />
            <input
              value={eventContext}
              onChange={e => setEventContext(e.target.value)}
              placeholder="Event / context (optional)"
              style={advancedInputStyle}
            />
            <input
              value={tone}
              onChange={e => setTone(e.target.value)}
              placeholder="Tone / style (optional)"
              style={advancedInputStyle}
            />
            <input
              value={duration}
              onChange={e => setDuration(e.target.value)}
              placeholder="Target length (e.g. 5 minutes)"
              style={advancedInputStyle}
            />
            <textarea
              value={mustInclude}
              onChange={e => setMustInclude(e.target.value)}
              placeholder="Must-include points"
              rows={2}
              style={{ ...advancedInputStyle, borderRadius: 8 }}
            />
            <textarea
              value={mustAvoid}
              onChange={e => setMustAvoid(e.target.value)}
              placeholder="Red lines / must-avoid"
              rows={2}
              style={{ ...advancedInputStyle, borderRadius: 8 }}
            />
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: '10px 12px',
            borderRadius: 8,
            backgroundColor: '#ffecec',
            color: '#a00',
            fontSize: 13,
            maxWidth: 960,
          }}
        >
          {error}
        </div>
      )}

      {/* Output: final + drafts + trace */}
      <OutputPanel
        finalSpeech={finalSpeech}
        drafts={drafts}
        judge={judge}
        guardrail={guardrail}
        trace={trace}
        onSelectDraft={handleSelectDraft}
      />
    </main>
  );
}

const advancedInputStyle: React.CSSProperties = {
  width: '100%',
  padding: '8px 10px',
  borderRadius: 6,
  border: '1px solid #e0e0e0',
  fontSize: 12,
  outline: 'none',
};
