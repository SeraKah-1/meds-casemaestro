// src/features/search/SearchPanel.tsx
import { useEffect, useMemo, useRef, useState } from 'react';
import { searchSnippets, type WebSnippet } from '../../lib/api';

type TabMode = 'snippets' | 'web';

const QUICK_TERMS = [
  'STEMI initial management',
  'Sepsis bundle 1-hour',
  'CURB-65 pneumonia',
  'PE WellS score',
  'DKA protocol adult',
  'ACS guideline AHA'
];

export function SearchPanel() {
  const [q, setQ] = useState('STEMI initial management');
  const [mode, setMode] = useState<TabMode>('snippets');
  const [results, setResults] = useState<WebSnippet[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedUrl, setSelectedUrl] = useState<string | null>(null);

  const debounceTimer = useRef<number | null>(null);

  // URL untuk pratinjau web (tanpa keluar app)
  const googleUrl = useMemo(() => {
    const base = 'https://www.google.com/search';
    const params = new URLSearchParams({ q, igu: '1' }); // igu=1 untuk embed-friendly
    return `${base}?${params.toString()}`;
  }, [q]);

  // Ambil snippets (opsional; jika env tidak diset di server, akan pulang [])
  useEffect(() => {
    if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    debounceTimer.current = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await searchSnippets(q);
        setResults(r);
        if (!selectedUrl && r[0]?.url) setSelectedUrl(r[0].url);
      } catch (e) {
        setError('Gagal memuat hasil. (Failed to fetch results)');
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (debounceTimer.current) window.clearTimeout(debounceTimer.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const hasSnippets = results && results.length > 0;

  function runSearchNow() {
    // gak perlu apa-apa karena efek di atas sudah debounce by q; ini hanya untuk UX "enter/click"
    setQ((v) => v.trim());
  }

  return (
    <section className="card p-4">
      {/* Header input */}
      <div className="flex flex-col md:flex-row md:items-center gap-2">
        <div className="flex-1">
          <label className="text-[11px] text-slate-500 block mb-1">
            Search (Cari)
          </label>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && runSearchNow()}
            placeholder="Cari istilah/diagnosis/pedoman… (e.g., STEMI guideline AHA)"
            className="w-full border rounded px-3 py-2 text-sm"
          />
        </div>
        <div className="flex items-center gap-2">
          <button
            className="btn btn-ghost"
            onClick={() => setMode('snippets')}
            aria-pressed={mode === 'snippets'}
          >
            Ringkasan (Snippets)
          </button>
          <button
            className="btn btn-ghost"
            onClick={() => setMode('web')}
            aria-pressed={mode === 'web'}
          >
            Pratinjau Web
          </button>
          <button className="btn btn-primary" onClick={runSearchNow}>
            Cari / Search
          </button>
        </div>
      </div>

      {/* Quick chips */}
      <div className="mt-3 flex flex-wrap gap-2">
        {QUICK_TERMS.map((t) => (
          <button
            key={t}
            onClick={() => setQ(t)}
            className="chip hover:bg-slate-200 transition-colors"
            title={t}
          >
            {t}
          </button>
        ))}
      </div>

      {/* Body: dua kolom */}
      <div className="mt-4 grid gap-4 md:grid-cols-5">
        {/* Kiri: daftar hasil (selalu tampil untuk bantu navigasi) */}
        <div className="md:col-span-2">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
            Hasil Pencarian (Search Results) {loading && <span className="text-slate-400">…</span>}
          </div>

          {!loading && !hasSnippets && (
            <div className="card p-3 text-xs text-slate-600">
              Tidak ada ringkasan (snippets). Kemungkinan API Google CSE belum diset.
              <div className="mt-1">
                Gunakan tab <b>Pratinjau Web</b> untuk menampilkan Google di dalam aplikasi.
              </div>
            </div>
          )}

          {error && (
            <div className="card p-3 text-sm text-red-700 border-red-200 bg-red-50/90">
              {error}
            </div>
          )}

          <ul className="space-y-2">
            {results.map((r, i) => {
              const active = selectedUrl === r.url;
              return (
                <li key={i} className={`card p-2 ${active ? 'ring-1 ring-blue-300' : ''}`}>
                  <button
                    onClick={() => {
                      setSelectedUrl(r.url);
                      setMode('web'); // auto beralih ke pratinjau biar cepat
                    }}
                    className="text-left w-full"
                    title={r.url}
                  >
                    <div className="text-sm font-medium text-blue-700 line-clamp-2">
                      {r.title} <span className="text-slate-500">(EN)</span>
                    </div>
                    <div className="text-xs text-slate-600 mt-1 line-clamp-3">
                      {r.snippet}
                    </div>
                    <div className="text-[10px] text-slate-400 mt-1 break-all">
                      {r.url}
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        {/* Kanan: pratinjau */}
        <div className="md:col-span-3">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">
            Pratinjau (Preview)
          </div>

          <div className="card overflow-hidden">
            {mode === 'web' ? (
              <iframe
                key={(selectedUrl || googleUrl) + '|web'}
                title="web-preview"
                className="w-full h-[60vh] bg-white"
                src={selectedUrl || googleUrl}
                loading="lazy"
              />
            ) : (
              // Mode snippets: kalau ada pilihan, tampilkan; kalau tidak, tampilkan google search untuk query
              <iframe
                key={(selectedUrl || googleUrl) + '|snip'}
                title="snippet-preview"
                className="w-full h-[60vh] bg-white"
                src={selectedUrl || googleUrl}
                loading="lazy"
              />
            )}
          </div>

          <div className="mt-2 flex items-center gap-2">
            <a
              className="btn btn-primary"
              href={selectedUrl || googleUrl}
              target="_blank"
              rel="noreferrer"
            >
              Buka di Tab Baru (Open in New Tab)
            </a>
            <span className="text-[11px] text-slate-500">
              Jika pratinjau kosong, situs memblokir iframe. Gunakan tombol di kiri.
            </span>
          </div>

          {/* Hint bilingual */}
          <div className="mt-3 text-[11px] text-slate-500">
            Gunakan hasil di kiri sebagai referensi cepat (Ringkasan). &nbsp;
            <span className="text-slate-400">
              Use the left list for quick vetted references.
            </span>
          </div>
        </div>
      </div>
    </section>
  );
}
