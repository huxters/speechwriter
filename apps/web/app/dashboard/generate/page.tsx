'use client';

import React, { useMemo, useState } from 'react';

// tiny helper – parse ```json fences safely
function parseOutline(raw: string) {
  const clean = raw.replace(/```json\s*|\s*```/g, '');
  try {
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

type Audience = {
  size: 'small' | 'medium' | 'large';
  familiarity: 'cold' | 'mixed' | 'warm';
  expertise: 'general' | 'technical' | 'executive';
};

type Intake = {
  occasion: string;
  audience: Audience;
  goal: string;
  tone: string[]; // e.g. ['warm','witty']
  mustInclude: string[]; // bullet list
  mustAvoid?: string[];
  timeLimit: number; // minutes
  wpm?: number;
};

export default function GeneratePage(): JSX.Element {
  // simple form state
  const [occasion, setOccasion] = useState('Awards Night');
  const [audienceSize, setAudienceSize] = useState<Audience['size']>('medium');
  const [audienceFam, setAudienceFam] = useState<Audience['familiarity']>('mixed');
  const [audienceExp, setAudienceExp] = useState<Audience['expertise']>('general');
  const [goal, setGoal] = useState('Celebrate the team and cue the CEO.');
  const [tone, setTone] = useState('warm,witty'); // comma-separated
  const [mustInclude, setMustInclude] = useState('thanks to partners; highlight 3 wins'); // ; separated
  const [timeLimit, setTimeLimit] = useState(5);
  const [wpm, setWpm] = useState(140);

  // status + results
  const [status, setStatus] = useState('');
  const [outlineRaw, setOutlineRaw] = useState<string | null>(null);
  const [outline, setOutline] = useState<any>(null);
  const [draft, setDraft] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const wordCount = useMemo(() => (draft ? draft.trim().split(/\s+/).length : 0), [draft]);
  const talkTime = useMemo(() => (wordCount && wpm ? wordCount / wpm : 0), [wordCount, wpm]);

  const intake: Intake = {
    occasion,
    audience: { size: audienceSize, familiarity: audienceFam, expertise: audienceExp },
    goal,
    tone: tone
      .split(',')
      .map(s => s.trim())
      .filter(Boolean),
    mustInclude: mustInclude
      .split(';')
      .map(s => s.trim())
      .filter(Boolean),
    timeLimit,
    wpm,
  };

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    setStatus('Creating outline…');
    setOutline(null);
    setDraft('');

    // 1) outline
    const outlineRes = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'outline', intake }),
    });
    if (!outlineRes.ok) {
      const err = await outlineRes.json().catch(() => ({}));
      setStatus(`Outline error: ${err.error || outlineRes.statusText}`);
      return;
    }
    const outlineJson = await outlineRes.json();
    setOutlineRaw(outlineJson.content ?? '');
    const parsed = parseOutline(outlineJson.content ?? '');
    if (!parsed) {
      setStatus('Could not parse outline JSON. Check prompts or try again.');
      return;
    }
    setOutline(parsed);

    // 2) draft
    setStatus('Creating draft…');
    const draftRes = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ type: 'draft', intake, outline: parsed }),
    });
    if (!draftRes.ok) {
      const err = await draftRes.json().catch(() => ({}));
      setStatus(`Draft error: ${err.error || draftRes.statusText}`);
      return;
    }
    const draftJson = await draftRes.json();
    setDraft(draftJson.content ?? '');
    setStatus('Draft ready.');
  }

  async function handleSave() {
    if (!draft || !outline) return;
    setSaving(true);
    setStatus('Saving…');
    const resp = await fetch('/api/save', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: `${intake.occasion} - ${new Date().toLocaleDateString()}`,
        occasion: intake.occasion,
        intake,
        outline,
        body: draft,
      }),
    });
    setSaving(false);
    if (!resp.ok) {
      const err = await resp.json().catch(() => ({}));
      setStatus(`Save error: ${err.error || resp.statusText}`);
      return;
    }
    const data = await resp.json();
    setStatus(`Saved. Project ${data.projectId}, Draft ${data.draftId}`);
  }

  return (
    <main
      style={{
        padding: '24px',
        maxWidth: 900,
        margin: '0 auto',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      <h1 style={{ fontSize: 28, marginBottom: 16 }}>New Speech</h1>
      <p style={{ color: '#666', marginBottom: 24 }}>
        Fill the intake → Generate outline & draft → Save.
      </p>

      <form
        onSubmit={handleGenerate}
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}
      >
        <label style={{ display: 'grid', gap: 6 }}>
          <span>Occasion</span>
          <input
            value={occasion}
            onChange={e => setOccasion(e.target.value)}
            required
            style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Goal</span>
          <input
            value={goal}
            onChange={e => setGoal(e.target.value)}
            required
            style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Tone (comma separated)</span>
          <input
            value={tone}
            onChange={e => setTone(e.target.value)}
            style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Must include (use “;” between points)</span>
          <input
            value={mustInclude}
            onChange={e => setMustInclude(e.target.value)}
            style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Audience size</span>
          <select
            value={audienceSize}
            onChange={e => setAudienceSize(e.target.value as any)}
            style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }}
          >
            <option value="small">small</option>
            <option value="medium">medium</option>
            <option value="large">large</option>
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Audience familiarity</span>
          <select
            value={audienceFam}
            onChange={e => setAudienceFam(e.target.value as any)}
            style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }}
          >
            <option value="cold">cold</option>
            <option value="mixed">mixed</option>
            <option value="warm">warm</option>
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Audience expertise</span>
          <select
            value={audienceExp}
            onChange={e => setAudienceExp(e.target.value as any)}
            style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }}
          >
            <option value="general">general</option>
            <option value="technical">technical</option>
            <option value="executive">executive</option>
          </select>
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Time limit (minutes)</span>
          <input
            type="number"
            min={1}
            max={60}
            value={timeLimit}
            onChange={e => setTimeLimit(parseInt(e.target.value || '0', 10))}
            style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }}
          />
        </label>

        <label style={{ display: 'grid', gap: 6 }}>
          <span>Words per minute (WPM)</span>
          <input
            type="number"
            min={100}
            max={200}
            value={wpm}
            onChange={e => setWpm(parseInt(e.target.value || '0', 10))}
            style={{ padding: 10, border: '1px solid #ccc', borderRadius: 8 }}
          />
        </label>

        <div style={{ gridColumn: '1 / span 2', display: 'flex', gap: 12 }}>
          <button
            type="submit"
            style={{ padding: '10px 16px', borderRadius: 8, background: '#111', color: '#fff' }}
          >
            Generate
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!draft || !outline || saving}
            style={{
              padding: '10px 16px',
              borderRadius: 8,
              background: saving ? '#aaa' : '#0a7',
              color: '#fff',
            }}
          >
            {saving ? 'Saving…' : 'Save to history'}
          </button>
        </div>
      </form>

      <div style={{ marginBottom: 16, color: '#666' }}>{status}</div>

      {outlineRaw && !outline && (
        <details style={{ marginBottom: 16 }}>
          <summary>Raw outline (unparsed)</summary>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{outlineRaw}</pre>
        </details>
      )}

      {outline && (
        <div
          style={{ padding: 16, border: '1px solid #e5e5e5', borderRadius: 12, marginBottom: 24 }}
        >
          <h3 style={{ margin: 0, marginBottom: 8 }}>Outline</h3>
          <pre style={{ whiteSpace: 'pre-wrap', margin: 0 }}>
            {JSON.stringify(outline, null, 2)}
          </pre>
        </div>
      )}

      {draft && (
        <div style={{ padding: 16, border: '1px solid #e5e5e5', borderRadius: 12 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
              marginBottom: 8,
            }}
          >
            <h3 style={{ margin: 0 }}>Draft</h3>
            <div style={{ color: '#666' }}>
              {wordCount} words • {talkTime.toFixed(1)} min @ {wpm} wpm
            </div>
          </div>
          <textarea
            value={draft}
            onChange={e => setDraft(e.target.value)}
            style={{
              width: '100%',
              minHeight: 240,
              padding: 12,
              border: '1px solid #ccc',
              borderRadius: 8,
              lineHeight: 1.6,
            }}
          />
        </div>
      )}
    </main>
  );
}
