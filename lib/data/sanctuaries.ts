/**
 * The three flagship sanctuaries — the canonical in-code portfolio.
 * Live Firestore `properties` documents (status: 'live') are merged after these.
 *
 * The Agartha gallery is served from this repo's own compressed mirror
 * (public/gallery/agartha/) rather than the Wix CDN the v1 app depended on.
 */

import type { Category, Stage } from '@/lib/data/categories';

export interface Sanctuary {
  id: string;
  title: string;
  location: string;
  aqi: number;
  noise: number;
  commute: string;
  valuation: string;
  memberPrice: string;
  image: string;
  features?: string[];
  tagline?: string;
  description?: string;
  /** Hand-written ≤160-char search/social description. The full `description`
   *  is prose for the page; slicing it for meta cuts mid-word and buries the
   *  headline facts, so metadata uses this when present. */
  metaDescription?: string;
  plots?: number;
  plotRange?: string;
  amenityAcres?: string;
  architect?: string;
  plotImages?: string[];
  pricePerSqYd?: number;
  sitePlanSrc?: string;
  brochureUrl?: string;
  mapUrl?: string;
  gallery?: string[];
  /**
   * Portal discovery fields — see lib/data/categories.ts. `category` is the
   * primary asset class, `stage` is where delivery stands, `investment` flags
   * an appreciation story worth telling (never a promised return).
   */
  category?: Category;
  stage?: Stage;
  investment?: boolean;
  /** Firestore-managed properties carry these */
  status?: 'live' | 'draft';
  order?: number;
}

// 0–22 are the original mirror; 23–27 are new renders lifted from the client's
// 2026 e-brochure (earthen retreats, the biomorphic clubhouse, thatched villas).
const AGARTHA_GALLERY = Array.from({ length: 28 }, (_, i) => `/gallery/agartha/${i}.webp`);

