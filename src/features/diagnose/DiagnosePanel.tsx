// src/features/diagnose/DiagnosePanel.tsx
import { useMemo, useState } from 'react';
import type { Submission, ScoreBreakdown } from '../../types/game';

function Stars({ value }: { value: number }) {
  // value 0..100 → 1..5 stars (dibulatkan ke terdekat)
  const stars = Math.max(1, Math.min(5, Math.round((value / 100) * 5)));
  return (
    <div className="text-2xl leading-none select-none" aria-label={`${stars} stars`}>
      {'⭐'.repeat(stars)}{'☆'.repeat(5 - stars)}
    </div>
  );
}

export function DiagnosePanel({
  enabled,
  defaultPicks,
  notesGuide,
  onLocalScore,
  onRemoteReview,
  onSave
}: {
  enabled: boolean;
  defaultPicks: string[];
  notesGuide?: string; // <- baru: isi dari tab Catatan
  onLocalScore: (submission: Submission) => ScoreBreakdown;
  onRemoteReview?: (submission: Submission) => Promise<ScoreBreakdown>;
  onSave: (submission: Submission, score: ScoreBreakdown) => void;
}) {
  const [dx, setDx] = useState('');
  const [mgmtText, setMgmtText] = useState('');
  const [score, setScore] = useState<ScoreBreakdown | null>(null);
  const [loadingAI, setLoadingAI] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const fieldsDisabled = !enabled || loadingAI;
  const guideText = useMemo(
    () => (notesGuide?.trim() ? notesGuide : 'Tidak ada catatan. (No notes)'),
    [notesGuide]
  );

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
    } catch {
      setErr('AI review gagal. Cek Netlify env atau batas pemakaian. (AI review failed)');
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
    <section className="card p-4">
      <h2 className="font-semibold">Diagnosis (Diagnosa)</h2>
      {!enabled && <p className="mt-2 text-sm text-slate-500">Mulai kasus dulu. (Start a case first)</p>}

      {/* Guide from Notes */}
      <div className="mt-3 card p-3 border-blue-200 bg-blue-50/60">
        <div className="text-xs uppercase tracking-wide text-blue-700 font-medium">
          Guide from Notes (Panduan dari Catatan)
        </div>
        <pre className="mt-2 whitespace-pre-wrap text-sm text-slate-800">{guideText}</pre>
      </div>

      {/* Form */}
      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="card p-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Final Diagnosis (Diagnosis Akhir)
          </div>
          <input
            className="mt-2 w-full border rounded px-3 py-2 text-sm"
            placeholder="e.g., Inferior STEMI (Infark miokard inferior)"
            value={dx}
            onChange={(e) => setDx(e.target.value)}
            disabled={fieldsDisabled}
            aria-busy={loadingAI}
          />
          <div className="text-xs text-slate-500 mt-2">Use clear, specific terms. (Gunakan istilah jelas & spesifik)</div>
        </div>

        <div className="card p-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Initial Management (Tatalaksana Awal) — one per line
          </div>
          <textarea
            className="mt-2 w-full h-32 border rounded p-2 text-sm"
            placeholder="- Activate cath lab (PCI)\n- Aspirin 325 mg chew + P2Y12\n- Heparin per protocol"
            value={mgmtText}
            onChange={(e) => setMgmtText(e.target.value)}
            disabled={fieldsDisabled}
            aria-busy={loadingAI}
          />
          <div className="text-[11px] text-slate-500 mt-1">Satu tindakan per baris. (One item per line)</div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-3 flex flex-wrap items-center gap-2">
        <button
          onClick={handleLocalScore}
          disabled={!enabled || loadingAI}
          className="btn btn-primary"
        >
          Local Score (Skor Lokal)
        </button>

        <button
          onClick={handleFullReview}
          disabled={!enabled || !onRemoteReview || loadingAI}
          className="btn btn-primary bg-emerald-700 hover:bg-emerald-800"
        >
          {loadingAI ? 'Reviewing…' : 'Full Review (AI)'}
        </button>

        <button
          onClick={handleSave}
          disabled={!enabled || loadingAI}
          className="btn btn-ghost"
        >
          Save (Simpan)
        </button>
      </div>

      {err && (
        <div className="mt-3 p-2 text-sm bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {err}
        </div>
      )}

      {/* Score & Review */}
      {score && (
        <div className="mt-3 p-3 bg-slate-50 border rounded-lg text-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">Score (Skor)</div>
              <div className="mt-1 text-slate-700">
                Local: {score.local} • Total: {score.total}
              </div>
            </div>
            <div className="text-center">
              <div className="text-[11px] text-slate-500 mb-1">Overall Rating (Performa)</div>
              <Stars value={score.ai_review?.score ?? score.total} />
            </div>
          </div>

          {score.ai_review ? (
            <div className="mt-3 grid gap-3 md:grid-cols-3">
              <ReviewList title="Strengths (Yang Baik)" items={score.ai_review.pros} icon="✅" />
              <ReviewList title="Areas to Improve (Perlu Perbaikan)" items={score.ai_review.cons} icon="⚠️" />
              <ReviewList title="Red Flags (Bahaya)" items={score.ai_review.red_flags} icon="🚩" />
            </div>
          ) : (
            <div className="text-[11px] text-slate-500 mt-2">
              Gunakan “Full Review (AI)” untuk feedback konsulen. (Use AI for tutor feedback)
            </div>
          )}
        </div>
      )}
    </section>
  );
}

function ReviewList({
  title,
  items,
  icon
}: {
  title: string;
  items?: string[] | null;
  icon: string;
}) {
  if (!items || items.length === 0) return (
    <div className="card p-3 text-xs text-slate-500">{title}: -</div>
  );
  return (
    <div className="card p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500 mb-1">{title}</div>
      <ul className="list-disc pl-5 space-y-1">
        {items.map((x, i) => (
          <li key={i} className="text-slate-700">
            {icon} {x}
          </li>
        ))}
      </ul>
    </div>
  );
}
