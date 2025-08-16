import { useState } from 'react';
import type { Submission, ScoreBreakdown } from '../../types/game';

export function DiagnosePanel({
  enabled,
  defaultPicks,
  onLocalScore,
  onRemoteReview,
  onSave
}: {
  enabled: boolean;
  defaultPicks: string[];
  onLocalScore: (submission: Submission) => ScoreBreakdown;
  onRemoteReview?: (submission: Submission) => Promise<ScoreBreakdown>;
  onSave: (submission: Submission, score: ScoreBreakdown) => void;
}) {
  const [dx, setDx] = useState('');
  const [mgmtText, setMgmtText] = useState('');
  const [score, setScore] = useState<ScoreBreakdown | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  function toList(text: string) {
    return text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function makeSubmission(): Submission {
    return { dx, mgmt: toList(mgmtText), picks: defaultPicks };
  }

  function handleLocalScore() {
    const sub = makeSubmission();
    const sc = onLocalScore(sub);
    setScore(sc);
    setErr(null);
  }

  async function handleFullReview() {
    if (!onRemoteReview) return;
    setLoadingAI(true);
    setErr(null);
    try {
      const sc = await onRemoteReview(makeSubmission());
      setScore(sc);
    } catch (e: any) {
      setErr('AI review failed. Check Netlify env or usage limits.');
    } finally {
      setLoadingAI(false);
    }
  }

  function handleSave() {
    const sub = makeSubmission();
    const sc = score ?? onLocalScore(sub);
    onSave(sub, sc);
  }

  return (
    <section className="bg-white border rounded-lg p-4 shadow-sm opacity-100">
      <h2 className="font-semibold">Diagnose</h2>
      {!enabled && <p className="mt-2 text-sm text-slate-500">Start a case first.</p>}

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="border rounded p-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">Final Diagnosis</div>
          <input
            className="mt-2 w-full border rounded px-3 py-2 text-sm"
            placeholder="e.g., Inferior STEMI"
            value={dx}
            onChange={(e) => setDx(e.target.value)}
            disabled={!enabled}
          />
          <div className="text-xs text-slate-500 mt-2">Use clear, specific terms.</div>
        </div>

        <div className="border rounded p-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">Initial Management (one per line)</div>
          <textarea
            className="mt-2 w-full h-32 border rounded p-2 text-sm"
            placeholder="- Activate cath lab (PCI)\n- Aspirin 325 mg chew + P2Y12\n- Heparin per protocol"
            value={mgmtText}
            onChange={(e) => setMgmtText(e.target.value)}
            disabled={!enabled}
          />
        </div>
      </div>

      <div className="mt-3 flex items-center gap-2">
        <button
          onClick={handleLocalScore}
          disabled={!enabled}
          className="px-3 py-2 rounded bg-blue-600 text-white text-sm disabled:opacity-50"
        >
          Local Score
        </button>

        <button
          onClick={handleFullReview}
          disabled={!enabled || !onRemoteReview || loadingAI}
          className="px-3 py-2 rounded bg-emerald-700 text-white text-sm disabled:opacity-50"
        >
          {loadingAI ? 'Reviewing…' : 'Full Review (AI)'}
        </button>

        <button
          onClick={handleSave}
          disabled={!enabled}
          className="px-3 py-2 rounded bg-slate-800 text-white text-sm disabled:opacity-50"
        >
          Save Case
        </button>
      </div>

      {err && <div className="mt-3 p-2 text-sm bg-red-50 border border-red-200 text-red-700 rounded">{err}</div>}

      {score && (
        <div className="mt-3 p-3 bg-slate-50 border rounded text-sm">
          <div className="font-semibold">Score</div>
          <div className="mt-1 text-slate-700">Local: {score.local} • Total: {score.total}</div>
          {score.ai_review && (
            <div className="mt-2">
              <div className="font-medium">AI Feedback</div>
              <ul className="mt-1 list-disc pl-5 text-slate-700">
                {(score.ai_review.pros ?? []).map((x, i) => <li key={'p'+i}>✅ {x}</li>)}
                {(score.ai_review.cons ?? []).map((x, i) => <li key={'c'+i}>⚠️ {x}</li>)}
                {(score.ai_review.red_flags ?? []).map((x, i) => <li key={'r'+i}>🚩 {x}</li>)}
              </ul>
            </div>
          )}
          {!score.ai_review && (
            <div className="text-[11px] text-slate-500 mt-1">Tip: use “Full Review (AI)” for tutor feedback.</div>
          )}
        </div>
      )}
    </section>
  );
}
