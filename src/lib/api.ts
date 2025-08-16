// src/lib/api.ts
import { fetchJSON } from './fetcher';
import type { CaseFile } from '../types/case';
import type { Submission, ScoreBreakdown } from '../types/game';
import { parseCaseJson } from '../schemas/caseSchema';
import { scoreLocal } from './scoring';

// ----------------------
// CASE GENERATION (AI)
// ----------------------
export async function getCase(opts: { specialty: string; difficulty: 1 | 2 | 3 }): Promise<CaseFile> {
  // App.tsx akan handle fallback ke mock jika ini throw
  const raw = await fetchJSON<unknown>('/api/case-gen', {
    method: 'POST',
    body: JSON.stringify(opts)
  });
  const parsed = parseCaseJson(raw) as CaseFile;
  return parsed;
}

// ----------------------
// GRADING
// ----------------------
export function localGrade(caseJson: CaseFile, submission: Submission): ScoreBreakdown {
  const local = scoreLocal(submission.picks, caseJson, submission.dx, submission.mgmt);
  return { total: local, local };
}

export async function remoteGrade(caseJson: CaseFile, submission: Submission): Promise<ScoreBreakdown> {
  try {
    const res = await fetchJSON<{ ai_review?: ScoreBreakdown['ai_review'] }>('/api/grade', {
      method: 'POST',
      body: JSON.stringify({ caseJson, submission })
    });
    const local = scoreLocal(submission.picks, caseJson, submission.dx, submission.mgmt);
    return { total: res.ai_review?.score ?? local, local, ai_review: res.ai_review };
  } catch {
    // kalau function belum ada / error, balik ke lokal
    return localGrade(caseJson, submission);
  }
}

// ----------------------
// SEARCH (opsional)
// ----------------------
export type WebSnippet = { title: string; url: string; snippet: string };

export async function searchSnippets(query: string): Promise<WebSnippet[]> {
  try {
    const res = await fetchJSON<WebSnippet[]>('/api/search?q=' + encodeURIComponent(query));
    return Array.isArray(res) ? res.slice(0, 5) : [];
  } catch {
    return [];
  }
}
