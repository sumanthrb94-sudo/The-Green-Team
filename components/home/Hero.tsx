'use client';

/**
 * v2 hero — cinematic editorial. Kinetic serif headline, glass sanctuary
 * tickets, live-data KPI bar, and a full-bleed gallery marquee. The backdrop
 * image is swappable: drop a generated image at /public/hero/backdrop.jpg and
 * it takes over automatically (falls back to the v1 backdrop).
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import { ArrowUpRight, Wind, VolumeX, Clock } from 'lucide-react';

const HEADLINE: { text: string; cls: string }[] = [
  { text: 'The forest', cls: 'text-white' },
  { text: 'is the address.', cls: 'text-[#a3b18a] italic' },
];

const TICKETS = [
  { id: 'agartha', name: 'MODCON Agartha', meta: 'Narsapur · AQI 12', price: 'From ₹68.7 L', img: '/gallery/agartha/11.webp' },
  { id: 'syl', name: 'SYL Residences', meta: 'ORR Exit-14 · Pre-Investor', price: '₹4,499/SFT', img: '/gallery/syl/1776279315359.webp' },
  { id: 'dates-county', name: 'Dates County', meta: 'Kandukur · 4,000-acre forest', price: '₹90 L', img: '/gallery/dates-county/temple.jpg' },
];

const MARQUEE_IMAGES = [
  '/gallery/agartha/4.webp',
  '/gallery/syl/1776279339464.webp',
  '/gallery/agartha/12.webp',
  '/gallery/dates-county/field.jpg',
  '/gallery/agartha/7.webp',
  '/gallery/syl/1776279361294.webp',
  '/gallery/agartha/16.webp',
  '/gallery/dates-county/water.jpg',
];

function useCountUp(target: number, run: boolean, ms = 1400) {
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!run) return;
    let raf: number;
    const t0 = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - t0) / ms);
      setV(Math.round(target * (1 - Math.pow(1 - p, 3))));
      if (p < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, run, ms]);
  return v;
}

function LiveKpis() {
  const [run, setRun] = useState(false);
  const aqi = useCountUp(12, run);
  const db = useCountUp(18, run);
  const mins = useCountUp(45, run);
  const roi = useCountUp(37, run);
  return (
    <motion.div
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true }}
      onViewportEnter={() => setRun(true)}
      className="grid grid-cols-2 md:grid-cols-4 gap-px bg-white/8 border-y border-white/8"
    >
      {[
        { Icon: Wind, v: aqi, unit: '', label: 'AQI at curated sites', sub: 'city is 100–180' },
        { Icon: VolumeX, v: db, unit: ' dB', label: 'Ambient noise', sub: 'city is 65+' },
        { Icon: Clock, v: mins, unit: ' min', label: 'Max commute', sub: 'to key corridors' },
        { Icon: ArrowUpRight, v: roi, unit: '%', label: 'Agartha appreciation', sub: 'in 18 months', accent: true },
      ].map(({ Icon, v, unit, label, sub, accent }) => (
        <div key={label} className="bg-[#0a1208] px-6 py-5 flex items-center gap-4">
          <Icon className={`w-4 h-4 flex-shrink-0 ${accent ? 'text-[#c8a951]' : 'text-[#a3b18a]/70'}`} />
          <div>
            <p className={`font-headline font-extrabold text-2xl leading-none ${accent ? 'text-[#c8a951]' : 'text-white'}`}>
              {accent ? '+' : ''}{v}{unit}
            </p>
            <p className="text-[8px] uppercase tracking-[0.3em] font-bold text-white/35 mt-1.5">{label}</p>
            <p className="text-[9px] text-white/25">{sub}</p>
          </div>
        </div>
      ))}
    </motion.div>
  );
}

export function Hero() {
  return (
    <section className="relative bg-[#0a1208] overflow-hidden">
      {/* Backdrop */}
      <div className="absolute inset-0">
        <Image src="/hero-backdrop.jpg" alt="" fill priority sizes="100vw" className="object-cover object-center opacity-55" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1208] via-[#0a1208]/75 to-[#0a1208]/25" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1208] via-transparent to-[#0a1208]/60" />
      </div>

      <div className="relative z-10 max-w-[1500px] mx-auto px-6 md:px-14 pt-14 md:pt-24 pb-10 grid lg:grid-cols-[1.3fr_1fr] gap-14 items-center min-h-[78svh]">
        {/* Left — kinetic headline */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className="flex items-center gap-3 mb-8"
          >
            <span className="w-1.5 h-1.5 rounded-full animate-pulse bg-[#8aab78]" />
            <span className="text-[9px] font-bold uppercase tracking-[0.55em] text-white/45">
              Independent Curators · Hyderabad
            </span>
          </motion.div>

          <h1 className="font-serif font-light leading-[0.95] tracking-tight text-[17vw] sm:text-[4.6rem] md:text-[5.8rem] xl:text-[7rem] mb-4">
            {HEADLINE.map((line, i) => (
              <span key={line.text} className="block overflow-hidden">
                <motion.span
                  initial={{ y: '110%' }}
                  animate={{ y: 0 }}
                  transition={{ delay: 0.15 + i * 0.14, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  className={`block ${line.cls}`}
                >
                  {line.text}
                </motion.span>
              </span>
            ))}
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.55, duration: 0.8 }}
            className="text-base md:text-lg font-light text-white/55 leading-relaxed max-w-md mb-10"
          >
            Forest-adjacent homes near Hyderabad — verified air, verified silence, city still within 45 minutes.
            We curate. You decide.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="flex flex-col sm:flex-row gap-3"
          >
            <Link
              href="/list"
              className="group px-9 py-4 rounded-full bg-[#a3b18a] text-[#0a1208] text-[10px] uppercase tracking-[0.4em] font-bold hover:bg-[#b8c8a0] transition-all flex items-center justify-center gap-2"
            >
              Explore the Portfolio
              <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
            </Link>
            <Link
              href="/membership"
              className="px-9 py-4 rounded-full border border-white/20 text-white/65 text-[10px] uppercase tracking-[0.4em] font-bold hover:border-[#c8a951]/60 hover:text-[#c8a951] transition-all text-center"
            >
              Request Adviser Call
            </Link>
          </motion.div>
        </div>

        {/* Right — glass sanctuary tickets */}
        <div className="hidden lg:flex flex-col gap-4">
          {TICKETS.map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, x: 40 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + i * 0.15, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            >
              <Link
                href={`/sanctuaries/${t.id}`}
                className="group flex items-center gap-5 p-4 pr-6 rounded-3xl bg-white/[0.06] border border-white/10 backdrop-blur-xl hover:bg-white/[0.1] hover:border-[#a3b18a]/40 transition-all"
                style={{ marginLeft: `${i * 26}px` }}
              >
                <span className="relative w-20 h-20 rounded-2xl overflow-hidden flex-shrink-0">
                  <Image src={t.img} alt={t.name} fill sizes="80px" className="object-cover group-hover:scale-105 transition-transform duration-700" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block font-headline font-bold text-white leading-tight">{t.name}</span>
                  <span className="block text-[9px] uppercase tracking-[0.25em] text-white/40 font-bold mt-1">{t.meta}</span>
                </span>
                <span className="text-right flex-shrink-0">
                  <span className="block font-headline font-bold text-[#c8a951]">{t.price}</span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-white/30 ml-auto mt-1 group-hover:text-[#a3b18a] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Live KPI count-up bar */}
      <div className="relative z-10">
        <LiveKpis />
      </div>

      {/* Gallery marquee */}
      <div className="relative z-10 py-5 overflow-hidden bg-[#0a1208]">
        <div className="marquee-track gap-4 pr-4">
          {[...MARQUEE_IMAGES, ...MARQUEE_IMAGES].map((src, i) => (
            <span key={i} className="relative w-56 h-36 rounded-2xl overflow-hidden flex-shrink-0">
              <Image src={src} alt="" fill sizes="224px" className="object-cover" />
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
