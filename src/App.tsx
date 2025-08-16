import { useEffect, useMemo, useState } from 'react';
import type { CaseFile } from './types/case';
import type { Difficulty, Specialty, Submission, SaveEntry, ScoreBreakdown } from './types/game';
import { specialties } from './lib/specialties';
import { generateMockCase } from './features/case/mock';
import { ActionHistory } from './features/common/ActionHistory';
import { CasePanel } from './features/case/CasePanel';
import { SearchPanel } from './features/search/SearchPanel';
import { NotesPanel } from './features/notes/NotesPanel';
import { DiagnosePanel } from './features/diagnose/DiagnosePanel';
import { SavedPanel } from './features/saved/SavedPanel';
import { scoreLocal } from './lib/scoring';
import { saveCase, loadCases, deleteCase } from './lib/save';

type TabKey = 'case' | 'search' | 'notes' | 'diagnose' | 'saved';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'case', label: 'Case' },
  { key: 'search', label: 'Search' },
  { key: 'notes', label: 'Notes' },
  { key: 'diagnose', label: 'Diagnose' },
  { key: 'saved', label: 'Saved' }
];

export default function App() {
  const [tab, setTab] = useState<TabKey>('case');
  const [specialty, setSpecialty] = useState<Specialty>('cardiology');
  const [difficulty, setDifficulty] = useState<Difficulty>(2);
  const [caseJson, setCaseJson] = useState<CaseFile | null>(null);
  const [picks, setPicks] = useState<string[]>([]);
  const [notes, setNotes] = useState<string>('');
  const [saved, setSaved] = useState<SaveEntry[]>([]);

  useEffect(() => {
    setSaved(loadCases());
  }, []);

  // Load notes per-case
  useEffect(() => {
    if (!caseJson) return;
    const key = `notes:${caseJson.id}`;
    const existing = localStorage.getItem(key);
    setNotes(existing ?? '');
  }, [caseJson?.id]);

  const canScore = useMemo(() => !!caseJson && (picks.length > 0 || notes.trim().length > 0), [caseJson, picks, notes]);

  function startCase() {
    const data = generateMockCase(specialty, difficulty);
    setCaseJson(data);
    setPicks([]);
    setTab('case');
  }

  function togglePick(actionId: string) {
    setPicks((prev) => (prev.includes(actionId) ? prev.filter((id) => id !== actionId) : [...prev, actionId]));
  }

  function doLocalScore(submission: Submission): ScoreBreakdown {
    if (!caseJson) return { total: 0, local: 0 };
    const local = scoreLocal(submission.picks, caseJson, submission.dx, submission.mgmt);
    return { total: local, local };
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
      version: '0.1'
    };
    saveCase(entry);
    setSaved(loadCases());
    setTab('saved');
  }

  function onDeleteSave(id: string) {
    deleteCase(id);
    setSaved(loadCases());
  }

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container-narrow py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="logo" className="h-8 w-8" />
            <h1 className="text-lg font-semibold">MEDS CaseMaestro</h1>
          </div>
          <a href="https://github.com" target="_blank" className="text-sm text-slate-600 hover:text-slate-900">
            GitHub
          </a>
        </div>

        {/* Controls */}
        <div className="container-narrow flex flex-wrap items-center gap-2 pb-3">
          <label className="text-xs text-slate-600">Specialty</label>
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

          <label className="text-xs text-slate-600 ml-3">Difficulty</label>
          <select
            className="border rounded px-2 py-1 text-sm"
            value={difficulty}
            onChange={(e) => setDifficulty(Number(e.target.value) as any)}
          >
            <option value={1}>1 (easy)</option>
            <option value={2}>2 (core)</option>
            <option value={3}>3 (hard)</option>
          </select>

          <button onClick={startCase} className="ml-3 px-3 py-1.5 rounded bg-blue-600 text-white text-sm">
            Start Case
          </button>
        </div>

        {/* Tabs */}
        <nav className="container-narrow -mb-px flex gap-2 overflow-x-auto pb-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                'px-3 py-2 text-sm rounded-t border-b-2 transition-colors',
                tab === t.key ? 'border-blue-500 text-blue-700 bg-blue-50' : 'border-transparent hover:border-slate-300 hover:bg-slate-50'
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main */}
      <main className="container-narrow py-6 space-y-6">
        {tab === 'case' && (
          <>
            <CasePanel caseJson={caseJson} picks={picks} onTogglePick={togglePick} />
            <ActionHistory picks={picks} />
          </>
        )}
        {tab === 'search' && <SearchPanel />}
        {tab === 'notes' && <NotesPanel caseId={caseJson?.id} notes={notes} onChange={setNotes} />}
        {tab === 'diagnose' && (
          <DiagnosePanel
            enabled={!!caseJson}
            onLocalScore={(sub) => doLocalScore(sub)}
            onSave={(sub, sc) => onSave(sub, sc)}
            defaultPicks={picks}
          />
        )}
        {tab === 'saved' && <SavedPanel items={saved} onDelete={onDeleteSave} />}
      </main>

      {/* Footer */}
      <footer className="container-narrow py-10 text-xs text-slate-500">For education only • © {new Date().getFullYear()}</footer>
    </div>
  );
}
