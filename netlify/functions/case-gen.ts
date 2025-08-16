/* Minimal AI case generator via OpenAI-compatible API.
 * Env:
 *  - AI_API_KEY (required)
 *  - AI_MODEL   (default: gpt-4o-mini)
 */
import type { Handler } from '@netlify/functions';
import { z } from 'zod';
import { CASE_GEN_SYSTEM, caseGenUserPrompt } from '../prompts/caseGen';

// --- tiny server-side schema to validate AI output ---
const ActionScoreSchema = z.object({
  learn: z.number().int().min(-5).max(10).optional(),
  must_have: z.boolean().optional()
}).strict();

const CaseActionSchema = z.object({
  id: z.string().min(1),
  text: z.string().min(1).max(140),
  cost: z.number().int().min(0).max(5).optional(),
  reveal_text: z.string().max(400).optional(),
  reveal_image: z.string().url().or(z.string().startsWith('/')).optional(),
  score: ActionScoreSchema.optional()
}).strict();

const CaseSchema = z.object({
  id: z.string().min(1).max(64),
  specialty: z.string().min(2).max(40),
  difficulty: z.union([z.literal(1), z.literal(2), z.literal(3)]),
  meta: z.object({
    title: z.string().min(3).max(120),
    est_time_min: z.number().int().min(1).max(30).optional(),
    authors: z.array(z.string()).optional()
  }).strict(),
  intro: z.object({
    demographics: z.record(z.any()).optional(),
    chief_complaint: z.string().min(2).max(120),
    vitals: z.record(z.any()).optional(),
    context: z.string().max(240).optional()
  }).strict(),
  actions: z.object({
    history: z.array(CaseActionSchema).min(1).max(10),
    exam: z.array(CaseActionSchema).min(0).max(10),
    tests: z.array(CaseActionSchema).min(0).max(10)
  }).strict(),
  solution: z.object({
    dx_primary: z.string().min(2).max(120),
    ddx: z.array(z.string().min(2).max(120)).max(6).optional(),
    management_first: z.array(z.string().min(2).max(160)).max(8).optional(),
    red_flags: z.array(z.string().min(2).max(160)).max(8).optional(),
    teaching_points: z.array(z.string().min(2).max(160)).max(8).optional()
  }).strict(),
  references: z.array(z.string().min(2).max(120)).max(8).optional()
}).strict();

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';

export const handler: Handler = async (event) => {
  try {
    if (event.httpMethod !== 'POST') return { statusCode: 405, body: 'Method Not Allowed' };

    const { specialty = 'cardiology', difficulty = 2 } = JSON.parse(event.body || '{}');
    const key = process.env.AI_API_KEY;
    const model = process.env.AI_MODEL || 'gpt-4o-mini';
    if (!key) return { statusCode: 500, body: 'Missing AI_API_KEY' };

    const messages = [
      { role: 'system', content: CASE_GEN_SYSTEM },
      { role: 'user', content: caseGenUserPrompt({ specialty, difficulty }) }
    ];

    const r = await fetch(OPENAI_URL, {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        temperature: 0.2,
        messages,
        response_format: { type: 'json_object' },
        max_tokens: 900
      })
    });

    const data = await r.json();
    const content = data?.choices?.[0]?.message?.content;
    if (!content) return { statusCode: 502, body: 'Bad AI response' };

    // Validate AI JSON
    const parsed = CaseSchema.parse(JSON.parse(content));

    // Clamp lengths to be safe
    parsed.actions.history = parsed.actions.history.slice(0, 6);
    parsed.actions.exam = parsed.actions.exam.slice(0, 6);
    parsed.actions.tests = parsed.actions.tests.slice(0, 6);

    return { statusCode: 200, body: JSON.stringify(parsed) };
  } catch (err: any) {
    console.error('case-gen error', err);
    return { statusCode: 500, body: JSON.stringify({ error: String(err?.message || err) }) };
  }
};
