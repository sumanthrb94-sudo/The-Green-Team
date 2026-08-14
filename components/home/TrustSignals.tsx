'use client';

import { motion } from 'motion/react';
import { Award } from 'lucide-react';

const PRINCIPLES = [
  {
    title: 'Independent by design',
    desc: 'We are not paid to say yes. A property either clears the bar — forest boundary, AQI, design, commute — or we walk away.',
  },
  {
    title: 'Verified in person',
    desc: 'Every AQI reading, noise level, and commute time we publish was measured by us on site, not copied from a brochure.',
  },
  {
    title: 'Direct to developer',
    desc: 'As channel partners we introduce you straight to the developer. No middleman markup, no inflated listing spread.',
  },
];

/** Credibility strip — principles, partners, and the 2024 award. (Unmounted dead code in v1; now live.) */
export function TrustSignals() {
  return (
    <section className="py-20 px-6 md:px-24 bg-surface border-b border-outline/10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <span className="text-primary text-[10px] font-bold uppercase tracking-[0.6em] mb-4 block">Why trust us</span>
          <h2 className="text-4xl md:text-5xl font-light text-on-surface leading-tight">
            A curation house.
            <br />
            <span className="font-serif italic font-medium text-primary">Not a listing portal.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6 mb-12">
          {PRINCIPLES.map((p, i) => (
            <motion.div
              key={p.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="p-8 rounded-3xl border border-outline/15 bg-surface-container-low"
            >
              <h3 className="text-lg font-headline font-bold text-on-surface mb-3">{p.title}</h3>
              <p className="text-sm text-secondary leading-relaxed">{p.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col md:flex-row gap-6 items-stretch">
          <div className="flex-1 flex items-center justify-around gap-8 p-8 rounded-3xl border border-outline/15">
            <div className="text-center">
              <p className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">MODCON</p>
              <p className="text-[8px] uppercase tracking-[0.4em] text-secondary/50 font-bold mt-1">Developer Partner</p>
            </div>
            <span className="w-px h-12 bg-outline/20" />
            <div className="text-center">
              <p className="font-headline font-extrabold text-2xl text-on-surface tracking-tight">ARQEN</p>
              <p className="text-[8px] uppercase tracking-[0.4em] text-secondary/50 font-bold mt-1">Architecture</p>
            </div>
          </div>
          <div className="flex-1 flex items-center gap-5 p-8 rounded-3xl bg-gold/10 border border-gold/25">
            <span className="w-12 h-12 rounded-2xl bg-gold/15 flex items-center justify-center flex-shrink-0">
              <Award className="w-6 h-6 text-gold" />
            </span>
            <div>
              <p className="text-sm font-bold text-on-surface">MODCON Agartha · Outlook Business 2024</p>
              <p className="text-xs text-secondary mt-0.5">Best Sustainable Eco-Friendly Project of the Year</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
