/** Business contact points, social profiles and WhatsApp deep links — single source of truth. */

export const SITE_URL = 'https://thegreenteam.in';
export const BUSINESS = {
  name: 'The Green Team',
  legalDescriptor: 'Channel Partners · Hyderabad',
  phone: '+91 97001 44003',
  whatsappNumber: '919700144003',
  email: 'hello@thegreenteam.in',
  instagram: 'https://www.instagram.com/the.green.team__',
  linkedin: 'https://linkedin.com/company/the-green-team-india',
  city: 'Hyderabad',
  region: 'Telangana',
  postalCode: '500032',
  geo: { lat: 17.385, lng: 78.4867 },
} as const;

const wa = (text: string) =>
  `https://wa.me/${BUSINESS.whatsappNumber}?text=${encodeURIComponent(text)}`;

export const WHATSAPP = {
  sylEnquire: wa(
    "Hi, I'm interested in MODCON SYL Residences (Tukkuguda, ORR Exit-14). Could you share the best pricing available?"
  ),
  sylVisit: wa(
    "Hi, I'd like to book an office visit / site visit for MODCON SYL Residences. Please share available slots. (Financial District Office)"
  ),
  agarthaEnquire: wa(
    "Hi, I'm interested in MODCON Agartha (Narsapur, Hyderabad). Could you share the best available plots and pricing?"
  ),
  agarthaVisit: wa(
    "Hi, I'd like to book a site visit for MODCON Agartha (Narsapur). Please share available slots."
  ),
  datesEnquire: wa(
    "Hi, I'm interested in Dates County by Planet Green (Kandukur, Hyderabad). Could you share available plots and best pricing? (500 sq yd @ ₹18,000)"
  ),
  datesVisit: wa(
    "Hi, I'd like to book a site visit for Dates County by Planet Green (Kandukur). Please share available slots."
  ),
  generic: wa("Hi, I'm interested in The Green Team's curated sanctuaries. Could you share more details?"),
} as const;

export const INVESTMENT_BRACKETS = [
  '₹50 L – ₹1 Cr',
  '₹1 Cr – ₹2 Cr',
  '₹2 Cr – ₹5 Cr',
  '₹5 Cr+',
  'Prefer not to say',
] as const;

/** Agartha pricing history (₹/sq yd) — used in invest panels and Groot. */
export const AGARTHA_OLD_RATE = 6199; // VIP pre-launch rate (2 yrs ago)
export const AGARTHA_NOW_RATE = 8500; // current rate
