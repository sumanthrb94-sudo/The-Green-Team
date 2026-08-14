'use client';

import Link from 'next/link';
import { motion } from 'motion/react';
import { TrendingDown, Award, Zap, ArrowUpRight } from 'lucide-react';
import { WHATSAPP } from '@/lib/data/contact';

const PILLARS = [
  {
    title: 'Lowest Possible Rate',
    desc: 'Pre-investor pricing is always below the pre-launch and public launch rate. Once booking targets are hit, this phase closes.',
    Icon: TrendingDown,
  },
  {
    title: 'First Pick of Units',
    desc: 'Best floor plans, preferred views, and corner units go to pre-investors — before the project is even advertised.',
    Icon: Award,
  },
  {
    title: 'Appreciation from Day One',
    desc: "Tukkuguda is in Hyderabad's 4th City corridor. Early investors capture the full growth curve from ground up.",
    Icon: Zap,
  },
];

export function PreInvestorGold() {
  return (
    <section className="py-24 px-6 md:px-24 bg-[#0a1208] text-white overflow-hidden relative">
      <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-[#c8a951]/5 to-transparent pointer-events-none" />
      <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-[#c8a951]/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-6xl mx-auto relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <div className="flex items-center gap-4 mb-6">
            <span className="w-12 h-px bg-[#c8a951]" />
            <span className="text-[#c8a951] text-[10px] font-bold uppercase tracking-[0.8em]">Pre-Investor Gold</span>
          </div>
          <h2 className="text-5xl md:text-7xl font-light leading-tight mb-8">
            SYL Residences <span className="font-serif italic font-medium text-[#c8a951]">Gold™</span>
          </h2>
          <p className="text-xl md:text-2xl text-white/60 font-light max-w-3xl leading-relaxed">
            Agartha investors gained +37% in 18 months. SYL Residences is the next opportunity — and you&apos;re
            still in the pre-investor window.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.97 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mb-24 overflow-hidden rounded-3xl border border-white/10 bg-white/5 backdrop-blur-sm"
        >
          <div className="grid grid-cols-3 border-b border-white/10 bg-white/5">
            <div className="p-6 text-[10px] uppercase tracking-widest font-bold text-white/40">Phase</div>
            <div className="p-6 text-[10px] uppercase tracking-widest font-bold text-white/40">Timeline</div>
            <div className="p-6 text-[10px] uppercase tracking-widest font-bold text-white/40">Rate (SFT)</div>
          </div>
          <div className="grid grid-cols-3 border-b border-white/10 bg-[#c8a951]/10">
            <div className="p-6 md:p-8 font-bold text-[#c8a951]">Pre-Investor</div>
            <div className="p-6 md:p-8 text-white/80">Now Running</div>
            <div className="p-6 md:p-8 font-headline text-2xl text-[#c8a951]">₹4,499</div>
          </div>
          <div className="grid grid-cols-3 border-b border-white/10">
            <div className="p-6 md:p-8 font-medium text-white/60">Pre-Launch</div>
            <div className="p-6 md:p-8 text-white/40">At Booking Milestone</div>
            <div className="p-6 md:p-8 text-white/60">Higher</div>
          </div>
          <div className="grid grid-cols-3">
            <div className="p-6 md:p-8 font-medium text-white/60">Public Launch</div>
            <div className="p-6 md:p-8 text-white/40">Market Launch</div>
            <div className="p-6 md:p-8 text-white/60">Market Rate</div>
          </div>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-12 mb-20">
          {PILLARS.map(({ title, desc, Icon }, i) => (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group"
            >
              <div className="mb-6 p-4 w-fit rounded-2xl bg-white/5 border border-white/10 group-hover:border-[#c8a951]/50 transition-colors">
                <Icon className="w-6 h-6 text-[#c8a951]" />
              </div>
              <h3 className="text-xl font-bold mb-4 group-hover:text-[#c8a951] transition-colors">{title}</h3>
              <p className="text-white/50 leading-relaxed text-sm">{desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <a
            href={WHATSAPP.sylEnquire}
            target="_blank"
            rel="noopener noreferrer"
            className="px-10 py-5 bg-[#c8a951] text-[#0a1208] text-[10px] uppercase tracking-[0.4em] font-bold hover:bg-[#d9bb62] transition-all text-center"
          >
            Enquire on WhatsApp
          </a>
          <Link
            href="/sanctuaries/syl"
            className="group px-10 py-5 border border-white/20 text-white/70 text-[10px] uppercase tracking-[0.4em] font-bold hover:border-white/50 hover:text-white transition-all flex items-center justify-center gap-2"
          >
            View SYL Residences
            <ArrowUpRight className="w-3 h-3 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </Link>
        </div>
      </div>
    </section>
  );
}
