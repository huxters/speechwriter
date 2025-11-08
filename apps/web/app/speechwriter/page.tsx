'use client';

import React, { useState } from 'react';

type TraceEntry = {
  stage: string;
  message: string;
};

export default function SpeechwriterPage() {
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [finalSpeech, setFinalSpeech] = useState('');
  const [error, setError] = useState('');
  const [trace, setTrace] = useState<TraceEntry[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brief.trim() || loading) return;

    setLoading(true);
    setError('');
    setFinalSpeech('');
    setTrace([]);

    try {
      const res = await fetch('/api/speechwriter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ brief: brief.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Pipeline failed.');
      }

      setFinalSpeech(data.finalSpeech || '');
      setTrace(data.trace || []);
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const charCount = brief.length;
  const overLimit = charCount > 2000;

  return (
    <main className="min-h-screen bg-white text-gray-900">
      <div className="max-w-3xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-semibold mb-3">Speechwriter — MVP Pipeline</h1>

        <p className="mb-6 text-sm text-gray-700">
          Enter a brief below. The system will run:
          <span className="font-semibold"> Planner → Drafter → Judge → Guardrail → Editor</span> and
          return a final speech. The pipeline trace shows what happened at each stage.
        </p>

        <form onSubmit={handleSubmit} className="space-y-3 mb-6">
          <label className="block text-sm font-medium text-gray-800">
            Speech Brief (max 2000 characters)
          </label>
          <textarea
            className={`w-full border rounded-md p-3 text-sm bg-white text-gray-900 focus:outline-none focus:ring-2 ${
              overLimit
                ? 'border-red-500 focus:ring-red-500'
                : 'border-gray-300 focus:ring-gray-900 focus:border-gray-900'
            }`}
            rows={6}
            placeholder="Example: 10-minute opening speech for a leadership offsite about navigating uncertainty, tone: calm, confident, hopeful..."
            value={brief}
            onChange={e => setBrief(e.target.value)}
          />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={loading || !brief.trim() || overLimit}
              className="px-4 py-2 rounded-md border border-gray-900 text-gray-900 text-sm font-medium hover:bg-gray-900 hover:text-white transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Running pipeline...' : 'Generate Speech'}
            </button>
            <span className={`text-xs ${overLimit ? 'text-red-600' : 'text-gray-500'}`}>
              {charCount}/2000 characters
              {overLimit && ' — too long, please shorten.'}
            </span>
          </div>
        </form>

        {loading && (
          <div className="mb-4 text-sm text-gray-800">
            Pipeline running… stepping through each stage.
          </div>
        )}

        {error && <div className="text-red-600 text-sm mb-4">{error}</div>}

        {trace.length > 0 && (
          <section className="mt-4 mb-6">
            <h2 className="text-md font-semibold mb-2">Pipeline Trace</h2>
            <ul className="text-xs leading-relaxed border border-gray-200 rounded-md p-3 bg-gray-50 space-y-1">
              {trace.map((t, idx) => (
                <li key={idx}>
                  <span className="font-semibold mr-1">[{t.stage}]</span>
                  <span>{t.message}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {finalSpeech && (
          <section className="mt-6">
            <h2 className="text-xl font-semibold mb-2">Final Speech</h2>
            <div className="whitespace-pre-wrap text-sm leading-relaxed border border-gray-200 rounded-md p-4 bg-white">
              {finalSpeech}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
