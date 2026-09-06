'use client';

/** "Why consider X?" — the first few features as a highlight card, expandable. */
import { useState } from 'react';
import { Target, Check, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

const SHOW = 4;

export function Highlights({ title, features }: { title: string; features: string[] }) {
  const [open, setOpen] = useState(false);
  if (!features.length) return null;
  const shown = open ? features : features.slice(0, SHOW);
  const more = features.length - SHOW;

  return (
    <div className="mt-8 rounded-3xl bg-gold/8 border border-gold/20 p-5 md:p-6">
      <p className="flex items-center gap-2.5 font-headline font-bold text-lg text-on-surface mb-4">
        <Target className="w-5 h-5 text-gold flex-shrink-0" /> Why consider {title}?
      </p>
      <ul className="space-y-2.5">
        {shown.map(f => (
          <li key={f} className="flex items-start gap-2.5 text-sm text-on-surface/85 leading-relaxed">
            <Check className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            {f}
          </li>
        ))}
      </ul>
      {more > 0 && (
        <button
          onClick={() => setOpen(o => !o)}
          className="mt-4 inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.25em] font-bold text-primary hover:underline underline-offset-4"
        >
          {open ? 'Show less' : `View ${more} more`}
          <ChevronDown className={cn('w-3.5 h-3.5 transition-transform', open && 'rotate-180')} />
        </button>
      )}
    </div>
  );
}
