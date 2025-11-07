// apps/web/app/admin/prompts/PromptsEditor.tsx

'use client';

import { useState } from 'react';

type PromptProfile = {
  id: string;
  key: string;
  label: string;
  system_prompt: string;
  user_template: string;
  is_active: boolean;
};

export default function PromptsEditor({
  initialPrompts,
}: {
  initialPrompts: PromptProfile[];
}): JSX.Element {
  const [prompts, setPrompts] = useState<PromptProfile[]>(initialPrompts);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [message, setMessage] = useState<string>('');

  const updateField = (id: string, field: keyof PromptProfile, value: string | boolean) => {
    setPrompts(all => all.map(p => (p.id === id ? { ...p, [field]: value } : p)));
  };

  const handleSave = async (p: PromptProfile) => {
    setSavingId(p.id);
    setMessage('');

    try {
      const res = await fetch('/api/admin/prompts', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(p),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save prompt');
      }

      setMessage('Saved.');
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || 'Error saving prompt');
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section style={{ display: 'grid', gap: 16 }}>
      <h2 style={{ fontSize: 18, margin: 0 }}>Prompt profiles</h2>
      <p
        style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          margin: 0,
          marginBottom: 4,
        }}
      >
        Edit the system and user templates that control how Speechwriter behaves.
      </p>

      {prompts.map(p => (
        <div key={p.id} className="card" style={{ display: 'grid', gap: 8 }}>
          <div
            style={{
              fontSize: 10,
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
            }}
          >
            {p.key}
          </div>

          <input
            value={p.label}
            onChange={e => updateField(p.id, 'label', e.target.value)}
            style={{
              padding: 6,
              fontSize: 13,
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
            }}
          />

          <label style={{ fontSize: 11 }}>System prompt</label>
          <textarea
            value={p.system_prompt}
            onChange={e => updateField(p.id, 'system_prompt', e.target.value)}
            rows={5}
            style={{
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              padding: 8,
              fontSize: 12,
              fontFamily: 'monospace',
            }}
          />

          <label style={{ fontSize: 11 }}>User template</label>
          <textarea
            value={p.user_template}
            onChange={e => updateField(p.id, 'user_template', e.target.value)}
            rows={4}
            style={{
              borderRadius: 8,
              border: '1px solid var(--border-subtle)',
              padding: 8,
              fontSize: 12,
              fontFamily: 'monospace',
            }}
          />

          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              marginTop: 4,
              gap: 8,
            }}
          >
            <button
              onClick={() => handleSave(p)}
              disabled={savingId === p.id}
              className="btn btn-primary"
            >
              {savingId === p.id ? 'Saving…' : 'Save'}
            </button>
          </div>
        </div>
      ))}

      {message && (
        <div
          style={{
            fontSize: 11,
            color: message === 'Saved.' ? 'var(--accent)' : 'var(--text-muted)',
          }}
        >
          {message}
        </div>
      )}
    </section>
  );
}
