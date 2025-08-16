// src/features/search/SearchPanel.tsx
import { useRef, useState } from "react";

/**
 * Embed Google yang paling sederhana & stabil:
 * - Tidak memuat google di awal (hindari X-Frame-Options).
 * - Saat user submit, set src => https://www.google.com/search?igu=1&hl=id&q=...
 * - Jika tetap diblok pada device tertentu, tampilkan tombol "Buka di Tab Baru".
 */
export function SearchPanel() {
  const [q, setQ] = useState("");
  const [url, setUrl] = useState<string | null>(null); // null = belum load apa pun
  const [blocked, setBlocked] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);

  function doSearch(e?: React.FormEvent) {
    e?.preventDefault();
    const query = q.trim();
    // kalau kosong, tampilkan halaman search “kosong” (tetap pakai igu=1)
    const next = query
      ? `https://www.google.com/search?igu=1&hl=id&q=${encodeURIComponent(query)}`
      : `https://www.google.com/search?igu=1&hl=id`;
    setBlocked(false);
    setUrl(next);
  }

  return (
    <section className="space-y-3">
      {/* Bar pencarian */}
      <form
        onSubmit={doSearch}
        className="flex items-center gap-2 bg-white shadow px-3 py-2 rounded-lg border"
      >
        <input
          type="text"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && doSearch()}
          placeholder="Cari istilah medis, guideline, diagnosis…"
          className="flex-1 px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded hover:bg-emerald-700"
        >
          Cari
        </button>
      </form>

      {/* Info kecil */}
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-2 rounded">
        Google akan dibuka di dalam aplikasi setelah kamu menekan <b>Cari</b>.
        Menggunakan mode embed <code>igu=1</code> agar lebih kompatibel.
      </div>

      {/* Viewer */}
      <div className="w-full h-[70vh] border rounded-lg overflow-hidden bg-white relative">
        {!url ? (
          <div className="h-full flex items-center justify-center text-sm text-slate-500">
            Ketik kueri lalu tekan <b>Cari</b>.
          </div>
        ) : (
          <>
            <iframe
              ref={iframeRef}
              key={url}
              src={url}
              title="Google Search"
              className="w-full h-full"
              // Kalau browser menolak iframe, sebagian akan memicu onError,
              // sebagian tidak. Kita sediakan fallback tombol di bawah.
              onError={() => setBlocked(true)}
            />
            {blocked && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/90">
                <div className="text-sm text-slate-600">
                  Sepertinya Google memblokir embed di perangkat ini.
                </div>
                <a
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded hover:bg-emerald-700"
                >
                  Buka di Tab Baru
                </a>
              </div>
            )}
          </>
        )}
      </div>
    </section>
  );
}

export default SearchPanel;
