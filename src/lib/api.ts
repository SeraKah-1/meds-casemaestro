import { fetchJSON } from './fetcher';
import type { CaseFile } from '../types/case';
import type { Submission, ScoreBreakdown } from '../types/game';
import { parseCaseJson } from '../schemas/caseSchema';
import { generateMockCase } from '../features/case/mock';
import { scoreLocal } from './scoring';

export async function getCase(opts: { specialty: string; difficulty: 1 | 2 | 3 }): Promise<CaseFile> {
  try {
    const raw = await fetchJSON<unknown>('/api/case-gen', {
      method: 'POST',
      body: JSON.stringify(opts)
    });
    const parsed = parseCaseJson(raw) as CaseFile; // ← cast ke TS type app kita
    return parsed;
  } catch {
    return generateMockCase(opts.specialty, opts.difficulty);
  }
}
