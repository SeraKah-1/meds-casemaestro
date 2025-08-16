import { LIMITS } from './constants';

export function clampMgmtLines(lines: string[]): string[] {
  return lines.slice(0, LIMITS.maxMgmtLines);
}

export function isOverActionCap(count: number): boolean {
  return count > LIMITS.maxActionsBeforePenalty;
}
