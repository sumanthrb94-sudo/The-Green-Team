/**
 * The three flagship sanctuaries — the canonical in-code portfolio.
 * Live Firestore `properties` documents (status: 'live') are merged after these.
 *
 * The Agartha gallery is served from this repo's own compressed mirror
 * (public/gallery/agartha/) rather than the Wix CDN the v1 app depended on.
 */

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
  /** Firestore-managed properties carry these */
  status?: 'live' | 'draft';
  order?: number;
}

const AGARTHA_GALLERY = Array.from({ length: 23 }, (_, i) => `/gallery/agartha/${i}.webp`);

export const SANCTUARIES: Sanctuary[] = [
  {
    id: 'agartha',
    title: 'MODCON Agartha',
    location: 'Janakampet, Narsapur · Hyderabad',
    aqi: 12,
    noise: 18,
    commute: '40 mins to Financial District',
    pricePerSqYd: 8500,
    valuation: '',
    memberPrice: 'From ₹68.7 L',
    image: '/gallery/agartha/11.webp',
    tagline: 'Where the forest becomes home.',
    description:
      'MODCON Agartha is a 25-acre regenerative permaculture farm estate on the Narsapur forest boundary, near the RRR. 36 unique farm plots — each pre-planted with 100+ tree varieties, drip irrigation, vegetable beds, and a spiral herbal garden — surround a 36,000 sq ft clubhouse with 5 premium amenities: aquatic pool, kayaking lake, gym, farm-to-table dining, and staycation villas. An on-site Goshala with integrated animal husbandry completes the self-sustaining ecosystem. Winner: Best Sustainable Eco-Friendly Project of the Year 2024.',
    plots: 36,
    plotRange: '808 – 4,800 sq yds',
    amenityAcres: '36,000 sq ft Clubhouse',
    architect: 'MODCON Builders',
    sitePlanSrc: '/FINAL-LAYOUT.jpeg',
    brochureUrl: 'https://www.modconbuilders.com/agartha',
    plotImages: AGARTHA_GALLERY,
    features: [
      '36,000 sq ft Clubhouse',
      'Kayaking & Aquatic Pool',
      'Farm-to-Table Dining',
      'Drip Irrigation (Each Plot)',
      '100+ Tree Varieties / Plot',
      'Goshala & Animal Husbandry',
      'Spiral Herbal Garden',
      'Near RRR · 40 Min City Access',
    ],
  },
  {
    id: 'syl',
    title: 'MODCON SYL Residences',
    location: 'Tukkuguda, ORR Exit-14 · Hyderabad',
    aqi: 22,
    noise: 24,
    commute: '10 mins to Airport · 30-45 mins to Financial District',
    valuation: '',
    memberPrice: '₹4,499 / SFT',
    image: '/gallery/syl/1776279315359.webp',
    tagline: 'A modern address where luxury meets nature.',
    description:
      "MODCON SYL Residences is a 4.5-acre biophilic development at Tukkuguda, ORR Exit-14 — offering luxury villaments from 2,500 to 4,500 SFT with large forest-view balconies, natural light, and sunrise views. The 22,000 sq ft clubhouse is a wellness retreat with a chemical-free Natural Bio Pool and Yoga Pavilion. Commercial spaces are also available at exclusive one-time investor prices — contact us for details. Located 10 minutes from the international airport and at the threshold of Hyderabad's Fourth City growth corridor.",
    plots: 0,
    plotRange: 'Villaments 2,500 – 4,500 SFT · Commercial Available',
    amenityAcres: '22,000 SFT Clubhouse · Health • Wellness • Nature',
    architect: 'MODCON Builders',
    brochureUrl: 'https://www.modconbuilders.com',
    features: [
      'Commercial Spaces — OTP Investor Pricing (Enquire)',
      'Villaments 2,500 – 4,500 SFT',
      'Natural Bio Pool (Chemical-Free)',
      'Yoga & Meditation Pavilion',
      'Large Forest-View Balconies',
      'Biophilic Green Corridors',
      'Wellness & Fitness Spaces',
      'EV Charging Points',
      '100% Power Backup',
      '4 High-Speed Passenger Lifts',
      'Gated Community · 24/7 Security',
      'ORR Exit-14 · 10 Min to Airport',
    ],
    plotImages: [
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
    location: 'Kandukur, Srisailam Highway · Hyderabad',
    aqi: 18,
    noise: 22,
    commute: '15 mins to Airport · 15 mins to ORR Exit-14',
    pricePerSqYd: 18000,
    valuation: '',
    memberPrice: '₹90 L',
    image: '/gallery/dates-county/temple.jpg',
    tagline: 'Eco-luxury villa plots at the edge of a 4,000-acre forest.',
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
