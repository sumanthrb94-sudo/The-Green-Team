'use client';

/**
 * Compact credibility band — replaces the old Manifesto + WhatWeDo +
 * TrustSignals + EcosystemPillars stack with one scannable section. Three
 * principles, partners, and the 2024 award. Nothing to click; the next stop
 * is the adviser-call form below it.
 */
import { motion } from 'motion/react';
import { Award, ShieldCheck, Compass, Handshake } from 'lucide-react';

const PRINCIPLES = [
  {
    Icon: ShieldCheck,
    title: 'Independent by design',
    desc: 'We are not paid to say yes. A property clears the bar — forest boundary, AQI, commute — or we walk away.',
  },
  {
    Icon: Compass,
    title: 'Verified in person',
    desc: 'Every AQI reading, noise level, and commute time we publish was measured by us on site.',
  },
  {
    Icon: Handshake,
    title: 'Direct to developer',
    desc: 'We introduce you straight to the developer. No middleman markup, no inflated spread.',
  },
];

export function ProofStrip() {
  return (
    <section className="py-20 px-6 md:px-14 bg-surface border-b border-outline/10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 text-center"
        >
          <span className="text-primary text-[10px] font-bold uppercase tracking-[0.6em] mb-4 block">Why trust us</span>
          <h2 className="font-headline font-extrabold tracking-[-0.02em] text-3xl md:text-5xl text-on-surface leading-[1.02]">
            A curation house.{' '}
            <span className="text-primary">Not a listing portal.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-5 mb-8">
          {PRINCIPLES.map(({ Icon, title, desc }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="p-7 rounded-3xl border border-outline/15 bg-surface-container-low"
            >
              <Icon className="w-5 h-5 text-primary mb-4" />
              <h3 className="font-headline font-bold text-on-surface mb-2">{title}</h3>
              <p className="text-sm text-secondary leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6 sm:gap-10 p-6 rounded-3xl bg-gold/8 border border-gold/20">
          <div className="flex items-center gap-3">
            <Award className="w-5 h-5 text-gold flex-shrink-0" />
            <p className="text-sm text-on-surface">
              <span className="font-bold">Outlook Business 2024</span>
              <span className="text-secondary"> · Best Sustainable Eco-Friendly Project (MODCON Agartha)</span>
            </p>
          </div>
          <span className="hidden sm:block w-px h-8 bg-outline/20" />
          <p className="text-[9px] uppercase tracking-[0.4em] font-bold text-secondary/60">
            MODCON · ARQEN · Planet Green
          </p>
        </div>
      </div>
    </section>
  );
}
