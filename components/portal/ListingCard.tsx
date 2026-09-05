'use client';

/**
 * The listing card — the atom of the portal. Where the old SanctuaryCard was a
 * full-bleed image with an overlaid title (a magazine plate), this is a real
 * listing tile in the NoBroker / Housing.com sense: a photo up top, then a
 * solid info block a buyer can scan in a second — price first, then the name,
 * the locality, a row of hard specs, and two clear actions.
 *
 * The Green Team difference is in what the spec row leads with: air and noise
 * sit beside size and stage, because that is what we actually sell.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { MapPin, Wind, VolumeX, Ruler, Heart, ArrowUpRight } from 'lucide-react';
import type { Sanctuary } from '@/lib/data/sanctuaries';
import { stageLabel } from '@/lib/data/categories';
import { estimateFromPrice, priceLabel } from '@/lib/data/listing';
import { cn } from '@/lib/utils';

const SHORTLIST_KEY = 'gt_shortlist';

function useShortlisted(id: string): [boolean, () => void] {
  const [on, setOn] = useState(false);
  useEffect(() => {
    try {
      const raw = JSON.parse(localStorage.getItem(SHORTLIST_KEY) || '[]');
      setOn(Array.isArray(raw) && raw.includes(id));
    } catch {}
  }, [id]);
  const toggle = () => {
    try {
      const raw: string[] = JSON.parse(localStorage.getItem(SHORTLIST_KEY) || '[]');
      const next = raw.includes(id) ? raw.filter(x => x !== id) : [...raw, id];
      localStorage.setItem(SHORTLIST_KEY, JSON.stringify(next));
      setOn(next.includes(id));
    } catch {}
  };
  return [on, toggle];
}

export function ListingCard({ sanctuary: s }: { sanctuary: Sanctuary }) {
  const [saved, toggleSaved] = useShortlisted(s.id);
  const from = estimateFromPrice(s);
  const stage = stageLabel(s.stage);
  const rate = s.pricePerSqYd
    ? `₹${s.pricePerSqYd.toLocaleString('en-IN')}/sq yd`
    : /sft/i.test(s.memberPrice ?? '')
      ? s.memberPrice
      : null;
  const size = s.plotRange ?? null;
  const units = s.plots && s.plots > 0 ? `${s.plots} ${s.category === 'villas' ? 'homes' : 'plots'}` : null;

  return (
    <article className="group flex flex-col rounded-3xl overflow-hidden bg-surface border border-outline/12 hover:border-primary/35 hover:shadow-[0_12px_40px_-12px_rgba(45,58,29,0.25)] transition-all duration-500">
      {/* Photo */}
      <div className="relative aspect-[16/11] overflow-hidden">
        <Image
          src={s.image}
          alt={s.title}
          fill
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          className="object-cover transition-transform duration-[1.1s] ease-out group-hover:scale-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-black/10" />

        {/* Stage + investment badges */}
        <div className="absolute top-3.5 left-3.5 flex flex-wrap gap-2">
          <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-sm border border-white/15 text-white text-[8px] uppercase tracking-[0.22em] font-bold">
            {stage}
          </span>
          {s.investment && (
            <span className="px-2.5 py-1 rounded-full bg-gold/90 text-[#1a1a0a] text-[8px] uppercase tracking-[0.22em] font-bold">
              Investment
            </span>
          )}
        </div>

        {/* Shortlist */}
        <button
          onClick={toggleSaved}
          aria-label={saved ? 'Remove from shortlist' : 'Add to shortlist'}
          aria-pressed={saved}
          className="absolute top-3 right-3 w-9 h-9 rounded-full bg-black/40 backdrop-blur-sm border border-white/15 flex items-center justify-center hover:bg-black/60 transition-all"
        >
          <Heart className={cn('w-4 h-4 transition-all', saved ? 'fill-[#e2857b] text-[#e2857b]' : 'text-white/80')} />
        </button>

        {/* Price chip */}
        <div className="absolute bottom-3.5 left-3.5">
          <div className="px-3.5 py-2 rounded-2xl bg-white/95 backdrop-blur-sm">
            <p className="font-headline font-extrabold text-lg text-[#1a1c1a] leading-none">
              {s.memberPrice || (from ? priceLabel(from) : 'On request')}
            </p>
            {rate && <p className="text-[9px] text-[#586062] mt-0.5">{rate}</p>}
          </div>
        </div>
      </div>

      {/* Info block */}
      <div className="flex flex-col flex-1 p-5">
        <h3 className="font-headline font-bold text-lg text-on-surface leading-snug">{s.title}</h3>
        <p className="flex items-center gap-1.5 text-sm text-secondary/80 mt-1">
          <MapPin className="w-3.5 h-3.5 flex-shrink-0 text-primary/60" />
          <span className="truncate">{s.location}</span>
        </p>

        {/* Spec row */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-4 pt-4 border-t border-outline/10">
          {size && (
            <Spec icon={<Ruler className="w-3.5 h-3.5" />} label="Size" value={size} />
          )}
          {units && <Spec icon={<span className="text-primary/60 text-xs font-bold">#</span>} label="Inventory" value={units} />}
          <Spec icon={<Wind className="w-3.5 h-3.5" />} label="Air (AQI)" value={String(s.aqi)} accent />
          <Spec icon={<VolumeX className="w-3.5 h-3.5" />} label="Noise" value={`${s.noise} dB`} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5 mt-5 pt-1">
          <Link
            href={`/sanctuaries/${s.id}`}
            className="flex-1 flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-full bg-primary text-on-primary text-[10px] uppercase tracking-[0.2em] font-bold hover:opacity-90 transition-all"
          >
            View details <ArrowUpRight className="w-3.5 h-3.5" />
          </Link>
          <Link
            href={`/contact?interest=${s.category ?? 'general'}&property=${s.id}`}
            className="flex-1 text-center px-4 py-2.5 rounded-full border border-outline/25 text-[10px] uppercase tracking-[0.2em] font-bold text-on-surface/70 hover:border-primary hover:text-primary transition-all"
          >
            Enquire
          </Link>
        </div>
      </div>
    </article>
  );
}

function Spec({ icon, label, value, accent }: { icon: React.ReactNode; label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex items-start gap-2 min-w-0">
      <span className={cn('mt-0.5 flex-shrink-0', accent ? 'text-primary' : 'text-secondary/50')}>{icon}</span>
      <div className="min-w-0">
        <p className="text-[8px] uppercase tracking-[0.18em] font-bold text-secondary/45">{label}</p>
        <p className={cn('text-sm font-semibold truncate', accent ? 'text-primary' : 'text-on-surface/85')}>{value}</p>
      </div>
    </div>
  );
}
