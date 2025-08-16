// netlify/functions/grade.ts
import type { Handler } from '@netlify/functions';

function json(status: number, body: unknown) {
  return {
    statusCode: status,
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body)
  };
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

    const { caseJson, submission } = JSON.parse(event.body || '{}');
    const key = process.env.AI_API_KEY;
    const model = process.env.AI_MODEL || 'gpt-4o-mini';

    // Heuristic fallback (tanpa AI)
    const heuristic = () => {
      const dxOk =
        typeof submission?.dx === 'string' &&
        typeof caseJson?.solution?.dx_primary === 'string' &&
        submission.dx.toLowerCase().includes(String(caseJson.solution.dx_primary).toLowerCase().slice(0, 8));
      const mgmtCount = Array.isArray(submission?.mgmt) ? submission.mgmt.length : 0;
      const picksCount = Array.isArray(submission?.picks) ? submission.picks.length : 0;

      const base = (dxOk ? 70 : 40) + Math.min(20, mgmtCount * 4) + Math.min(10, picksCount * 2);
      const score = Math.max(10, Math.min(95, base));

      const pros = [];
      const cons = [];
      const red_flags = [];

      if (dxOk) pros.push('Diagnosis final konsisten dengan temuan utama.');
      else cons.push('Diagnosis kurang selaras dengan data klinis.');

      if (mgmtCount >= 3) pros.push('Rencana tatalaksana cukup komprehensif.');
      else cons.push('Tambahkan langkah tatalaksana awal yang esensial.');

      if ((caseJson?.solution?.red_flags || []).length > 0 && mgmtCount < 2) {
        red_flags.push('Beberapa red flags belum ter-cover pada rencana awal.');
      }

      return { score, pros, cons, red_flags };
    };

    // Tanpa key → langsung fallback
    if (!key) return json(200, { ai_review: heuristic() });

    // AI path
    const prompt = [
      { role: 'system', content: 'You are a senior clinician. Respond ONLY JSON with fields: score (0-100), pros[], cons[], red_flags[]' },
      {
        role: 'user',
        content:
          `CASE:\n${JSON.stringify(caseJson)}\n\nSUBMISSION:\n${JSON.stringify(submission)}\n\n` +
          `Score strictly 0-100. Pros/cons/red_flags are bullet points, concise, clinical, Indonesian language.`
      }
    ];

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: { 'content-type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model,
        messages: prompt,
        temperature: 0.2,
        response_format: { type: 'json_object' },
        max_tokens: 400
      })
    });

    if (!r.ok) {
      const t = await r.text();
      console.error('grade upstream error', r.status, t.slice(0, 300));
      return json(200, { ai_review: heuristic(), upstream: r.status });
    }

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return json(200, { ai_review: heuristic(), note: 'no content' });

    const parsed = JSON.parse(content);
    // sanitize minimal
    const out = {
      score: Math.max(0, Math.min(100, Number(parsed.score) || 0)),
      pros: Array.isArray(parsed.pros) ? parsed.pros.slice(0, 8) : [],
      cons: Array.isArray(parsed.cons) ? parsed.cons.slice(0, 8) : [],
      red_flags: Array.isArray(parsed.red_flags) ? parsed.red_flags.slice(0, 8) : []
    };
    return json(200, { ai_review: out });
  } catch (err: any) {
    console.error('grade fatal', err);
    return json(200, { ai_review: { score: 50, pros: [], cons: ['Gagal memproses AI'], red_flags: [] } });
  }
};
