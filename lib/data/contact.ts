/** Business contact points, social profiles and WhatsApp deep links — single source of truth. */

export const SITE_URL = 'https://thegreenteam.in';
export const BUSINESS = {
  name: 'The Green Team',
  legalDescriptor: 'Channel Partners · Hyderabad',
  phone: '+91 97001 44003',
  whatsappNumber: '919700144003',
  email: 'admin@thegreenteam.in',
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

/**
 * Agartha pricing (₹/sq yd) — used in invest panels and Groot.
 * Per MODCON's 2026 price-projection deck: launched 2024 at ₹6,200, now
 * ₹8,500, developer-projected ₹10,000 by 2028.
 *
 * The same deck prints "90.48% in 18 months" next to those two numbers, but
 * ₹6,200 → ₹8,500 is +37.1%. We publish the figure its own numbers support,
 * not the headline — a wrong appreciation claim is the one number a buyer
 * will check.
 */
export const AGARTHA_OLD_RATE = 6200; // 2024 launch rate
export const AGARTHA_NOW_RATE = 8500; // current rate (2026)
export const AGARTHA_PROJECTED_RATE = 10000; // developer projection for 2028

/**
 * Agartha construction (₹/sq ft), per MODCON's rate card. Flat — it does not
 * step with built area, because homes are designed and built to order.
 *
 * Publishing this is what makes the two headline numbers reconcile. Land alone
 * on the smallest plot is 726 × 8,500 = ₹61,71,000, but the project is marketed
 * "from ₹78 lakhs" — which is that plot plus the 650 sq ft 1 BHK starting home
 * at ₹2,500 a foot (₹16,25,000), giving ₹77,96,000. Without the construction
 * rate on the page the two look like a contradiction, and it is exactly the
 * question the first traceable lead came to WhatsApp to ask.
 */
export const AGARTHA_CONSTRUCTION_RATE = 2500;

/** The two published starting packages: plot + built home. */
export const AGARTHA_CONFIGS = [
  { label: 'One BHK', yds: 726, sft: 650 },
  { label: 'Two BHK', yds: 847, sft: 800 },
] as const;

/**
 * Agartha club membership — one-time, tiered by plot size, per MODCON's rate
 * card. Optional and a separate purchase, so it is never folded into a plot
 * total; quoting it inside one would overstate the price of the land.
 */
export const AGARTHA_MEMBERSHIP = [
  { tier: 'Standard', appliesTo: 'Plots under 0.5 acre, or standalone members', fee: 50_000 },
  { tier: 'Premium', appliesTo: '0.5 acre plot owners', fee: 100_000 },
  { tier: 'Founder', appliesTo: '1 acre plot owners, or early patrons', fee: 200_000 },
] as const;

/**
 * Agartha's in-house letting programme, as MODCON states it.
 *
 * Deliberately typed as the developer's claim rather than ours. Our published
 * standard (lib/data/standard.ts) refuses to list assured-return, guaranteed-
 * buyback or rental-guarantee structures in any form — so these figures may be
 * repeated as an indicative operating estimate for a managed let, and may not
 * be described as guaranteed anywhere, by us or in an advertisement, unless an
 * assured-return clause actually exists in the buyer agreement. If one does,
 * the project fails our own standard and the listing is the thing to revisit,
 * not the wording.
 *
 * It applies only to a built home let out when the owner is not using it. Raw
 * land produces no rent.
 */
export const AGARTHA_RENTAL = {
  monthlyLow: 30_000,
  monthlyHigh: 50_000,
  /** MODCON's projection, not a measurement and not ours. */
  statedAnnualGrowthPct: 8,
  management: 'Fully managed in-house',
  guaranteed: false,
} as const;

/** MODCON SYL villament rate (₹/SFT), current as of 2026. */
export const SYL_RATE = 6999;

/**
 * Villaments in MODCON SYL Residences, per the developer.
 *
 * Kept separate from `SYL_UNITS` in agartha-layout.ts, which holds only the
 * units we have plotted positions and printed areas for off the issued
 * SITE_PLAN.pdf. That drawing is a portion of the project, so the two numbers
 * are different things and neither should be derived from the other — the
 * interactive site plan draws what we can place, this is what is being built.
 */
export const SYL_TOTAL_UNITS = 155;
