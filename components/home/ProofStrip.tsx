'use client';

/**
 * Compact credibility band — replaces the old Manifesto + WhatWeDo +
 * TrustSignals + EcosystemPillars stack with one scannable section: three
 * principles, then the developers we work with.
 *
 * The 2024 award here is MODCON's, for Agartha. It is stated that way on
 * purpose. An unattributed award under a heading that says "why trust us",
 * printed beside a list of partner names, reads as ours — and a channel partner
 * borrowing a developer's credential is exactly the thing that costs one its
 * credibility. It links to the project so the claim can be checked.
 */
import Link from 'next/link';
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

        {/* The award belongs to MODCON, for Agartha — not to us, and not jointly
            to the three developers. Sitting unattributed under "Why trust us",
            beside a partner list, it read as ours. Say whose it is, and link to
            the project so a buyer can check. */}
        <div className="rounded-3xl bg-gold/8 border border-gold/20 divide-y divide-outline/10">
          <Link
            href="/sanctuaries/agartha"
            className="group flex items-start gap-4 p-6 hover:bg-gold/5 transition-colors rounded-t-3xl"
          >
            <Award className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-[9px] uppercase tracking-[0.35em] font-bold text-secondary/60 mb-1.5">
                Awarded to MODCON
              </p>
              <p className="text-sm text-on-surface leading-relaxed">
                <span className="font-bold">Best Sustainable Eco-Friendly Project of the Year 2024</span>
                <span className="text-secondary">
                  {' '}— Outlook Business Spotlight Entity Awards, won by MODCON for{' '}
                </span>
                <span className="font-bold group-hover:text-primary transition-colors">MODCON Agartha</span>
                <span className="text-secondary">, one of the three projects on our list.</span>
              </p>
            </div>
          </Link>
          <div className="px-6 py-5">
            <p className="text-[9px] uppercase tracking-[0.35em] font-bold text-secondary/60 mb-2">
              Developers we work with
            </p>
            <p className="text-sm text-secondary">MODCON · ARQEN Design Studio · Planet Green</p>
          </div>
        </div>
      </div>
    </section>
  );
}
