import type { SaveEntry } from '../types/game';

const KEY = 'saves';

export function loadCases(): SaveEntry[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

export function saveCase(entry: SaveEntry) {
  const all = loadCases();
  all.push(entry);
  localStorage.setItem(KEY, JSON.stringify(all));
}

export function deleteCase(id: string) {
  const all = loadCases().filter((s) => s.id !== id);
  localStorage.setItem(KEY, JSON.stringify(all));
}
