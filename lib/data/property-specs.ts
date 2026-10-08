/**
 * Per-type specifications — the parameters a listing needs before it can be
 * published, by asset class. One schema drives three places so they can never
 * drift apart:
 *
 *   - the admin form (components/admin/PropertiesManager.tsx) renders a field
 *     per entry, in this order, with these labels and options;
 *   - the API (lib/server/property-input.ts) whitelists, coerces and — when a
 *     listing goes live — enforces the `required` ones;
 *   - the property page (components/property/Specifications.tsx) shows every
 *     filled entry, and nothing for an empty one.
 *
 * Fields are flat top-level keys on the `properties` document (the portfolio
 * reader drops nested objects), so a key must be unique across all types.
 * A key shared by several types (e.g. `floors`) is declared once per type with
 * a type-appropriate label.
 */

import type { Category } from '@/lib/data/categories';

export type SpecKind = 'text' | 'number' | 'select' | 'multi' | 'boolean';

export interface SpecOption {
  value: string;
  label: string;
}

export interface SpecField {
  key: string;
  label: string;
  kind: SpecKind;
  options?: SpecOption[];
  placeholder?: string;
  /** Unit appended on the property page (₹ prefixes are written into the label). */
  unit?: string;
  /** Enforced when the listing is published (status: live). Drafts may be partial. */
  required?: boolean;
  hint?: string;
}

const opts = (...xs: (string | [string, string])[]): SpecOption[] =>
  xs.map(x => (Array.isArray(x) ? { value: x[0], label: x[1] } : { value: x, label: x }));

/* ── Option sets ───────────────────────────────────────────────────────── */

const CONFIGURATIONS = opts('1 BHK', '2 BHK', '2.5 BHK', '3 BHK', '3.5 BHK', '4 BHK', '5 BHK', '5+ BHK');
const FACINGS = opts('East', 'West', 'North', 'South', 'North-East', 'North-West', 'South-East', 'South-West');
const RESIDENTIAL_FURNISHING = opts(
  ['unfurnished', 'Unfurnished'],
  ['semi-furnished', 'Semi-furnished'],
  ['fully-furnished', 'Fully furnished'],
);
const APPROVALS = opts('HMDA', 'DTCP', 'GHMC', 'TSIIC', 'Gram Panchayat', 'Municipality', 'Agricultural (Pattadar)');

/* ── Common to every type ──────────────────────────────────────────────── */

export const COMMON_SPECS: SpecField[] = [
  {
    key: 'transaction',
    label: 'Transaction',
    kind: 'select',
    options: opts(['new', 'New booking (developer)'], ['resale', 'Resale (owner)']),
    required: true,
  },
  { key: 'approvals', label: 'Approvals', kind: 'multi', options: APPROVALS, required: true },
  { key: 'totalLandArea', label: 'Total project land', kind: 'text', placeholder: 'e.g. 4.5 acres' },
  { key: 'facing', label: 'Facing options', kind: 'multi', options: FACINGS },
  { key: 'gated', label: 'Gated community', kind: 'boolean' },
  { key: 'maintenance', label: 'Maintenance', kind: 'text', placeholder: 'e.g. ₹3 / sq ft / month' },
];

/* ── Per type ──────────────────────────────────────────────────────────── */

