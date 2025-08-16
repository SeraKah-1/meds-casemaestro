import { useEffect, useMemo, useState } from "react";
import type { CaseFile } from "./types/case";
import type {
  Difficulty,
  Specialty,
  Submission,
  SaveEntry,
  ScoreBreakdown,
} from "./types/game";
import { specialties } from "./lib/specialties";
import { ActionHistory } from "./features/common/ActionHistory";
import { CasePanel } from "./features/case/CasePanel";
import { SearchPanel } from "./features/search/SearchPanel";
import { NotesPanel } from "./features/notes/NotesPanel";
import { DiagnosePanel } from "./features/diagnose/DiagnosePanel";
import { SavedPanel } from "./features/saved/SavedPanel";
import { saveCase, loadCases, deleteCase } from "./lib/save";
import { getCase, localGrade, remoteGrade } from "./lib/api";

type TabKey = "case" | "search" | "notes" | "diagnose" | "saved";

const tabs: { key: TabKey; label: string }[] = [
  { key: "case", label: "Kasus" },
  { key: "search", label: "Cari" },
  { key: "notes", label: "Catatan" },
  { key: "diagnose", label: "Diagnosa" },
  { key: "saved", label: "Tersimpan" },
];

export default function App() {
  const [tab, setTab] = useState<TabKey>("case");
  const [specialty, setSpecialty] = useState<Specialty>("cardiology");
  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const [caseJson, setCaseJson] = useState<CaseFile | null>(null);
  const [picks, setPicks] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>("");
  const [saved, setSaved] = useState<SaveEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [usedFallback, setUsedFallback] = useState(false);

  useEffect(() => {
    setSaved(loadCases());
  }, []);

  useEffect(() => {
    if (!caseJson) return;
    const key = `notes:${caseJson.id}`;
    const existing = localStorage.getItem(key);
    setNotes(existing ?? "");
  }, [caseJson?.id]);

  const canScore = useMemo(
    () => !!caseJson && (picks.length > 0 || notes.trim().length > 0),
    [caseJson, picks, notes]
  );

  async function startCase() {
    setLoading(true);
    setErr(null);
    setUsedFallback(false);
    try {
      const data = await getCase({ specialty, difficulty });
      setCaseJson(data);
      setPicks([]);
      setTab("case");
    } catch (e: any) {
      try {
        const { generateMockCase } = await import("./features/case/mock");
        const mock = generateMockCase(specialty, difficulty);
        setCaseJson(mock);
        setUsedFallback(true);
        setTab("case");
      } catch {
        setErr("Gagal memulai kasus. Coba lagi.");
      }
    } finally {
      setLoading(false);
    }
  }

  function togglePick(actionId: string) {
    setPicks((prev) =>
      prev.includes(actionId)
        ? prev.filter((id) => id !== actionId)
        : [...prev, actionId]
    );
  }

  function doLocalScore(submission: Submission): ScoreBreakdown {
    if (!caseJson) return { total: 0, local: 0 };
    return localGrade(caseJson, submission);
  }

  async function doRemoteReview(submission: Submission): Promise<ScoreBreakdown> {
    if (!caseJson) return { total: 0, local: 0 };
    return remoteGrade(caseJson, submission);
  }

  function onSave(sub: Submission, score: ScoreBreakdown) {
    if (!caseJson) return;
    const entry: SaveEntry = {
      id: `save-${Date.now()}`,
      created_at: Date.now(),
      specialty,
      difficulty,
      caseJson,
      submission: sub,
      score,
      version: "0.3-ui",
    };
    saveCase(entry);
    setSaved(loadCases());
    setTab("saved");
  }

  function onDeleteSave(id: string) {
    deleteCase(id);
    setSaved(loadCases());
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-800">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r flex flex-col shadow-sm">
        <div className="px-6 py-5 border-b">
          <h1 className="text-lg font-serif font-bold text-emerald-700">
            MEDS CaseMaestro
          </h1>
          <p className="text-xs text-slate-500">AI Clinical Training</p>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`w-full text-left px-3 py-2 rounded-md text-sm font-medium transition-colors
              ${
                tab === t.key
                  ? "bg-emerald-100 text-emerald-700"
                  : "text-slate-600 hover:bg-slate-100"
              }`}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <footer className="p-4 text-xs text-slate-400 border-t">
          © {new Date().getFullYear()} Edu Project
        </footer>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {/* Header Controls */}
        <header className="bg-white border-b px-6 py-3 flex items-center gap-4 sticky top-0 z-10">
          <div>
            <label className="block text-xs text-slate-500">Spesialis</label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={specialty}
              onChange={(e) => setSpecialty(e.target.value as Specialty)}
            >
              {specialties.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-slate-500">Kesulitan</label>
            <select
              className="border rounded px-2 py-1 text-sm"
              value={difficulty}
              onChange={(e) => setDifficulty(Number(e.target.value) as any)}
            >
              <option value={1}>1 (mudah)</option>
              <option value={2}>2 (inti)</option>
              <option value={3}>3 (sulit)</option>
            </select>
          </div>
          <button
            onClick={startCase}
            className="ml-auto px-4 py-2 rounded bg-emerald-600 text-white text-sm font-semibold shadow hover:bg-emerald-700 disabled:opacity-50"
            disabled={loading}
          >
            {loading ? "Memulai…" : "Mulai Kasus"}
          </button>
        </header>

        {/* Content */}
        <div className="p-6 space-y-6">
          {err && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded">
              {err}
            </div>
          )}
          {usedFallback && (
            <div className="p-3 bg-amber-50 border border-amber-200 text-amber-800 text-sm rounded">
              AI gagal—sementara menggunakan kasus mock lokal.
            </div>
          )}
          {tab === "case" && (
            <>
              <CasePanel
                caseJson={caseJson}
                picks={picks}
                onTogglePick={togglePick}
                loading={loading}
              />
              <ActionHistory picks={picks} />
            </>
          )}
          {tab === "search" && <SearchPanel />}
          {tab === "notes" && (
            <NotesPanel
              caseId={caseJson?.id}
              notes={notes}
              onChange={setNotes}
            />
          )}
          {tab === "diagnose" && (
            <DiagnosePanel
              enabled={!!caseJson}
              onLocalScore={(sub) => doLocalScore(sub)}
              onRemoteReview={(sub) => doRemoteReview(sub)}
              onSave={(sub, sc) => onSave(sub, sc)}
              defaultPicks={picks}
            />
          )}
          {tab === "saved" && (
            <SavedPanel items={saved} onDelete={onDeleteSave} />
          )}
        </div>
      </main>
    </div>
  );
}
