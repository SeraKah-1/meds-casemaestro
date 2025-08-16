import { useState } from 'react';

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

  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="border-b bg-white">
        <div className="container-narrow py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <img src="/favicon.svg" alt="logo" className="h-8 w-8" />
            <h1 className="text-lg font-semibold">MEDS CaseMaestro</h1>
          </div>
          <a
            href="https://github.com"
            target="_blank"
            className="text-sm text-slate-600 hover:text-slate-900"
          >
            GitHub
          </a>
        </div>

        {/* Tabs */}
        <nav className="container-narrow -mb-px flex gap-2 overflow-x-auto pb-1">
          {tabs.map(t => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={[
                'px-3 py-2 text-sm rounded-t border-b-2 transition-colors',
                tab === t.key
                  ? 'border-blue-500 text-blue-700 bg-blue-50'
                  : 'border-transparent hover:border-slate-300 hover:bg-slate-50'
              ].join(' ')}
            >
              {t.label}
            </button>
          ))}
        </nav>
      </header>

      {/* Main */}
      <main className="container-narrow py-6">
        {tab === 'case' && <CasePanelPlaceholder />}
        {tab === 'search' && <SearchPanelPlaceholder />}
        {tab === 'notes' && <NotesPanelPlaceholder />}
        {tab === 'diagnose' && <DiagnosePanelPlaceholder />}
        {tab === 'saved' && <SavedPanelPlaceholder />}
      </main>

      {/* Footer */}
      <footer className="container-narrow py-10 text-xs text-slate-500">
        For education only • © {new Date().getFullYear()}
      </footer>
    </div>
  );
}

function Card(props: { title: string; children: React.ReactNode; hint?: string }) {
  return (
    <section className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <h2 className="font-semibold">{props.title}</h2>
        {props.hint && <span className="text-[10px] text-slate-500">{props.hint}</span>}
      </div>
      <div className="mt-3 text-sm text-slate-700">{props.children}</div>
    </section>
  );
}

function CasePanelPlaceholder() {
  return (
    <Card title="Case" hint="Part 3 will render AI case here">
      <p>
        Choose a specialty and start a case. In Part 3 we’ll add the Actions timeline (History /
        Exam / Tests) and reveals. In Part 5, AI-generated cases will appear here.
      </p>
    </Card>
  );
}

function SearchPanelPlaceholder() {
  return (
    <Card title="Search" hint="Embed web search or API">
      <ul className="list-disc pl-5 space-y-1">
        <li>Option A: simple embedded DuckDuckGo Lite (zero server cost).</li>
        <li>
          Option B: call a tiny Netlify function that returns top 5 snippets (needs API key).
        </li>
      </ul>
    </Card>
  );
}

function NotesPanelPlaceholder() {
  return (
    <Card title="Notes" hint="Autosave to localStorage">
      <p>Write your reasoning here. In Part 3 we’ll wire autosave and export.</p>
    </Card>
  );
}

function DiagnosePanelPlaceholder() {
  return (
    <Card title="Diagnose" hint="Local Score & Full Review">
      <p>
        Enter working Dx, differentials, and initial management. Local scoring first; optional AI
        grading later (Part 5).
      </p>
    </Card>
  );
}

function SavedPanelPlaceholder() {
  return (
    <Card title="Saved Cases" hint="Load / Delete / Export">
      <p>We’ll implement the save list and open/export in Part 3–4.</p>
    </Card>
  );
}
