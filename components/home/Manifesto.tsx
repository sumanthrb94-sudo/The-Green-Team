'use client';

/** Big serif manifesto statement + scrolling credential marquee (signature effect #2). */
import { motion } from 'motion/react';

const TICKER = [
  'MODCON AGARTHA', 'AQI 12', 'SYL RESIDENCES', '₹4,499 / SFT', 'DATES COUNTY',
  '4,000-ACRE RESERVE', 'OUTLOOK BUSINESS 2024', '18 dB', 'RRR CORRIDOR',
  'ARQEN ARCHITECTURE', '+37% IN 18 MONTHS', 'NARSAPUR FOREST',
];

export function Manifesto() {
  return (
    <section className="bg-surface border-b border-outline/10 overflow-hidden">
      <div className="max-w-5xl mx-auto px-6 md:px-12 py-24 md:py-32 text-center">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-[10px] uppercase tracking-[0.7em] font-bold text-primary/60 mb-10"
        >
          A curation house · Not a listing portal
        </motion.p>
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="font-serif font-light text-4xl md:text-6xl xl:text-7xl leading-[1.12] text-on-surface"
        >
          Every property must earn its place —{' '}
          <em className="text-primary">verified forest boundary</em>, air below AQI 25,{' '}
          <em className="text-primary">awarded architecture</em>, and the city within{' '}
          <em className="text-primary">45 minutes</em>. If it fails one, we walk away.
        </motion.h2>
      </div>

      <div className="py-6 border-t border-outline/10 overflow-hidden">
        <div className="marquee-track marquee-slow gap-10 pr-10">
          {[...TICKER, ...TICKER].map((t, i) => (
            <span key={i} className="flex items-center gap-10 flex-shrink-0">
              <span className="font-headline font-extrabold text-xl md:text-2xl tracking-tight text-on-surface/25 whitespace-nowrap">
                {t}
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-gold/60 flex-shrink-0" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
