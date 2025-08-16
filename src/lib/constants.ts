export const APP_VERSION = '0.2.0';

export const LIMITS = {
  maxActionsBeforePenalty: 6,
  maxMgmtLines: 10,
  ai: {
    maxCaseTokens: 900,
    maxGradeTokens: 500
  }
} as const;

export const FEATURE = {
  enableSearchIframe: true,
  enableApiSearch: true // set true jika sudah buat /api/search (Part 5)
} as const;
