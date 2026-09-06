/**
 * "Bookings from …" — the headline pricing strip. The entry price, the rate
 * and the size range are public (they're in the page title and the search
 * snippet, so hiding them would be cloaking). The unit-by-unit sheet is real
 * and sits behind sign-in further down; this strip points there rather than
 * inventing plausible-looking unit cards.
 */
import { ArrowRight, Flame } from 'lucide-react';
import type { Sanctuary } from '@/lib/data/sanctuaries';
import { estimateFromPrice, priceLabel } from '@/lib/data/listing';

export function PricingStrip({ sanctuary: s }: { sanctuary: Sanctuary }) {
  const est = estimateFromPrice(s);
  const from = s.memberPrice || (est ? priceLabel(est) : 'On request');
  const rate = s.pricePerSqYd
    ? `₹${s.pricePerSqYd.toLocaleString('en-IN')} / sq yd · headline rate`
    : /sft/i.test(s.memberPrice ?? '')
      ? 'Headline rate · unit sizes below'
      : null;
  const units = s.plots && s.plots > 0 ? s.plots : null;
  const noun = s.category === 'villas' ? 'homes' : 'plots';
  const reserved = units && s.reserved ? Math.min(s.reserved, units) : 0;

  return (
    <div className="mt-6 rounded-3xl border border-outline/12 bg-surface p-5 md:p-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-secondary/50">Bookings from</p>
          <p className="font-headline font-extrabold tracking-[-0.02em] text-3xl md:text-4xl text-on-surface mt-1">{from}</p>
          {rate && <p className="text-xs text-secondary mt-1.5">{rate}</p>}
        </div>
        <div className="flex flex-wrap gap-2">
          {s.plotRange && <Chip>{s.plotRange}</Chip>}
          {units && <Chip>{units} {noun}</Chip>}
          {reserved > 0 && (
            <Chip gold>
              <Flame className="w-3 h-3" /> {reserved} of {units} reserved
            </Chip>
          )}
        </div>
      </div>
      <a
        href="#insights"
        className="mt-5 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] font-bold text-primary hover:underline underline-offset-4"
      >
        Unit-by-unit pricing <ArrowRight className="w-3.5 h-3.5" />
      </a>
    </div>
  );
}

function Chip({ children, gold }: { children: React.ReactNode; gold?: boolean }) {
  return (
    <span
      className={
        gold
          ? 'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gold/15 text-gold text-[10px] font-bold'
          : 'inline-flex items-center px-3 py-1.5 rounded-full bg-surface-container text-on-surface/80 text-[10px] font-semibold'
      }
    >
      {children}
    </span>
  );
}
