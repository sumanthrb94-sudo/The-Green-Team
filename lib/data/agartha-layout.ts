/**
 * MODCON Agartha interactive site-plan data — hotspots and the 37 plot dots,
 * positioned (x%, y%) against `public/agartha-master-plan.webp`.
 *
 * Source of truth: the client's `Agartha_Final_layout.pdf` master plan
 * (ARQEN Design Studio, drawing A001), exported to WebP by cropping the
 * drawing area out of the A3 sheet. Every plot number and area below is read
 * off that drawing — do not adjust a size without a newer layout to read it
 * from.
 *
 * This replaced an earlier 36-plot schedule whose sizes and arrangement no
 * longer matched the issued plan.
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

/** 1 acre as stated on the master plan for plots 3 and 31. */
export const ACRE_SQ_YDS = 4840;

export const AGARTHA_HOTSPOTS: Hotspot[] = [
  {
    id: 'amenity-core', num: 1, x: 56, y: 62,
    label: 'Agartha Resort & Clubhouse',
    tag: '2 Acres of Amenity',
    detail:
      'Two of the twenty-five acres are given over to the resort and clubhouse: earthen retreats, a farm-to-table restaurant, a yoga and wellness centre, a Tulum-style gym in wood and stone, a banquet hall, and a natural bio-pool cleaned by biological filtration rather than chemicals.',
    stats: [
      { label: 'Resort Area', value: '2 of 25 acres' },
      { label: 'Pool', value: 'Natural bio-filtered' },
      { label: 'Dining', value: 'Farm-to-table' },
    ],
  },
  {
    id: 'forest-buffer', num: 2, x: 5, y: 33,
    label: 'Narsapur Forest Boundary',
    tag: 'AQI 12',
    detail:
      'Direct boundary with the Narsapur forest reserve — native dry deciduous woodland that was standing before the layout was drawn. Native bird corridors, natural white noise, and 15 minutes to Narsapur Urban Park.',
    stats: [
      { label: 'AQI', value: '12 — Pristine' },
      { label: 'Noise', value: '18 dB' },
      { label: 'Urban Park', value: '15 min' },
    ],
  },
  {
    id: 'goshala', num: 3, x: 34, y: 8,
    label: 'Goshala & Organic Farm',
    tag: 'Farm-to-Table',
    detail:
      'An on-site Goshala with integrated animal husbandry feeding the soil back. Edible landscapes are developed on permaculture principles — a food forest of fruit, vegetables and herbs in your own backyard, designed to work with natural systems so it needs less maintenance and fewer inputs.',
    stats: [
      { label: 'Farming', value: 'Permaculture' },
      { label: 'Backyards', value: 'Edible food forest' },
      { label: 'Livestock', value: 'On-site Goshala' },
    ],
  },
  {
    id: 'premium-corner', num: 4, x: 6, y: 23,
    label: 'Plot 3 — One Acre',
    tag: '1 Acre · Forest Edge',
    detail:
      'One of two full-acre parcels on the plan (the other is Plot 31). Its western edge is the forest boundary itself, which gives it the greatest green frontage and the most separation from any neighbour.',
    stats: [
      { label: 'Size', value: '1 acre (~4,840 sq yds)' },
      { label: 'Frontage', value: 'Forest boundary' },
      { label: 'Full acres', value: 'Plots 3 & 31' },
    ],
  },
  {
    id: 'plot-community', num: 5, x: 47, y: 37,
    label: '37-Plot Farmhouse Community',
    tag: 'From ₹78 L',
    detail:
      '37 farm plots across 25 acres, from 726 sq yds up to a full acre, at ₹8,500/sq yd. Homes are built to order in natural materials — the Bamora Retreat in bamboo with a mezzanine, or the Earthlyn Retreat in CSCB brick with lime plaster — as 1, 2 or 3 BHK.',
    stats: [
      { label: 'Plots', value: '37' },
      { label: 'Sizes', value: '726 sq yds – 1 acre' },
      { label: 'Rate', value: '₹8,500/sq yd' },
    ],
  },
];

