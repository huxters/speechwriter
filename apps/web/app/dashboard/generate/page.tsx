'use client';

import React, { useMemo, useState } from 'react';

// Types
type AudienceSize = 'small' | 'medium' | 'large';
type AudienceFamiliarity = 'cold' | 'mixed' | 'warm';
type AudienceExpertise = 'general' | 'technical' | 'executive';

type Audience = {
  size: AudienceSize;
  familiarity: AudienceFamiliarity;
  expertise: AudienceExpertise;
};

type Intake = {
  occasion: string;
  audience: Audience;
  goal: string;
  tone: string[];
  mustInclude: string[];
  mustAvoid?: string[];
  timeLimit: number;
  wpm?: number;
};

// Tone options (cleaner than a giant button wall)
const TONE_OPTIONS = [
  'Formal',
  'Warm',
  'Light-touch humour',
  'Punchy',
  'Gravitas',
  'Conversational',
] as const;

// Helper: parse outline JSON that may be wrapped in ```json fences
function parseOutline(raw: string) {
  if (!raw) return null;
  const clean = raw.replace(/```json\s*|\s*```/gi, '');
  try {
    return JSON.parse(clean);
  } catch {
    return null;
  }
}

export default function GeneratePage(): JSX.Element {
  // Intake state
  const [occasion, setOccasion] = useState('Awards Night');
  const [goal, setGoal] = useState('Celebrate the team and cue the CEO.');
  const [audienceSize, setAudienceSize] = useState<AudienceSize>('medium');
  const [audienceFam, setAudienceFam] = useState<AudienceFamiliarity>('mixed');
  const [audienceExp, setAudienceExp] = useState<AudienceExpertise>('general');
  const [selectedTones, setSelectedTones] = useState<string[]>(['Warm']);
  const [mustInclude, setMustInclude] = useState('Thanks to partners; Highlight 3 key wins');
  const [mustAvoid, setMustAvoid] = useState('');
  const [timeLimit, setTimeLimit] = useState(5);
  const [wpm, setWpm] = useState(140);

  // Generation state
  const [status, setStatus] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [outline, setOutline] = useState<any | null>(null);
  const [outlineRaw, setOutlineRaw] = useState<string | null>(null);
  const [draft, setDraft] = useState<string>('');
  const [saving, setSaving] = useState(false);

  const intake: Intake = {
    occasion: occasion.trim(),
    goal: goal.trim(),
    audience: {
      size: audienceSize,
      familiarity: audienceFam,
      expertise: audienceExp,
    },
    tone: selectedTones,
    mustInclude: mustInclude
      .split(';')
      .map(s => s.trim())
      .filter(Boolean),
    mustAvoid:
      mustAvoid
        .split(';')
        .map(s => s.trim())
        .filter(Boolean) || [],
    timeLimit,
    wpm,
  };

  const wordCount = useMemo(() => (draft ? draft.trim().split(/\s+/).length : 0), [draft]);
  const estMinutes = useMemo(() => (draft && wpm ? wordCount / wpm : 0), [draft, wpm, wordCount]);

  function toggleTone(tone: string) {
    setSelectedTones(prev =>
      prev.includes(tone) ? prev.filter(t => t !== tone) : [...prev, tone]
    );
  }

  async function handleGenerate(e: React.FormEvent) {
    e.preventDefault();
    if (!intake.occasion || !intake.goal || intake.mustInclude.length === 0) {
      setStatus('Please fill occasion, goal, and at least one "must include" point.');
      return;
    }

    setLoading(true);
    setStatus('Creating outline…');
    setOutline(null);
    setOutlineRaw(null);
    setDraft('');

    try {
      // 1) Outline
      const outlineRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'outline', intake }),
      });

      if (!outlineRes.ok) {
        const err = await outlineRes.json().catch(() => ({}));
        throw new Error(err.error || `Outline failed (${outlineRes.status})`);
      }

      const outlineJson = await outlineRes.json();
      const raw = outlineJson.content ?? '';
      const parsed = parseOutline(raw);

      setOutlineRaw(raw);
      if (!parsed) {
        throw new Error('Could not parse outline JSON from model.');
      }
      setOutline(parsed);

      // 2) Draft
      setStatus('Creating draft…');
      const draftRes = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'draft', intake, outline: parsed }),
      });

      if (!draftRes.ok) {
        const err = await draftRes.json().catch(() => ({}));
        throw new Error(err.error || `Draft failed (${draftRes.status})`);
      }

      const draftJson = await draftRes.json();
      const body = draftJson.content ?? '';

      if (!body) {
        throw new Error('Draft came back empty.');
      }

      setDraft(body);
      setStatus('Draft ready. You can edit and then save.');
    } catch (err: any) {
      console.error(err);
      setStatus(err.message || 'Something went wrong while generating.');
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!draft || !outline) {
      setStatus('No draft to save yet.');
      return;
    }
    setSaving(true);
    setStatus('Saving to your workspace…');

    try {
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

      if (!resp.ok) {
        const err = await resp.json().catch(() => ({}));
        throw new Error(err.error || `Save failed (${resp.status})`);
      }

      const data = await resp.json();
      setStatus(`Saved. Project ${data.projectId}, Draft ${data.draftId}.`);
    } catch (err: any) {
      console.error(err);
      setStatus(err.message || 'Could not save draft.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <main
      style={{
        maxWidth: 1200,
        margin: '0 auto',
        padding: '24px 24px 40px',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 1.8fr)',
        gap: 24,
      }}
    >
      {/* LEFT: Intake */}
      <section className="card" style={{ alignSelf: 'flex-start' }}>
        <h1 style={{ fontSize: 22, margin: 0, marginBottom: 8 }}>New Speech</h1>
        <p className="text-muted" style={{ marginTop: 0, marginBottom: 20 }}>
          Define the brief. We’ll generate an outline and a full draft you can refine.
        </p>

        <form
          onSubmit={handleGenerate}
          style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
        >
          <label style={{ fontSize: 12 }}>
            Occasion
            <input
              value={occasion}
              onChange={e => setOccasion(e.target.value)}
              required
              style={inputStyle}
            />
          </label>

          <label style={{ fontSize: 12 }}>
            Goal (one or two sentences)
            <textarea
              value={goal}
              onChange={e => setGoal(e.target.value)}
              required
              style={{ ...inputStyle, minHeight: 60, resize: 'vertical' }}
            />
          </label>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 8,
              fontSize: 12,
            }}
          >
            <label>
              Audience size
              <select
                value={audienceSize}
                onChange={e => setAudienceSize(e.target.value as AudienceSize)}
                style={inputStyle}
              >
                <option value="small">Small</option>
                <option value="medium">Medium</option>
                <option value="large">Large</option>
              </select>
            </label>

            <label>
              Familiarity
              <select
                value={audienceFam}
                onChange={e => setAudienceFam(e.target.value as AudienceFamiliarity)}
                style={inputStyle}
              >
                <option value="cold">Cold</option>
                <option value="mixed">Mixed</option>
                <option value="warm">Warm</option>
              </select>
            </label>

            <label>
              Expertise
              <select
                value={audienceExp}
                onChange={e => setAudienceExp(e.target.value as AudienceExpertise)}
                style={inputStyle}
              >
                <option value="general">General</option>
                <option value="technical">Technical</option>
                <option value="executive">Executive</option>
              </select>
            </label>
          </div>

          {/* Tone selector */}
          <div style={{ fontSize: 12 }}>
            <div style={{ marginBottom: 4 }}>Tone (toggle to apply)</div>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: 6,
              }}
            >
              {TONE_OPTIONS.map(tone => {
                const active = selectedTones.includes(tone);
                return (
                  <button
                    key={tone}
                    type="button"
                    onClick={() => toggleTone(tone)}
                    style={{
                      padding: '5px 10px',
                      borderRadius: 999,
                      border: active ? '1px solid var(--accent)' : '1px solid var(--border-subtle)',
                      backgroundColor: active ? 'var(--accent-soft)' : 'transparent',
                      color: active ? 'var(--accent)' : 'var(--text-muted)',
                      fontSize: 11,
                      cursor: 'pointer',
                    }}
                  >
                    {tone}
                  </button>
                );
              })}
            </div>
          </div>

          <label style={{ fontSize: 12 }}>
            Must include (use <code>;</code> to separate points)
            <input
              value={mustInclude}
              onChange={e => setMustInclude(e.target.value)}
              style={inputStyle}
            />
          </label>

          <label style={{ fontSize: 12 }}>
            Must avoid (optional, use <code>;</code> to separate)
            <input
              value={mustAvoid}
              onChange={e => setMustAvoid(e.target.value)}
              style={inputStyle}
            />
          </label>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 8,
              fontSize: 12,
            }}
          >
            <label>
              Time limit (minutes)
              <input
                type="number"
                min={1}
                max={60}
                value={timeLimit}
                onChange={e => setTimeLimit(parseInt(e.target.value || '0', 10))}
                style={inputStyle}
              />
            </label>

            <label>
              Words per minute
              <input
                type="number"
                min={100}
                max={220}
                value={wpm}
                onChange={e => setWpm(parseInt(e.target.value || '0', 10))}
                style={inputStyle}
              />
            </label>
          </div>

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Working…' : 'Generate outline & draft'}
            </button>
            <button
              type="button"
              className="btn btn-outline"
              onClick={handleSave}
              disabled={!draft || !outline || saving}
            >
              {saving ? 'Saving…' : 'Save to history'}
            </button>
          </div>

          <div className="text-muted" style={{ marginTop: 8, fontSize: 11, minHeight: 16 }}>
            {status}
          </div>
        </form>
      </section>

      {/* RIGHT: Output */}
      <section
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 16,
        }}
      >
        <div className="card" style={{ minHeight: 120 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <h2
              style={{
                fontSize: 15,
                margin: 0,
                color: '#e5e7eb',
              }}
            >
              Outline
            </h2>
            {outline && (
              <span
                style={{
                  fontSize: 10,
                  padding: '2px 8px',
                  borderRadius: 999,
                  backgroundColor: 'var(--accent-soft)',
                  color: 'var(--accent)',
                }}
              >
                Structured
              </span>
            )}
          </div>
          {outline ? (
            <pre
              style={{
                margin: 0,
                fontSize: 11,
                whiteSpace: 'pre-wrap',
                color: 'var(--text-muted)',
              }}
            >
              {JSON.stringify(outline, null, 2)}
            </pre>
          ) : (
            <p className="text-muted" style={{ fontSize: 11, margin: 0 }}>
              Generate to see a structured outline here.
            </p>
          )}
          {outlineRaw && !outline && (
            <details style={{ marginTop: 8 }}>
              <summary style={{ fontSize: 10 }}>View raw model output</summary>
              <pre
                style={{
                  fontSize: 10,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {outlineRaw}
              </pre>
            </details>
          )}
        </div>

        <div className="card" style={{ flex: 1, minHeight: 240 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 6,
            }}
          >
            <h2
              style={{
                fontSize: 15,
                margin: 0,
              }}
            >
              Draft
            </h2>
            {draft && (
              <div
                style={{
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  display: 'flex',
                  gap: 6,
                }}
              >
                <span>{wordCount} words</span>
                <span>•</span>
                <span>
                  ~{estMinutes.toFixed(1)} min @ {wpm} wpm
                </span>
              </div>
            )}
          </div>
          {draft ? (
            <textarea
              value={draft}
              onChange={e => setDraft(e.target.value)}
              style={{
                width: '100%',
                height: '100%',
                minHeight: 220,
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                backgroundColor: 'rgba(9,9,15,0.92)',
                color: 'var(--text-main)',
                padding: 12,
                fontSize: 12,
                lineHeight: 1.6,
                resize: 'vertical',
              }}
            />
          ) : (
            <p className="text-muted" style={{ fontSize: 11, margin: 0 }}>
              Generate to see a full speech draft here, then edit freely before saving.
            </p>
          )}
        </div>
      </section>
    </main>
  );
}

const inputStyle: React.CSSProperties = {
  marginTop: 4,
  width: '100%',
  padding: '8px 10px',
  borderRadius: 10,
  border: '1px solid var(--border-subtle)',
  backgroundColor: 'rgba(4,7,18,0.96)',
  color: 'var(--text-main)',
  fontSize: 12,
  outline: 'none',
};
