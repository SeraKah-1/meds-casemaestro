/* Grader: combines local heuristic scoring + optional AI feedback.
 * Env:
 *  - AI_API_KEY (optional; if absent, returns only local-style score 0)
 *  - AI_MODEL   (default: gpt-4o-mini)
 */
import type { Handler } from '@netlify/functions';
import { GRADER_SYSTEM, graderUserPrompt } from '../prompts/grader';

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

// Minimal server-side local-ish scoring (mirrors client logic loosely)
function localHeuristicScore(payload: { caseJson: any; submission: { dx: string; mgmt: string[]; picks: string[] } }) {
  let score = 0;
  const { caseJson, submission } = payload;
  const ids = new Set(submission.picks || []);

  // action points
  (['history', 'exam', 'tests'] as const).forEach((grp) => {
    for (const a of caseJson?.actions?.[grp] || []) {
      if (ids.has(a.id)) {
        if (a?.score?.learn) score += a.score.learn;
        if (a?.score?.must_have) score += 5;
      }
    }
  });

  // dx keyword (toy)
  if (submission.dx && /stemi|acute\s*mi/i.test(submission.dx)) score += 10;

  // mgmt keywords (toy)
  const joined = (submission.mgmt || []).join(' ').toLowerCase();
  ['aspirin', 'heparin', 'anticoag', 'pci', 'cath', 'reperfusion'].forEach((kw) => {
    if (joined.includes(kw)) score += 3;
  });

  // penalty for over-ordering
  const penalty = Math.max(0, (submission.picks?.length || 0) - 6);
  return Math.max(0, score - penalty);
}

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };
    const { caseJson, submission } = JSON.parse(event.body || '{}');

    const local = localHeuristicScore({ caseJson, submission });

    const key = process.env.AI_API_KEY;
    if (!key) {
      return { statusCode: 200, body: JSON.stringify({ ai_review: { score: local, pros: [], cons: [], red_flags: [] } }) };
    }

    const model = process.env.AI_MODEL || 'gpt-4o-mini';
    const messages = [
      { role: 'system', content: GRADER_SYSTEM },
      { role: 'user', content: graderUserPrompt({ caseJson, submission }) }
    ];

    const r = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages,
        response_format: { type: 'json_object' },
        max_tokens: 400
      })
    });

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content;
    let ai_review = { score: local, pros: [], cons: [], red_flags: [] as string[] };

    if (content) {
      const parsed = JSON.parse(content);
      // Merge with local baseline if AI missing score
      ai_review = {
        score: typeof parsed.score === 'number' ? parsed.score : local,
        pros: Array.isArray(parsed.pros) ? parsed.pros.slice(0, 4) : [],
        cons: Array.isArray(parsed.cons) ? parsed.cons.slice(0, 4) : [],
        red_flags: Array.isArray(parsed.red_flags) ? parsed.red_flags.slice(0, 4) : []
      };
    }

    return { statusCode: 200, body: JSON.stringify({ ai_review }) };
  } catch (err: any) {
    console.error('grade error', err);
    return { statusCode: 500, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};
