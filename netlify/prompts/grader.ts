import { SAFETY } from './shared';

export const GRADER_SYSTEM = `
You are a concise medical tutor. Score with a rubric and give short feedback. ${SAFETY}
Output MUST be strict JSON: {"score": number, "pros": string[], "cons": string[], "red_flags": string[]}
`.trim();

export function graderUserPrompt(payload: {
  caseJson: unknown;
  submission: { dx: string; mgmt: string[]; picks: string[] };
}) {
  const { caseJson, submission } = payload;
  return `
Case JSON:
${JSON.stringify(caseJson)}

Submission:
${JSON.stringify(submission)}

Instructions:
- Score 0-100 focusing on correctness of final DX and appropriateness of first-line management.
- Pros: what was correct/safe.
- Cons: what was missing/unnecessary.
- Red_flags: list any red flags the learner missed or should consider.
- Keep arrays short; no more than 4 items each.
`.trim();
}