/**
 * Plot schedule, read directly off the master plan.
 * Plots 3 and 31 are marked "1. acre" on the drawing rather than a sq-yd figure.
 */
export const AGARTHA_PLOTS: PlotDot[] = [
  // ── North-west cluster, by the entrance and amenity core ──
  { id: 1, sqYds: 1003.5, x: 36.1, y: 16.2 },
  { id: 2, sqYds: 968, x: 28.9, y: 17.9 },
  { id: 3, sqYds: ACRE_SQ_YDS, x: 6.3, y: 22.9 },
  { id: 4, sqYds: 1690.44, x: 31.5, y: 26.7 },
  { id: 5, sqYds: 1248.6, x: 36.7, y: 31.9 },
  { id: 6, sqYds: 1167, x: 28.4, y: 33.6 },
  // ── West spine, along the forest boundary ──
  { id: 7, sqYds: 1140, x: 17.0, y: 36.6 },
  { id: 8, sqYds: 917, x: 17.8, y: 44.8 },
  { id: 11, sqYds: 917, x: 19.0, y: 51.6 },
  { id: 14, sqYds: 914, x: 19.7, y: 58.5 },
  { id: 15, sqYds: 978, x: 20.7, y: 67.0 },
  { id: 17, sqYds: 1053, x: 21.8, y: 73.7 },
  { id: 19, sqYds: 1044.24, x: 22.8, y: 81.2 },
  // ── Central-west block ──
  { id: 9, sqYds: 847, x: 30.1, y: 44.6 },
  { id: 10, sqYds: 847, x: 38.0, y: 44.8 },
  { id: 12, sqYds: 769, x: 31.1, y: 53.0 },
  { id: 13, sqYds: 968, x: 37.5, y: 53.0 },
  { id: 16, sqYds: 1230, x: 32.8, y: 64.3 },
  { id: 18, sqYds: 1126.79, x: 34.2, y: 71.5 },
  { id: 20, sqYds: 726, x: 35.9, y: 79.6 },
  // ── North-central row ──
  { id: 21, sqYds: 1210, x: 47.7, y: 32.0 },
  { id: 22, sqYds: 1210, x: 47.7, y: 37.8 },
  { id: 23, sqYds: 1279.71, x: 61.5, y: 31.9 },
  { id: 24, sqYds: 1572.7, x: 71.2, y: 30.3 },
  { id: 25, sqYds: 1326.35, x: 71.5, y: 37.5 },
  // ── Plots flanking the resort core ──
  { id: 26, sqYds: 1868.67, x: 47.2, y: 45.1 },
  { id: 27, sqYds: 1862.68, x: 64.4, y: 75.9 },
  // ── East block ──
  { id: 28, sqYds: 2057, x: 71.7, y: 45.2 },
  { id: 29, sqYds: 786.5, x: 70.9, y: 54.3 },
  { id: 30, sqYds: 726, x: 71.5, y: 61.8 },
  { id: 31, sqYds: ACRE_SQ_YDS, x: 71.8, y: 70.8 },
  { id: 32, sqYds: 726, x: 78.3, y: 61.8 },
  { id: 33, sqYds: 786.5, x: 78.5, y: 54.3 },
  // ── Far-east strip ──
  { id: 34, sqYds: 1232.86, x: 88.7, y: 44.9 },
  { id: 35, sqYds: 1165.05, x: 88.7, y: 51.2 },
  { id: 36, sqYds: 1001.43, x: 88.5, y: 56.9 },
  { id: 37, sqYds: 740.57, x: 88.5, y: 63.0 },
];

/** dot diameter: scales linearly across the real range on the plan (726 → 4,840 sq yds) */
export const plotDotSize = (sqYds: number) =>
  6 + Math.min(1, Math.max(0, (sqYds - 726) / (ACRE_SQ_YDS - 726))) * 12;

/** sanctuary id → plot dots / hotspots (add new properties here when they get a site plan) */
export const SANCTUARY_PLOTS: Record<string, PlotDot[]> = { agartha: AGARTHA_PLOTS };
export const SANCTUARY_HOTSPOTS: Record<string, Hotspot[]> = { agartha: AGARTHA_HOTSPOTS };
