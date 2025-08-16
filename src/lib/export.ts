import type { SaveEntry } from '../types/game';

export function downloadJson(s: SaveEntry) {
  const blob = new Blob([JSON.stringify(s, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  trigger(url, `${s.caseJson.id}.json`);
}

export function downloadMarkdown(s: SaveEntry) {
  const lines = [
    `# ${s.caseJson.meta.title}`,
    '',
    `**Specialty:** ${s.specialty}  `,
    `**Difficulty:** ${s.difficulty}  `,
    `**Saved at:** ${new Date(s.created_at).toLocaleString()}`,
    '',
    '## Final Diagnosis',
    s.submission?.dx ?? '-',
    '',
    '## Initial Management',
    ...(s.submission?.mgmt ?? ['-']).map((x) => `- ${x}`),
    '',
    '## Actions Taken',
    ...(s.submission?.picks ?? ['-']).map((x) => `- ${x}`)
  ].join('\n');
  const blob = new Blob([lines], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  trigger(url, `${s.caseJson.id}.md`);
}

function trigger(url: string, name: string) {
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
