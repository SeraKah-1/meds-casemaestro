import { useMemo } from 'react';
import type { SaveEntry } from '../../types/game';
import { downloadJson, downloadMarkdown } from '../../lib/export';

export function SavedPanel({ items, onDelete }: { items: SaveEntry[]; onDelete: (id: string) => void }) {
  const sorted = useMemo(() => [...items].sort((a, b) => b.created_at - a.created_at), [items]);

  if (!sorted.length) {
    return (
      <section className="bg-white border rounded-lg p-4 shadow-sm">
        <h2 className="font-semibold">Saved Cases</h2>
        <p className="mt-2 text-sm text-slate-600">
          No saved cases yet. Score and save one from the Diagnose tab.
        </p>
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
                {s.specialty} • diff {s.difficulty} •{' '}
                {new Date(s.created_at).toLocaleString()}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 text-xs border rounded"
                onClick={() => downloadJson(s)}
              >
                Download .json
              </button>
              <button
                className="px-2 py-1 text-xs border rounded"
                onClick={() => downloadMarkdown(s)}
              >
                Export .md
              </button>
              <button
                className="px-2 py-1 text-xs border rounded text-red-600"
                onClick={() => onDelete(s.id)}
              >
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
