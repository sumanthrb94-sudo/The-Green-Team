/**
 * The key-facts row — the icon strip a portal puts right under the title so a
 * buyer gets the shape of the thing in two seconds. Every fact is real data
 * from the listing; anything absent is simply not shown, never padded.
 */
import type { LucideIcon } from 'lucide-react';
import { Building2, Trees, Layers, Hammer, KeyRound, Sparkles, Ruler, Building, CalendarCheck, ShieldCheck } from 'lucide-react';
import type { Sanctuary } from '@/lib/data/sanctuaries';
import { stageLabel } from '@/lib/data/categories';
import { cn } from '@/lib/utils';

interface Fact {
  Icon: LucideIcon;
  label: string;
  value: string;
  accent?: boolean;
}

export function KeyFacts({ sanctuary: s }: { sanctuary: Sanctuary }) {
  const StageIcon = s.stage === 'completed' ? KeyRound : s.stage === 'upcoming' ? Sparkles : Hammer;
  const facts = [
    s.category
      ? { Icon: s.category === 'villas' ? Building2 : Trees, label: 'Type', value: s.category === 'villas' ? 'Villas' : 'Plots' }
      : null,
    s.plots && s.plots > 0
      ? { Icon: Layers, label: 'Inventory', value: `${s.plots} ${s.category === 'villas' ? 'homes' : 'plots'}` }
      : null,
    { Icon: StageIcon, label: 'Stage', value: stageLabel(s.stage) },
    s.plotRange ? { Icon: Ruler, label: 'Sizes', value: s.plotRange } : null,
    s.architect ? { Icon: Building, label: 'Developer', value: s.architect } : null,
    s.possession ? { Icon: CalendarCheck, label: 'Possession', value: s.possession } : null,
    s.rera ? { Icon: ShieldCheck, label: 'RERA', value: s.rera, accent: true } : null,
  ].filter((f): f is Fact => Boolean(f));

  return (
    <div className="flex gap-3 overflow-x-auto no-scrollbar -mx-6 px-6 md:mx-0 md:px-0 md:flex-wrap">
      {facts.map(f => (
        <div
          key={f.label}
          className="flex-shrink-0 w-[9rem] md:w-auto md:flex-1 md:min-w-[9rem] p-4 rounded-2xl border border-outline/12 bg-surface-container-low"
        >
          <span
            className={cn(
              'w-10 h-10 rounded-full flex items-center justify-center mb-3',
              f.accent ? 'bg-primary/10 text-primary' : 'bg-surface border border-outline/10 text-primary/70',
            )}
          >
            <f.Icon className="w-4.5 h-4.5" />
          </span>
          <p className="text-[8px] uppercase tracking-[0.2em] font-bold text-secondary/50">{f.label}</p>
          <p className="text-sm font-semibold text-on-surface mt-0.5 leading-snug">{f.value}</p>
        </div>
      ))}
    </div>
  );
}
