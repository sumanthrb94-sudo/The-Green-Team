/**
 * The specifications table — every per-type parameter the admin filled in
 * (lib/data/property-specs.ts), labelled for this property's type. Unset
 * values are omitted, never shown as "—"; with nothing filled, it renders nothing.
 */
import type { Sanctuary } from '@/lib/data/sanctuaries';
import { typeLabel } from '@/lib/data/categories';
import { formatSpec, specsFor } from '@/lib/data/property-specs';

export function Specifications({ sanctuary: s }: { sanctuary: Sanctuary }) {
  const values = s as unknown as Record<string, unknown>;
  const rows = specsFor(s.category)
    .map(f => ({ label: f.label, value: formatSpec(f, values[f.key]) }))
    .filter((r): r is { label: string; value: string } => r.value !== null);
  if (!rows.length) return null;

  return (
    <div className="mt-6 rounded-3xl border border-outline/12 bg-surface p-5 md:p-6">
      <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-secondary/50 mb-4">
        {typeLabel(s.category)} specifications
      </p>
      <dl className="grid sm:grid-cols-2 gap-x-8">
        {rows.map(r => (
          <div key={r.label} className="flex justify-between gap-4 py-2.5 border-b border-outline/10">
            <dt className="text-xs text-secondary/70">{r.label}</dt>
            <dd className="text-xs font-semibold text-on-surface text-right">{r.value}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
