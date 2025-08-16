import { z } from 'zod';

// Keep schema tight so AI must output valid, short JSON
export const ActionScoreSchema = z.object({
  learn: z.number().int().min(-5).max(10).optional(),
  must_have: z.boolean().optional(),
}).strict();

export const CaseActionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1).max(140),
  cost: z.number().int().min(0).max(5).optional(),
  reveal_text: z.string().max(400).optional(),
  reveal_image: z.string().url().or(z.string().startsWith('/')).optional(),
  score: ActionScoreSchema.optional(),
}).strict();

export const DemographicsSchema = z.record(z.any()).partial().extend({
  age: z.number().int().min(0).max(120).optional(),
  sex: z.string().optional(),
});

export const VitalsSchema = z.record(z.any()).partial().extend({
  hr: z.number().int().min(20).max(250).optional(),
  bp: z.string().max(20).optional(),
  rr: z.number().int().min(5).max(80).optional(),
  temp: z.number().min(30).max(43).optional(),
  spo2: z.number().min(50).max(100).optional(),
});

export const CaseMetaSchema = z.object({
  title: z.string().min(3).max(120),
  authors: z.array(z.string().min(1)).max(5).optional(),
  est_time_min: z.number().int().min(1).max(30).optional(),
}).strict();

export const CaseIntroSchema = z.object({
  demographics: DemographicsSchema.optional(),
  chief_complaint: z.string().min(2).max(120),
  vitals: VitalsSchema.optional(),
  context: z.string().max(240).optional(),
}).strict();

export const CaseSolutionSchema = z.object({
  dx_primary: z.string().min(2).max(120),
  ddx: z.array(z.string().min(2).max(120)).max(6).optional(),
  management_first: z.array(z.string().min(2).max(160)).max(8).optional(),
  red_flags: z.array(z.string().min(2).max(160)).max(8).optional(),
  teaching_points: z.array(z.string().min(2).max(160)).max(8).optional(),
  references: z.array(z.string().min(2).max(120)).max(6).optional(),
}).strict();

export const CaseActionsGroupSchema = z.object({
  history: z.array(CaseActionSchema).min(1).max(12),
  exam: z.array(CaseActionSchema).min(1).max(12),
  tests: z.array(CaseActionSchema).min(0).max(12),
}).strict();

export const CaseFileSchema = z.object({
  id: z.string().min(1).max(64),
  specialty: z.string().min(2).max(40),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  meta: CaseMetaSchema,
  intro: CaseIntroSchema,
  actions: CaseActionsGroupSchema,
  solution: CaseSolutionSchema,
  references: z.array(z.string().min(2).max(120)).max(8).optional(),
}).strict();

// Helper: validate & return parsed case or throw
export function parseCaseJson(json: unknown) {
  return CaseFileSchema.parse(json);
}
