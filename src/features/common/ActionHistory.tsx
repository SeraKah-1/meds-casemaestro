export function ActionHistory({ picks }: { picks: string[] }) {
  if (!picks?.length) return null;
  return (
    <section className="bg-white border rounded-lg p-4 shadow-sm">
      <h2 className="font-semibold">Action History</h2>
      <ul className="mt-2 text-sm text-slate-700 list-disc pl-5">
        {picks.map((id) => (
          <li key={id}>{id}</li>
        ))}
      </ul>
    </section>
  );
}
