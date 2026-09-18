'use client';

/**
 * v5 hero — one full-bleed band, one statement, one search.
 *
 * v4 split the band in two: type on a dark canvas at left, a cinematic Agartha
 * still at right. That still is gone. It pinned the front door to one of the
 * three projects, and it covered half of the backdrop — so the slideshow behind
 * the headline was only ever visible on the half nobody was looking at.
 *
 * What is left is the backdrop at full width: three stills of what we actually
 * sell, crossfading slowly under a left-weighted wash that keeps the display
 * type legible. Real listings — Agartha among them — are on the screen directly
 * below, which is where a visitor picks one rather than being handed one.
 */
import Link from 'next/link';
import { motion } from 'motion/react';
import { ArrowRight, Phone } from 'lucide-react';
import { HeroSearch } from '@/components/home/HeroSearch';
import { HeroBackdrop } from '@/components/home/HeroBackdrop';
import { AGARTHA_NOW_RATE, AGARTHA_OLD_RATE } from '@/lib/data/contact';

const ease = [0.16, 1, 0.3, 1] as const;

// Derived, not typed. This read "+37%" for a week after the rate moved to
// ₹8,000 — it had been computed against ₹8,500 and nothing recomputed it. It is
// the single number on the home page a buyer can check with a calculator.
const APPRECIATION_PCT = Math.round(((AGARTHA_NOW_RATE - AGARTHA_OLD_RATE) / AGARTHA_OLD_RATE) * 100);

const STATS = [
  { v: '12', label: 'AQI at our sites' },
  { v: '45 min', label: 'to the city' },
  { v: `+${APPRECIATION_PCT}%`, label: 'Agartha · 18 mo', accent: true },
];

export function Hero() {
  return (
    <section className="relative bg-[#0a1208] overflow-hidden">
      {/* The whole canvas now — three stills of what we actually sell,
          crossfading slowly behind the headline. */}
      <HeroBackdrop
        slides={[
          { src: '/hero-villa.webp', position: '60% center' },
          { src: '/hero-highrise.webp', position: '55% center' },
          { src: '/hero-balcony.webp', position: '55% center' },
        ]}
      />

      <div className="relative z-10 max-w-[1500px] mx-auto">
        <div className="min-w-0 max-w-2xl flex flex-col justify-center px-6 md:px-14 pt-16 md:pt-20 pb-14 md:pb-20 min-h-[62svh] lg:min-h-[78svh]">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="flex items-center gap-3 mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[#c8a951]" />
            <span className="text-[10px] font-bold uppercase tracking-[0.5em] text-white/45">
              The Green Team · Hyderabad
            </span>
          </motion.div>

          <h1 className="font-headline font-extrabold tracking-[-0.02em] leading-[0.9] text-[15vw] sm:text-6xl md:text-7xl xl:text-[5.6rem] text-white">
            {['The forest', 'is the'].map((line, i) => (
              <span key={line} className="block overflow-hidden">
                <motion.span
                  initial={{ y: '110%' }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.12 + i * 0.12, duration: 0.9, ease }}
                  className="block"
                >
                  {line}
                </motion.span>
              </span>
            ))}
            <span className="block overflow-hidden">
              <motion.span
                initial={{ y: '110%' }}
                animate={{ y: 0 }}
                transition={{ delay: 0.36, duration: 0.9, ease }}
                className="block text-[#a3b18a]"
              >
                address.
              </motion.span>
            </span>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="text-sm md:text-base font-light text-white/55 leading-relaxed max-w-md mt-5"
          >
            Forest-adjacent homes and plots near Hyderabad — each verified for air, quiet, access and title
            before you ever see it.
          </motion.p>

          {/* The first thing a visitor can do, rather than a scroll. */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.62, duration: 0.8 }}
            className="mt-7"
          >
            <HeroSearch />
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8, duration: 0.8 }}
            className="mt-6"
          >
            <Link
              href="/contact"
              className="group inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.3em] font-bold text-white/45 hover:text-white transition-colors"
            >
              <Phone className="w-3.5 h-3.5" /> Or talk to an adviser
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
          </motion.div>

          {/* Credential row — desktop only. On a phone it wrapped into the
              sticky call bar, and the search is the job there anyway; the proof
              strip further down carries the same numbers. */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="hidden sm:flex flex-wrap items-center gap-x-6 gap-y-4 md:gap-9 mt-9"
          >
            {STATS.map((s, i) => (
              <div key={s.label} className="flex items-center gap-x-6 md:gap-9">
                {i > 0 && <span className="h-8 w-px bg-white/10" />}
                <div>
                  <p className={`font-headline font-extrabold text-2xl md:text-3xl leading-none ${s.accent ? 'text-[#c8a951]' : 'text-white'}`}>
                    {s.v}
                  </p>
                  <p className="text-[9px] uppercase tracking-[0.25em] font-bold text-white/35 mt-1.5">{s.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
