'use client';

/** Per-property investment economics + WhatsApp CTAs — parity with v1's Invest tab. */
import { Wind, VolumeX, Clock, MapPin, Leaf, Star } from 'lucide-react';
import { WHATSAPP, AGARTHA_NOW_RATE, SYL_RATE } from '@/lib/data/contact';
import { formatRs } from '@/lib/utils';
import type { Sanctuary } from '@/lib/data/sanctuaries';

function WhatsAppButtons({ enquire, visit, visitLabel }: { enquire: string; visit: string; visitLabel: string }) {
  return (
    <div className="space-y-3 mt-8">
      <a
        href={enquire}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2.5 px-6 py-4 rounded-2xl bg-olive-800 text-cream dark:bg-primary dark:text-on-primary text-[10px] uppercase tracking-[0.35em] font-bold hover:opacity-90 transition-all"
      >
        <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current" aria-hidden>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
        </svg>
        WhatsApp · Enquire Now
      </a>
      <a
        href={visit}
        target="_blank"
        rel="noopener noreferrer"
        className="w-full flex items-center justify-center gap-2.5 py-4 px-6 rounded-2xl border border-outline/30 text-on-surface/70 text-[10px] uppercase tracking-[0.35em] font-bold hover:border-primary/50 hover:text-on-surface transition-all"
      >
        <MapPin className="w-4 h-4" /> {visitLabel}
      </a>
    </div>
  );
}

function PriceTable({
  rows,
  highlightIndex,
}: {
  rows: { label: string; qty: string; price: string; star?: boolean }[];
  highlightIndex?: number;
}) {
  return (
    <div className="rounded-2xl border border-outline/15 overflow-hidden divide-y divide-outline/10">
      {rows.map((r, i) => (
        <div
          key={r.label}
          className={`grid grid-cols-[1.2fr_1fr_auto] items-center gap-3 px-5 py-4 text-sm ${
            i === highlightIndex ? 'bg-gold/10' : i % 2 ? 'bg-surface-container-low/60' : ''
          }`}
        >
          <span className="text-on-surface/60 flex items-center gap-1.5">
            {r.star && <Star className="w-3.5 h-3.5 text-gold fill-gold" />}
            {r.label}
          </span>
          <span className="font-medium text-on-surface/80">{r.qty}</span>
          <span className="font-headline font-bold text-on-surface">{r.price}</span>
        </div>
      ))}
    </div>
  );
}

