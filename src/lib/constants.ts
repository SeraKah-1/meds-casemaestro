export const APP_VERSION = '0.1.0';

export const LIMITS = {
  maxActionsBeforePenalty: 6,
  maxMgmtLines: 10,
  // soft caps to keep tokens low later
  ai: {
    maxCaseTokens: 900,
    maxGradeTokens: 500
  }
} as const;

export const FEATURE = {
  enableSearchIframe: true,
  enableApiSearch: false // will flip to true in Part 5 if you add /api/search
} as const;
