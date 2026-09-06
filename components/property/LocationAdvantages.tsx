/**
 * Location advantages — built from the commute line we measured, not from a
 * scraped POI list. Each " · "-separated fact becomes a card, with a link to
 * the environmental map for the full picture (AQI heatmap, forest boundaries,
 * ring-road exits).
 */
import Link from 'next/link';
import { MapPin, Clock, ArrowUpRight, ShieldCheck } from 'lucide-react';
import type { Sanctuary } from '@/lib/data/sanctuaries';

export function LocationAdvantages({ sanctuary: s }: { sanctuary: Sanctuary }) {
  const items = s.commute
    .split('·')
    .map(x => x.trim())
    .filter(Boolean);

  return (
    <div>
      <p className="flex items-center gap-2 text-sm text-on-surface/85">
        <MapPin className="w-4 h-4 text-primary/70 flex-shrink-0" /> {s.location}
      </p>
      <div className="grid sm:grid-cols-2 gap-3 mt-5">
        {items.map(t => (
          <div key={t} className="flex items-center gap-3 p-4 rounded-2xl border border-outline/12 bg-surface-container-low">
            <span className="w-10 h-10 rounded-full bg-surface border border-outline/10 flex items-center justify-center text-primary/70 flex-shrink-0">
              <Clock className="w-4 h-4" />
            </span>
            <span className="text-sm font-semibold text-on-surface">{t}</span>
          </div>
        ))}
      </div>
      <p className="mt-4 flex items-start gap-2 text-xs text-secondary/70 leading-relaxed">
        <ShieldCheck className="w-3.5 h-3.5 text-primary/60 mt-0.5 flex-shrink-0" />
        Commute, air and noise figures were measured by us on site, not copied from a brochure.
      </p>
      <Link
        href="/map"
        className="mt-5 inline-flex items-center gap-1.5 text-[10px] uppercase tracking-[0.25em] font-bold text-primary hover:underline underline-offset-4"
      >
        See it on the sanctuary map <ArrowUpRight className="w-3.5 h-3.5" />
      </Link>
    </div>
  );
}
