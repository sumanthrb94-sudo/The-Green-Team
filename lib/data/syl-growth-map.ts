/**
 * Investor slide: MODCON SYL on satellite imagery with the established
 * residential projects around it and South Hyderabad's growth corridors.
 * Rendered at /investors/syl-growth by components/map/GrowthCorridorMap.tsx.
 *
 * Every point names its source and how precise it is. Planned roads and the
 * metro are drawn straight between sourced waypoints, so they show the
 * direction of the corridor, not a surveyed alignment. The slide says so.
 */
import type { LatLng } from '@/lib/data/map';

/** SYL site pin, as confirmed by the team (Oct 2026). */
export const SYL_SITE: LatLng = [17.1326227, 78.4783771];

export type GrowthPlaceKind = 'residential' | 'hub' | 'landmark';

export interface GrowthPlace {
  name: string;
  /** Short line under the name. */
  note: string;
  at: LatLng;
  kind: GrowthPlaceKind;
  /** 'pin' = a map listing for the place itself; 'village' = the village or town centre. */
  precision: 'pin' | 'village';
  /** false = too far to fit; drawn as an arrow at the edge of the slide instead. */
  inFrame?: boolean;
}

export const GROWTH_PLACES: GrowthPlace[] = [
  // Established residential projects, from their Google Maps listings.
  { name: 'Hallmark Oakshir', note: 'Villas', at: [17.165939, 78.457664], kind: 'residential', precision: 'pin' },
  { name: 'Prajay Virgin County', note: 'Villas & apartments', at: [17.174722, 78.457222], kind: 'residential', precision: 'pin' },
  { name: 'Ramky Discovery City', note: 'Integrated township', at: [17.177352, 78.479887], kind: 'residential', precision: 'pin' },
  { name: 'Bliss in the Woods', note: 'Villas', at: [17.191994, 78.437067], kind: 'residential', precision: 'pin' },
  { name: 'Casagrand Windsor Court', note: 'Villas', at: [17.195438, 78.464687], kind: 'residential', precision: 'pin' },
  { name: 'Vijayakalpa Kshetra', note: 'Villas', at: [17.209812, 78.492938], kind: 'residential', precision: 'pin' },
  { name: 'Rukkha Residency', note: 'Residential', at: [17.210866, 78.478529], kind: 'residential', precision: 'pin' },
  { name: 'Akshita Golden Breeze I', note: 'Plotted layout', at: [17.146458, 78.436103], kind: 'residential', precision: 'pin' },
  { name: 'Akshita Golden Breeze II', note: 'Plotted layout', at: [17.105654, 78.42714], kind: 'residential', precision: 'pin' },
  // Map listings via Exa's place index (Google Maps pins), Oct 2026.
  { name: 'Vishal Sanjivini', note: '338 villas', at: [17.195862, 78.48996], kind: 'residential', precision: 'pin' },
  { name: "Kavuri's Forest Nest", note: 'Villas', at: [17.18013, 78.486673], kind: 'residential', precision: 'pin' },
  { name: 'Greenstone Kadamba Forest', note: 'Apartments', at: [17.177513, 78.493545], kind: 'residential', precision: 'pin' },
  { name: 'Sark South Fields', note: 'Villas', at: [17.188901, 78.458944], kind: 'residential', precision: 'pin' },
  { name: 'HPR Gateway', note: 'Residential', at: [17.218343, 78.491456], kind: 'residential', precision: 'pin' },
  { name: 'Northstar Airport Boulevard', note: 'Villas', at: [17.223922, 78.477183], kind: 'residential', precision: 'pin' },
  { name: 'MAN Airport Residency', note: 'Residential', at: [17.225413, 78.474828], kind: 'residential', precision: 'pin' },

  // Economic growth hubs.
  { name: 'RGI Airport', note: 'International airport', at: [17.240283, 78.429358], kind: 'hub', precision: 'pin' },
  { name: 'Fab City & E-City', note: 'Electronics manufacturing', at: [17.21611, 78.51306], kind: 'hub', precision: 'pin' },
  // Wikipedia, Adibatla: 17°14′N 78°33′E. The aerospace SEZ (Tata TASL, Lockheed Martin JV) is in the village.
  { name: 'Adibatla Aerospace SEZ', note: 'Tata Advanced Systems', at: [17.233, 78.55], kind: 'hub', precision: 'village' },
  // Wikipedia, Meerkhanpet: 17°03′N 78°35′E (GNS). Net Zero Valley, the university and the metro terminus.
  { name: 'Bharat Future City', note: 'Young India Skills University · Meerkhanpet', at: [17.05, 78.583], kind: 'hub', precision: 'village', inFrame: false },

  // Landmarks.
  { name: 'ORR Exit 14', note: 'Tukkuguda', at: [17.20917, 78.47639], kind: 'landmark', precision: 'pin' },
  { name: 'ORR Exit 13', note: 'Raviryal · Wonderla', at: [17.217289, 78.528505], kind: 'landmark', precision: 'pin' },
  { name: 'Maheshwaram', note: 'Shivaganga Temple', at: [17.136528, 78.437839], kind: 'landmark', precision: 'pin' },
  // Wikipedia, Amangal: 16°51′N 78°32′E. The radial road meets the RRR here.
  { name: 'Amangal · RRR', note: 'Regional Ring Road junction', at: [16.85, 78.533], kind: 'landmark', precision: 'village', inFrame: false },
];

