'use client';

import React, { useState, useRef } from 'react';

type TraceEntry = {
  stage: string;
  message: string;
};

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
        body: JSON.stringify({
          brief: brief.trim(),
          audience: audience.trim() || undefined,
          eventContext: eventContext.trim() || undefined,
          tone: tone.trim() || undefined,
          duration: duration.trim() || undefined,
          keyPoints: keyPoints.trim() || undefined,
          redLines: redLines.trim() || undefined,
        }),
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
      <div className="max-w-5xl mx-auto py-10 px-4">
        {/* Header */}
        <header className="mb-8">
          <p className="text-xs uppercase tracking-[0.18em] text-gray-400">
            Dashboard / New Speech
          </p>
          <h1 className="text-3xl font-semibold mt-1">New Speech</h1>
          <p className="text-sm text-gray-400 mt-2 max-w-3xl">
            Define the speech clearly. We&apos;ll run your inputs through{' '}
            <span className="font-medium text-gray-200">
              Planner → Drafter → Judge → Guardrail → Editor
            </span>{' '}
            and return a final spoken-ready draft. Use the fields to constrain the system like a
            world-class speech team.
          </p>
        </header>

        {/* Form Card */}
        <section className="mb-8">
          <div className="bg-[#050816] border border-gray-800 rounded-2xl p-5 shadow-sm">
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Core Brief */}
              <div>
                <label className="block text-sm font-medium text-gray-200 mb-1">
                  Core Brief <span className="text-gray-500">(max 2000 characters)</span>
                </label>
                <textarea
                  className={`w-full rounded-xl bg-[#020817] text-gray-100 text-sm border p-3 focus:outline-none focus:ring-2 transition ${
                    overLimit
                      ? 'border-red-500 focus:ring-red-500'
                      : 'border-gray-700 focus:border-gray-500 focus:ring-gray-500'
                  }`}
                  rows={4}
                  placeholder="What is this speech for? What outcome do you want? One clear paragraph."
                  value={brief}
                  onChange={e => setBrief(e.target.value)}
                />
                <div className={`mt-1 text-xs ${overLimit ? 'text-red-400' : 'text-gray-400'}`}>
                  {charCount}/2000 characters
                  {overLimit && ' — too long, please shorten.'}
                </div>
              </div>

              {/* Row: Audience / Context */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">Audience</label>
                  <input
                    className="w-full rounded-lg bg-[#020817] text-gray-100 text-xs border border-gray-700 p-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="e.g. 300 team members, mixed functions, know the speaker well"
                    value={audience}
                    onChange={e => setAudience(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Event / Moment Context
                  </label>
                  <input
                    className="w-full rounded-lg bg-[#020817] text-gray-100 text-xs border border-gray-700 p-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="e.g. year-end review + bonus announcement"
                    value={eventContext}
                    onChange={e => setEventContext(e.target.value)}
                  />
                </div>
              </div>

              {/* Row: Tone / Duration */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Tone / Style
                  </label>
                  <input
                    className="w-full rounded-lg bg-[#020817] text-gray-100 text-xs border border-gray-700 p-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="e.g. positive, grateful, specific, no clichés"
                    value={tone}
                    onChange={e => setTone(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Target Duration / Length
                  </label>
                  <input
                    className="w-full rounded-lg bg-[#020817] text-gray-100 text-xs border border-gray-700 p-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    placeholder="e.g. 5 minutes, ~750 words"
                    value={duration}
                    onChange={e => setDuration(e.target.value)}
                  />
                </div>
              </div>

              {/* Must Include / Must Avoid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Must-Include Points
                  </label>
                  <textarea
                    className="w-full rounded-lg bg-[#020817] text-gray-100 text-xs border border-gray-700 p-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    rows={3}
                    placeholder="Bullets or sentences: key themes, proof points, thanks, announcements."
                    value={keyPoints}
                    onChange={e => setKeyPoints(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-300 mb-1">
                    Red Lines / Must-Avoid
                  </label>
                  <textarea
                    className="w-full rounded-lg bg-[#020817] text-gray-100 text-xs border border-gray-700 p-2 focus:outline-none focus:ring-2 focus:ring-gray-500"
                    rows={3}
                    placeholder='e.g. Do not mention specific numbers; avoid "family" language; no over-promising.'
                    value={redLines}
                    onChange={e => setRedLines(e.target.value)}
                  />
                </div>
              </div>

              {/* Actions + Status */}
              <div className="flex items-center gap-3 pt-1">
                <button
                  type="submit"
                  disabled={loading || !brief.trim() || overLimit}
                  className="inline-flex items-center px-4 py-2 rounded-lg text-sm font-medium border border-gray-300 text-gray-900 bg-gray-50 hover:bg-white hover:text-black transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {loading ? 'Running pipeline...' : 'Generate Speech'}
                </button>

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

              {loading && (
                <div className="mt-2 text-xs text-gray-300">
                  Pipeline running
                  {currentStage ? ` — current stage: ${currentStage}` : '… initialising'}.
                </div>
              )}

              {error && <div className="mt-2 text-xs text-red-400">{error}</div>}
            </form>
          </div>
        </section>

        {/* Debug Trace */}
        {showTrace && trace.length > 0 && (
          <section className="mb-6">
            <h2 className="text-xs font-semibold text-gray-300 mb-2">Pipeline Trace (internal)</h2>
            <ul className="text-[10px] leading-relaxed border border-gray-800 rounded-2xl p-3 bg-[#020314] space-y-1">
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
          <section>
            <h2 className="text-lg font-semibold text-gray-50 mb-2">Final Speech</h2>
            <div className="whitespace-pre-wrap text-sm leading-relaxed bg-[#050816] border border-gray-800 rounded-2xl p-4 text-gray-100">
              {finalSpeech}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
