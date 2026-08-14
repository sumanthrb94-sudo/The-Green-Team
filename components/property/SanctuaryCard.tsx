'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { Wind, VolumeX, ArrowUpRight } from 'lucide-react';
import type { Sanctuary } from '@/lib/data/sanctuaries';

const BADGES: Record<string, { top: string; sub?: string }> = {
  agartha: { top: 'Open Reservation', sub: 'TGT Channel Partner' },
  syl: { top: 'Pre-Investor Phase', sub: 'TGT Channel Partner' },
  'dates-county': { top: 'Now Booking', sub: 'TGT × Planet Green' },
};

export function SanctuaryCard({ sanctuary, index = 0 }: { sanctuary: Sanctuary; index?: number }) {
  const badge = BADGES[sanctuary.id] ?? { top: 'Curated' };
  const priceNote = sanctuary.pricePerSqYd ? `₹${sanctuary.pricePerSqYd.toLocaleString('en-IN')}/sq yd` : null;

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay: index * 0.08, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="group relative rounded-3xl overflow-hidden aspect-[4/5] sm:aspect-[3/4]"
    >
      <Image
        src={sanctuary.image}
        alt={sanctuary.title}
        fill
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-black/20" />

      <div className="absolute top-5 left-5 flex flex-col gap-2 items-start">
        <span className="px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-sm border border-white/15 text-white text-[8px] uppercase tracking-[0.3em] font-bold">
          {badge.top}
        </span>
        {badge.sub && (
          <span className="px-3 py-1.5 rounded-full bg-black/35 backdrop-blur-sm text-white/70 text-[8px] uppercase tracking-[0.3em] font-bold">
            {badge.sub}
          </span>
        )}
      </div>

      <div className="absolute inset-x-0 bottom-0 p-6">
        <p className="text-[9px] uppercase tracking-[0.3em] text-white/50 font-bold mb-1 truncate">
          {sanctuary.commute}
        </p>
        <div className="flex items-end justify-between gap-3 mb-4">
          <h3 className="text-2xl font-headline font-bold text-white leading-tight">{sanctuary.title}</h3>
          <div className="text-right flex-shrink-0">
            {priceNote && <p className="text-[8px] text-white/40">{priceNote}</p>}
            <p className="text-lg font-headline font-bold text-white whitespace-nowrap">{sanctuary.memberPrice}</p>
          </div>
        </div>
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5">
              <Wind className="w-3.5 h-3.5 text-[#a3b18a]" />
              <span className="text-[9px] uppercase tracking-widest font-bold text-white/70">AQI {sanctuary.aqi}</span>
            </span>
            <span className="flex items-center gap-1.5">
              <VolumeX className="w-3.5 h-3.5 text-white/40" />
              <span className="text-[9px] uppercase tracking-widest font-bold text-white/70">{sanctuary.noise} dB</span>
            </span>
          </div>
          <Link
            href={`/sanctuaries/${sanctuary.id}`}
            className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 bg-white/10 backdrop-blur-sm border border-white/20 text-white text-[8px] uppercase tracking-widest font-bold rounded-xl hover:bg-[#a3b18a] hover:text-[#0a1208] hover:border-transparent transition-all"
          >
            View Details <ArrowUpRight className="w-3 h-3" />
          </Link>
        </div>
      </div>

      {/* whole-card click target under the explicit CTA */}
      <Link href={`/sanctuaries/${sanctuary.id}`} aria-label={sanctuary.title} className="absolute inset-0 z-[-1]" />
    </motion.article>
  );
}