export const SANCTUARIES: Sanctuary[] = [
  {
    id: 'agartha',
    title: 'MODCON Agartha',
    category: 'plots',
    stage: 'ongoing',
    investment: true,
    location: 'Janakampet, Narsapur · Hyderabad',
    aqi: 12,
    noise: 18,
    commute: '50 mins to Gachibowli · 100 m from upcoming RRR',
    pricePerSqYd: 8500,
    valuation: '',
    memberPrice: 'From ₹78 L',
    image: '/gallery/agartha/11.webp',
    tagline: 'Where the forest becomes home.',
    metaDescription:
      'MODCON Agartha — 37 forest plots (726 sq yds to 1 acre) from ₹78 L on the Narsapur forest boundary, with a 2-acre resort and clubhouse. Book a site visit.',
    description:
      'MODCON Agartha is a 25-acre bespoke farmhouse community on the Narsapur forest boundary, 100 m from the upcoming RRR. Two of those acres are given to a resort and clubhouse — earthen retreats, a farm-to-table restaurant, a yoga and wellness centre, a Tulum-style gym, a banquet hall, and a natural bio-pool filtered biologically rather than chemically, fed by a hand-built natural stream. The 37 farm plots run from 726 sq yds to a full acre, each with an edible permaculture backyard, and homes are built to order in natural materials: the Bamora Retreat in bamboo with a mezzanine floor, or the Earthlyn Retreat in CSCB brick finished in lime plaster, as 1, 2 or 3 BHK. Designed by ARQEN Design Studio. Winner: Best Sustainable Eco-Friendly Project of the Year 2024 (Outlook Business Spotlight Entity Awards); nominated for the Times of India Ecopreneur Awards 2026.',
    plots: 37,
    plotRange: '726 sq yds – 1 acre',
    amenityAcres: '2-Acre Resort & Clubhouse',
    architect: 'MODCON Builders',
    sitePlanSrc: '/agartha-master-plan.webp',
    brochureUrl: 'https://www.modconbuilders.com/agartha',
    plotImages: AGARTHA_GALLERY,
    features: [
      '2-Acre Resort & Clubhouse',
      'Natural Bio-Pool (Chemical-Free)',
      'Hand-Built Natural Stream',
      'Farm-to-Table Restaurant',
      'Yoga & Wellness Centre',
      'Tulum-Style Jungle Gym',
      'Banquet Hall',
      'Edible Permaculture Backyards',
      'Goshala & Animal Husbandry',
      'Bamboo / CSCB Earthen Homes · 1–3 BHK',
      '100 m from Upcoming RRR',
      '15 Min to Narsapur Urban Park',
    ],
  },
  {
    id: 'syl',
    title: 'MODCON SYL Residences',
    category: 'villas',
    stage: 'ongoing',
    investment: true,
    location: 'Tukkuguda, ORR Exit-14 · Hyderabad',
    aqi: 22,
    noise: 24,
    commute: '10 mins to Airport · 30-45 mins to Financial District',
    valuation: '',
    memberPrice: '₹6,999 / SFT',
    image: '/gallery/syl/syl-exterior-dusk.webp',
    tagline: 'A modern address where luxury meets nature.',
    metaDescription:
      'MODCON SYL Residences — 15 biophilic villaments, 3,882–7,000 SFT at ₹6,999/SFT at Tukkuguda, ORR Exit-14, with a 22,000 SFT clubhouse. 10 min to the airport.',
    description:
      "MODCON SYL Residences is the residential half of a 4.5-acre integrated commercial-and-residential project at Tukkuguda, ORR Exit-14 — villament living in a low-density, biophilic enclave overlooking forest, with large balconies, abundant light and sunrise views. The 22,000 sq ft G+2 clubhouse is built entirely around health, wellness and nature: infinity pool, fully equipped gym with Pilates, yoga pavilion, steam and sauna, library, co-working spaces, banquet and guest rooms, indoor and outdoor play. Alongside it sits an integrated commercial hub — retail, cafés and banking at ground, co-working on the first floor, clinics and diagnostics on the second, and business suites with a hospitality stay concept above. Every balcony is landscaped on biophilic principles. Two to five minutes from ORR Exit-14 and Fab City, 10–15 minutes from the airport.",
    plots: 15,
    plotRange: 'Villaments 3,882 – 7,000 SFT · Integrated Commercial',
    amenityAcres: '22,000 SFT G+2 Clubhouse · Health • Wellness • Nature',
    architect: 'MODCON Builders',
    sitePlanSrc: '/syl-site-plan.webp',
    brochureUrl: 'https://www.modconbuilders.com',
    features: [
      'Integrated Commercial Hub (Enquire)',
      '15 Villaments · 3,882 – 7,000 SFT',
      'Infinity Pool',
      'Gym with Pilates · Steam & Sauna',
      'Yoga Pavilion · Library',
      'Co-Working & Business Suites',
      'Banquet & Guest Rooms',
      'Biophilic Balcony Landscaping',
      'Large Forest & Sunrise-View Balconies',
      'GROHE Fittings · EV Charging Points',
      '100% Power Backup · 4 High-Speed Lifts',
      'ORR Exit-14 · 2–5 Min · Airport 10–15 Min',
    ],
    plotImages: [
      // Exteriors from the 2026 MODCON deck; the rest are the clubhouse interiors.
      '/gallery/syl/syl-exterior-dusk.webp',
      '/gallery/syl/syl-street-dusk.webp',
      '/gallery/syl/syl-facade-sky.webp',
      '/gallery/syl/syl-balcony-detail.webp',
      '/gallery/syl/1776279315359.webp',
      '/gallery/syl/1776279320251.webp',
      '/gallery/syl/1776279329483.webp',
      '/gallery/syl/1776279339464.webp',
      '/gallery/syl/1776279343905.webp',
      '/gallery/syl/1776279350036.webp',
      '/gallery/syl/1776279361294.webp',
      '/gallery/syl/1776279377269.webp',
    ],
  },
  {
    id: 'dates-county',
    title: 'Dates County by Planet Green',
    category: 'plots',
    stage: 'ongoing',
    investment: true,
    location: 'Kandukur, Srisailam Highway · Hyderabad',
    aqi: 18,
    noise: 22,
    commute: '15 mins to Airport · 15 mins to ORR Exit-14',
    pricePerSqYd: 18000,
    valuation: '',
    memberPrice: '₹90 L',
    image: '/gallery/dates-county/temple.jpg',
    tagline: 'Eco-luxury villa plots at the edge of a 4,000-acre forest.',
    metaDescription:
      'Dates County by Planet Green — eco-luxury 500 sq yd villa plots at ₹18,000/sq yd beside a 4,000-acre reserve forest in Kandukur. 15 min to the airport.',
    description:
      "Dates County by Planet Green is a 300+ acre eco-luxury villa-plot community in Kandukur — the epicentre of Hyderabad's emerging Future City on Srisailam Highway. Adjacent to a 4,000-acre reserve forest, the township reserves 40% of its land for open and recreational spaces, woven through with date palm plantations, themed parks, sports courts and natural fishing ponds. 15 minutes to the Hyderabad International Airport and 15 minutes to ORR Exit-14 (Tukkuguda). RERA P02400002648 · P02400003813.",
    plots: 0,
    plotRange: '500 sq yds · ₹18,000/sq yd',
    amenityAcres: '300+ Acres · 40% Open Space',
    architect: 'Planet Green Infra',
    brochureUrl: 'https://www.thedatescounty.in',
    features: [
      'Adjacent to 4,000-Acre Reserve Forest',
      '40% Open & Recreational Space',
      'Date Palm Plantations (Vedic Farming)',
      'Clubhouse · Swimming Pool · Gym',
      'Themed Parks · Natural Fishing Ponds',
      'Landscaped Gardens · Senior Citizen Park',
      '24/7 Security · Gated Community',
      '15 Min to Airport · ORR Exit-14',
    ],
    plotImages: [
      '/gallery/dates-county/temple.jpg',
      '/gallery/dates-county/project-highlight.jpg',
      '/gallery/dates-county/field.jpg',
      '/gallery/dates-county/amenities.jpg',
      '/gallery/dates-county/water.jpg',
      '/gallery/dates-county/forest.jpg',
      '/gallery/dates-county/sustainability.png',
    ],
  },
];

export const getSanctuary = (id: string) => SANCTUARIES.find(s => s.id === id);
