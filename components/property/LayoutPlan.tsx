'use client';

/**
 * Interactive site plan — the official layout image overlaid with the 36 plot
 * dots (tap for an investment snapshot) and numbered hotspots.
 */
import { useState } from 'react';
import Image from 'next/image';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { AGARTHA_HOTSPOTS, SANCTUARY_PLOTS, plotDotSize, type Hotspot, type PlotDot } from '@/lib/data/agartha-layout';
import { AGARTHA_NOW_RATE, AGARTHA_OLD_RATE, WHATSAPP } from '@/lib/data/contact';
import { formatRs } from '@/lib/utils';
import type { Sanctuary } from '@/lib/data/sanctuaries';

export function LayoutPlan({ sanctuary }: { sanctuary: Sanctuary }) {
  const plots = SANCTUARY_PLOTS[sanctuary.id] ?? [];
  const hotspots = sanctuary.id === 'agartha' ? AGARTHA_HOTSPOTS : [];
  const [mode, setMode] = useState<'plots' | 'features'>('plots');
  const [selPlot, setSelPlot] = useState<PlotDot | null>(null);
  const [selSpot, setSelSpot] = useState<Hotspot | null>(null);

  if (!sanctuary.sitePlanSrc) return null;

  return (
    <div>
      <div className="flex items-center justify-between mb-5">
        <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-on-surface/60">
          Site Plan — {plots.length || sanctuary.plots} Plots
        </p>
        <div className="flex rounded-full border border-outline/25 overflow-hidden text-[9px] uppercase tracking-widest font-bold">
          <button
            onClick={() => setMode('plots')}
            className={`px-4 py-2 transition-colors ${mode === 'plots' ? 'bg-primary text-on-primary' : 'text-secondary/60'}`}
          >
            Plots
          </button>
          <button
            onClick={() => setMode('features')}
            className={`px-4 py-2 transition-colors ${mode === 'features' ? 'bg-primary text-on-primary' : 'text-secondary/60'}`}
          >
            Features
          </button>
        </div>
      </div>

      <div className="relative rounded-3xl overflow-hidden border border-outline/15">
        <span className="absolute top-4 left-4 z-20 px-3 py-1.5 rounded-full bg-black/60 backdrop-blur text-white text-[8px] uppercase tracking-[0.25em] font-bold">
          {mode === 'plots' ? 'Tap a plot to see its investment snapshot' : 'Tap a numbered feature'}
        </span>
        <Image
          src={sanctuary.sitePlanSrc}
          alt={`${sanctuary.title} site plan`}
          width={1600}
          height={1100}
          className="w-full h-auto"
        />

        {mode === 'plots' &&
          plots.map(p => {
            const size = plotDotSize(p.sqYds);
            return (
              <button
                key={p.id}
                onClick={() => { setSelPlot(p); setSelSpot(null); }}
                aria-label={`Plot ${p.id}, ${p.sqYds} sq yds`}
                className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold-bright ring-2 ring-white/70 shadow-md hover:scale-125 transition-transform"
                style={{ left: `${p.x}%`, top: `${p.y}%`, width: size, height: size }}
              />
            );
          })}

        {mode === 'features' &&
          hotspots.map(h => (
            <button
              key={h.id}
              onClick={() => { setSelSpot(h); setSelPlot(null); }}
              aria-label={h.label}
              className="absolute -translate-x-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-forest-section text-white text-xs font-bold flex items-center justify-center ring-2 ring-white/80 shadow-lg hover:scale-110 transition-transform"
              style={{ left: `${h.x}%`, top: `${h.y}%` }}
            >
              {h.num}
            </button>
          ))}
      </div>

      <AnimatePresence>
        {selPlot && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            className="mt-5 p-7 rounded-3xl border border-gold/30 bg-gold/5 relative"
          >
            <button onClick={() => setSelPlot(null)} aria-label="Close" className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-primary/10">
              <X className="w-4 h-4 text-on-surface/60" />
            </button>
            <p className="text-[9px] uppercase tracking-[0.5em] font-bold text-gold mb-2">
              Plot {selPlot.id} · Investment Snapshot
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
              {[
                { l: 'Size', v: `${selPlot.sqYds.toLocaleString('en-IN')} sq yds` },
                { l: 'Pre-launch (2024)', v: formatRs(selPlot.sqYds * AGARTHA_OLD_RATE) },
                { l: 'Today @ ₹8,500', v: formatRs(selPlot.sqYds * AGARTHA_NOW_RATE) },
                { l: '18-month gain', v: `+${formatRs(selPlot.sqYds * (AGARTHA_NOW_RATE - AGARTHA_OLD_RATE))}` },
              ].map(x => (
                <div key={x.l}>
                  <p className="text-[8px] uppercase tracking-[0.3em] text-secondary/50 font-bold">{x.l}</p>
                  <p className="font-headline font-bold text-on-surface mt-1">{x.v}</p>
                </div>
              ))}
            </div>
            <a
              href={WHATSAPP.agarthaEnquire}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-6 px-6 py-3 rounded-xl bg-primary text-on-primary text-[9px] uppercase tracking-[0.35em] font-bold hover:opacity-90 transition-all"
            >
              Enquire About Plot {selPlot.id}
            </a>
          </motion.div>
        )}

        {selSpot && (
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 14 }}
            className="mt-5 p-7 rounded-3xl border border-outline/20 bg-surface-container-low relative"
          >
            <button onClick={() => setSelSpot(null)} aria-label="Close" className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-primary/10">
              <X className="w-4 h-4 text-on-surface/60" />
            </button>
            <p className="text-[9px] uppercase tracking-[0.5em] font-bold text-primary mb-1">{selSpot.tag}</p>
            <h4 className="font-headline font-bold text-lg text-on-surface mb-3">{selSpot.label}</h4>
            <p className="text-sm text-secondary leading-relaxed mb-5">{selSpot.detail}</p>
            <div className="flex flex-wrap gap-6">
              {selSpot.stats.map(s => (
                <div key={s.label}>
                  <p className="text-[8px] uppercase tracking-[0.3em] text-secondary/50 font-bold">{s.label}</p>
                  <p className="text-sm font-bold text-on-surface mt-0.5">{s.value}</p>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