export const TYPE_SPECS: Record<Category, SpecField[]> = {
  villas: [
    {
      key: 'villaType',
      label: 'Villa type',
      kind: 'select',
      options: opts(
        ['independent', 'Independent villa'],
        ['villament', 'Villament'],
        ['row-house', 'Row house'],
        ['duplex', 'Duplex'],
        ['triplex', 'Triplex'],
      ),
      required: true,
    },
    { key: 'configurations', label: 'Configurations', kind: 'multi', options: CONFIGURATIONS, required: true },
    { key: 'landPerUnit', label: 'Land per villa', kind: 'text', placeholder: 'e.g. 200 – 400 sq yds' },
    { key: 'floors', label: 'Floors per villa', kind: 'text', placeholder: 'e.g. G+2' },
    { key: 'carParking', label: 'Car parking', kind: 'text', placeholder: 'e.g. 2 covered' },
    { key: 'furnishing', label: 'Furnishing', kind: 'select', options: RESIDENTIAL_FURNISHING },
    { key: 'privateGarden', label: 'Private garden / terrace', kind: 'boolean' },
  ],
  apartments: [
    { key: 'configurations', label: 'Configurations', kind: 'multi', options: CONFIGURATIONS, required: true },
    { key: 'superBuiltUpArea', label: 'Super built-up area', kind: 'text', placeholder: 'e.g. 1,650 – 2,800 sq ft' },
    { key: 'towers', label: 'Towers', kind: 'number', placeholder: 'e.g. 4', required: true },
    { key: 'floors', label: 'Floors per tower', kind: 'text', placeholder: 'e.g. G+24', required: true },
    { key: 'unitsPerFloor', label: 'Units per floor', kind: 'number', placeholder: 'e.g. 6' },
    { key: 'liftsPerTower', label: 'Lifts per tower', kind: 'number', placeholder: 'e.g. 4' },
    { key: 'openSpacePercent', label: 'Open space', kind: 'number', unit: '%', placeholder: 'e.g. 70' },
    { key: 'carParking', label: 'Car parking', kind: 'text', placeholder: 'e.g. 1 covered per unit' },
    { key: 'furnishing', label: 'Furnishing', kind: 'select', options: RESIDENTIAL_FURNISHING },
  ],
  plots: [
    {
      key: 'plotType',
      label: 'Plot type',
      kind: 'select',
      options: opts(
        ['open', 'Open plot'],
        ['villa', 'Villa plot'],
        ['farm', 'Farm plot / farmland'],
        ['commercial', 'Commercial plot'],
      ),
      required: true,
    },
    {
      key: 'layoutApproval',
      label: 'Layout permit no.',
      kind: 'text',
      placeholder: 'e.g. HMDA LP No. 000123/LO/Plg/2024',
      hint: 'The LP / DTCP permit number as issued.',
    },
    { key: 'roadWidth', label: 'Road widths', kind: 'text', placeholder: 'e.g. 40 ft main · 30 ft internal' },
    { key: 'cornerPlots', label: 'Corner plots available', kind: 'boolean' },
    {
      key: 'utilities',
      label: 'Infrastructure',
      kind: 'multi',
      options: opts(
        'Black-top roads',
        'Electricity',
        'Water supply',
        'Underground drainage',
        'Street lights',
        'Compound wall',
        'Avenue plantation',
      ),
    },
    { key: 'constructionAllowed', label: 'Construction permitted', kind: 'text', placeholder: 'e.g. G+2 · build anytime' },
  ],
  commercial: [
    {
      key: 'commercialType',
      label: 'Space type',
      kind: 'select',
      options: opts(
        ['office', 'Office space'],
        ['co-working', 'Co-working'],
        ['retail', 'Retail / shop'],
        ['showroom', 'Showroom'],
        ['warehouse', 'Warehouse'],
      ),
      required: true,
    },
    {
      key: 'dealType',
      label: 'Available for',
      kind: 'select',
      options: opts(['sale', 'Sale'], ['lease', 'Lease'], ['both', 'Sale or lease']),
      required: true,
    },
    { key: 'rentPerSqFt', label: 'Lease rent (₹ / sq ft / month)', kind: 'number', placeholder: 'e.g. 85' },
    { key: 'fitout', label: 'Fit-out', kind: 'select', options: opts(
      ['bare-shell', 'Bare shell'],
      ['warm-shell', 'Warm shell'],
      ['fully-furnished', 'Fully furnished'],
      ['plug-and-play', 'Plug & play'],
    ) },
    { key: 'floors', label: 'Floors in building', kind: 'text', placeholder: 'e.g. G+12' },
    { key: 'workstations', label: 'Workstations', kind: 'text', placeholder: 'e.g. 40 – 220 seats' },
    { key: 'buildingGrade', label: 'Building grade', kind: 'select', options: opts(['A', 'Grade A'], ['B', 'Grade B']) },
    { key: 'carParking', label: 'Car parking', kind: 'text', placeholder: 'e.g. 1 per 1,000 sq ft' },
    { key: 'powerBackup', label: 'Power backup', kind: 'text', placeholder: 'e.g. 100% DG backup' },
    { key: 'lockInPeriod', label: 'Lock-in period', kind: 'text', placeholder: 'e.g. 3 years' },
    { key: 'occupancyCertificate', label: 'Occupancy certificate received', kind: 'boolean' },
  ],
};

/** The fields shown for one type, in form order: its own first, then the common ones. */
export const specsFor = (c?: Category): SpecField[] => [...(c ? TYPE_SPECS[c] : []), ...COMMON_SPECS];

/** Every spec key across all types — the server's whitelist. */
export const ALL_SPEC_FIELDS: SpecField[] = (() => {
  const seen = new Map<string, SpecField>();
  for (const f of [...Object.values(TYPE_SPECS).flat(), ...COMMON_SPECS]) if (!seen.has(f.key)) seen.set(f.key, f);
  return [...seen.values()];
})();

/**
 * The size field (`plotRange`) is shared — it feeds the pricing strip and the
 * price estimate — but means something different per type.
 */
export const SIZE_LABEL: Record<Category, { label: string; placeholder: string }> = {
  villas: { label: 'Built-up area range', placeholder: 'e.g. 3,882 – 7,000 SFT' },
  apartments: { label: 'Carpet area range', placeholder: 'e.g. 1,250 – 2,100 SFT' },
  plots: { label: 'Plot size range', placeholder: 'e.g. 150 – 500 sq yds' },
  commercial: { label: 'Carpet area range', placeholder: 'e.g. 1,200 – 25,000 SFT' },
};

/** Human value for one spec on the property page; null when unset. */
export function formatSpec(f: SpecField, v: unknown): string | null {
  if (v === undefined || v === null || v === '') return null;
  switch (f.kind) {
    case 'boolean':
      return v === true ? 'Yes' : null;
    case 'number': {
      const n = Number(v);
      return Number.isFinite(n) && n > 0 ? `${n.toLocaleString('en-IN')}${f.unit ?? ''}` : null;
    }
    case 'select':
      return f.options?.find(o => o.value === v)?.label ?? String(v);
    case 'multi':
      return Array.isArray(v) && v.length
        ? v.map(x => f.options?.find(o => o.value === x)?.label ?? String(x)).join(' · ')
        : null;
    default:
      return String(v).trim() || null;
  }
}

/** Labels of the required specs (plus the shared size range) missing from a listing. */
export function missingRequired(p: Record<string, unknown>): string[] {
  const c = p.category as Category | undefined;
  const missing: string[] = [];
  if (!c) return ['Property type'];
  if (!String(p.plotRange ?? '').trim()) missing.push(SIZE_LABEL[c].label);
  for (const f of specsFor(c)) {
    if (!f.required) continue;
    const v = p[f.key];
    const empty =
      v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0) || (f.kind === 'number' && !(Number(v) > 0));
    if (empty) missing.push(f.label);
  }
  return missing;
}
