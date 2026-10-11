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

/** Where a plot really sits on the drawing: centre (% of width/height) and width ÷ height. */
export interface PlotShape { x: number; y: number; aspect: number }

export interface SiteLayout {
  sanctuaryId: string;
  /**
   * Plot centres and proportions read off the master plan. The plot's *area*
   * always comes from its sold size, so only the shape is taken from here.
   * Plots without an entry fall back to a square around their dot.
   */
  shapes?: Record<number, PlotShape>;
  /** Transparent line-art version of the master plan (white strokes, no background). */
  overlaySrc: string;
  /** Optional colour fills drawn under the line art (see scripts/build-agartha-clubhouse.py). */
  colorSrc?: string;
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

/**
 * Agartha plot centres and proportions, read off `agartha-master-plan.webp`
 * (centre as % of the sheet; aspect = width ÷ height of the plot as drawn).
 * Plots 34 and 35 run off the right edge of the sheet, so theirs are inferred.
 */
const AGARTHA_SHAPES: Record<number, PlotShape> = {
  1: { x: 37.4, y: 17.8, aspect: 1.8 }, 2: { x: 27.1, y: 19.7, aspect: 1.0 },
  3: { x: 7.8, y: 26.9, aspect: 1.0 }, 4: { x: 33.7, y: 27.2, aspect: 2.1 },
  5: { x: 39.2, y: 36.1, aspect: 0.55 }, 6: { x: 30.7, y: 36.9, aspect: 0.78 },
  7: { x: 20.0, y: 38.8, aspect: 1.1 }, 8: { x: 21.0, y: 46.6, aspect: 1.0 },
  9: { x: 31.5, y: 47.5, aspect: 0.75 }, 10: { x: 39.2, y: 47.5, aspect: 0.72 },
  11: { x: 22.0, y: 53.6, aspect: 0.9 }, 12: { x: 32.0, y: 56.4, aspect: 0.54 },
  13: { x: 39.2, y: 56.4, aspect: 0.62 }, 14: { x: 23.5, y: 60.8, aspect: 1.1 },
  15: { x: 23.9, y: 67.4, aspect: 1.14 }, 16: { x: 36.7, y: 66.1, aspect: 1.23 },
  17: { x: 25.3, y: 74.5, aspect: 1.06 }, 18: { x: 37.5, y: 73.6, aspect: 1.27 },
  19: { x: 26.3, y: 82.5, aspect: 1.1 }, 20: { x: 38.4, y: 80.6, aspect: 1.04 },
  21: { x: 52.3, y: 32.9, aspect: 2.07 }, 22: { x: 52.3, y: 38.8, aspect: 1.98 },
  23: { x: 63.5, y: 35.6, aspect: 0.48 }, 24: { x: 77.1, y: 32.1, aspect: 1.78 },
  25: { x: 77.1, y: 38.7, aspect: 2.07 }, 26: { x: 56.1, y: 46.3, aspect: 2.95 },
  27: { x: 56.1, y: 78.9, aspect: 2.86 }, 28: { x: 76.9, y: 48.1, aspect: 1.26 },
  29: { x: 73.0, y: 56.8, aspect: 0.83 }, 30: { x: 73.0, y: 63.9, aspect: 0.89 },
  31: { x: 79.2, y: 76.8, aspect: 1.1 }, 32: { x: 80.7, y: 63.9, aspect: 0.89 },
  33: { x: 80.7, y: 56.8, aspect: 0.83 }, 34: { x: 93.5, y: 46.6, aspect: 1.5 },
  35: { x: 93.5, y: 52.8, aspect: 1.4 }, 36: { x: 91.8, y: 58.8, aspect: 1.48 },
  37: { x: 90.2, y: 64.6, aspect: 1.0 },
};

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
    colorSrc: '/layouts/agartha-clubhouse.webp',
    // Centre: Google Maps listing "Agartha By Modcon", plus code Q64Q+C9F
    // (Mohammadabad @ Janakampet). ~10° clockwise matches how the plan sits on
    // the ground relative to its sheet. Fine-tune at /map?calibrate=agartha.
    anchors: anchorsFromCenter(AGARTHA_SITE, 322, 402, 10),
    calibrated: false,
    shapes: AGARTHA_SHAPES,
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
  /** Plot centre. */
  position: LatLng;
  /** The plot's outline: a rectangle of the plot's real area on the ground. */
  corners: LatLng[];
  status: PlotStatus;
}

const SQ_YD_M2 = 0.83612736;

/** Metres across the drawing (u) and down it (v), from the anchors. */
function drawingSizeM(a: LayoutAnchors): { w: number; h: number } {
  const mPerLat = 110_950;
  const mPerLng = 111_320 * Math.cos((a.tl[0] * Math.PI) / 180);
  const len = (p: LatLng) => Math.hypot((p[0] - a.tl[0]) * mPerLat, (p[1] - a.tl[1]) * mPerLng);
  return { w: len(a.tr), h: len(a.bl) };
}

/** Plots for a sanctuary, projected onto the ground at their true size. */
export function geoPlots(layout: SiteLayout): GeoPlot[] {
  const { w: W, h: H } = drawingSizeM(layout.anchors);
  return (SANCTUARY_PLOTS[layout.sanctuaryId] ?? []).map(p => {
    const shape = layout.shapes?.[p.id];
    const cx = (shape?.x ?? p.x) / 100;
    const cy = (shape?.y ?? p.y) / 100;
    const aspect = shape?.aspect ?? 1;
    const areaM2 = p.area * SQ_YD_M2;
    const wM = Math.sqrt(areaM2 * aspect);
    const hM = Math.sqrt(areaM2 / aspect);
    const du = wM / 2 / W;
    const dv = hM / 2 / H;
    const at = (u: number, v: number) => layoutToLatLng(layout.anchors, u, v);
    return {
      ...p,
      position: at(cx, cy),
      corners: [at(cx - du, cy - dv), at(cx + du, cy - dv), at(cx + du, cy + dv), at(cx - du, cy + dv)],
      status: layout.status[p.id] ?? 'available',
    };
  });
}

export const PLOT_STATUS_COLOR: Record<PlotStatus, string> = {
  available: '#4ade80',
  reserved: '#facc15',
  sold: '#1f2937',
};
