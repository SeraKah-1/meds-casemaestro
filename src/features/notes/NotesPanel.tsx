import { useEffect, useRef, useState } from 'react';

export function NotesPanel({
  caseId,
  notes,
  onChange
}: {
  caseId?: string;
  notes: string;
  onChange: (v: string) => void;
}) {
  const [local, setLocal] = useState(notes);
  const timer = useRef<number | null>(null);
  const key = caseId ? `notes:${caseId}` : null;

  // sync from parent when case changes
  useEffect(() => setLocal(notes), [notes, caseId]);

  // autosave debounce
  useEffect(() => {
    if (!key) return;
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      localStorage.setItem(key, local);
      onChange(local);
    }, 400);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [local, key]);

  return (
    <section className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold">Notes</h2>
        <span className="text-[10px] text-slate-500">{caseId ? `autosave: ${key}` : 'no case yet'}</span>
      </div>
      <textarea
        className="mt-3 w-full h-[50vh] border rounded p-3 text-sm"
        value={local}
        onChange={(e) => setLocal(e.target.value)}
        placeholder="Reason through Hx/PE findings, list DDx, justify tests..."
      />
      <div className="mt-2 text-[11px] text-slate-500">Autosaves every ~0.4s while typing.</div>
    </section>
  );
}
