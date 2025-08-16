// src/features/search/SearchPanel.tsx
import { useState } from "react";
import { searchSnippets, summarizeQuery, type WebSnippet } from "../../lib/api";

export function SearchPanel() {
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(false);
  const [snips, setSnips] = useState<WebSnippet[]>([]);
  const [sum, setSum] = useState<{ summary: string; key_points: string[] } | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function run(e?: React.FormEvent) {
    e?.preventDefault();
    const query = q.trim();
    if (!query) return;

    setLoading(true);
    setErr(null);
    setSum(null);
    setSnips([]);

    try {
      const results = await searchSnippets(query);
      setSnips(results);
      const s = await summarizeQuery(query, results);
      setSum(s);
    } catch {
      setErr("Gagal mengambil hasil dari Google. Cek GOOGLE_CSE_KEY/ID.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-4">
      {/* Search bar */}
      <form onSubmit={run} className="bg-white border rounded-xl shadow-sm p-3 flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari guideline/definisi/diagnosis… (contoh: STEMI management 2024 guideline)"
          className="flex-1 px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-emerald-500 outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-60"
        >
          {loading ? "Mencari…" : "Cari"}
        </button>
      </form>

      {/* Summary */}
      <div className="bg-white border rounded-xl shadow-sm p-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-800">Ringkasan (Summary)</h3>
          {!!snips.length && <span className="text-[11px] text-slate-500">{snips.length} sumber</span>}
        </div>

        {!sum && !loading && (
          <p className="text-sm text-slate-500 mt-2">Tulis kueri lalu tekan <b>Cari</b>. Ringkasan akan muncul di sini.</p>
        )}

        {loading && (
          <div className="animate-pulse space-y-2 mt-3">
            <div className="h-3 bg-slate-200 rounded" />
            <div className="h-3 bg-slate-200 rounded w-5/6" />
            <div className="h-3 bg-slate-200 rounded w-2/3" />
          </div>
        )}

        {sum && (
          <div className="mt-3">
            {sum.summary && <p className="text-sm text-slate-700 whitespace-pre-wrap">{sum.summary}</p>}
            {sum.key_points?.length > 0 && (
              <ul className="mt-3 grid md:grid-cols-2 gap-2 text-sm">
                {sum.key_points.map((x, i) => (
                  <li key={i} className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded px-2 py-1">
                    {x}
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {err && <div className="mt-3 text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{err}</div>}
      </div>

      {/* Results */}
      <div className="grid gap-3 md:grid-cols-2">
        {snips.map((s, i) => (
          <a
            key={s.url + i}
            href={s.url}
            target="_blank"
            rel="noreferrer"
            className="block bg-white border rounded-xl shadow-sm p-4 hover:shadow-md transition-shadow"
          >
            <div className="text-sm font-medium text-slate-800 line-clamp-2">{s.title}</div>
            <div className="text-xs text-slate-500 mt-1 line-clamp-3">{s.snippet}</div>
            <div className="text-[11px] text-slate-400 mt-2 break-all">
              {(() => { try { return new URL(s.url).hostname; } catch { return s.url; } })()}
            </div>
          </a>
        ))}

        {!loading && !snips.length && (
          <div className="text-sm text-slate-500">Tidak ada hasil—coba query lain.</div>
        )}
      </div>
    </section>
  );
}

export default SearchPanel;
