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
  /** Real units reserved/sold, admin-entered — powers the momentum strip. */
  reserved?: number;
  /** RERA registration number(s), as issued — shown as a trust badge when present. */
  rera?: string;
  /** Expected possession / handover, free text (e.g. "Dec 2027"). */
  possession?: string;
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
    pricePerSqYd: 8000,
    valuation: '',
    memberPrice: 'From ₹78 L · land + home',
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
    stage: 'upcoming',
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
      'MODCON SYL Residences — 155 biophilic villaments, 3,882–7,000 SFT at ₹6,999/SFT at Tukkuguda, ORR Exit-14, with a 22,000 SFT clubhouse. 10 min to the airport.',
    description:
      "MODCON SYL Residences is the residential half of a 4.5-acre integrated commercial-and-residential project at Tukkuguda, ORR Exit-14 — villament living in a low-density, biophilic enclave overlooking forest, with large balconies, abundant light and sunrise views. The 22,000 sq ft G+2 clubhouse is built entirely around health, wellness and nature: infinity pool, fully equipped gym with Pilates, yoga pavilion, steam and sauna, library, co-working spaces, banquet and guest rooms, indoor and outdoor play. Alongside it sits an integrated commercial hub — retail, cafés and banking at ground, co-working on the first floor, clinics and diagnostics on the second, and business suites with a hospitality stay concept above. Every balcony is landscaped on biophilic principles. Two to five minutes from ORR Exit-14 and Fab City, 10–15 minutes from the airport.",
    plots: 155,
    plotRange: 'Villaments 3,882 – 7,000 SFT · Integrated Commercial',
    amenityAcres: '22,000 SFT G+2 Clubhouse · Health • Wellness • Nature',
    architect: 'MODCON Builders',
    sitePlanSrc: '/syl-site-plan.webp',
    brochureUrl: 'https://www.modconbuilders.com',
    features: [
      'Integrated Commercial Hub (Enquire)',
      '155 Villaments · 3,882 – 7,000 SFT',
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
    rera: 'P02400002648 · P02400003813',
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
  {
    id: 'ananthagiri-reserve',
    title: 'Ananthagiri Biosphere Retreat',
    category: 'plots',
    stage: 'upcoming',
    investment: true,
    location: 'Vikarabad Reserve Forest Buffer · Hyderabad West',
    aqi: 14,
    noise: 16,
    commute: '55 mins to Gachibowli · Direct access via Shankarpally Road',
    pricePerSqYd: 6500,
    valuation: '',
    memberPrice: 'From ₹65 L · In Dossier',
    image: '/hero-backdrop-forest-meadow-1200.png',
    tagline: 'Highland agro-forest plots within the Deccan biosphere buffer.',
    metaDescription:
      'Ananthagiri Biosphere Retreat — upcoming 500–1,200 sq yd farm plots nestled beside Vikarabad reserve forest. High elevation, pristine AQI 14. Priority registration open.',
    description:
      'Ananthagiri Biosphere Retreat is a 42-acre upcoming agro-forest sanctuary situated along the forested ridgeline of Vikarabad, 300 meters higher in elevation than Hyderabad city. Positioned within the perennial catchment of the Musi river headwaters, the land features red laterite soil, dense teak and sandalwood groves, and a natural ambient AQI of 14 with whisper-quiet 16 dB background noise. Currently undergoing title verification, drone survey, and TG-RERA pipeline compliance documentation before public launch. Early allocations reserved for members.',
    plots: 48,
    plotRange: '500 sq yds – 1,200 sq yds',
    amenityAcres: '3.5-Acre Indigenous Arboretum & Forest Wellness Deck',
    architect: 'Eco-Terrain Bio-Architects',
    rera: 'In Dossier Onboarding · Diligence Stage',
    brochureUrl: '/list',
    features: [
      'Adjacent to Vikarabad Reserve Forest (4,800 Ha)',
      'Elevated Deccan Plateau (680 m MSL)',
      'Perennial Stream & Bio-Catchment',
      'Permaculture & Organic Fruit Orchard',
      'Ayurvedic Medicinal Forest Trail',
      'TG-RERA / HMDA Diligence in Progress',
      'Under 60 Min to Financial District',
    ],
    plotImages: [
      '/hero-backdrop-forest-meadow-1200.png',
      '/gallery/agartha/0.webp',
      '/gallery/agartha/1.webp',
      '/gallery/agartha/5.webp',
      '/gallery/agartha/12.webp',
    ],
  },
  {
    id: 'kollur-canopy',
    title: 'Kollur Green Canopy',
    category: 'villas',
    stage: 'upcoming',
    investment: true,
    location: 'Tellapur–Kollur Corridor, ORR Exit-2 · Hyderabad',
    aqi: 24,
    noise: 25,
    commute: '18 mins to Financial District · 2 mins to ORR Exit 2',
    valuation: '',
    memberPrice: 'From ₹2.85 Cr · Pre-Launch',
    image: '/hero-villa.webp',
    tagline: 'Biophilic zero-carbon forest villas on the Western Growth Axis.',
    metaDescription:
      'Kollur Green Canopy — upcoming luxury 4 & 5 BHK biophilic villas adjacent to protected green buffers at Kollur, ORR Exit 2. Minutes from Neopolis & Financial District.',
    description:
      'Kollur Green Canopy is an upcoming 18-acre boutique enclave of 68 biophilic villas located at the confluence of Tellapur and Kollur, directly accessible from ORR Exit 2. Designed on net-zero water and solar-envelope principles, each residence features 12-foot double-height living spaces, extensive vertical garden terraces, and floor-to-ceiling high-performance thermal glazing overlooking an 8-acre dedicated urban micro-forest. Currently in final master-planning and statutory environmental clearance.',
    plots: 68,
    plotRange: '4 & 5 BHK Villas · 4,200 – 5,800 SFT',
    amenityAcres: '15,000 SFT Solar Clubhouse & Natural Lake Deck',
    architect: 'Studio Biome & Earth',
    rera: 'TG-RERA Application Pre-Dossier',
    brochureUrl: '/list',
    features: [
      '2 Min to ORR Exit-2 (Tellapur / Kollur)',
      'Adjacent to Kollur Lake & Protected Buffer',
      'Net-Zero Carbon Villa Architecture',
      'Private Plunge Pool & Zen Courtyards',
      '100% Underground Solar Microgrid',
      '18 Min to Wipro Circle / Financial District',
      'In-Dossier Developer Diligence',
    ],
    plotImages: [
      '/hero-villa.webp',
      '/hero-balcony.webp',
      '/gallery/syl/syl-exterior-dusk.webp',
      '/gallery/syl/syl-street-dusk.webp',
    ],
  },
  {
    id: 'shamirpet-lakeview',
    title: 'Shamirpet Lakeview Agro-Estates',
    category: 'plots',
    stage: 'upcoming',
    investment: true,
    location: 'Genome Valley Eco-Buffer, ORR Exit-7 · Hyderabad',
    aqi: 19,
    noise: 20,
    commute: '25 mins to Secunderabad · 5 mins to ORR Exit 7',
    pricePerSqYd: 12000,
    valuation: '',
    memberPrice: 'From ₹72 L · Dossier Stage',
    image: '/hero-backdrop.jpg',
    tagline: 'Waterfront farm estates along the pristine Shamirpet lake catchment.',
    metaDescription:
      'Shamirpet Lakeview Agro-Estates — 600–1,000 sq yd waterfront farm plots beside Shamirpet Lake & Deer Park. Low density, pristine AQI 19.',
    description:
      'Shamirpet Lakeview Agro-Estates is an upcoming 32-acre low-density farm estate bordered by the freshwater backwaters of Shamirpet Lake and the Jawahar Deer Park reserve forest. With an unbroken green canopy and cool micro-climate, the property is tailored for weekend rejuvenation and sustainable organic farming. Comprehensive legal verification, survey boundary demarcation, and non-agricultural farm layout compliance are currently underway.',
    plots: 52,
    plotRange: '600 sq yds – 1,000 sq yds',
    amenityAcres: 'Waterfront Kayak Pier & Vedic Community Barn',
    architect: 'Verdant Habitat Architects',
    rera: 'In Dossier Review · Title Chain Verified',
    brochureUrl: '/list',
    features: [
      'Unobstructed Shamirpet Lake Views',
      'Adjacent to Jawahar Deer Park Forest',
      'Organic Fruit Orchards Pre-Planted',
      'Vedic Barn & Equestrian Trail',
      '5 Min to ORR Exit-7 & Genome Valley',
      'Zero Industrial Effluents / Pristine Aquifer',
    ],
    plotImages: [
      '/hero-backdrop.jpg',
      '/gallery/dates-county/water.jpg',
      '/gallery/dates-county/field.jpg',
      '/gallery/dates-county/amenities.jpg',
    ],
  },
  {
    id: 'mucherla-future-city',
    title: 'Mucherla Future City Reserve',
    category: 'plots',
    stage: 'upcoming',
    investment: true,
    location: 'Mucherla, Srisailam Highway / RRR Node · Hyderabad',
    aqi: 16,
    noise: 21,
    commute: '20 mins to Airport · Direct access to proposed AI City & Skill Univ',
    pricePerSqYd: 11000,
    valuation: '',
    memberPrice: 'From ₹55 L · Pipeline Dossier',
    image: '/gallery/dates-county/project-highlight.jpg',
    tagline: 'High-growth villa plots at the front door of Hyderabad Fourth City.',
    metaDescription:
      'Mucherla Future City Reserve — upcoming 400–800 sq yd villa plots in the Kandukur-Mucherla growth corridor. Forest edge, future city infrastructure, high appreciation potential.',
    description:
      'Mucherla Future City Reserve represents a strategic 55-acre land parcel positioned at the junction of the upcoming Regional Ring Road (RRR) and the government-mandated Fourth City / Net-Zero Future City masterplan. Bordered on the south by state forest lands and on the north by the 100-meter arterial transit spine, this sanctuary balances hyper-connectivity with ecological seclusion. Currently under final vetting for legal documentation, physical access road survey, and institutional co-investment structuring.',
    plots: 110,
    plotRange: '400 sq yds – 800 sq yds',
    amenityAcres: 'Central 4-Acre Native Forest Spine',
    architect: 'Green Blueprint Studio',
    rera: 'Dossier Diligence · Pre-Launch Compliance',
    brochureUrl: '/list',
    features: [
      'Core Node of Hyderabad Fourth City (Mucherla)',
      'Direct Connectivity to Upcoming RRR Interchange',
      '20 Min to Rajiv Gandhi International Airport',
      'Adjacent to 2,000-Acre Protected Ridge',
      'Underground Utilities & Wide 60ft/40ft Avenues',
      'Pre-Launch Legal Audit Underway',
    ],
    plotImages: [
      '/gallery/dates-county/project-highlight.jpg',
      '/gallery/dates-county/temple.jpg',
      '/gallery/dates-county/forest.jpg',
    ],
  },
  {
    id: 'moinabad-eco-enclave',
    title: 'Moinabad Eco-Enclave',
    category: 'villas',
    stage: 'upcoming',
    investment: true,
    location: 'Chilkur / Moinabad Green Belt · Hyderabad South-West',
    aqi: 18,
    noise: 19,
    commute: '28 mins to Financial District · 20 mins to Gachibowli via Chevella Road',
    valuation: '',
    memberPrice: 'From ₹2.20 Cr · Private Pipeline',
    image: '/hero-highrise.webp',
    tagline: 'Exclusive earth-brick eco-homes in the protected catchment zone.',
    metaDescription:
      'Moinabad Eco-Enclave — upcoming low-density farm villas in the serene Chilkur forest catchment, Moinabad. 28 min to Financial District.',
    description:
      'Moinabad Eco-Enclave is an exclusive 16-home sustainable cluster tucked into the rolling scrub forests of Chilkur and Moinabad. Built with stabilized rammed earth and natural timber, each home sits on a private half-acre with rainwater harvest bioswales and indigenous bird habitats. Being developed by a certified sustainable builder with strict low-density covenants. Available exclusively via invitation and member dossier.',
    plots: 16,
    plotRange: '3 & 4 BHK Earth Villas · Half-Acre Plots',
    amenityAcres: 'Permaculture Kitchen & Community Pavilion',
    architect: 'Tierra Ecological Architecture',
    rera: 'Private Member Dossier Onboarding',
    brochureUrl: '/list',
    features: [
      'Strict Eco-Conservation Buffer Compliance',
      'Stabilized Rammed Earth & Reclaimed Teak Construction',
      'Rainwater Bioswales with 100% Aquifer Recharge',
      'Zero Light Pollution Dark-Sky Enclave',
      '28 Mins to Financial District',
    ],
    plotImages: [
      '/hero-highrise.webp',
      '/gallery/agartha/10.webp',
      '/gallery/agartha/14.webp',
      '/gallery/agartha/23.webp',
    ],
  },
];

export const getSanctuary = (id: string) => SANCTUARIES.find(s => s.id === id);
