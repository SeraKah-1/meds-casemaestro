// netlify/functions/summarize.ts
import type { Handler } from "@netlify/functions";

function json(status: number, body: unknown) {
  return { statusCode: status, headers: { "content-type": "application/json" }, body: JSON.stringify(body) };
}

export const handler: Handler = async (event) => {
  if (event.httpMethod !== "POST") return json(405, { error: "Method Not Allowed" });

  try {
    const { q, snippets } = JSON.parse(event.body || "{}") as {
      q?: string;
      snippets?: { title: string; url: string; snippet: string }[];
    };

    if (!q || !Array.isArray(snippets)) return json(400, { error: "Missing q or snippets" });

    const key = process.env.AI_API_KEY;
    const model = process.env.AI_MODEL || "gpt-4o-mini";

    if (!key) {
      // fallback sederhana
      const bullets = snippets.slice(0, 5).map((s) => `• ${s.title}`);
      return json(200, { summary: bullets.join("\n"), key_points: bullets });
    }

    const sys =
      'You are a clinical search summarizer. Output JSON only: {"summary": string, "key_points": string[]}';
    const user =
      `Query: ${q}\n\n` +
      `Snippets:\n` +
      snippets
        .slice(0, 8)
        .map((s, i) => `${i + 1}. ${s.title}\n${s.snippet}\n${s.url}`)
        .join("\n\n") +
      `\n\nRules:\n- Accurate & concise.\n- Bilingual: English first, then Indonesian in parentheses for key terms.\n- 4–6 bullets for key_points.`;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: { "content-type": "application/json", Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: [{ role: "system", content: sys }, { role: "user", content: user }],
        temperature: 0.2,
        response_format: { type: "json_object" },
        max_tokens: 450,
      }),
    });

    if (!r.ok) {
      const t = await r.text().catch(() => "");
      console.error("summarize upstream", r.status, t.slice(0, 200));
      return json(200, { summary: "", key_points: [] });
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content;
    const parsed = content ? JSON.parse(content) : { summary: "", key_points: [] };
    return json(200, {
      summary: String(parsed.summary || ""),
      key_points: Array.isArray(parsed.key_points) ? parsed.key_points.slice(0, 8) : [],
    });
  } catch (e) {
    console.error("summarize error", e);
    return json(200, { summary: "", key_points: [] });
  }
};
