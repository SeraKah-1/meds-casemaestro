import { useMemo } from 'react';
import type { SaveEntry } from '../../types/game';

export function SavedPanel({ items, onDelete }: { items: SaveEntry[]; onDelete: (id: string) => void }) {
  const sorted = useMemo(() => [...items].sort((a, b) => b.created_at - a.created_at), [items]);

  if (!sorted.length) {
    return (
      <section className="bg-white border rounded-lg p-4 shadow-sm">
        <h2 className="font-semibold">Saved Cases</h2>
        <p className="mt-2 text-sm text-slate-600">No saved cases yet. Score and save one from the Diagnose tab.</p>
      </section>
    );
  }

  return (
    <section className="bg-white border rounded-lg p-4 shadow-sm">
      <h2 className="font-semibold">Saved Cases</h2>
      <ul className="mt-3 divide-y">
        {sorted.map((s) => (
          <li key={s.id} className="py-3 flex items-center justify-between gap-3">
            <div className="text-sm">
              <div className="font-medium">{s.caseJson.meta.title}</div>
              <div className="text-xs text-slate-500">
                {s.specialty} • diff {s.difficulty} • {new Date(s.created_at).toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button className="px-2 py-1 text-xs border rounded" onClick={() => downloadJson(s)}>
                Download .json
              </button>
              <button className="px-2 py-1 text-xs border rounded" onClick={() => downloadMarkdown(s)}>
                Export .md
              </button>
              <button className="px-2 py-1 text-xs border rounded text-red-600" onClick={() => onDelete(s.id)}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function downloadJson(s: SaveEntry) {
  const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  trigger(url, `${s.caseJson.id}.json`);
}

function downloadMarkdown(s: SaveEntry) {
  const lines = [
    `# ${s.caseJson.meta.title}`,
    '',
    `**Specialty:** ${s.specialty}  `,
    `**Difficulty:** ${s.difficulty}  `,
    `**Saved at:** ${new Date(s.created_at).toLocaleString()}`,
    '',
    '## Final Diagnosis',
    s.submission?.dx ?? '-',
    '',
    '## Initial Management',
    ...(s.submission?.mgmt ?? ['-']).map((x) => `- ${x}`),
    '',
    '## Actions Taken',
    ...(s.submission?.picks ?? ['-']).map((x) => `- ${x}`)
  ].join('\n');
  const blob = new Blob([lines], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  trigger(url, `${s.caseJson.id}.md`);
}

function trigger(url: string, name: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
