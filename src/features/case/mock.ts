import type { CaseFile } from '../../types/case';

export function generateMockCase(specialty: string, difficulty: 1 | 2 | 3): CaseFile {
  const id = `mock-${specialty}-${Date.now()}`;
  return {
    id,
    specialty,
    difficulty,
    meta: { title: `Mock ${capitalize(specialty)} Case` },
    intro: {
      demographics: { age: 58, sex: 'M' },
      chief_complaint: 'Chest pain',
      vitals: { hr: 104, bp: '92/58', rr: 22, temp: 36.8, spo2: 92 },
      context: 'Pain started 45 minutes ago while walking.'
    },
    actions: {
      history: [
        { id: 'onset', text: 'Ask onset & triggers', reveal_text: 'Sudden onset on exertion; nausea present.', score: { learn: 2 } },
        { id: 'risk', text: 'Ask risk factors', reveal_text: 'Smoker, HTN, HLD.', score: { learn: 2 } }
      ],
      exam: [
        { id: 'cardiac_exam', text: 'Focused cardiac exam', reveal_text: 'Diaphoretic, S3, cool extremities', score: { learn: 1 } }
      ],
      tests: [
        { id: 'ecg', text: '12-lead ECG', reveal_text: 'ST elevations II, III, aVF; reciprocal I, aVL', score: { learn: 4, must_have: true } },
        { id: 'troponin', text: 'Troponin I', reveal_text: '> 100x ULN', score: { learn: 2 } },
        { id: 'cxr', text: 'Chest X-ray', reveal_text: 'Mild congestion', score: { learn: -1 } }
      ]
    },
    solution: {
      dx_primary: 'Inferior STEMI',
      ddx: ['Pulmonary embolism', 'Aortic dissection', 'GERD'],
      management_first: ['Activate cath lab (PCI)', 'Aspirin 325 mg chew + P2Y12', 'Heparin per protocol'],
      red_flags: ['Hypotension'],
      teaching_points: ['ECG localization for inferior MI', 'Door-to-balloon targets']
    }
  };
}

function capitalize(s: string) {
  return s.charAt(0).toUpperCase() + s.slice(1);
}
