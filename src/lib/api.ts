// src/lib/api.ts
export interface CaseData {
  caseTitle: string;
  chiefComplaint: string;
  patientBackground: string;
  actionPoints: number;
  investigations: {
    Anamnesis: { label: string; cost: number; detail: string }[];
    "Pemeriksaan Fisik": { label: string; cost: number; detail: string }[];
    "Pemeriksaan Penunjang": { label: string; cost: number; detail: string }[];
  };
  finalDiagnosis: string;
  discussion: string;
}

export interface ReviewData {
  diagnosisEvaluation: string;
  reasoningCritique: string;
  efficiencyComment: string;
  overallRating: number;
}

const API_BASE = "https://api.openai.com/v1/chat/completions";

async function callOpenAI(apiKey: string, prompt: string) {
  const response = await fetch(API_BASE, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini", // default model
      messages: [{ role: "user", content: prompt }],
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API failed: ${response.status}`);
  }
  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || "";
  const cleaned = text.replace(/^```json\s*/, "").replace(/\s*```$/, "");
  return JSON.parse(cleaned);
}

export async function generateCase(
  apiKey: string,
  specialty: string,
  difficulty: string
): Promise<CaseData> {
  const prompt = `
You are a medical case generator for a clinical reasoning game.
Generate a case for specialty: ${specialty}, difficulty: ${difficulty}.
Return strictly JSON.

IMPORTANT: Always output bilingual (English + Indonesian).
For every field, write in English then add Indonesian translation in parentheses.

Schema:
{
  "caseTitle": "...",
  "chiefComplaint": "...",
  "patientBackground": "...",
  "actionPoints": 100 | 80 | 60,
  "investigations": {
    "Anamnesis": [ { "label": "...", "cost": number, "detail": "..." } ],
    "Pemeriksaan Fisik": [ { "label": "...", "cost": number, "detail": "..." } ],
    "Pemeriksaan Penunjang": [ { "label": "...", "cost": number, "detail": "..." } ]
  },
  "finalDiagnosis": "...",
  "discussion": "..."
}`;

  return await callOpenAI(apiKey, prompt);
}

export async function reviewDiagnosis(
  apiKey: string,
  caseData: CaseData,
  userSubmission: { diagnosis: string; analysis: string },
  actionPoints: number
): Promise<ReviewData> {
  const prompt = `
You are a senior medical consultant reviewing a junior doctor's work.

Case: ${JSON.stringify(caseData)}
Submission:
- Diagnosis: "${userSubmission.diagnosis}"
- Reasoning: "${userSubmission.analysis}"
- Remaining AP: ${actionPoints}/${caseData.actionPoints}

IMPORTANT: Output must be bilingual (English + Indonesian).
Every string field: English first, then Indonesian translation.

Schema:
{
  "diagnosisEvaluation": "...",
  "reasoningCritique": "...",
  "efficiencyComment": "...",
  "overallRating": 1-5
}`;

  return await callOpenAI(apiKey, prompt);
}
