import { SAFETY } from './shared';

export const CASE_GEN_SYSTEM = `
You are a medical educator generating SAFE, anonymized, evidence-based case-based learning (CBL) scenarios.
Output MUST be strict JSON following the provided schema. No extra text. ${SAFETY}
`.trim();

export function caseGenUserPrompt(params: {
  specialty: string;
  difficulty: 1 | 2 | 3;
}) {
  const { specialty, difficulty } = params;
  return `
Generate ONE concise case in JSON with fields:
{
  "id": "ai-${specialty}-${Date.now()}",
  "specialty": "${specialty}",
  "difficulty": ${difficulty},
  "meta": { "title": "short title (<=60 chars)", "est_time_min": 8 },
  "intro": {
    "demographics": { "age": 50-80, "sex": "M|F" },
    "chief_complaint": "short",
    "vitals": { "hr": 50-140, "bp": "e.g. 92/58", "rr": 10-30, "temp": 35-39, "spo2": 85-100 },
    "context": "one sentence"
  },
  "actions": {
    "history": [ { "id":"...", "text":"...", "reveal_text":"...", "score": {"learn": 1-4} } ],
    "exam":    [ { "id":"...", "text":"...", "reveal_text":"...", "score": {"learn": 1-3} } ],
    "tests":   [ { "id":"...", "text":"...", "reveal_text":"...", "score": {"learn": -1|0|1|2|4, "must_have": true|false} } ]
  },
  "solution": {
    "dx_primary": "short dx",
    "ddx": ["x","y","z"],
    "management_first": ["bullets, first-line only"],
    "red_flags": ["bullets"],
    "teaching_points": ["2-4 short bullets"]
  },
  "references": ["name of guideline/org only (e.g., ACC/AHA)"]
}
Rules:
- Use <= 10 total actions across groups if possible.
- Prefer must_have on 1-2 critical tests.
- Keep strings short; no markdown in JSON.
`.trim();
}
