/**
 * The portal's discovery structure — how a buyer finds what has been curated.
 *
 * This is deliberately NOT a promise of volume. /standard says "a portal lists
 * everything and lets you sort it out; we do the opposite", and that stays true:
 * a category here can hold three superb things and read as selective. The
 * categories exist so a buyer who already knows they want a villa, or land, or
 * an appreciation play, lands on that answer in one click instead of reading
 * the whole portfolio to find it.
 *
 * Every property carries a primary `category` (its asset class), a `stage`
 * (where it is in delivery) and an `investment` flag (whether it has an
 * appreciation story worth telling). One property can appear under its
 * category AND under Investments; that is the point.
 */

export type Category = 'villas' | 'plots';
export type Stage = 'completed' | 'ongoing' | 'upcoming';

/** A browse page: the URL slug and everything the page says about itself. */
export interface CategoryDef {
  slug: string;
  /** Short nav label. */
  label: string;
  /** The page h1. */
  title: string;
  /** One line under the h1. */
  tagline: string;
  /** Two or three sentences — the editorial frame for the whole category. */
  intro: string;
  seoTitle: string;
  seoDescription: string;
  /** Which properties belong here. */
  match: (p: { category?: Category; investment?: boolean }) => boolean;
}

export const CATEGORIES: CategoryDef[] = [
  {
    slug: 'villas',
    label: 'Villas',
    title: 'Villas & Villaments',
    tagline: 'A finished home, with the forest as the neighbour.',
    intro:
      'Built residences in low-density, biophilic enclaves — large balconies, real light, and a tree line rather than the next tower in the window. Standard home-loan territory, construction-linked payment, and a developer with something delivered you can walk through.',
    seoTitle: 'Luxury Villas & Villaments Near Hyderabad — Forest-Adjacent',
    seoDescription:
      'Premium villas and villaments near Hyderabad, curated for cleaner air, real access and a developer who has delivered. Forest views, biophilic design, verified on site.',
    match: p => p.category === 'villas',
  },
  {
    slug: 'plots',
    label: 'Plots',
    title: 'Plots & Farmland',
    tagline: 'Land you can stand on, at the forest edge.',
    intro:
      'Farm plots and villa plots on the boundary of protected green — the Narsapur forest, a 4,000-acre reserve, the RRR corridor. Approved layouts, measured air and noise, an approach road that already exists. You choose whether and what to build.',
    seoTitle: 'Farm Plots & Villa Plots Near Hyderabad — Forest-Adjacent Land',
    seoDescription:
      'HMDA/DTCP-approved farm plots and villa plots on the forest boundary near Hyderabad. Measured AQI and noise, real road access, clear title. Curated, not listed.',
    match: p => p.category === 'plots',
  },
  {
    slug: 'investments',
    label: 'Investments',
    title: 'Investment Opportunities',
    tagline: 'Appreciation with a paper trail — never a promise.',
    intro:
      'Projects with a documented price ladder and an infrastructure reason behind it: a ring road arriving, an airport corridor, a pre-investor window that closes. We publish what the rate actually did, not what a deck says it will do. There are no assured returns here, and we will not list one.',
    seoTitle: 'Real Estate Investment Opportunities Near Hyderabad — Verified Appreciation',
    seoDescription:
      'Investment property near Hyderabad with a documented price history and real infrastructure drivers — RRR, ORR, airport corridor. No assured-return schemes.',
    match: p => p.investment === true,
  },
];

export const getCategory = (slug: string) => CATEGORIES.find(c => c.slug === slug);

export const STAGES: { value: Stage; label: string; hint: string }[] = [
  { value: 'ongoing', label: 'Ongoing', hint: 'Under development — bookings open' },
  { value: 'completed', label: 'Completed', hint: 'Delivered — ready to occupy' },
  { value: 'upcoming', label: 'Upcoming', hint: 'Pre-launch — register interest' },
];

export const stageLabel = (s?: Stage) => STAGES.find(x => x.value === s)?.label ?? 'Ongoing';
