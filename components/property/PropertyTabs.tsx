'use client';

import { useState } from 'react';
import { Gallery } from './Gallery';
import { LayoutPlan } from './LayoutPlan';
import { InvestPanel } from './InvestPanel';
import type { Sanctuary } from '@/lib/data/sanctuaries';
import { cn } from '@/lib/utils';

export function PropertyTabs({ sanctuary }: { sanctuary: Sanctuary }) {
  const hasLayout = Boolean(sanctuary.sitePlanSrc);
  const tabs = ['Gallery', ...(hasLayout ? ['Layout Plan'] : []), 'Invest'] as const;
  const [tab, setTab] = useState<string>('Gallery');

  return (
    <div>
      <div className="flex border-b border-outline/15 mb-10 overflow-x-auto no-scrollbar" role="tablist">
        {tabs.map(t => (
          <button
            key={t}
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn(
              'flex-shrink-0 px-6 md:px-10 py-4 text-[10px] uppercase tracking-[0.4em] font-bold transition-all border-b-2 -mb-px',
              tab === t
                ? 'text-on-surface border-primary'
                : 'text-secondary/40 border-transparent hover:text-secondary'
            )}
          >
            {t}
          </button>
        ))}
      </div>

      {tab === 'Gallery' && <Gallery images={sanctuary.plotImages ?? [sanctuary.image]} title={sanctuary.title} />}
      {tab === 'Layout Plan' && hasLayout && <LayoutPlan sanctuary={sanctuary} />}
      {tab === 'Invest' && <InvestPanel sanctuary={sanctuary} />}
    </div>
  );
}
