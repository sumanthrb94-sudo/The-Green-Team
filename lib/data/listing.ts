/**
 * Client-safe helpers that turn the portfolio into a browsable listing set —
 * the search / filter / sort logic behind the portal, the way NoBroker or
 * Housing.com would run it, but over our curated set rather than an open feed.
 *
 * Everything here is a pure function so it runs in the browser: the PortalBrowser
 * holds all properties in memory (the set is small and hand-curated) and narrows
 * them live as the buyer types and taps, with no round-trip.
 */

import { CATEGORIES, type Category, type Stage } from '@/lib/data/categories';
import type { Sanctuary } from '@/lib/data/sanctuaries';

/* ── Price ─────────────────────────────────────────────────────────────────
 * memberPrice is a human string ("From ₹78 L", "₹6,999 / SFT", "₹90 L"), so we
 * derive one comparable "entry" rupee figure per property for budget filtering
 * and price sorting. A rate-based headline (per SFT / sq yd) is multiplied by
 * the smallest unit size we can find; anything we cannot read confidently
 * returns null and shows as "Price on request" — never a guessed number.
 */

/** Parse a total like "From ₹78 L" or "₹1.2 Cr" into rupees. Null if none. */
function parseTotalRupees(s: string): number | null {
  const m = s.match(/₹?\s*([\d,]+(?:\.\d+)?)\s*(cr|crore|lakh|lac|l)\b/i);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ''));
  if (!Number.isFinite(n)) return null;
  const unit = m[2].toLowerCase();
  return unit.startsWith('c') ? n * 1e7 : n * 1e5;
}

/** First integer in a string ("Villaments 3,882 – 7,000 SFT" → 3882). */
function firstInt(s?: string): number | null {
  if (!s) return null;
  const m = s.match(/([\d,]{2,})/);
  if (!m) return null;
  const n = parseInt(m[1].replace(/,/g, ''), 10);
  return Number.isFinite(n) ? n : null;
}

/** Best-effort entry price in rupees, or null when it is genuinely on request. */
export function estimateFromPrice(s: Sanctuary): number | null {
  const mp = s.memberPrice ?? '';
  // Rate-based headline: rate × smallest available unit size.
  if (/\bsft\b/i.test(mp) || /sq\.?\s*ft/i.test(mp)) {
    const rate = firstInt(mp);
    const minSft = firstInt(s.plotRange);
    return rate && minSft ? rate * minSft : null;
  }
  if (/sq\.?\s*yd/i.test(mp) && s.pricePerSqYd) {
    const minYd = firstInt(s.plotRange);
    return minYd ? s.pricePerSqYd * minYd : null;
  }
  return parseTotalRupees(mp);
}

/** Compact ₹ label for a rupee figure (₹78.0 L / ₹2.72 Cr). */
export function priceLabel(rs: number): string {
  return rs >= 1e7 ? `₹${(rs / 1e7).toFixed(2)} Cr` : `₹${Math.round(rs / 1e5)} L`;
}

/* ── Budget bands ──────────────────────────────────────────────────────── */

export interface BudgetBand {
  id: string;
  label: string;
  test: (rs: number) => boolean;
}

export const BUDGET_BANDS: BudgetBand[] = [
  { id: 'lt1cr', label: 'Under ₹1 Cr', test: rs => rs < 1e7 },
  { id: '1to2cr', label: '₹1–2 Cr', test: rs => rs >= 1e7 && rs < 2e7 },
  { id: 'gt2cr', label: '₹2 Cr +', test: rs => rs >= 2e7 },
];

/* ── Sort ──────────────────────────────────────────────────────────────── */

export type SortId = 'featured' | 'price-asc' | 'price-desc' | 'aqi';

export const SORT_OPTIONS: { id: SortId; label: string }[] = [
  { id: 'featured', label: 'Featured' },
  { id: 'price-asc', label: 'Price: Low to High' },
  { id: 'price-desc', label: 'Price: High to Low' },
  { id: 'aqi', label: 'Cleanest air first' },
];

/* ── The one function the browser calls ────────────────────────────────── */

export interface Filters {
  q: string;
  category: string; // '' = all
  stage: string; // '' = all
  budget: string; // BudgetBand id, '' = all
  sort: SortId;
}

export const EMPTY_FILTERS: Filters = { q: '', category: '', stage: '', budget: '', sort: 'featured' };

const categoryMatch = (slug: string) => CATEGORIES.find(c => c.slug === slug)?.match;

/** Narrow + order the portfolio for the given filters. Original order is the
 *  "Featured" order (Firestore `order`, then in-code sequence). */
export function applyFilters(all: Sanctuary[], f: Filters): Sanctuary[] {
  const q = f.q.trim().toLowerCase();

  let out = all.filter(s => {
    if (f.category) {
      const m = categoryMatch(f.category);
      if (m && !m(s)) return false;
    }
    if (f.stage && (s.stage ?? 'ongoing') !== f.stage) return false;
    if (f.budget) {
      const band = BUDGET_BANDS.find(b => b.id === f.budget);
      const price = estimateFromPrice(s);
      // On-request prices are hidden only when a budget band is chosen — they
      // cannot be placed in one honestly.
      if (band && (price == null || !band.test(price))) return false;
    }
    if (q) {
      const hay = [s.title, s.location, s.commute, s.tagline, ...(s.features ?? [])]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (f.sort === 'price-asc' || f.sort === 'price-desc') {
    out = [...out].sort((a, b) => {
      const pa = estimateFromPrice(a);
      const pb = estimateFromPrice(b);
      // On-request always sinks to the bottom regardless of direction.
      if (pa == null && pb == null) return 0;
      if (pa == null) return 1;
      if (pb == null) return -1;
      return f.sort === 'price-asc' ? pa - pb : pb - pa;
    });
  } else if (f.sort === 'aqi') {
    out = [...out].sort((a, b) => (a.aqi ?? 999) - (b.aqi ?? 999));
  }

  return out;
}

/* ── URL <-> Filters (shareable, deep-linkable) ────────────────────────── */

export function filtersFromParams(p: URLSearchParams | Record<string, string | undefined>): Filters {
  const get = (k: string) =>
    p instanceof URLSearchParams ? (p.get(k) ?? '') : (p[k] ?? '');
  const sort = get('sort') as SortId;
  return {
    q: get('q'),
    category: get('type'),
    stage: get('stage'),
    budget: get('budget'),
    sort: SORT_OPTIONS.some(o => o.id === sort) ? sort : 'featured',
  };
}

/** Serialize to a query string, omitting defaults so links stay clean. */
export function paramsFromFilters(f: Filters): string {
  const sp = new URLSearchParams();
  if (f.q) sp.set('q', f.q);
  if (f.category) sp.set('type', f.category);
  if (f.stage) sp.set('stage', f.stage);
  if (f.budget) sp.set('budget', f.budget);
  if (f.sort && f.sort !== 'featured') sp.set('sort', f.sort);
  const s = sp.toString();
  return s ? `?${s}` : '';
}

export type { Category, Stage };
