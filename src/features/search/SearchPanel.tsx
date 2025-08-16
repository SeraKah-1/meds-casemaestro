import { useEffect, useRef, useState } from "react";

/**
 * Google CSE (Programmable Search) embed
 * - Butuh env VITE_GOOGLE_CSE_ID berisi "cx"
 * - Script hanya dimuat sekali, lalu render elemen <div id="cse-container" />
 * - Tanpa API key (ini elemen UI, bukan REST API)
 */
export function SearchPanel() {
  const CX = (import.meta as any).env?.VITE_GOOGLE_CSE_ID || "";
  const [ready, setReady] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const renderedRef = useRef(false);

  useEffect(() => {
    if (!CX) {
      setErr(
        "Search belum aktif: set VITE_GOOGLE_CSE_ID di Netlify Environment (Search engine ID / cx)."
      );
      return;
    }

    // Pastikan parse tags explicit agar kita render manual.
    (window as any).__gcse = { parsetags: "explicit" };

    function renderCSE() {
      try {
        if (renderedRef.current) return;
        const g = (window as any).google;
        if (!g?.search?.cse?.element) return;

        g.search.cse.element.render({
          div: "cse-container",
          tag: "search", // menampilkan search box + hasil
          attributes: {
            linkTarget: "_blank", // buka di tab baru jika di-click
            enableAutoComplete: true,
          },
        });
        renderedRef.current = true;
        setReady(true);
      } catch (e) {
        console.error(e);
        setErr("Gagal merender Google CSE.");
      }
    }

    // Jika script sudah ada, langsung render.
    const EXISTING = document.getElementById("gcse-script") as HTMLScriptElement | null;
    if (EXISTING) {
      // tunggu sampai window.google ready
      const t = setInterval(() => {
        if ((window as any).google?.search?.cse?.element) {
          clearInterval(t);
          renderCSE();
        }
      }, 100);
      return () => clearInterval(t);
    }

    // Muat script baru
    const s = document.createElement("script");
    s.id = "gcse-script";
    s.async = true;
    s.src = `https://cse.google.com/cse.js?cx=${encodeURIComponent(CX)}`;
    s.onload = () => {
      // tunggu hingga object google terpasang
      const t = setInterval(() => {
        if ((window as any).google?.search?.cse?.element) {
          clearInterval(t);
          renderCSE();
        }
      }, 100);
    };
    s.onerror = () => setErr("Gagal memuat script Google CSE.");
    document.body.appendChild(s);
  }, [CX]);

  return (
    <section className="space-y-3">
      <div className="bg-white border rounded-lg shadow-sm p-3">
        <div className="text-sm text-slate-700">
          <b>Google Search (ter-embed)</b> — ketik kata kunci di kotak bawah, hasil
          muncul langsung di halaman ini.
        </div>
        {!CX && (
          <div className="mt-2 text-xs text-red-700 bg-red-50 border border-red-200 rounded p-2">
            VITE_GOOGLE_CSE_ID belum diset.
          </div>
        )}
      </div>

      <div className="bg-white border rounded-lg shadow-sm overflow-hidden">
        {/* Google akan mengganti isi div ini dengan widget-nya */}
        <div id="cse-container" className="min-h-[60vh] p-2" />
        {!ready && !err && (
          <div className="p-4 text-sm text-slate-500">Memuat Google Search…</div>
        )}
        {err && (
          <div className="p-4 text-sm text-red-700 bg-red-50 border-t border-red-200">
            {err}
          </div>
        )}
      </div>
    </section>
  );
}

export default SearchPanel;
