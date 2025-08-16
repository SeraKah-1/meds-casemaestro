import type { CaseFile } from '../types/case';

export function scoreLocal(picks: string[], cf: CaseFile, dx: string, mgmt: string[]): number {
  let score = 0;
  const ids = new Set(picks);

  // Action learning points
  (['history', 'exam', 'tests'] as const).forEach((grp) => {
    for (const a of cf.actions[grp]) {
      if (ids.has(a.id)) {
        score += a.score?.learn ?? 0;
        if (a.score?.must_have) score += 5;
      }
    }
  });

  // Diagnosis match (very simple, we’ll improve later)
  const okDx = /stemi|acute\s*mi/i.test(dx);
  if (okDx) score += 10;

  // Management keywords
  const need = [/aspirin/i, /(heparin|anticoag)/i, /(pci|cath|reperfusion)/i];
  const joined = mgmt.join(' ');
  score += need.filter((rx) => rx.test(joined)).length * 3;

  // Penalty for over-ordering
  const penalty = Math.max(0, picks.length - 6);
  return score - penalty;
}
