import { useEffect, useState } from 'react';
import { FEATURE } from '../../lib/constants';
import { searchSnippets, type WebSnippet } from '../../lib/api';

export function SearchPanel() {
  const [q, setQ] = useState('STEMI initial management');
  const [snips, setSnips] = useState<WebSnippet[]>([]);
  const [loading, setLoading] = useState(false);

  const url = 'https://duckduckgo.com/?kp=1&kz=-1&k1=-1&q=' + encodeURIComponent(q);

  useEffect(() => {
    let alive = true;
    (async () => {
      if (!FEATURE.enableApiSearch) return;
      setLoading(true);
      try {
        const res = await searchSnippets(q);
        if (alive) setSnips(res);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [q]);

  return (
    <section className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search terminology or guidelines..."
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <a className="px-3 py-2 rounded bg-slate-800 text-white text-sm" href={url} target="_blank" rel="noreferrer">
          Open
        </a>
      </div>

      {FEATURE.enableApiSearch && (
        <div className="mt-3">
          <div className="text-xs uppercase tracking-wide text-slate-500">Top results</div>
          {loading && <div className="text-xs text-slate-500 mt-1">Loading…</div>}
          {!loading && snips.length > 0 && (
            <ul className="mt-1 space-y-2">
              {snips.map((s, i) => (
                <li key={i} className="border rounded p-2">
                  <a className="text-sm font-medium text-blue-700" href={s.url} target="_blank" rel="noreferrer">
                    {s.title}
                  </a>
                  <div className="text-xs text-slate-600 mt-1">{s.snippet}</div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <div className="mt-3 h-[60vh]">
        <iframe title="websearch" className="w-full h-full border rounded" src={url} loading="lazy" />
      </div>
      <p className="mt-2 text-[11px] text-slate-500">Use Search to justify your choices. Iframe uses DuckDuckGo Lite.</p>
    </section>
  );
}
