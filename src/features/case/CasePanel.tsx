import type { CaseFile, CaseAction } from '../../types/case';
import { Skeleton } from '../../components/Skeleton';

export function CasePanel({
  caseJson,
  picks,
  onTogglePick,
  loading = false
}: {
  caseJson: CaseFile | null;
  picks: string[];
  onTogglePick: (id: string) => void;
  loading?: boolean;
}) {
  if (loading) {
    return (
      <section className="bg-white border rounded-lg p-4 shadow-sm">
        <div className="flex items-start justify-between">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-20" />
        </div>
        <div className="mt-3 grid gap-3 sm:grid-cols-3">
          <SkInfo />
          <SkInfo />
          <SkInfo />
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-3">
          <SkList />
          <SkList />
          <SkList />
        </div>
      </section>
    );
  }

  if (!caseJson) {
    return (
      <section className="bg-white border rounded-lg p-4 shadow-sm">
        <h2 className="font-semibold">Case</h2>
        <p className="mt-2 text-sm text-slate-700">
          Click <b>Start Case</b> above to generate a case.
        </p>
      </section>
    );
  }

  const { meta, intro, actions, solution } = caseJson;

  return (
    <section className="bg-white border rounded-lg p-4 shadow-sm">
      <div className="flex items-start justify-between">
        <h2 className="font-semibold">{meta.title}</h2>
        <span className="text-[10px] text-slate-500">
          {caseJson.specialty} • diff {caseJson.difficulty}
        </span>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-3">
        <InfoCard title="Chief Complaint">{intro.chief_complaint}</InfoCard>
        <InfoCard title="Demographics">{fmtObj(intro.demographics)}</InfoCard>
        <InfoCard title="Vitals">{fmtObj(intro.vitals)}</InfoCard>
      </div>

      <div className="mt-4 grid gap-4 sm:grid-cols-3">
        <ActionGroup title="History" items={actions.history} picks={picks} onToggle={onTogglePick} />
        <ActionGroup title="Exam" items={actions.exam} picks={picks} onToggle={onTogglePick} />
        <ActionGroup title="Tests" items={actions.tests} picks={picks} onToggle={onTogglePick} />
      </div>

      <div className="mt-5 p-3 bg-slate-50 border rounded text-xs text-slate-600">
        <b>Teaching points preview:</b>{' '}
        {(solution.teaching_points ?? []).slice(0, 2).join(' • ')}
      </div>
    </section>
  );
}

function InfoCard({ title, children }: { title: string; children?: any }) {
  return (
    <div className="border rounded p-3 bg-white">
      <div className="text-xs uppercase tracking-wide text-slate-500">{title}</div>
      <div className="text-sm text-slate-800 mt-1">{children || '-'}</div>
    </div>
  );
}

function ActionGroup({
  title,
  items,
  picks,
  onToggle
}: {
  title: string;
  items: CaseAction[];
  picks: string[];
  onToggle: (id: string) => void;
}) {
  return (
    <div className="border rounded p-3">
      <div className="text-xs uppercase tracking-wide text-slate-500 mb-2">{title}</div>
      <div className="space-y-2">
        {items.map((a) => {
          const selected = picks.includes(a.id);
          return (
            <button
              key={a.id}
              onClick={() => onToggle(a.id)}
              className={
                'w-full text-left border rounded p-2 text-sm ' +
                (selected ? 'bg-blue-50 border-blue-300' : 'bg-white hover:bg-slate-50')
              }
            >
              <div className="flex items-center justify-between">
                <span>{a.text}</span>
                {selected && <span className="text-[10px] text-blue-700">selected</span>}
              </div>
              {selected && a.reveal_text && (
                <div className="mt-1 text-xs text-slate-600">{a.reveal_text}</div>
              )}
              {selected && a.reveal_image && (
                <img src={a.reveal_image} alt="" className="mt-2 rounded border" loading="lazy" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** Pretty-print small objects like vitals/demographics */
function fmtObj(obj?: Record<string, any>): string {
  if (!obj || typeof obj !== 'object') return '-';
  const entries = Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== '');
  if (!entries.length) return '-';
  return entries
    .map(([k, v]) => `${k}: ${typeof v === 'number' ? v : String(v)}`)
    .join(' • ');
}

// --- skeleton subcomponents ---
function SkInfo() {
  return (
    <div className="border rounded p-3 bg-white">
      <Skeleton className="h-3 w-24" />
      <div className="mt-2 space-y-2">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
      </div>
    </div>
  );
}
function SkList() {
  return (
    <div className="border rounded p-3 bg-white">
      <Skeleton className="h-3 w-20 mb-2" />
      <div className="space-y-2">
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
        <Skeleton className="h-9 w-full" />
      </div>
    </div>
  );
}
