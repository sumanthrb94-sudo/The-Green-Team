/**
 * MODCON Agartha interactive site-plan data — hotspots and the 36 plot dots,
 * positioned (x%, y%) against the official FINAL-LAYOUT site plan image.
 */

export interface HotspotStat { label: string; value: string }
export interface Hotspot {
  id: string;
  num: number;
  x: number;
  y: number;
  label: string;
  tag: string;
  detail: string;
  stats: HotspotStat[];
}
export interface PlotDot { id: number; sqYds: number; x: number; y: number }

export const AGARTHA_HOTSPOTS: Hotspot[] = [
  {
    id: 'amenity-core', num: 1, x: 52, y: 68,
    label: '36,000 Sq Ft Clubhouse',
    tag: '5 Premium Amenities',
    detail: "The 36,000 sq ft heart of Agartha. 5 premium amenities: a resort-style aquatic pool, fully-equipped gym, kayaking lake, farm-to-table restaurant, and children's play area. Staycation villas for weekend escapes — without leaving the forest.",
    stats: [{ label: 'Clubhouse', value: '36,000 sq ft' }, { label: 'Amenities', value: '5 Premium' }, { label: 'Access', value: 'Residents + guests' }],
  },
  {
    id: 'forest-buffer', num: 2, x: 8, y: 40,
    label: 'Narsapur Forest Buffer',
    tag: 'AQI 12',
    detail: 'Direct boundary with the Narsapur forest reserve. AQI 12 — one of the cleanest micro-climates in the Hyderabad metro. Native bird corridors, natural white noise, and a living green lung at your doorstep.',
    stats: [{ label: 'AQI', value: '12 — Pristine' }, { label: 'Noise', value: '18 dB' }, { label: 'Forest', value: 'Native Dry Deciduous' }],
  },
  {
    id: 'goshala', num: 3, x: 36, y: 82,
    label: 'Goshala & Organic Farm',
    tag: 'Farm-to-Table',
    detail: 'An on-site Goshala with integrated animal husbandry for holistic farming. Each plot is pre-planted with 100+ tree varieties, advanced drip irrigation, vegetable beds, and a spiral herbal garden — your private edible forest.',
    stats: [{ label: 'Trees / Plot', value: '100+ varieties' }, { label: 'Irrigation', value: 'Drip system' }, { label: 'Farming', value: 'Permaculture' }],
  },
  {
    id: 'premium-corner', num: 4, x: 15, y: 33,
    label: 'Premium Corner — Plot 3',
    tag: '4,800 Sq Yds · ₹4.08 Cr',
    detail: 'The largest plot in Agartha. Corner positioning on the forest boundary gives maximum green frontage and the greatest separation from neighbours. At ₹8,500/sq yd: ₹4.08 Cr.',
    stats: [{ label: 'Size', value: '~4,800 sq yds' }, { label: 'Price', value: '~₹4.08 Cr' }, { label: 'Frontage', value: 'Forest boundary' }],
  },
  {
    id: 'plot-community', num: 5, x: 62, y: 48,
    label: '36-Plot Private Community',
    tag: 'From ₹68.7 L',
    detail: '36 unique farm plots across 25 acres — each pre-planted and drip-irrigated. Sizes from 808 to 4,800 sq yds at ₹8,500/sq yd. Near RRR, 40 mins from Financial District. Winner: Best Eco-Friendly Project 2024.',
    stats: [{ label: 'Total Area', value: '25 Acres' }, { label: 'Starting', value: '₹68.7 L' }, { label: 'Rate', value: '₹8,500/sq yd' }],
  },
];

export const AGARTHA_PLOTS: PlotDot[] = [
  // ── Top row (above main grid) ──
  { id: 1, sqYds: 1003, x: 53, y: 18 },
  { id: 2, sqYds: 968, x: 42, y: 22 },
  // ── PLOT 3 — Large irregular corner (forest boundary) ──
  { id: 3, sqYds: 4800, x: 15, y: 33 },
  // ── Row 2 (left → right) ──
  { id: 4, sqYds: 1690, x: 37, y: 35 },
  { id: 5, sqYds: 1249, x: 48, y: 32 },
  // ── Row 3 (left → right) ──
  { id: 7, sqYds: 1140, x: 21, y: 44 },
  { id: 6, sqYds: 1167, x: 33, y: 44 },
  { id: 10, sqYds: 1200, x: 44, y: 45 },
  // ── Row 4 (left → right) ──
  { id: 8, sqYds: 1120, x: 21, y: 53 },
  { id: 9, sqYds: 1080, x: 33, y: 53 },
  // ── Row 5 (left → right) ──
  { id: 11, sqYds: 1050, x: 21, y: 62 },
  { id: 12, sqYds: 1100, x: 32, y: 62 },
  { id: 13, sqYds: 1150, x: 44, y: 62 },
  // ── Row 6 ──
  { id: 14, sqYds: 1300, x: 21, y: 71 },
  // ── Row 7 ──
  { id: 15, sqYds: 1400, x: 21, y: 79 },
  { id: 16, sqYds: 1350, x: 33, y: 79 },
  // ── Row 8 ──
  { id: 17, sqYds: 1250, x: 21, y: 87 },
  { id: 18, sqYds: 1200, x: 33, y: 87 },
  // ── Bottom row ──
  { id: 19, sqYds: 1100, x: 21, y: 93 },
  { id: 20, sqYds: 1050, x: 36, y: 93 },
  // ── Right section, row 2 ──
  { id: 21, sqYds: 1210, x: 59, y: 33 },
  { id: 23, sqYds: 1450, x: 68, y: 32 },
  { id: 24, sqYds: 1600, x: 78, y: 27 },
  // ── Right section, row 3 ──
  { id: 22, sqYds: 1320, x: 59, y: 44 },
  { id: 25, sqYds: 1550, x: 78, y: 38 },
  { id: 33, sqYds: 1500, x: 83, y: 45 },
  // ── Right section, row 4 ──
  { id: 26, sqYds: 1869, x: 59, y: 54 },
  { id: 27, sqYds: 1700, x: 70, y: 51 },
  { id: 34, sqYds: 1550, x: 83, y: 54 },
  // ── Right section, row 5 ──
  { id: 28, sqYds: 2057, x: 70, y: 62 },
  { id: 32, sqYds: 1650, x: 80, y: 62 },
  { id: 35, sqYds: 1600, x: 83, y: 63 },
  // ── Right section, row 6 ──
  { id: 29, sqYds: 1800, x: 70, y: 71 },
  { id: 31, sqYds: 1900, x: 80, y: 71 },
  // ── Right section, rows 7-8 ──
  { id: 30, sqYds: 1750, x: 70, y: 82 },
  { id: 36, sqYds: 1700, x: 83, y: 79 },
];

/** dot diameter: scales linearly from 6px (968 sq yd) to 18px (4800 sq yd) */
export const plotDotSize = (sqYds: number) =>
  6 + Math.min(1, Math.max(0, (sqYds - 968) / (4800 - 968))) * 12;

/** sanctuary id → plot dots / hotspots (add new properties here when they get a site plan) */
export const SANCTUARY_PLOTS: Record<string, PlotDot[]> = { agartha: AGARTHA_PLOTS };
export const SANCTUARY_HOTSPOTS: Record<string, Hotspot[]> = { agartha: AGARTHA_HOTSPOTS };
