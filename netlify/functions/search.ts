/* Optional simple search proxy.
 * If you don't set SEARCH_API_KEY, this will return 204 (no content).
 * Example providers:
 *  - Bing Web Search (set SEARCH_ENGINE=bing)
 */
import type { Handler } from '@netlify/functions';

export const handler: Handler = async (event) => {
  try {
    const q = (event.queryStringParameters?.q || '').toString().trim();
    if (!q) return { statusCode: 400, body: 'Missing q' };

    const provider = process.env.SEARCH_ENGINE || 'none';
    const key = process.env.SEARCH_API_KEY;
    if (!key || provider === 'none') return { statusCode: 204, body: '' };

    if (provider === 'bing') {
      const url = `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(q)}&count=5&textDecorations=false&safeSearch=Moderate`;
      const r = await fetch(url, { headers: { 'Ocp-Apim-Subscription-Key': key } });
      const data = await r.json();
      const web = data?.webPages?.value || [];
      const out = web.slice(0, 5).map((x: any) => ({
        title: x.name,
        url: x.url,
        snippet: x.snippet
      }));
      return { statusCode: 200, body: JSON.stringify(out) };
    }

    // Add more providers here if needed

    return { statusCode: 204, body: '' };
  } catch (err: any) {
    console.error('search error', err);
    return { statusCode: 500, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};
