'use client';

import { motion } from 'motion/react';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const ROWS = [
  { metric: 'Air Quality (AQI)', tgt: '12 — Pristine', city: '100–180 — Unhealthy', better: true },
  { metric: 'Ambient Noise', tgt: '18 dB', city: '65+ dB', better: true },
  { metric: 'Forest / Nature', tgt: 'On your doorstep', city: '45 min drive', better: true },
  { metric: 'Commute to office', tgt: 'Under 45 min', city: 'Already there', better: false },
  { metric: 'Property types', tgt: 'Plots, Villas, Flats', city: 'All types', better: false },
];

export function WhyItMatters() {
  return (
    <section className="py-20 px-6 md:px-24 bg-surface-container-low border-b border-outline/10">
      <div className="max-w-5xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-14"
        >
          <span className="text-primary text-[10px] font-bold uppercase tracking-[0.6em] mb-4 block">Why it matters</span>
          <h2 className="text-4xl md:text-5xl font-light text-on-surface leading-tight">
            You can live near a forest
            <br />
            <span className="font-serif italic font-medium text-primary">and still be close to work.</span>
          </h2>
        </motion.div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-outline/20">
                <th className="text-left py-4 pr-8 text-[10px] uppercase tracking-[0.5em] font-bold text-secondary/50 w-1/3">
                  What we measure
                </th>
                <th className="text-left py-4 pr-8 text-[10px] uppercase tracking-[0.5em] font-bold text-primary/70">
                  Our curated sites
                </th>
                <th className="text-left py-4 text-[10px] uppercase tracking-[0.5em] font-bold text-secondary/50">
                  Typical city
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline/10">
              {ROWS.map((r, i) => (
                <motion.tr
                  key={r.metric}
                  initial={{ opacity: 0, x: -10 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.06 }}
                >
                  <td className="py-5 pr-8 font-medium text-on-surface/70">{r.metric}</td>
                  <td className="py-5 pr-8">
                    <span
                      className={cn(
                        'inline-flex items-center gap-1.5 font-headline font-bold',
                        r.better ? 'text-primary' : 'text-on-surface/80'
                      )}
                    >
                      {r.better && <Check className="w-3.5 h-3.5 flex-shrink-0" />}
                      {r.tgt}
                    </span>
                  </td>
                  <td className="py-5 text-secondary/60">{r.city}</td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
}
