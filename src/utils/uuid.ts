// Tiny UUID helper without extra deps.
// Prefer crypto.randomUUID when available; fallback to a compact variant.

export function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  // Fallback: timestamp + random base36
  return (
    'u-' +
    Date.now().toString(36) +
    '-' +
    Math.random().toString(36).slice(2, 10)
  );
}
