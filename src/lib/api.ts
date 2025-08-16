// src/lib/api.ts
// Kompatibel dengan App.tsx kamu:
// - getCase({ specialty, difficulty }) -> Promise<CaseFile>
// - localGrade(caseJson, submission)   -> ScoreBreakdown
// - remoteGrade(caseJson, submission)  -> Promise<ScoreBreakdown>
// PLUS tetap menyediakan generateCase / reviewDiagnosis (OpenAI)

import type { CaseFile } from '../types/case';
import type { Submission, ScoreBreakdown } from '../types/game';

// ---------- Util fetch JSON ----------
async function fetchJSON<T = any>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, {
    headers: { 'content-type': 'application/json', ...(init?.headers || {}) },
    ...init,
  });
  if (!r.ok) {
    const txt = await r.text().catch(() => '');
    throw new Error(`HTTP ${r.status} ${url}: ${txt.slice(0, 200)}`);
  }
  return r.json() as Promise<T>;
}

// =====================================================
// 1) API yang diharapkan App.tsx (serverless-first)
// =====================================================

// -- CASE GENERATION via Netlify Function --
export async function getCase(opts: { specialty: string; difficulty: 1 | 2 | 3 }): Promise<CaseFile> {
  // Harapannya kamu sudah punya netlify/functions/case-gen.ts
  // dan AI_API_KEY diset di Netlify Environment.
  // Kalau function tidak ada, ini akan throw → App.tsx akan fallback ke mock.
  return fetchJSON<CaseFile>('/api/case-gen', {
    method: 'POST',
    body: JSON.stringify(opts),
  });
}

// -- LOCAL GRADE (heuristik ringan, tanpa token) --
export function localGrade(caseJson: CaseFile, submission: Submission): ScoreBreakdown {
  // Heuristik sederhana:
  // - dx match (substring kasar) memberi bobot besar
  // - jumlah tatalaksana memberi bobot tambahan
  // - picks memberi bobot kecil
  const dxTruth =
    (caseJson as any)?.solution?.dx_primary ||
    (caseJson as any)?.solution?.finalDiagnosis ||
    '';

  const dxUser = (submission.dx || '').toLowerCase();
  const dxOk =
    typeof dxTruth === 'string' &&
    dxUser.includes(String(dxTruth).toLowerCase().slice(0, 8));

  const mgmtCount = Array.isArray(submission.mgmt) ? submission.mgmt.length : 0;
  const picksCount = Array.isArray(submission.picks) ? submission.picks.length : 0;

  let score = (dxOk ? 60 : 35) + Math.min(25, mgmtCount * 5) + Math.min(15, picksCount * 1.5);
  score = Math.max(5, Math.min(100, Math.round(score)));

  // Bentuk ScoreBreakdown minimal yang cocok dengan App
  return { total: score, local: score };
}

// -- REMOTE GRADE via Netlify Function (fallback ke lokal) --
export async function remoteGrade(caseJson: CaseFile, submission: Submission): Promise<ScoreBreakdown> {
  try {
    // Harapannya kamu punya netlify/functions/grade.ts
    const res = await fetchJSON<{ ai_review?: ScoreBreakdown['ai_review']; total?: number }>(
      '/api/grade',
      { method: 'POST', body: JSON.stringify({ caseJson, submission }) }
    );

    const local = localGrade(caseJson, submission);
    const total = typeof res.total === 'number' ? res.total : res.ai_review?.score ?? local.total;

    return {
      total,
      local: local.total,
      ai_review: res.ai_review,
    };
  } catch {
    // Tidak ada function / error → gunakan skor lokal saja
    return localGrade(caseJson, submission);
  }
}

// =====================================================
// 2) API tambahan (opsional) kalau kamu mau pakai langsung OpenAI
//    di komponen lain: generateCase / reviewDiagnosis
//    (tidak dipakai App.tsx, tapi tetap disediakan agar kode “asli” kamu tetap ada).
// =====================================================

export interface CaseData {
  caseTitle: string;
  chiefComplaint: string;
  patientBackground: string;
  actionPoints: number;
  investigations: {
    Anamnesis: { label: string; cost: number; detail: string }[];
    'Pemeriksaan Fisik': { label: string; cost: number; detail: string }[];
    'Pemeriksaan Penunjang': { label: string; cost: number; detail: string }[];
  };
  finalDiagnosis: string;
  discussion: string;
}

export interface ReviewData {
  diagnosisEvaluation: string;
  reasoningCritique: string;
  efficiencyComment: string;
  overallRating: number;
}

const OPENAI_CHAT_URL = 'https://api.openai.com/v1/chat/completions';

async function callOpenAI(apiKey: string, prompt: string) {
  const r = await fetch(OPENAI_CHAT_URL, {
    method: 'POST',
    headers: { 'content-type': 'application/json', Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.7,
    }),
  });
  if (!r.ok) throw new Error(`OpenAI API failed: ${r.status}`);
  const data = await r.json();
  const text: string = data?.choices?.[0]?.message?.content || '';
  const cleaned = text.replace(/^```json\s*/, '').replace(/\s*```$/, '');
  return JSON.parse(cleaned);
}

export async function generateCase(
  apiKey: string,
  specialty: string,
  difficulty: string
): Promise<CaseData> {
  const prompt = `
You are a medical case generator for a clinical reasoning game.
Generate a case for specialty: ${specialty}, difficulty: ${difficulty}.
Return strictly JSON.

IMPORTANT: Always output bilingual (English + Indonesian).
For every field, write in English then add Indonesian translation in parentheses.

Schema:
{
  "caseTitle": "...",
  "chiefComplaint": "...",
  "patientBackground": "...",
  "actionPoints": 100 | 80 | 60,
  "investigations": {
    "Anamnesis": [ { "label": "...", "cost": number, "detail": "..." } ],
    "Pemeriksaan Fisik": [ { "label": "...", "cost": number, "detail": "..." } ],
    "Pemeriksaan Penunjang": [ { "label": "...", "cost": number, "detail": "..." } ]
  },
  "finalDiagnosis": "...",
  "discussion": "..."
}`;
  return callOpenAI(apiKey, prompt);
}

export async function reviewDiagnosis(
  apiKey: string,
  caseData: CaseData,
  userSubmission: { diagnosis: string; analysis: string },
  actionPoints: number
): Promise<ReviewData> {
  const prompt = `
You are a senior medical consultant reviewing a junior doctor's work.

Case: ${JSON.stringify(caseData)}
Submission:
- Diagnosis: "${userSubmission.diagnosis}"
- Reasoning: "${userSubmission.analysis}"
- Remaining AP: ${actionPoints}/${caseData.actionPoints}

IMPORTANT: Output must be bilingual (English + Indonesian).
Every string field: English first, then Indonesian translation.

Schema:
{
  "diagnosisEvaluation": "...",
  "reasoningCritique": "...",
  "efficiencyComment": "...",
  "overallRating": 1-5
}`;
  return callOpenAI(apiKey, prompt);
}
