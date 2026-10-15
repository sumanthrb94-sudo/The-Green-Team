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

/** SYL site pin, as confirmed by the team (Oct 2026). */
export const SYL_SITE: LatLng = [17.1326227, 78.4783771];

export interface AerialPlace {
  name: string;
  /** Short kind label shown under the name: "Farm stay", "Town", "Temple"… */
  kind: string;
  at: LatLng;
  /** Residential projects get their own colour and legend entry. */
  group?: 'residential' | 'landmark';
}

export interface AerialScene {
  id: string;
  /** Sanctuary id in SITE_LAYOUTS, to draw the plot layout on the site. */
  layoutId?: string;
  title: string;
  subtitle: string;
  site: LatLng;
  /** Small caps line on the site's card. */
  siteTag?: string;
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
  syl: {
    id: 'syl',
    title: 'MODCON SYL',
    subtitle: 'Near Maheshwaram · South Hyderabad',
    site: SYL_SITE,
    siteTag: 'OUR PROJECT',
    ringsKm: [5, 10],
    places: [
      { name: 'Hallmark Oakshir', kind: 'Villas', at: [17.165939, 78.457664], group: 'residential' },
      { name: 'Prajay Virgin County', kind: 'Villas & apartments', at: [17.174722, 78.457222], group: 'residential' },
      { name: 'Ramky Discovery City', kind: 'Integrated township', at: [17.177352, 78.479887], group: 'residential' },
      { name: 'Bliss in the Woods', kind: 'Villas · Nestmakers', at: [17.191994, 78.437067], group: 'residential' },
      { name: 'Casagrand Windsor Court', kind: 'Villas', at: [17.195438, 78.464687], group: 'residential' },
      { name: 'Vijayakalpa Kshetra', kind: 'Villas', at: [17.209812, 78.492938], group: 'residential' },
      { name: 'Rukkha Residency', kind: 'Residential', at: [17.210866, 78.478529], group: 'residential' },
      { name: 'Akshita Golden Breeze I', kind: 'Plotted layout', at: [17.146458, 78.436103], group: 'residential' },
      { name: 'Akshita Golden Breeze II', kind: 'Plotted layout', at: [17.105654, 78.42714], group: 'residential' },
      { name: 'Shivaganga Temple', kind: 'Temple · Maheshwaram town', at: [17.136528, 78.437839] },
      { name: 'Tukkuguda · ORR Exit 14', kind: 'ORR interchange', at: [17.20917, 78.47639] },
      { name: 'Fab City & E-City', kind: 'Electronics cluster · Raviryal', at: [17.21611, 78.51306] },
      { name: 'Wonderla', kind: 'Amusement park · ORR Exit 13', at: [17.217289, 78.528505] },
      { name: 'RGI Airport', kind: 'International airport', at: [17.240283, 78.429358] },
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
