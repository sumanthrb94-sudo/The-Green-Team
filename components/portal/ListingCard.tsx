'use client';

/**
 * The listing card — the atom of the portal, in an editorial cut.
 *
 * A portal card and a magazine plate both fail here: the first buries the
 * place under chips and buttons, the second hides the facts a buyer scans for.
 * So: a clean photo with only what belongs on it (stage, investment, shortlist),
 * then the price and name in the info block where they can breathe, one quiet
 * line of specs — leading with air and noise, because that is what we sell —
 * and a single primary action with Enquire as a quiet second.
 */
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Wind, VolumeX, Ruler, Layers, Heart, ArrowUpRight } from 'lucide-react';
import type { Sanctuary } from '@/lib/data/sanctuaries';
import { stageLabel } from '@/lib/data/categories';
import { estimateFromPrice, priceLabel } from '@/lib/data/listing';
import { useShortlist } from '@/lib/shortlist';
import { cn } from '@/lib/utils';

export function ListingCard({ sanctuary: s }: { sanctuary: Sanctuary }) {
  const [saved, toggleSaved] = useShortlist(s.id);
  const from = estimateFromPrice(s);
  const rate = s.pricePerSqYd
    ? `₹${s.pricePerSqYd.toLocaleString('en-IN')}/sq yd`
    : /sft/i.test(s.memberPrice ?? '')
      ? null // the headline already is the rate
      : null;
  const units = s.plots && s.plots > 0 ? `${s.plots} ${s.category === 'villas' ? 'homes' : 'plots'}` : null;

  return (
    <article className="group relative flex flex-col rounded-[1.75rem] overflow-hidden bg-surface border border-outline/10 hover:border-primary/30 hover:shadow-[0_24px_50px_-24px_rgba(45,58,29,0.35)] hover:-translate-y-0.5 transition-all duration-500">
      {/* Photo — only what belongs on it */}
      <Link href={`/sanctuaries/${s.id}`} className="relative block aspect-[4/3] overflow-hidden" aria-label={s.title}>
        <Image
          src={s.image}
          alt={s.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.04]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-black/5" />
        <div className="absolute top-3.5 left-3.5 flex gap-1.5">
          <span className="px-2.5 py-1 rounded-full bg-black/45 backdrop-blur-sm border border-white/15 text-white text-[8px] uppercase tracking-[0.22em] font-bold">
            {stageLabel(s.stage)}
          </span>
          {s.investment && (
            <span className="px-2.5 py-1 rounded-full bg-gold/90 text-[#1a1a0a] text-[8px] uppercase tracking-[0.22em] font-bold">
              Investment
            </span>
          )}
        </div>
      </Link>
      <button
        onClick={toggleSaved}
        aria-label={saved ? 'Remove from shortlist' : 'Add to shortlist'}
        aria-pressed={saved}
        className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/15 flex items-center justify-center hover:bg-black/60 transition-all"
      >
        <Heart className={cn('w-4 h-4 transition-all', saved ? 'fill-[#e2857b] text-[#e2857b]' : 'text-white/85')} />
      </button>

      {/* Info — price and name where they can breathe */}
      <div className="flex flex-col flex-1 p-5 md:p-6">
        <div className="flex items-baseline justify-between gap-3">
          <p className="font-headline font-extrabold tracking-[-0.01em] text-xl text-on-surface leading-none">
            {s.memberPrice || (from ? priceLabel(from) : 'On request')}
          </p>
          {rate && <p className="text-[11px] text-secondary/70 whitespace-nowrap">{rate}</p>}
        </div>
        <h3 className="font-headline font-bold text-lg text-on-surface leading-snug mt-3">
          <Link href={`/sanctuaries/${s.id}`} className="hover:text-primary transition-colors">
            {s.title}
          </Link>
        </h3>
        <p className="flex items-center gap-1.5 text-sm text-secondary/75 mt-1">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-primary/60" />
          <span className="truncate">{s.location}</span>
        </p>

        {/* One quiet line of specs */}
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1.5 mt-4 pt-4 border-t border-outline/10 text-[12px] text-on-surface/80">
          <li className="flex items-center gap-1.5 font-semibold text-primary">
            <Wind className="w-3.5 h-3.5" /> AQI {s.aqi}
          </li>
          <li className="flex items-center gap-1.5">
            <VolumeX className="w-3.5 h-3.5 text-secondary/50" /> {s.noise} dB
          </li>
          {s.plotRange && (
            <li className="flex items-center gap-1.5 min-w-0">
              <Ruler className="w-3.5 h-3.5 text-secondary/50 flex-shrink-0" />
              <span className="truncate">{s.plotRange}</span>
            </li>
          )}
          {units && (
            <li className="flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-secondary/50" /> {units}
            </li>
          )}
        </ul>

        {/* One primary action, one quiet second */}
        <div className="flex items-center justify-between gap-3 mt-5 pt-1">
          <Link
            href={`/sanctuaries/${s.id}`}
            className="group/btn inline-flex items-center gap-2 px-4.5 py-2.5 rounded-full bg-primary text-on-primary text-[10px] uppercase tracking-[0.2em] font-bold hover:opacity-90 transition-all"
          >
            View details
            <ArrowUpRight className="w-3.5 h-3.5 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
          </Link>
          <Link
            href={`/contact?interest=${s.category ?? 'general'}&property=${s.id}`}
            className="text-[10px] uppercase tracking-[0.2em] font-bold text-secondary/70 hover:text-primary transition-colors"
          >
            Enquire
          </Link>
        </div>
      </div>
    </article>
  );
}
