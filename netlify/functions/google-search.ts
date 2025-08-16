// netlify/functions/google-search.ts
import type { Handler } from "@netlify/functions";

type Req = { q?: string; n?: number };
type Snip = { title: string; url: string; snippet: string; source?: string };

function json(status: number, body: unknown) {
  return {
    statusCode: status,
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });

  try {
    const { q, n = 6 } = JSON.parse(event.body || "{}") as Req;
    if (!q || !q.trim()) return json(400, { error: "Missing q" });

    const KEY = process.env.GOOGLE_CSE_KEY;
    const CX = process.env.GOOGLE_CSE_ID;
    if (!KEY || !CX) return json(200, { results: [], note: "GOOGLE_CSE_KEY / GOOGLE_CSE_ID missing" });

    const url =
      `https://www.googleapis.com/customsearch/v1` +
      `?key=${encodeURIComponent(KEY)}` +
      `&cx=${encodeURIComponent(CX)}` +
      `&q=${encodeURIComponent(q)}` +
      `&num=${Math.min(10, Math.max(1, n))}`;

    const r = await fetch(url);
    if (!r.ok) return json(r.status, { error: "google upstream error" });

    const data = await r.json() as any;
    const items: any[] = data?.items || [];

    let results: Snip[] = items.map((it) => ({
      title: String(it?.title || "Untitled"),
      url: String(it?.link || ""),
      snippet: String(it?.snippet || ""),
      source: "google",
    }));

    // de-dup URL
    const seen = new Set<string>();
    results = results.filter((x) => x.url && !seen.has(x.url) && seen.add(x.url));

    return json(200, { results });
  } catch (e) {
    console.error("google-search error", e);
    return json(500, { results: [], error: "internal error" });
  }
};
