'use client';

import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { ArrowUpRight } from 'lucide-react';

const KPIS = [
  { label: 'AQI at our curated sites', value: '12 — Pristine' },
  { label: 'Ambient Noise', value: '18 dB' },
  { label: 'Commute to city', value: 'Under 45 min' },
  { label: 'Property types', value: 'Plots · Villas · Flats' },
];

export function Hero() {
  return (
    <section className="relative min-h-[calc(100svh-3.5rem)] flex flex-col overflow-hidden">
      <div className="absolute inset-0 z-0">
        <Image
          src="/hero-backdrop.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1208]/90 via-[#0a1208]/40 to-[#0a1208]/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1208]/70 via-[#0a1208]/20 to-transparent" />
      </div>

      <div className="relative z-10 flex flex-col flex-1 justify-between px-6 md:px-16 xl:px-20 pt-16 pb-0">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8 }}
          className="flex items-center gap-3"
        >
          <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-[#8aab78]" />
          <span className="text-[8px] font-bold uppercase tracking-[0.6em] text-white/45">
            Independent Curators · Hyderabad, India
          </span>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex-1 flex flex-col justify-center py-12 max-w-3xl"
        >
          <h1 className="font-serif text-[3.2rem] sm:text-[4.5rem] md:text-[5.5rem] xl:text-[6.2rem] font-light text-white leading-[0.98] tracking-tight mb-8">
            Live close
            <br />
            <span className="italic font-medium text-[#a3b18a]">to the forest.</span>
            <br />
            <span className="text-white/70">Still reach</span>
            <br />
            <span className="italic font-medium text-white/55">work in 45 min.</span>
          </h1>
          <p className="text-base md:text-xl font-light text-white/55 leading-relaxed max-w-lg mb-12">
            We are channel partners who curate homes near forests — where the air is clean, the design is
            thoughtful, and the city is still within reach. Apartments, villas, plots — any type, as long as it
            meets our bar.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link
              href="/membership"
              className="group px-8 py-4 text-[9px] uppercase tracking-[0.45em] font-bold bg-[#a3b18a] text-[#0a1208] hover:bg-[#b8c8a0] transition-all duration-300 flex items-center justify-center gap-2"
            >
              See What We Curate
              <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
            <Link
              href="/list"
              className="px-8 py-4 border border-white/20 text-white/60 text-[9px] uppercase tracking-[0.45em] font-bold hover:border-white/40 hover:text-white transition-all duration-300 text-center"
            >
              View Properties
            </Link>
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.8 }}
        className="relative z-10 border-t border-white/10 px-6 md:px-16 xl:px-20 py-5 flex flex-wrap items-center justify-between gap-4 bg-[#0a1208]/65 backdrop-blur-md"
      >
        <div className="flex flex-wrap gap-8 md:gap-14">
          {KPIS.map(s => (
            <div key={s.label}>
              <p className="text-[7px] uppercase tracking-[0.45em] font-bold text-white/25">{s.label}</p>
              <p className="text-xs font-headline font-bold mt-0.5 text-white/70">{s.value}</p>
            </div>
          ))}
        </div>
        <div className="hidden sm:flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-[#a3b18a]" />
          <p className="text-xs font-headline font-bold text-[#a3b18a]">Open for Reservation</p>
        </div>
      </motion.div>
    </section>
  );
}
