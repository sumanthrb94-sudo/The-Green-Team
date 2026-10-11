/**
 * Georeferenced site layouts — lets a sanctuary's master-plan drawing (and its
 * plot dots from agartha-layout.ts) sit on top of the satellite basemap in
 * /map, the way buyers see the venture on the ground.
 *
 * A layout is pinned to the earth by three anchors: the lat/lng of the
 * drawing's top-left, top-right and bottom-left corners. Those three points
 * define an affine transform, so the drawing can be scaled, rotated and
 * sheared to match the ground without re-tracing anything — every plot dot's
 * (x%, y%) on the drawing maps through the same transform.
 *
 * Calibrating: open /map?calibrate=<sanctuary id>, drag the three corner
 * handles until the drawn boundary sits on the fence line / roads visible in
 * the satellite imagery, then paste the printed anchors here and set
 * `calibrated: true`. Until then the map labels the layout "approximate".
 */
import type { LatLng } from '@/lib/data/map';
import { SANCTUARY_PLOTS, type PlotDot } from '@/lib/data/agartha-layout';

export type PlotStatus = 'available' | 'reserved' | 'sold';

export interface LayoutAnchors {
  /** lat/lng of the drawing's top-left corner */
  tl: LatLng;
  /** lat/lng of the drawing's top-right corner */
  tr: LatLng;
  /** lat/lng of the drawing's bottom-left corner */
  bl: LatLng;
}

export interface SiteLayout {
  sanctuaryId: string;
  /** Transparent line-art version of the master plan (white strokes, no background). */
  overlaySrc: string;
  anchors: LayoutAnchors;
  /** false until someone has lined the anchors up against the imagery. */
  calibrated: boolean;
  /**
   * Per-plot status, admin-confirmed. Plots not listed are shown as available —
   * never mark a plot sold here without the developer's sales sheet.
   */
  status: Record<number, PlotStatus>;
}

/**
 * Anchors from a site centre, the drawing's real-world size and how far the
 * drawing is turned from true north (clockwise, degrees). Handy when all you
 * have is one pin for the site — size and rotation come from the drawing.
 */
export function anchorsFromCenter(
  center: LatLng,
  widthM: number,
  heightM: number,
  rotationDeg: number,
): LayoutAnchors {
  const t = (rotationDeg * Math.PI) / 180;
  const mPerLat = 110_950;
  const mPerLng = 111_320 * Math.cos((center[0] * Math.PI) / 180);
  const at = (east: number, north: number): LatLng => {
    const e = east * Math.cos(t) + north * Math.sin(t);
    const n = -east * Math.sin(t) + north * Math.cos(t);
    return [+(center[0] + n / mPerLat).toFixed(6), +(center[1] + e / mPerLng).toFixed(6)];
  };
  return {
    tl: at(-widthM / 2, heightM / 2),
    tr: at(widthM / 2, heightM / 2),
    bl: at(-widthM / 2, -heightM / 2),
  };
}

/** Agartha's Google Maps pin (plus code 7J9WQ64Q+C9F). */
export const AGARTHA_SITE: LatLng = [17.756063, 78.238422];

/**
 * Agartha anchors: centred on the Google Maps pin and scaled from the
 * drawing (plot 31 = 1 acre ⇒ ~0.4 m per px of the 800-px preview, so the
 * sheet spans ~322 m × 402 m). Needs calibrating against the real site.
 */
export const SITE_LAYOUTS: Record<string, SiteLayout> = {
  agartha: {
    sanctuaryId: 'agartha',
    overlaySrc: '/layouts/agartha-overlay.webp',
    // Centre: Google Maps listing "Agartha By Modcon", plus code Q64Q+C9F
    // (Mohammadabad @ Janakampet). ~10° clockwise matches how the plan sits on
    // the ground relative to its sheet. Fine-tune at /map?calibrate=agartha.
    anchors: anchorsFromCenter(AGARTHA_SITE, 322, 402, 10),
    calibrated: false,
    // Sold plots as confirmed by the team, Oct 2026 — 13 sold, 24 available.
    status: Object.fromEntries(
      [3, 7, 8, 10, 11, 14, 22, 28, 29, 34, 35, 36, 37].map(id => [id, 'sold' as const])
    ),
  },
};

/** Drawing fraction (u, v ∈ 0..1, v down) → lat/lng through the anchors. */
export function layoutToLatLng(a: LayoutAnchors, u: number, v: number): LatLng {
  return [
    a.tl[0] + u * (a.tr[0] - a.tl[0]) + v * (a.bl[0] - a.tl[0]),
    a.tl[1] + u * (a.tr[1] - a.tl[1]) + v * (a.bl[1] - a.tl[1]),
  ];
}

/** Centre of the drawing — where the map flies to when a layout is opened. */
export const layoutCenter = (a: LayoutAnchors) => layoutToLatLng(a, 0.5, 0.5);

export interface GeoPlot extends PlotDot {
  position: LatLng;
  status: PlotStatus;
}

/** Plot dots for a sanctuary, projected onto the ground. */
export function geoPlots(layout: SiteLayout): GeoPlot[] {
  return (SANCTUARY_PLOTS[layout.sanctuaryId] ?? []).map(p => ({
    ...p,
    position: layoutToLatLng(layout.anchors, p.x / 100, p.y / 100),
    status: layout.status[p.id] ?? 'available',
  }));
}

export const PLOT_STATUS_COLOR: Record<PlotStatus, string> = {
  available: '#4ade80',
  reserved: '#facc15',
  sold: '#1f2937',
};
