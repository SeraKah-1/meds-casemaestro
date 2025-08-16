// src/lib/api.ts
// Client-side API helpers untuk berkomunikasi dengan Netlify Functions.
// Endpoints yang dipakai:
//   - /api/case-gen  : generate kasus AI (Netlify Function)
//   - /api/grade     : AI/heuristic grading (Netlify Function)
//   - /api/search    : Google Programmable Search proxy (Netlify Function)

import { fetchJSON } from './fetcher';
import type { CaseFile } from '../types/case';
import type { Submission, ScoreBreakdown } from '../types/game';
import { parseCaseJson } from '../schemas/caseSchema';
import { scoreLocal } from './scoring';

// ----------------------
// CASE GENERATION (AI)
// ----------------------

/**
 * Meminta kasus ke server (/api/case-gen).
 * App.tsx akan menangani fallback ke mock jika request ini melempar error.
 */
export async function getCase(opts: { specialty: string; difficulty: 1 | 2 | 3 }): Promise<CaseFile> {
  const raw = await fetchJSON<unknown>('/api/case-gen', {
    method: 'POST',
    body: JSON.stringify(opts)
  });
  // Validasi & normalisasi via Zod schema
  const parsed = parseCaseJson(raw) as CaseFile;
  return parsed;
}

// ----------------------
// GRADING
// ----------------------

/** Skor lokal (tanpa token), dipakai di client & sebagai fallback. */
export function localGrade(caseJson: CaseFile, submission: Submission): ScoreBreakdown {
  const local = scoreLocal(submission.picks, caseJson, submission.dx, submission.mgmt);
  return { total: local, local };
}

/**
 * Skor remote + feedback AI (jika function tersedia).
 * Jika function error/404 → fallback ke skor lokal.
 */
export async function remoteGrade(caseJson: CaseFile, submission: Submission): Promise<ScoreBreakdown> {
  try {
    const res = await fetchJSON<{ ai_review?: ScoreBreakdown['ai_review'] }>('/api/grade', {
      method: 'POST',
      body: JSON.stringify({ caseJson, submission })
    });
    const local = scoreLocal(submission.picks, caseJson, submission.dx, submission.mgmt);
    return { total: res.ai_review?.score ?? local, local, ai_review: res.ai_review };
  } catch {
    return localGrade(caseJson, submission);
  }
}

// ----------------------
// SEARCH (built-in list + preview)
// ----------------------

export type WebSnippet = { title: string; url: string; snippet: string };

/**
 * Mengambil 3–5 snippet hasil pencarian via /api/search.
 * Jika env Google CSE belum diset, function akan balas [] → UI tetap jalan (tanpa list).
 */
export async function searchSnippets(query: string): Promise<WebSnippet[]> {
  try {
    const res = await fetchJSON<WebSnippet[]>('/api/search?q=' + encodeURIComponent(query));
    return Array.isArray(res) ? res.slice(0, 5) : [];
  } catch {
    return [];
  }
}
