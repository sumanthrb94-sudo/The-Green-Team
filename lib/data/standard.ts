/**
 * The listing standard — the bar a property must clear before it appears on
 * this site or before we take enquiries on it.
 *
 * This existed only in the founder's head until now, which made it
 * unenforceable when adding the next property and invisible to a buyer asking
 * the obvious question: "why do you only list three?" `lib/data/faq.ts` already
 * promises "a fixed standard" — this file is that standard, written down.
 *
 * The thresholds below are derived from the three properties currently listed
 * (see PROOF at the bottom, which measures them against the bar rather than
 * asserting they pass). Change the constants here and the public page, the FAQ
 * and Groot all follow — there is no second copy.
 */

/** Hyderabad city-average AQI, the baseline every listing is measured against. */
export const CITY_AQI_BASELINE = 148;

/** A listing must sit at or under these to qualify. */
export const MAX_AQI = 30;
export const MAX_NOISE_DB = 30;

/**
 * Geographic scope. Deliberately narrow: the environmental and access claims
 * on this site are only verifiable in a region we can drive to and re-check.
 */
export const SERVICE_AREA = {
  region: 'Hyderabad',
  headline: 'Hyderabad only, for now.',
  detail:
    'We list inside Hyderabad and its ORR–RRR growth corridor and nowhere else. Every claim we publish — air quality, ambient noise, drive times, what the access road actually looks like — is something we can go and re-check in an afternoon. We would rather cover one city honestly than list a country we have never stood in. When we open a second city we will say so here.',
} as const;

export interface StandardPillar {
  id: string;
  title: string;
  summary: string;
  /** The specific, checkable tests behind the pillar. */
  tests: string[];
}

export const LISTING_STANDARD: StandardPillar[] = [
  {
    id: 'environment',
    title: 'A measurable environmental advantage',
    summary:
      `Clean air is the reason to move out this far, so it is the first thing we measure rather than the last thing we mention. A listing has to be meaningfully cleaner and quieter than the city it is an escape from — Hyderabad averages around AQI ${CITY_AQI_BASELINE}.`,
    tests: [
      `Air quality at or under AQI ${MAX_AQI}, measured on site — not modelled from a district average`,
      `Ambient noise at or under ${MAX_NOISE_DB} dB during the day`,
      'Genuine adjacency to protected green: a reserve forest, a notified lake, or a designated green belt',
      'No active quarry, landfill, industrial corridor or high-tension line inside the immediate surrounds',
    ],
  },
  {
    id: 'legal',
    title: 'Paperwork that survives a lawyer',
    summary:
      'The cheapest land in Telangana is usually cheap for a reason that shows up two years later. We check the file before the view.',
    tests: [
      'Clear, traceable title with an encumbrance certificate we have actually read',
      'Approvals appropriate to the asset class — RERA registration where the law requires it, HMDA or DTCP layout approval for plotted development',
      'No litigation, no assigned or endowment land, no pending land-ceiling question',
      'Conversion status correct for what the buyer intends to build',
    ],
  },
  {
    id: 'access',
    title: 'Access that already exists',
    summary:
      'Drive times are quoted from roads you can use today, not from an alignment on a government slide. Where infrastructure is genuinely coming, we say it is coming and name it.',
    tests: [
      'A metalled approach road that exists now and that we have driven ourselves',
      'Inside the ORR–RRR corridor, or on a named highway with funded, published upgrades',
      'Every drive time on the listing measured in real traffic, not by map estimate',
      'Planned infrastructure described as planned — never priced as if it were finished',
    ],
  },
  {
    id: 'developer',
    title: 'A developer who has finished something',
    summary:
      'A brochure is not a track record. We will not introduce a buyer to a first-time developer on an unproven balance sheet, however good the renders look.',
    tests: [
      'At least one delivered project we can physically take a buyer to visit',
      'Named architect or design studio, and a construction specification in writing',
      'A payment schedule tied to construction milestones, not to calendar dates',
      'Willing to meet our buyer directly — we do not sell behind a developer who will not show up',
    ],
  },
  {
    id: 'design',
    title: 'Built with the land, not on top of it',
    summary:
      'The point of forest-adjacent land is the forest. A project that clears it to maximise saleable area has removed the thing it was selling.',
    tests: [
      'Meaningful protected open space, held as common land rather than counted twice',
      'Ecological water handling — natural filtration, rainwater harvesting, no chemical-dependent water bodies',
      'Native and edible planting over decorative lawn',
      'Materials and orientation suited to the Deccan climate',
    ],
  },
  {
    id: 'honesty',
    title: 'Numbers we are willing to be quoted on',
    summary:
      'We publish the figure a buyer can verify, not the figure that markets best. If a developer deck contradicts itself, we publish what its own numbers support and say why.',
    tests: [
      'Every published rate traceable to a current developer price list',
      'Appreciation described from actual past rates, never projected as a promise',
      'No assured-return, guaranteed-buyback or rental-guarantee structure — we will not list one',
      'Renders labelled as renders; we never show a visualisation as a built home',
    ],
  },
];

/**
 * The refusals. A standard that only describes what qualifies is marketing;
 * the list of what we turn down is the part that costs us money, and is
 * therefore the part worth publishing.
 */
export const DISQUALIFIERS: string[] = [
  'Anything outside Hyderabad and its corridor, for now',
  'Any project we have not physically stood on',
  'Assured returns, guaranteed buybacks or rental guarantees, in any form',
  'Unapproved layouts, disputed title, or assigned land',
  'A developer with no delivered project a buyer can walk through',
  'Land whose environmental claim we cannot measure ourselves',
  'Any listing we could not take you to see this week',
];

/**
 * How the current portfolio measures against the bar.
 *
 * Sourced from `lib/data/sanctuaries.ts` at render time rather than restated
 * here, so a property whose numbers change cannot silently keep a pass mark.
 */
export interface StandardProof {
  id: string;
  aqi: number;
  noise: number;
  passesAqi: boolean;
  passesNoise: boolean;
  /** Multiple of the city baseline this listing's air is cleaner by. */
  cleanerBy: number;
}

export function measureAgainstStandard(
  properties: { id: string; aqi: number; noise: number }[]
): StandardProof[] {
  return properties.map(p => ({
    id: p.id,
    aqi: p.aqi,
    noise: p.noise,
    passesAqi: p.aqi <= MAX_AQI,
    passesNoise: p.noise <= MAX_NOISE_DB,
    cleanerBy: Math.round((CITY_AQI_BASELINE / Math.max(1, p.aqi)) * 10) / 10,
  }));
}
