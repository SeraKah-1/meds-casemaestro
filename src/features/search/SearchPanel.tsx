import { useEffect, useMemo, useRef, useState } from 'react';
import { searchSnippets, type WebSnippet } from '../../lib/api';

export function SearchPanel() {
  const [q, setQ] = useState('tatalaksana awal STEMI');
  const [results, setResults] = useState<WebSnippet[]>([]);
  const [loading, setLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const timer = useRef<number | null>(null);

  // Debounce pencarian
  useEffect(() => {
    if (timer.current) window.clearTimeout(timer.current);
    timer.current = window.setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        const r = await searchSnippets(q);
        setResults(r);
        // set preview otomatis ke hasil pertama
        if (!previewUrl && r[0]?.url) setPreviewUrl(r[0].url);
      } catch {
        setError('Gagal memuat hasil. Coba lagi.');
      } finally {
        setLoading(false);
      }
    }, 300);
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
    };
  }, [q]);

  const canPreview = useMemo(() => !!previewUrl, [previewUrl]);

  return (
    <section className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Cari terminologi/diagnosis/pedoman (contoh: STEMI guideline AHA)"
          className="flex-1 border rounded px-3 py-2 text-sm"
        />
        <button
          className="px-3 py-2 rounded border text-sm"
          onClick={() => setQ((v) => v.trim())}
        >
          Cari
        </button>
      </div>

      {error && (
        <div className="mt-3 p-2 text-sm bg-red-50 border border-red-200 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="mt-3 grid gap-3 md:grid-cols-5">
        {/* Hasil kiri */}
        <div className="md:col-span-2 space-y-2">
          <div className="text-xs uppercase tracking-wide text-slate-500">
            Hasil Pencarian {loading && <span className="text-slate-400">…</span>}
          </div>
          {(!results || results.length === 0) && !loading && (
            <div className="text-xs text-slate-500">Tidak ada hasil (atau API key belum di-set).</div>
          )}
          <ul className="space-y-2">
            {results.map((r, i) => (
              <li key={i} className="border rounded p-2">
                <button
                  onClick={() => setPreviewUrl(r.url)}
                  className="text-left w-full"
                  title={r.url}
                >
                  <div className="text-sm font-medium text-blue-700 line-clamp-2">{r.title}</div>
                  <div className="text-xs text-slate-600 mt-1 line-clamp-3">{r.snippet}</div>
                  <div className="text-[10px] text-slate-400 mt-1 break-all">{r.url}</div>
                </button>
              </li>
            ))}
          </ul>
        </div>

        {/* Preview kanan */}
        <div className="md:col-span-3">
          <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">Pratinjau</div>
          {canPreview ? (
            <div className="border rounded overflow-hidden">
              <iframe
                key={previewUrl!}
                title="preview"
                className="w-full h-[60vh] bg-white"
                src={previewUrl!}
                loading="lazy"
              />
            </div>
          ) : (
            <div className="border rounded p-3 text-sm text-slate-600">
              Pilih salah satu hasil untuk melihat pratinjau di sini.
            </div>
          )}
          {previewUrl && (
            <div className="mt-2 flex items-center gap-2">
              <a
                className="px-3 py-1.5 rounded bg-slate-800 text-white text-xs"
                href={previewUrl}
                target="_blank"
                rel="noreferrer"
              >
                Buka di Tab Baru (jika blok iframe)
              </a>
              <span className="text-[11px] text-slate-500">
                Beberapa situs memblokir pratinjau—pakai tombol di kiri jika layar kosong.
              </span>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