export type CorridorStyle = 'expressway' | 'metro';

export interface GrowthCorridor {
  name: string;
  /** Status and length, shown on the label. */
  detail: string;
  style: CorridorStyle;
  /** Sourced waypoints. Lines are straight between them. */
  path: LatLng[];
  /** Which segment carries the label (index of its first point). */
  labelSegment: number;
}

const EXIT_14 = GROWTH_PLACES.find(p => p.name === 'ORR Exit 14')!.at;
const EXIT_13 = GROWTH_PLACES.find(p => p.name === 'ORR Exit 13')!.at;
const AIRPORT = GROWTH_PLACES.find(p => p.name === 'RGI Airport')!.at;
const FUTURE_CITY = GROWTH_PLACES.find(p => p.name === 'Bharat Future City')!.at;
const AMANGAL = GROWTH_PLACES.find(p => p.name === 'Amangal · RRR')!.at;

export const GROWTH_CORRIDORS: GrowthCorridor[] = [
  {
    // 41.5 km, 100 m wide: phase 1 Raviryal → Meerkhanpet 19.2 km, phase 2 → Amangal (RRR) 22.3 km.
    // Swarajya / Construction World, 2025–26.
    name: 'Ratan Tata Greenfield Radial Road',
    detail: '41.5 km · 100 m wide · ORR to RRR · under construction',
    style: 'expressway',
    path: [EXIT_13, FUTURE_CITY, AMANGAL],
    labelSegment: 0,
  },
  {
    // RGIA → Pedda Golconda → Tukkuguda → Raviryal, then at grade along the radial road to
    // Meerkhanpet. 39.6 km; DPR done, central approval pending (Siasat / Deccan Chronicle, 2025–26).
    name: 'Airport – Future City Metro',
    detail: '39.6 km · DPR ready · approval pending',
    style: 'metro',
    path: [AIRPORT, EXIT_14, EXIT_13, FUTURE_CITY],
    labelSegment: 0,
  },
];

/** Labels for roads that already exist and show on the imagery. Placed at a point on the road. */
export const ROAD_TAGS: { text: string; at: LatLng }[] = [
  // ORR between Exit 14 and Exit 13.
  { text: 'ORR · 158 km · operational', at: [17.2132, 78.5025] },
  // Srisailam Highway between Exit 14 and SYL.
  { text: 'Srisailam Hwy · NH 765', at: [17.171, 78.4775] },
];

/** Great-circle distance in km. */
export function distanceKm(a: LatLng, b: LatLng): number {
  const R = 6371;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b[0] - a[0]);
  const dLng = toRad(b[1] - a[1]);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(a[0])) * Math.cos(toRad(b[0])) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
