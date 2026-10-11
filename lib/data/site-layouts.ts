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
 * Agartha anchors are an estimate: centred on the map pin and scaled from the
 * drawing (plot 31 = 1 acre ⇒ ~0.4 m per px of the 800-px preview, so the
 * sheet spans ~322 m × 402 m). Needs calibrating against the real site.
 */
export const SITE_LAYOUTS: Record<string, SiteLayout> = {
  agartha: {
    sanctuaryId: 'agartha',
    overlaySrc: '/layouts/agartha-overlay.webp',
    anchors: {
      tl: [17.741812, 78.278482],
      tr: [17.741812, 78.281518],
      bl: [17.738188, 78.278482],
    },
    calibrated: false,
    status: {},
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
