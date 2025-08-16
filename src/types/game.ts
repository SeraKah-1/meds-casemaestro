import type { CaseFile } from './case';

export type Difficulty = 1 | 2 | 3;

// You can add more later; keep as plain strings for AI flexibility
export type Specialty =
  | 'cardiology'
  | 'pulmonology'
  | 'neurology'
  | 'gastroenterology'
  | 'endocrinology'
  | 'infectious-disease'
  | 'nephrology'
  | 'hematology'
  | 'oncology'
  | 'obgyn'
  | 'pediatrics'
  | 'emergency'
  | string;

export type Submission = {
  dx: string;           // user’s final diagnosis text
  mgmt: string[];       // first-line management bullets
  picks: string[];      // action IDs clicked/ordered
  notes?: string;       // optional notes snapshot at submit time
};

export type ScoreBreakdown = {
  total: number;
  local: number;        // local (token-free) score
  ai_review?: {
    score?: number;           // optional AI grader score
    pros?: string[];
    cons?: string[];
    red_flags?: string[];
    feedback?: string[];      // concise bullets
  };
};

export type SaveEntry = {
  id: string;                 // uuid / timestamp id
  created_at: number;         // epoch ms
  specialty: Specialty;
  difficulty: Difficulty;
  caseJson: CaseFile;         // the generated case
  submission?: Submission;    // last submission
  score?: ScoreBreakdown;     // last score
  version?: string;           // for future migrations
};
