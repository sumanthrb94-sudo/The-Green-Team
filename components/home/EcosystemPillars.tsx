'use client';

import { motion } from 'motion/react';

const CHECKS = [
  {
    icon: '🌿',
    title: 'Forest & Nature',
    desc: "The property must sit within or right next to forest, hills, or open green land — not just a park. If it's a drive away, it doesn't qualify.",
    proof: 'Agartha (live): surrounded by forest reserve',
  },
  {
    icon: '💨',
    title: 'Clean air — AQI under 25',
    desc: 'We check AQI data before we show any property. City air is 100–180. Our minimum standard is below 25. Breathing matters where you live.',
    proof: 'Current site: AQI 12',
  },
  {
    icon: '🏗️',
    title: 'Well-designed, built to last',
    desc: 'We only work with developers whose architecture has won recognition. Biophilic layouts, natural materials, spaces that feel like they belong in the landscape.',
    proof: 'Partner: MODCON × ARQEN · Eco Award 2024',
  },
  {
    icon: '🚗',
    title: 'Office within 45 minutes',
    desc: "Living in nature shouldn't mean sacrificing your commute. Every property we recommend is reachable from Hyderabad's key corridors within 45 min.",
    proof: 'RRR / ORR proximity verified',
  },
];

export function EcosystemPillars({ isFullPage = false }: { isFullPage?: boolean }) {
  return (
    <section id="pillars" className={`bg-forest-section text-[#e0dace] px-6 md:px-24 ${isFullPage ? 'py-24' : 'py-20'}`}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <span className="text-white/25 text-[9px] font-bold uppercase tracking-[0.6em] mb-5 block">Our bar</span>
          <h2 className="text-4xl md:text-6xl font-light leading-tight">
            Four things every property
            <br />
            <span className="font-serif italic font-medium text-[#a3b18a]">must pass.</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-px bg-white/5 border border-white/5 rounded-3xl overflow-hidden">
          {CHECKS.map((c, i) => (
            <motion.div
              key={c.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="bg-forest-section p-10 hover:bg-white/[0.03] transition-colors"
            >
              <div className="text-3xl mb-5">{c.icon}</div>
              <h3 className="text-xl font-headline font-bold mb-3">{c.title}</h3>
              <p className="text-white/40 leading-relaxed text-sm mb-4">{c.desc}</p>
              <p className="text-[9px] uppercase tracking-[0.4em] font-bold text-[#a3b18a]">{c.proof}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
