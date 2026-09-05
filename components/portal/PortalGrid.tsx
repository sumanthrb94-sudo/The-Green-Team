'use client';

/**
 * The browse grid with a delivery-stage filter.
 *
 * Empty stages are shown, not hidden. Today every listed property is ongoing,
 * so "Completed" has nothing in it — and a tab that quietly disappears would
 * imply we have completed stock we are not showing. Saying "nothing here yet"
 * is the honest version, and it points at /standard so the emptiness reads as
 * selectivity rather than absence.
 */
import { useState } from 'react';
import Link from 'next/link';
import { SanctuaryCard } from '@/components/property/SanctuaryCard';
import { STAGES, type Stage } from '@/lib/data/categories';
import type { Sanctuary } from '@/lib/data/sanctuaries';
import { cn } from '@/lib/utils';

export function PortalGrid({ sanctuaries }: { sanctuaries: Sanctuary[] }) {
  const [stage, setStage] = useState<Stage | 'all'>('all');

  const countOf = (s: Stage) => sanctuaries.filter(p => (p.stage ?? 'ongoing') === s).length;
  const shown = stage === 'all' ? sanctuaries : sanctuaries.filter(p => (p.stage ?? 'ongoing') === stage);

  return (
    <div>
      <div
        role="tablist"
        aria-label="Delivery stage"
        className="flex flex-wrap gap-2 mb-8"
      >
        {[{ value: 'all' as const, label: 'All', count: sanctuaries.length }, ...STAGES.map(s => ({ ...s, count: countOf(s.value) }))].map(t => (
          <button
            key={t.value}
            role="tab"
            aria-selected={stage === t.value}
            onClick={() => setStage(t.value)}
            className={cn(
              'px-4 py-2 rounded-full border text-[9px] uppercase tracking-[0.3em] font-bold transition-all',
              stage === t.value
                ? 'bg-primary text-on-primary border-primary'
                : 'border-outline/25 text-secondary/60 hover:text-on-surface hover:border-outline/50'
            )}
          >
            {t.label}
            <span className={cn('ml-2 tabular-nums', stage === t.value ? 'opacity-70' : 'opacity-40')}>{t.count}</span>
          </button>
        ))}
      </div>

      {shown.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {shown.map((s, i) => (
            <SanctuaryCard key={s.id} sanctuary={s} index={i} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-outline/30 p-10 md:p-14 text-center">
          <p className="font-serif text-2xl md:text-3xl font-light text-on-surface mb-3">
            Nothing here clears the bar yet.
          </p>
          <p className="text-sm text-secondary/70 max-w-md mx-auto leading-relaxed mb-6">
            We list a property only when it passes all six parts of our standard. When a{' '}
            {STAGES.find(s => s.value === stage)?.label.toLowerCase()} project does, it appears here — and
            not before.
          </p>
          <Link
            href="/standard"
            className="inline-block px-6 py-3 rounded-full border border-outline/25 text-[10px] uppercase tracking-[0.3em] font-bold text-on-surface/70 hover:border-primary hover:text-primary transition-all"
          >
            Read the standard
          </Link>
        </div>
      )}
    </div>
  );
}
