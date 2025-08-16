import { fetchJSON } from './fetcher';
import type { CaseFile } from '../types/case';
import type { Submission, ScoreBreakdown } from '../types/game';
import { parseCaseJson } from '../schemas/caseSchema';
import { generateMockCase } from '../features/case/mock';
import { scoreLocal } from './scoring';

// --- CASE GENERATION ---

/**
 * Try to get an AI-generated case via /api/case-gen.
 * If the API isn't available yet (Part 5), fall back to local mock.
 */
export async function getCase(opts: { specialty: string; difficulty: 1 | 2 | 3 }): Promise<CaseFile> {
  try {
    // Part 5: Netlify redirect sends /api/* to serverless functions
    const raw = await fetchJSON<unknown>('/api/case-gen', {
      method: 'POST',
      body: JSON.stringify(opts)
    });
    const parsed = parseCaseJson(raw);
    return parsed;
  } catch {
    // fallback for now (works today)
    return generateMockCase(opts.specialty, opts.difficulty);
  }
}

// --- GRADING ---

/**
 * Local first (token-free). If remote grader exists, you can call it explicitly.
 */
export async function localGrade(caseJson: CaseFile, submission: Submission): Promise<ScoreBreakdown> {
  const local = scoreLocal(submission.picks, caseJson, submission.dx, submission.mgmt);
  return { total: local, local };
}

/**
 * Optional remote grade (Part 5).
 * Returns { total, local, ai_review? }
 */
export async function remoteGrade(
  caseJson: CaseFile,
  submission: Submission
): Promise<ScoreBreakdown> {
  // Try remote API; if not present, just return local.
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

// --- SEARCH (optional) ---

export type WebSnippet = { title: string; url: string; snippet: string };

export async function searchSnippets(query: string): Promise<WebSnippet[]> {
  try {
    const res = await fetchJSON<WebSnippet[]>('/api/search?q=' + encodeURIComponent(query));
    return res.slice(0, 5);
  } catch {
    // no API yet → empty list (iframe search still works)
    return [];
  }
}
