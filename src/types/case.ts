// Core case types used across the app

export type ActionScore = {
  learn?: number;        // +points for high-yield actions
  must_have?: boolean;   // critical action (bonus + unlocks)
};

export type CaseAction = {
  id: string;            // unique within the case
  text: string;          // label shown in UI
  cost?: number;         // optional "token/time" cost
  reveal_text?: string;  // text shown after selecting action
  reveal_image?: string; // optional image path
  score?: ActionScore;
};

export type Demographics = {
  age?: number;
  sex?: 'M' | 'F' | 'Other' | string;
  [k: string]: unknown;
};

export type Vitals = {
  hr?: number;
  bp?: string;
  rr?: number;
  temp?: number;
  spo2?: number;
  [k: string]: unknown;
};

export type CaseMeta = {
  title: string;
  authors?: string[];
  est_time_min?: number;
};

export type CaseIntro = {
  demographics?: Demographics;
  chief_complaint: string;
  vitals?: Vitals;
  context?: string;
};

export type CaseSolution = {
  dx_primary: string;         // final diagnosis
  ddx?: string[];             // differentials
  management_first?: string[];// initial management bullets
  red_flags?: string[];       // what must not be missed
  teaching_points?: string[]; // short bullets
  references?: string[];      // guideline names only
};

export type CaseActionsGroup = {
  history: CaseAction[];
  exam: CaseAction[];
  tests: CaseAction[];
};

export type CaseFile = {
  id: string;                 // e.g. "ai-cardiology-20250816-001"
  specialty: string;          // 'cardiology' | 'pulmonology' | ...
  difficulty: 1 | 2 | 3;
  meta: CaseMeta;
  intro: CaseIntro;
  actions: CaseActionsGroup;
  solution: CaseSolution;
  references?: string[];      // optional top-level refs
};
