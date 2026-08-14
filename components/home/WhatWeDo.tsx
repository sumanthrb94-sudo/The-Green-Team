'use client';

import { motion } from 'motion/react';
import { Search, Check, ArrowRight } from 'lucide-react';

const STEPS = [
  {
    num: '01',
    title: 'We Find It',
    desc: 'We scout properties near forests, rivers, and open land — where the air quality is verified below AQI 25 and ambient noise stays under 25 dB.',
    Icon: Search,
  },
  {
    num: '02',
    title: 'We Verify It',
    desc: 'We check AQI readings, noise levels, commute times, design quality, and developer credentials before we show it to anyone.',
    Icon: Check,
  },
  {
    num: '03',
    title: 'We Connect You',
    desc: 'As channel partners, we introduce you directly to the developer. Apartments, villas, plots — any property type that meets our bar qualifies.',
    Icon: ArrowRight,
  },
];

export function WhatWeDo() {
  return (
    <section className="py-20 px-6 md:px-24 bg-surface border-b border-outline/10">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <span className="text-primary text-[10px] font-bold uppercase tracking-[0.6em] mb-4 block">How it works</span>
          <h2 className="text-4xl md:text-5xl font-light text-on-surface leading-tight">
            We are channel partners.
            <br />
            <span className="font-serif italic font-medium text-primary">We curate, you decide.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-px bg-outline/10 border border-outline/10 rounded-3xl overflow-hidden">
          {STEPS.map(({ num, title, desc, Icon }, i) => (
            <motion.div
              key={num}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="bg-surface p-10 hover:bg-surface-container-low transition-colors"
            >
              <div className="flex items-center gap-3 mb-6">
                <span className="text-[10px] font-bold text-primary/40 tracking-[0.5em]">{num}</span>
                <span className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                  <Icon className="w-5 h-5" />
                </span>
              </div>
              <h3 className="text-2xl font-headline font-bold text-on-surface mb-3">{title}</h3>
              <p className="text-secondary leading-relaxed">{desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
