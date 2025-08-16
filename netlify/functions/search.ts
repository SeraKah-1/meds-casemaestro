/* Search proxy with Google Custom Search JSON API (Programmable Search).
 * Env (Netlify → Site → Settings → Build & deploy → Environment):
 *  - GOOGLE_CSE_ID   (required)  e.g. "abcd1234abcd1234a"
 *  - GOOGLE_CSE_KEY  (required)  e.g. "AIzaSy...."
 *
 * Usage: /api/search?q=your+query
 */
import type { Handler } from '@netlify/functions';

type WebSnippet = { title: string; url: string; snippet: string };

function json(statusCode: number, body: unknown) {
  return {
    statusCode,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  };
}

export const handler: Handler = async (event) => {
  try {
    const q = (event.queryStringParameters?.q || '').toString().trim();
    if (!q) return json(400, { error: 'Missing q' });

    const key = process.env.GOOGLE_CSE_KEY;
    const cx = process.env.GOOGLE_CSE_ID;
    if (!key || !cx) {
      // No creds: return empty array gracefully
      return json(200, [] as WebSnippet[]);
    }

    const url =
      'https://www.googleapis.com/customsearch/v1?' +
      new URLSearchParams({
        key,
        cx,
        q,
        num: '5',
        safe: 'active'
      }).toString();

    const r = await fetch(url);
    if (!r.ok) {
      const text = await r.text();
      console.error('google search error', r.status, text.slice(0, 300));
      return json(502, { error: 'Search upstream error', status: r.status });
    }

    const data = await r.json();
    const items = (data.items || []) as any[];
    const out: WebSnippet[] = items.slice(0, 5).map((it) => ({
      title: it.title,
      url: it.link,
      snippet: it.snippet
    }));
    return json(200, out);
  } catch (err: any) {
    console.error('search fatal', err);
    return json(500, { error: String(err?.message || err) });
  }
};
