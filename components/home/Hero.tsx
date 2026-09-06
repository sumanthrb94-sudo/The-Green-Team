'use client';

/**
 * v4 hero — "bold modern" (The Agency / Compass register), now with the front
 * door's first action in it.
 *
 * v3 was a statement and nothing else: the only thing a visitor could do on
 * arrival was scroll, and listings did not appear until the second screen. This
 * keeps the confident split — oversized type on a dark canvas at left, one
 * cinematic listing at right — but the paragraph gives way to a search bar and
 * four shortcuts, and the whole band is short enough that real listings are on
 * screen behind it rather than a scroll away.
 *
 * It is still not the seven stacked elements of v2 that read as a listing
 * utility: one statement, one image, one search.
 */
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { ArrowUpRight, ArrowRight, Phone } from 'lucide-react';
import { HeroSearch } from '@/components/home/HeroSearch';

const ease = [0.16, 1, 0.3, 1] as const;

const STATS = [
  { v: '12', label: 'AQI at our sites' },
  { v: '45 min', label: 'to the city' },
  { v: '+37%', label: 'Agartha · 18 mo', accent: true },
];

export function Hero() {
  return (
    <section className="relative bg-[#0a1208] overflow-hidden">
      {/* faint texture wash so the dark canvas isn't flat */}
      <div className="absolute inset-0 opacity-[0.5]">
        <Image src="/hero-backdrop.jpg" alt="" fill priority sizes="100vw" className="object-cover object-center" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1208] via-[#0a1208]/92 to-[#0a1208]/60" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1208] via-transparent to-[#0a1208]/50" />
      </div>

      <div className="relative z-10 max-w-[1500px] mx-auto grid lg:grid-cols-[1.05fr_0.95fr]">
        {/* LEFT — the statement */}
        <div className="min-w-0 flex flex-col justify-center px-6 md:px-14 pt-16 md:pt-20 pb-10 lg:pb-16 min-h-[58svh] lg:min-h-[74svh]">
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

        {/* RIGHT — one cinematic listing */}
        <motion.div
          initial={{ opacity: 0, scale: 1.04 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.1, ease }}
          className="relative min-h-[40svh] lg:min-h-[74svh]"
        >
          <Image
            src="/gallery/agartha/11.webp"
            alt="MODCON Agartha — earthen retreat on the Narsapur forest boundary"
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a1208]/90 via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a1208]/60 via-transparent to-transparent lg:from-[#0a1208]/80" />

          {/* Featured listing card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.9, ease }}
            className="absolute bottom-5 left-5 right-5 md:bottom-8 md:left-8 md:right-8 lg:right-10"
          >
            <Link
              href="/sanctuaries/agartha"
              className="group flex items-center gap-4 p-3.5 pr-5 rounded-2xl bg-white/[0.07] border border-white/12 backdrop-blur-xl hover:bg-white/[0.12] hover:border-[#a3b18a]/40 transition-all max-w-md"
            >
              <span className="px-2.5 py-3 rounded-xl bg-[#c8a951] text-[#1a1a0a] text-[8px] uppercase tracking-[0.2em] font-extrabold [writing-mode:vertical-rl] rotate-180">
                Featured
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-headline font-bold text-white leading-tight">MODCON Agartha</span>
                <span className="block text-[10px] uppercase tracking-[0.2em] text-white/45 font-bold mt-1">
                  Narsapur forest · 37 plots
                </span>
              </span>
              <span className="text-right flex-shrink-0">
                <span className="block font-headline font-extrabold text-[#c8a951] whitespace-nowrap">From ₹78 L</span>
                <ArrowUpRight className="w-4 h-4 text-white/35 ml-auto mt-1 group-hover:text-[#a3b18a] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
              </span>
            </Link>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
