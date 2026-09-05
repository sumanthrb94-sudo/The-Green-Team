import 'server-only';
import { AGARTHA_NOW_RATE, SYL_RATE } from '@/lib/data/contact';

/**
 * Unit-by-unit price sheets — the detail that sits behind sign-in.
 *
 * `server-only` is load-bearing, not decorative. If a client component imported
 * this, the whole sheet would ship inside the JavaScript bundle and anyone could
 * read it with devtools — the gate would be theatre. It reaches the browser only
 * through /api/pricing/[id], which checks for a session first.
 *
 * What stays public elsewhere is the headline rate (₹8,500/sq yd, ₹6,999/SFT,
 * ₹18,000/sq yd), the size ranges and the entry price. That is deliberate: those
 * are in the page titles, meta descriptions and Product JSON-LD, and they win the
 * searches that actually convert. Hiding them would either cost those rankings or,
 * worse, mean showing Google a price we hide from the visitor who clicks through —
 * which is cloaking, and risks the whole domain.
 *
 * Sizes are real, off the issued plans (lib/data/agartha-layout.ts,
 * SITE_PLAN.pdf) — not round numbers invented to look plausible.
 */

export interface UnitRow {
  label: string;
  qty: string;
  /** Computed from a real size and the current rate — never hardcoded. */
  price: number;
  star?: boolean;
}

export interface PriceSheet {
  /** Shown publicly too; repeated here so the panel reads as one thing. */
  rateLabel: string;
  rows: UnitRow[];
  /** Honest framing of what the number is and is not. */
  note: string;
}

const inr = (n: number) => n.toLocaleString('en-IN');

const AGARTHA_SIZES = [
  { label: 'Plot 20 (Smallest)', yds: 726 },
  { label: 'Plot 13', yds: 968 },
  { label: 'Plot 21 (Typical)', yds: 1210 },
  { label: 'Plot 28 (Largest sq-yd)', yds: 2057 },
  { label: 'Plot 3 / 31 (1 Acre)', yds: 4840 },
];

const SYL_SIZES = [
  { label: 'Block A — Smallest', sft: 3882 },
  { label: 'Block B — Typical', sft: 3950 },
  { label: 'Block A — Corner', sft: 4165 },
  { label: 'Block B — Large', sft: 4720 },
  { label: 'Block A — Largest', sft: 7000 },
];

const DATES_SIZES = [
  { label: 'Starter Plot', yds: 200 },
  { label: 'Standard Plot', yds: 300 },
  { label: 'Signature Plot', yds: 500, star: true },
  { label: 'Estate Plot', yds: 600 },
];

const DATES_RATE = 18000;

export function getPriceSheet(id: string): PriceSheet | null {
  if (id === 'agartha') {
    return {
      rateLabel: `₹${inr(AGARTHA_NOW_RATE)} / sq yd`,
      rows: AGARTHA_SIZES.map(s => ({
        label: s.label,
        qty: `${inr(s.yds)} sq yds`,
        price: s.yds * AGARTHA_NOW_RATE,
      })),
      note: `Calculated at the current listed rate of ₹${inr(AGARTHA_NOW_RATE)} per sq yd across the 37 plots on the issued master plan. Better than the listed rate is routinely available on an in-person visit, and we negotiate that on your behalf — ask your adviser for the live price sheet and which plots are still unsold. Stamp duty, registration and GST where it applies are additional.`,
    };
  }

  if (id === 'syl') {
    return {
      rateLabel: `₹${inr(SYL_RATE)} / SFT`,
      rows: SYL_SIZES.map(s => ({
        label: s.label,
        qty: `${inr(s.sft)} SFT`,
        price: s.sft * SYL_RATE,
      })),
      note: `Calculated at the current rate of ₹${inr(SYL_RATE)} per SFT across the 15 villaments on the issued site plan. A lower pre-investor window exists for a limited number of units — your adviser confirms the current rate and how many remain. Commercial space in the integrated block is quoted on enquiry rather than published. Stamp duty, registration and GST where it applies are additional.`,
    };
  }

  if (id === 'dates-county') {
    return {
      rateLabel: `₹${inr(DATES_RATE)} / sq yd`,
      rows: DATES_SIZES.map(s => ({
        label: s.label,
        qty: `${s.yds} sq yds`,
        price: s.yds * DATES_RATE,
        ...(s.star ? { star: true } : {}),
      })),
      note: `Calculated at ₹${inr(DATES_RATE)} per sq yd. RERA P02400002648 and P02400003813 — verify both yourself on the Telangana RERA portal. Stamp duty, registration and any corpus or maintenance deposit are additional.`,
    };
  }

  return null;
}
