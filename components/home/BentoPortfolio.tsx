'use client';

/** Bento-grid portfolio — Agartha as the anchor tile, editorial asymmetry. */
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { ArrowUpRight, Wind, VolumeX } from 'lucide-react';
import type { Sanctuary } from '@/lib/data/sanctuaries';
import { showsAqi } from '@/lib/data/categories';

function Tile({
  s,
  large = false,
  index = 0,
  badge,
}: {
  s: Sanctuary;
  large?: boolean;
  index?: number;
  badge: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 28 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ delay: index * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
      className={large ? 'md:col-span-2 md:row-span-2' : ''}
    >
      <Link
        href={`/sanctuaries/${s.id}`}
        className={`group relative block rounded-2xl sm:rounded-[2rem] overflow-hidden h-full ${large ? 'min-h-[20rem] sm:min-h-[26rem] md:min-h-full' : 'min-h-[14rem] sm:min-h-[16rem]'}`}
      >
        <Image
          src={s.image}
          alt={s.title}
          fill
          sizes={large ? '(max-width:768px) 100vw, 60vw' : '(max-width:768px) 100vw, 30vw'}
          className="object-cover transition-transform duration-[1.4s] ease-out group-hover:scale-[1.05]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/20 to-black/25" />

        <span className="absolute top-3.5 left-3.5 sm:top-5 sm:left-5 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/15 text-white text-[7.5px] sm:text-[8px] uppercase tracking-[0.25em] sm:tracking-[0.3em] font-bold">
          {badge}
        </span>
        <span className="absolute top-3.5 right-3.5 sm:top-5 sm:right-5 w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center opacity-0 group-hover:opacity-100 -translate-y-1 group-hover:translate-y-0 transition-all">
          <ArrowUpRight className="w-4 h-4 text-white" />
        </span>

        <div className="absolute inset-x-0 bottom-0 p-4 sm:p-6 md:p-7">
          <p className="text-[8.5px] sm:text-[9px] uppercase tracking-[0.25em] text-white/45 font-bold mb-1">{s.location}</p>
          <div className="flex items-end justify-between gap-3 sm:gap-4">
            <h3 className={`font-headline font-bold text-white leading-tight ${large ? 'text-2xl sm:text-3xl md:text-4xl' : 'text-lg sm:text-xl'}`}>
              {s.title}
            </h3>
            <p className={`font-headline font-bold text-[#c8a951] whitespace-nowrap ${large ? 'text-lg sm:text-xl' : 'text-sm sm:text-base'}`}>
              {s.memberPrice}
            </p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 mt-2 sm:mt-3">
            {showsAqi(s) && (
              <span className="flex items-center gap-1.5 text-[8.5px] sm:text-[9px] uppercase tracking-wider font-bold text-white/70">
                <Wind className="w-3.5 h-3.5 text-[#a3b18a]" /> AQI {s.aqi}
              </span>
            )}
            {s.noise > 0 && (
              <span className="flex items-center gap-1.5 text-[8.5px] sm:text-[9px] uppercase tracking-wider font-bold text-white/70">
                <VolumeX className="w-3.5 h-3.5 text-white/40" /> {s.noise} dB
              </span>
            )}
            {large && s.plotRange && (
              <span className="hidden md:inline text-[9px] uppercase tracking-widest font-bold text-white/45">
                {s.plotRange}
              </span>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

const BADGES: Record<string, string> = {
  agartha: 'Flagship · Open Reservation',
  syl: 'Pre-Investor Phase',
  'dates-county': 'Now Booking',
};

export function BentoPortfolio({ sanctuaries }: { sanctuaries: Sanctuary[] }) {
  const [first, ...rest] = sanctuaries;
  if (!first) return null;
  return (
    <section id="sanctuaries" className="py-12 sm:py-16 md:py-24 px-4 sm:px-6 md:px-14 bg-surface-container-low">
      <div className="max-w-[1400px] mx-auto">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 sm:gap-6 mb-8 sm:mb-12">
          <div>
            <span className="text-primary text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.5em] sm:tracking-[0.6em] mb-2 sm:mb-4 block">
              Curated Portfolio
            </span>
            <h2 className="font-headline font-extrabold tracking-[-0.02em] text-3xl sm:text-5xl md:text-6xl text-on-surface leading-[0.98]">
              Curated sanctuaries.
              <br />
              <span className="text-primary">Chosen to be lived in.</span>
            </h2>
          </div>
          <div className="max-w-xl">
            <p className="text-on-surface/60 text-sm sm:text-base md:text-lg leading-relaxed mb-4 sm:mb-5">
              Every listing is visited, checked, and described in plain language. Compare the setting, access, air, noise, title, and development stage before you spend a weekend on a site visit.
            </p>
            <Link
              href="/list"
              className="inline-flex px-5 py-2.5 sm:px-7 sm:py-3.5 rounded-full border border-outline/30 text-[9px] sm:text-[10px] uppercase tracking-[0.35em] sm:tracking-[0.4em] font-bold text-on-surface/70 hover:border-primary hover:text-primary transition-all"
            >
              View all listings
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 md:grid-rows-2 gap-3.5 sm:gap-4 md:gap-5">
          <Tile s={first} large badge={BADGES[first.id] ?? 'Curated'} />
          {rest.slice(0, 2).map((s, i) => (
            <Tile key={s.id} s={s} index={i + 1} badge={BADGES[s.id] ?? 'Curated'} />
          ))}
        </div>
      </div>
    </section>
  );
}
