'use client';

import { motion } from 'motion/react';

const WHY = [
  { title: 'Maximum Appreciation', desc: 'Entry at the lowest possible price point.' },
  { title: 'Priority Selection', desc: 'First-right-of-refusal on the best plots/units.' },
  { title: 'Verified Potential', desc: 'We only curate projects with clear growth trajectories.' },
];

export function Advantage({ isFullPage = false }: { isFullPage?: boolean }) {
  return (
    <section className={`px-6 md:px-24 bg-surface border-y border-outline/10 ${isFullPage ? 'py-20' : 'py-14'}`}>
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-16"
        >
          <span className="text-primary text-[10px] font-bold uppercase tracking-[0.6em] mb-4 block">The TGT Edge</span>
          <h2 className="text-4xl md:text-6xl font-light text-on-surface leading-tight">
            We are <span className="font-serif italic text-primary">channel partners.</span>
            <br />
            Not developers. Not portals.
          </h2>
          <p className="mt-6 text-lg md:text-xl text-secondary leading-relaxed max-w-3xl">
            We independently curate properties, verify every claim ourselves, and connect you with the developer
            directly. No middleman markup — just our honest recommendation. Our edge lies in our rigorous
            selection process and our commitment to transparency.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-12">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h3 className="text-2xl font-headline font-bold text-on-surface">What is the Pre-Investor Phase?</h3>
            <p className="text-secondary leading-relaxed">
              The Pre-Investor Phase is the most exclusive window in a property&apos;s lifecycle. It occurs after land
              acquisition and initial planning, but before the official public launch.
            </p>
            <p className="text-secondary leading-relaxed">
              During this period, we offer our members the opportunity to secure units at &quot;ground-floor&quot;
              pricing — often 20-30% below the eventual market rate. This phase is characterized by high capital
              appreciation potential as the project moves toward official RERA registration and public marketing.
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-primary/5 p-8 rounded-3xl border border-primary/10"
          >
            <h4 className="text-primary text-[10px] font-bold uppercase tracking-widest mb-4">Why it matters</h4>
            <ul className="space-y-4">
              {WHY.map(item => (
                <li key={item.title} className="flex gap-3">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                  <span>
                    <span className="block text-sm font-bold text-on-surface">{item.title}</span>
                    <span className="block text-xs text-secondary">{item.desc}</span>
                  </span>
                </li>
              ))}
            </ul>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
