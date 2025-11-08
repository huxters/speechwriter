'use client';

import React, { useState, useRef } from 'react';

type TraceEntry = {
  stage: string;
  message: string;
};

export default function DashboardGeneratePage() {
  const [brief, setBrief] = useState('');
  const [loading, setLoading] = useState(false);
  const [finalSpeech, setFinalSpeech] = useState('');
  const [error, setError] = useState('');
  const [trace, setTrace] = useState<TraceEntry[]>([]);
  const [showTrace, setShowTrace] = useState(false);
  const [currentStage, setCurrentStage] = useState<string | null>(null);

  const stageTimersRef = useRef<number[]>([]);

  const clearStageTimers = () => {
    stageTimersRef.current.forEach(id => window.clearTimeout(id));
    stageTimersRef.current = [];
  };

  const startStageProgress = () => {
    clearStageTimers();
    setCurrentStage('Planner');

    const timers: number[] = [];
    // These are UX hints, not strict guarantees; they mirror our pipeline order.
    timers.push(window.setTimeout(() => setCurrentStage('Drafter'), 700));
    timers.push(window.setTimeout(() => setCurrentStage('Judge'), 1400));
    timers.push(window.setTimeout(() => setCurrentStage('Guardrail'), 2100));
    timers.push(window.setTimeout(() => setCurrentStage('Editor'), 2800));

    stageTimersRef.current = timers;
  };

  const resetStageProgress = () => {
    clearStageTimers();
    setCurrentStage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!brief.trim() || loading) return;

    setLoading(true);
    setError('');
    setFinalSpeech('');
    setTrace([]);
    setShowTrace(false);
    resetStageProgress();
    startStageProgress();

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
      resetStageProgress();
    }
  };

  const charCount = brief.length;
  const overLimit = charCount > 2000;

  return (
    <main className="min-h-screen bg-[#020817] text-gray-50">
      <div className="max-w-4xl mx-auto py-10 px-4">
        {/* Page Header */}
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
            Dashboard / New Speech
          </p>
          <h1 className="text-3xl font-semibold mt-1">New Speech</h1>
          <p className="text-sm text-gray-400 mt-2 max-w-2xl">
            Paste a clear brief below. We&apos;ll run it through the full pipeline —
            <span className="font-medium text-gray-200">
              {' '}
              Planner → Drafter → Judge → Guardrail → Editor{' '}
            </span>
            — and return a final, spoken-ready draft.
          </p>
        </header>

        {/* Form */}
        <section className="mb-8">
          <form onSubmit={handleSubmit} className="space-y-3">
            <label className="block text-sm font-medium text-gray-200">
              Speech Brief (max 2000 characters)
            </label>
            <textarea
              className={`w-full rounded-xl bg-[#050816] text-gray-100 text-sm border p-3 focus:outline-none focus:ring-2 transition ${
                overLimit
                  ? 'border-red-500 focus:ring-red-500'
                  : 'border-gray-700 focus:border-gray-400 focus:ring-gray-500'
              }`}
              rows={8}
              placeholder="Example: 10-minute opening for our global leadership offsite in March. Audience: 120 senior leaders. Tone: calm, confident, candid, no clichés. Themes: uncertainty, responsibility, long-term conviction..."
              value={brief}
              onChange={e => setBrief(e.target.value)}
            />
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={loading || !brief.trim() || overLimit}
                className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-900 bg-gray-50 hover:bg-white hover:text-black transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Running pipeline...' : 'Generate Speech'}
              </button>
              <span className={`text-xs ${overLimit ? 'text-red-400' : 'text-gray-400'}`}>
                {charCount}/2000 characters
                {overLimit && ' — too long, please shorten.'}
              </span>
              {trace.length > 0 && (
                <button
                  type="button"
                  onClick={() => setShowTrace(v => !v)}
                  className="ml-auto text-[10px] px-2 py-1 rounded border border-gray-600 text-gray-300 hover:bg-gray-800 transition"
                >
                  {showTrace ? 'Hide debug trace' : 'Show debug trace'}
                </button>
              )}
            </div>
          </form>

          {/* Live stage indicator */}
          {loading && (
            <div className="mt-3 text-xs text-gray-300">
              Pipeline running
              {currentStage ? ` — current stage: ${currentStage}` : '… initialising'}.
            </div>
          )}

          {error && <div className="mt-3 text-xs text-red-400">{error}</div>}
        </section>

        {/* Debug Trace (collapsible) */}
        {showTrace && trace.length > 0 && (
          <section className="mb-8">
            <h2 className="text-xs font-semibold text-gray-300 mb-2">Pipeline Trace (internal)</h2>
            <ul className="text-[10px] leading-relaxed border border-gray-800 rounded-xl p-3 bg-[#020314] space-y-1">
              {trace.map((t, idx) => (
                <li key={idx}>
                  <span className="font-semibold text-gray-300 mr-1">[{t.stage}]</span>
                  <span className="text-gray-400">{t.message}</span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {/* Final Speech */}
        {finalSpeech && (
          <section className="mb-4">
            <h2 className="text-lg font-semibold text-gray-50 mb-2">Final Speech</h2>
            <div className="whitespace-pre-wrap text-sm leading-relaxed bg-[#020314] border border-gray-800 rounded-2xl p-4 text-gray-100">
              {finalSpeech}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
