import { useState } from "react";

export function SearchPanel() {
  const [query, setQuery] = useState("");
  const [searchUrl, setSearchUrl] = useState("https://www.google.com/");

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (!query.trim()) return;
    const encoded = encodeURIComponent(query);
    setSearchUrl(`https://www.google.com/search?q=${encoded}`);
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <form
        onSubmit={handleSearch}
        className="flex items-center gap-2 bg-white shadow px-3 py-2 rounded-lg border"
      >
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Cari istilah medis atau diagnosis…"
          className="flex-1 px-3 py-2 text-sm border rounded focus:ring-2 focus:ring-emerald-500 focus:outline-none"
        />
        <button
          type="submit"
          className="px-4 py-2 bg-emerald-600 text-white text-sm font-semibold rounded hover:bg-emerald-700"
        >
          Cari
        </button>
      </form>

      {/* Info */}
      <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs px-3 py-2 rounded">
        🔍 Gunakan Google langsung di sini untuk mencari guideline, definisi,
        atau jurnal medis. Hasil tetap bahasa asli (English), tekan
        <span className="font-semibold"> “Tampilkan Terjemahan” </span> jika ingin melihat versi Bahasa Indonesia.
      </div>

      {/* Embedded Google */}
      <div className="w-full h-[70vh] border rounded-lg overflow-hidden">
        <iframe
          key={searchUrl}
          src={searchUrl}
          title="Google Search"
          className="w-full h-full"
        />
      </div>
    </div>
  );
}
