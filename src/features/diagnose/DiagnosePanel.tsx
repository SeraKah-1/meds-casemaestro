import { useState } from 'react';
import type { Submission, ScoreBreakdown } from '../../types/game';

export function DiagnosePanel({
  enabled,
  defaultPicks,
  onLocalScore,
  onSave
}: {
  enabled: boolean;
  defaultPicks: string[];
  onLocalScore: (submission: Submission) => ScoreBreakdown;
  onSave: (submission: Submission, score: ScoreBreakdown) => void;
}) {
  const [dx, setDx] = useState('');
  const [mgmtText, setMgmtText] = useState('');
  const [score, setScore] = useState<ScoreBreakdown | null>(null);

  function toList(text: string) {
    return text
      .split('\n')
      .map((s) => s.trim())
      .filter(Boolean);
  }

  function handleLocalScore() {
    const sub: Submission = { dx, mgmt: toList(mgmtText), picks: defaultPicks };
    const sc = onLocalScore(sub);
    setScore(sc);
  }

  function handleSave() {
    const sub: Submission = { dx, mgmt: toList(mgmtText), picks: defaultPicks };
    const sc = onLocalScore(sub);
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
          onClick={handleSave}
          disabled={!enabled}
          className="px-3 py-2 rounded bg-slate-800 text-white text-sm disabled:opacity-50"
        >
          Save Case
        </button>
      </div>

      {score && (
        <div className="mt-3 p-3 bg-slate-50 border rounded text-sm">
          <div className="font-semibold">Score</div>
          <div className="mt-1 text-slate-700">Local: {score.local} • Total: {score.total}</div>
          <div className="text-[11px] text-slate-500 mt-1">AI “Full Review” will arrive in Part 5.</div>
        </div>
      )}
    </section>
  );
}
