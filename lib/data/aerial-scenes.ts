/**
 * Aerial "what's around it" snapshots, rendered at /aerial/<id> by
 * components/map/AerialSnapshot.tsx and downloadable as a PNG for WhatsApp,
 * brochures and social posts.
 *
 * Every coordinate here comes from a Google Maps listing (plus code or place
 * pin), not from eyeballing a map — a misplaced neighbour misleads a buyer
 * about distances. Add a place only with a source you can point to.
 */
import type { LatLng } from '@/lib/data/map';
import { AGARTHA_SITE } from '@/lib/data/site-layouts';

export interface AerialPlace {
  name: string;
  /** Short kind label shown under the name: "Farm stay", "Town", "Temple"… */
  kind: string;
  at: LatLng;
}

export interface AerialScene {
  id: string;
  /** Sanctuary id in SITE_LAYOUTS, to draw the plot layout on the site. */
  layoutId?: string;
  title: string;
  subtitle: string;
  site: LatLng;
  places: AerialPlace[];
  /** Distance rings drawn around the site, in km. */
  ringsKm: number[];
}

export const AERIAL_SCENES: Record<string, AerialScene> = {
  agartha: {
    id: 'agartha',
    layoutId: 'agartha',
    title: 'MODCON Agartha',
    subtitle: 'Mohammadabad @ Janakampet · Narsapur, Hyderabad',
    site: AGARTHA_SITE,
    ringsKm: [2, 5],
    places: [
      { name: 'Agastya Farms', kind: 'Farm stay', at: [17.76197, 78.24147] },
      { name: 'Pattigari Nilayam', kind: 'Farmhouse', at: [17.76381, 78.22857] },
      { name: 'Ayana Farms', kind: 'Hilltop resort · farmland', at: [17.789846, 78.248208] },
      { name: 'Jala Anjaneya Swamy Temple', kind: 'Temple · Medak–Narsapur Rd', at: [17.76282, 78.268648] },
      { name: 'Narsapur', kind: 'Town', at: [17.73795, 78.28121] },
      { name: 'Narsapur Lake & Urban Forest Park', kind: 'Lake · forest park', at: [17.7264, 78.28605] },
      { name: 'Geetha Farmz', kind: 'Farm stay', at: [17.782155, 78.294998] },
      { name: 'Forest Creek', kind: 'Resort · SH 17', at: [17.75093, 78.33356] },
    ],
  },
};

/** Great-circle distance in km. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