export function InvestPanel({ sanctuary }: { sanctuary: Sanctuary }) {
  const telemetry = (
    <div className="grid grid-cols-3 gap-px bg-outline/10 border border-outline/10 rounded-2xl overflow-hidden mb-10">
      {[
        { Icon: Wind, label: 'AQI', value: String(sanctuary.aqi), sub: sanctuary.aqi <= 15 ? 'Pure Air' : 'Clean' },
        { Icon: VolumeX, label: 'Noise', value: `${sanctuary.noise} dB`, sub: sanctuary.noise <= 20 ? 'Near Silent' : 'Quiet' },
        { Icon: Clock, label: 'Commute', value: sanctuary.commute.split('·')[0].trim(), sub: '' },
      ].map(({ Icon, label, value, sub }) => (
        <div key={label} className="bg-surface p-6 text-center">
          <Icon className="w-4 h-4 mx-auto text-primary/60 mb-2" />
          <p className="text-[8px] uppercase tracking-[0.4em] text-secondary/50 font-bold">{label}</p>
          <p className="text-xl font-headline font-bold text-on-surface mt-1">{value}</p>
          {sub && <p className="text-[9px] text-secondary/50 mt-0.5">{sub}</p>}
        </div>
      ))}
    </div>
  );

  if (sanctuary.id === 'agartha') {
    // Real sizes off the issued master plan, not round numbers — see
    // lib/data/agartha-layout.ts.
    const sizes = [
      { label: 'Plot 20 (Smallest)', yds: 726 },
      { label: 'Plot 13', yds: 968 },
      { label: 'Plot 21 (Typical)', yds: 1210 },
      { label: 'Plot 28 (Largest sq-yd)', yds: 2057 },
      { label: 'Plot 3 / 31 (1 Acre)', yds: 4840 },
    ];
    return (
      <div>
        {telemetry}
        <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-on-surface/60 mb-4">
          Price Estimate — ₹8,500 / sq yd
        </p>
        <PriceTable
          rows={sizes.map(s => ({
            label: s.label,
            qty: `${s.yds.toLocaleString('en-IN')} sq yds`,
            price: formatRs(s.yds * AGARTHA_NOW_RATE),
          }))}
        />
        <p className="mt-3 text-[10px] text-secondary/50">Rate: ₹8,500/sq yd · 37 plots from 726 sq yds to 1 acre</p>

        <div className="mt-8 p-7 rounded-3xl border border-outline/15 bg-surface-container-low">
          <p className="flex items-center gap-2 text-[9px] uppercase tracking-[0.45em] font-bold text-primary mb-4">
            <Leaf className="w-3.5 h-3.5" /> Biomorphic Construction Add-On
          </p>
          <p className="text-sm text-secondary leading-relaxed mb-6">
            MODCON&apos;s <strong className="text-on-surface">biomorphic design studio</strong> can build a 150 sq yd
            home within your plot using mud · bamboo · lime · Bali-style architecture — a sustainable retreat
            that&apos;s yours from day one.
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { l: 'Built-Up', v: '150 sq yds', s: '1,350 SFT' },
              { l: 'Add-On Cost', v: '₹35 – 50 L', s: 'Additional' },
              { l: 'Style', v: 'Bali', s: 'Mud · Bamboo · Lime' },
            ].map(x => (
              <div key={x.l} className="p-4 rounded-2xl bg-surface border border-outline/10">
                <p className="text-[8px] uppercase tracking-[0.3em] text-secondary/50 font-bold">{x.l}</p>
                <p className="font-headline font-bold text-on-surface mt-1">{x.v}</p>
                <p className="text-[9px] text-secondary/50">{x.s}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-[10px] text-secondary/40">
            Biomorphic architecture by MODCON&apos;s design team. Pricing is indicative — enquire for a custom build quote.
          </p>
        </div>

        <p className="mt-8 text-sm text-on-surface/70">
          Rate is ₹8,500/sq yd. <strong>Better pricing available for in-person visits — we negotiate on your behalf.</strong>{' '}
          Message us on WhatsApp to enquire or book a site visit.
        </p>
        <WhatsAppButtons enquire={WHATSAPP.agarthaEnquire} visit={WHATSAPP.agarthaVisit} visitLabel="Book Site Visit · WhatsApp" />
      </div>
    );
  }

  if (sanctuary.id === 'syl') {
    const sizes = [
      // Real unit areas printed on the issued SITE_PLAN.pdf (Blocks A & B).
      { label: 'Block A — Smallest', sft: 3882 },
      { label: 'Block B — Typical', sft: 3950 },
      { label: 'Block A — Corner', sft: 4165 },
      { label: 'Block B — Large', sft: 4720 },
      { label: 'Block A — Largest', sft: 7000 },
    ];
    return (
      <div>
        {telemetry}
        <div className="mb-8 p-7 rounded-3xl bg-[#c8a951]/10 border border-[#c8a951]/30">
          <p className="text-[9px] uppercase tracking-[0.5em] font-bold text-gold mb-3">Pre-Investor Phase · Now Running</p>
          <p className="text-sm text-on-surface/80 leading-relaxed">
            Agartha investors gained <strong>+37% in 18 months</strong>. SYL sits in the same corridor logic — and
            you&apos;re still in the lowest-priced window: <strong>₹6,999/SFT — current rate</strong>.
          </p>
        </div>
        <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-on-surface/60 mb-4">
          Price Estimate — ₹6,999 / SFT
        </p>
        <PriceTable
          rows={sizes.map(s => ({
            label: s.label,
            qty: `${s.sft.toLocaleString('en-IN')} SFT`,
            price: formatRs(s.sft * SYL_RATE),
          }))}
        />
        <p className="mt-3 text-[10px] text-secondary/50">
          Commercial spaces in MODCON ONE available at one-time investor pricing — direct enquiry only.
        </p>
        <WhatsAppButtons enquire={WHATSAPP.sylEnquire} visit={WHATSAPP.sylVisit} visitLabel="Book Office Visit · WhatsApp" />
      </div>
    );
  }

  // dates-county
  const sizes = [
    { label: 'Starter Plot', yds: 200 },
    { label: 'Standard Plot', yds: 300 },
    { label: 'Signature Plot', yds: 500, star: true },
    { label: 'Estate Plot', yds: 600 },
  ];
  return (
    <div>
      {telemetry}
      <div className="mb-8 p-7 rounded-3xl bg-[#3a7d44]/10 border border-[#3a7d44]/30">
        <p className="text-[9px] uppercase tracking-[0.5em] font-bold text-[#3a7d44] dark:text-primary mb-3">
          Planet Green · 4,000-Acre Reserve Forest
        </p>
        <p className="text-sm text-on-surface/80 leading-relaxed">
          300+ acres, 40% open space, adjacent to a 4,000-acre reserve forest on the Srisailam Highway Future City
          axis. <strong>RERA P02400002648 · P02400003813.</strong>
        </p>
      </div>
      <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-on-surface/60 mb-4">
        Price Estimate — ₹18,000 / sq yd
      </p>
      <PriceTable
        rows={sizes.map(s => ({
          label: s.label,
          qty: `${s.yds} sq yds`,
          price: formatRs(s.yds * 18000),
          star: s.star,
        }))}
        highlightIndex={2}
      />
      <p className="mt-3 text-[10px] text-secondary/50">★ 500 sq yds at ₹18,000/sq yd — ₹90 L signature plot.</p>
      <WhatsAppButtons enquire={WHATSAPP.datesEnquire} visit={WHATSAPP.datesVisit} visitLabel="Book Site Visit · WhatsApp" />
    </div>
  );
}
