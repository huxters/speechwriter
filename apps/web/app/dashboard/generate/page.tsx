'use client';

import React, { useState, useEffect } from 'react';
import PromptBar from '@/components/PromptBar';
import VersionCard, {
  VersionVM,
  DraftsVM,
  JudgeVM,
  GuardrailVM,
  TraceEntryVM,
} from '@/components/VersionCard';

type PipelineResult = {
  finalSpeech: string | null;
  drafts: DraftsVM | null;
  judge: JudgeVM | null;
  guardrail: GuardrailVM | null;
  trace: TraceEntryVM[];
};

type TraceEntry = TraceEntryVM;

type HistoryItem = {
  id: string;
  brief: string | null;
  final_speech: string | null;
  trace: TraceEntryVM[] | null;
  created_at: string | null;
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

  // Pipeline + UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trace, setTrace] = useState<TraceEntry[]>([]);
  const [narration, setNarration] = useState<string>('Ready. Describe your speech to get started.');

  // Versions (multi-iteration output thread)
  const [versions, setVersions] = useState<VersionVM[]>([]);

  function setNarrationStage(
    stage: 'idle' | 'planning' | 'drafting' | 'judging' | 'guardrail' | 'editing'
  ) {
    switch (stage) {
      case 'planning':
        setNarration('Planning the structure and emotional arc of your speech…');
        break;
      case 'drafting':
        setNarration('Drafting two competing versions from the plan…');
        break;
      case 'judging':
        setNarration('Judging the drafts to pick the stronger option…');
        break;
      case 'guardrail':
        setNarration('Checking tone, safety, and constraints…');
        break;
      case 'editing':
        setNarration('Polishing the winner for spoken delivery…');
        break;
      case 'idle':
      default:
        setNarration('Ask for tweaks, new directions, or a different speech whenever you like.');
        break;
    }
  }

  // --- Hydrate from history on first load ---
  useEffect(() => {
    let cancelled = false;

    async function loadHistory() {
      try {
        const res = await fetch('/api/speechwriter/history', {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
        });

        if (!res.ok) {
          // History is non-critical – fail quietly with a trace in future if needed
          return;
        }

        const data: { items: HistoryItem[] } = await res.json();
        if (!data || !Array.isArray(data.items) || cancelled) return;

        const items = data.items.filter(item => item.final_speech && item.final_speech.trim());

        if (items.length === 0) return;

        // items are already sorted newest first by created_at
        const total = items.length;

        const mapped: VersionVM[] = items.map((item, index) => ({
          index: total - index, // oldest = 1, newest = total
          createdAt: item.created_at ? new Date(item.created_at) : new Date(),
          text: item.final_speech || '',
          drafts: null,
          judge: null,
          guardrail: null,
          trace: Array.isArray(item.trace) ? (item.trace as TraceEntryVM[]) : [],
          requestText: item.brief || '',
        }));

        // Newest version should still be at top visually
        mapped.sort((a, b) => b.index - a.index);

        setVersions(mapped);
      } catch {
        // Silent failure – history is helpful but not critical
      }
    }

    loadHistory();

    return () => {
      cancelled = true;
    };
  }, []);

  async function runPipeline() {
    const trimmed = rawBrief.trim();
    if (!trimmed) {
      setError('Please describe what you want to create.');
      return;
    }

    // Capture the request text for THIS run before we clear anything
    const requestForThisRun = trimmed;

    // Capture latest version context for refinement mode
    const latestVersion = versions.length > 0 ? versions[0] : null;
    const previousVersionText = latestVersion?.text ?? null;
    const previousRequestText = latestVersion?.requestText ?? null;

    setLoading(true);
    setError(null);
    setTrace([]);
    setNarrationStage('planning');

    try {
      const res = await fetch('/api/speechwriter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawBrief: trimmed,
          audience,
          eventContext,
          tone,
          duration,
          mustInclude,
          mustAvoid,
          // context for refinement mode (null on first run)
          previousVersionText,
          previousRequestText,
        }),
      });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `API error (${res.status})`);
      }

      setNarrationStage('drafting');

      const data: PipelineResult = await res.json();

      setNarrationStage('judging');
      setTrace(Array.isArray(data.trace) ? data.trace : []);

      // Build new version from pipeline result
      const final = data.finalSpeech ?? '';

      const newVersion: VersionVM = {
        index: versions.length + 1,
        createdAt: new Date(),
        text: final,
        drafts: data.drafts ?? null,
        judge: data.judge ?? null,
        guardrail: data.guardrail ?? null,
        trace: Array.isArray(data.trace) ? data.trace : [],
        requestText: requestForThisRun, // request that produced this version
      };

      // Newest version at the top (directly under the lozenge)
      setVersions(prev => [newVersion, ...prev]);

      setNarrationStage('editing');

      if (!final) {
        setError('Pipeline completed without a final draft. Please try again.');
      } else {
        // Clear the lozenge ready for the next refinement / new speech
        setRawBrief('');
        // Back to idle helper text
        setNarrationStage('idle');
      }
    } catch (e: any) {
      setError(e?.message || 'Internal error running Speechwriter pipeline.');
      setNarration('Something went wrong while running the pipeline.');
    } finally {
      setLoading(false);
    }
  }

  // Actions wired per version
  function handleCopy(version: VersionVM) {
    if (!version.text) return;
    navigator.clipboard.writeText(version.text).catch(() => {});
  }

  function handleExportPdf(version: VersionVM) {
    if (!version.text) return;
    import('jspdf')
      .then(({ jsPDF }) => {
        const doc = new jsPDF();
        const lines = doc.splitTextToSize(version.text, 180);
        doc.text(lines, 15, 20);
        doc.save(`speechwriter-v${version.index}.pdf`);
      })
      .catch(() => {
        const w = window.open('', '_blank');
        if (w) {
          w.document.write(
            `<pre style="white-space:pre-wrap;font:14px/1.5 system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;">${escapeHtml(
              version.text
            )}</pre>`
          );
          w.document.close();
          w.focus();
          w.print();
        }
      });
  }

  function handleSpeak(version: VersionVM) {
    if (!version.text) return;
    const u = new SpeechSynthesisUtterance(version.text);
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

      {/* Lozenge */}
      <PromptBar
        value={rawBrief}
        onChange={setRawBrief}
        onSubmit={runPipeline}
        disabled={loading}
      />

      {/* Narration feed */}
      <div style={{ marginTop: 8, fontSize: 12, color: '#6b7280' }}>{narration}</div>

      {/* Advanced constraints toggle */}
      <div style={{ marginTop: 10 }}>
        <button
          type="button"
          onClick={() => setShowAdvanced(v => !v)}
          style={{
            fontSize: 12,
            padding: '6px 10px',
            borderRadius: 8,
            border: '1px solid #e5e7eb',
            background: '#f9fafb',
            color: '#6b7280',
            cursor: 'pointer',
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
          />
          <input
            placeholder="Context (optional)"
            value={eventContext}
            onChange={e => setEventContext(e.target.value)}
          />
          <input
            placeholder="Tone (optional)"
            value={tone}
            onChange={e => setTone(e.target.value)}
          />
          <input
            placeholder="Duration (e.g. 5 minutes)"
            value={duration}
            onChange={e => setDuration(e.target.value)}
          />
          <input
            placeholder="Must include (comma-separated)"
            value={mustInclude}
            onChange={e => setMustInclude(e.target.value)}
          />
          <input
            placeholder="Must avoid (comma-separated)"
            value={mustAvoid}
            onChange={e => setMustAvoid(e.target.value)}
          />
        </div>
      )}

      {/* Error (if any) */}
      {error && <div style={{ marginTop: 10, color: '#b91c1c', fontSize: 13 }}>{error}</div>}

      {/* Output thread: newest version first */}
      {versions.length > 0 && (
        <div style={{ marginTop: 18, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {versions.map((version, idx) => (
            <VersionCard
              key={`${version.index}-${version.createdAt.toISOString()}-${idx}`}
              version={version}
              expanded={idx === 0} // most recent open by default
              onCopy={() => handleCopy(version)}
              onExportPdf={() => handleExportPdf(version)}
              onSpeak={() => handleSpeak(version)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// HTML escape for print fallback
function escapeHtml(s: string) {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
