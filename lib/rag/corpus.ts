import 'server-only';

import { createHash } from 'node:crypto';

import {
  AGARTHA_HOTSPOTS,
  AGARTHA_PLOTS,
  SYL_HOTSPOTS,
  SYL_UNITS,
} from '@/lib/data/agartha-layout';
import {
  AGARTHA_NOW_RATE,
  AGARTHA_OLD_RATE,
  BUSINESS,
  INVESTMENT_BRACKETS,
  SITE_URL,
  SYL_RATE,
} from '@/lib/data/contact';
import { SALES_FAQ } from '@/lib/data/faq';
import { DISQUALIFIERS, LISTING_STANDARD, SERVICE_AREA } from '@/lib/data/standard';
import { JOURNAL_POSTS } from '@/lib/data/journal';
import { KEY_ZONES, MAP_LOCATIONS, NATURAL_FEATURES } from '@/lib/data/map';
import { getPortfolio } from '@/lib/server/portfolio';
import { formatRs } from '@/lib/utils';
import type { Sanctuary } from '@/lib/data/sanctuaries';
import type { KbChunk, KbSource } from '@/lib/rag/types';

/**
 * Contextual retrieval: every chunk restates its own subject, because an
 * embedded fragment is retrieved alone and read alone — "priced at ₹8,500/sq yd"
 * matches nothing useful, "MODCON Agartha is priced at ₹8,500/sq yd" does.
 */

export function hashText(t: string): string {
  return createHash('sha256').update(t).digest('hex').slice(0, 16);
}

/** Below this a chunk is a label, not a fact — it only pollutes the index. */
const MIN_TEXT_LENGTH = 40;

type ChunkInput = {
  id: string;
  title: string;
  source: KbSource;
  text: string;
  url?: string;
  propertyId?: string;
};

function add(out: KbChunk[], input: ChunkInput): void {
  const text = input.text
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  if (text.length < MIN_TEXT_LENGTH) return;
  out.push({ ...input, text, contentHash: hashText(text) });
}

const inr = (n: number) => n.toLocaleString('en-IN');

function propertyChunks(out: KbChunk[]): (s: Sanctuary) => void {
  return s => {
    const url = `/sanctuaries/${s.id}`;
    const base = { source: 'property' as const, url, propertyId: s.id };

    const overview = [
      `${s.title} is a sanctuary curated by The Green Team, located at ${s.location}.`,
      s.tagline && `Its tagline is "${s.tagline}".`,
      s.description,
      s.architect && `${s.title} is developed by ${s.architect}.`,
      s.amenityAcres && `Amenity core at ${s.title}: ${s.amenityAcres}.`,
    ]
      .filter(Boolean)
      .join(' ');
    add(out, { ...base, id: `property:${s.id}:overview`, title: `${s.title} — Overview`, text: overview });

    const pricing = [
      s.pricePerSqYd
        ? `${s.title} is priced at ₹${inr(s.pricePerSqYd)} per sq yd.`
        : `${s.title} is priced at ${s.memberPrice}.`,
      s.pricePerSqYd && s.memberPrice && `The headline entry price for ${s.title} is ${s.memberPrice}.`,
      s.valuation && `Comparable market valuation for ${s.title}: ${s.valuation}.`,
      s.plotRange && `Unit sizes available at ${s.title}: ${s.plotRange}.`,
      s.plots ? `${s.title} has ${s.plots} plots in total.` : '',
      `The Green Team is a channel partner, so the buyer pays the developer's price for ${s.title} with no added fee, and better terms are often negotiated on an in-person visit.`,
      `Stamp duty, registration, GST where applicable and any maintenance or corpus deposit are additional to the quoted price of ${s.title}.`,
    ]
      .filter(Boolean)
      .join(' ');
    add(out, { ...base, id: `property:${s.id}:pricing`, title: `${s.title} — Pricing`, text: pricing });

    const environment =
      `${s.title} environmental and access profile, verified on site by The Green Team: ` +
      `air quality index ${s.aqi}, ambient noise ${s.noise} dB, commute ${s.commute}. ` +
      `${s.title} sits at ${s.location}. ` +
      `The Green Team measures AQI and noise at the site itself at different times of day rather than quoting a city average, and drives the commute rather than calculating it.`;
    add(out, {
      ...base,
      id: `property:${s.id}:environment`,
      title: `${s.title} — Environment & Commute`,
      text: environment,
    });

    if (s.features?.length) {
      add(out, {
        ...base,
        id: `property:${s.id}:features`,
        title: `${s.title} — Features & Amenities`,
        text: `${s.title} features and amenities: ${s.features.join('; ')}.`,
      });
    }

    const galleryCount = s.plotImages?.length ?? s.gallery?.length ?? 0;
    const links = [
      `${s.title} has a dedicated page on The Green Team site at ${url} (${SITE_URL}${url}).`,
      s.brochureUrl && `The developer brochure or site for ${s.title} is at ${s.brochureUrl}.`,
      s.mapUrl && `${s.title} location map: ${s.mapUrl}.`,
      s.sitePlanSrc && `The official ${s.title} site plan image is served at ${s.sitePlanSrc}.`,
      galleryCount > 0 && `The ${s.title} gallery carries ${galleryCount} photographs.`,
      `Enquiries and site visits for ${s.title} go through The Green Team on WhatsApp at ${BUSINESS.phone}.`,
    ]
      .filter(Boolean)
      .join(' ');
    add(out, { ...base, id: `property:${s.id}:links`, title: `${s.title} — Links & Resources`, text: links });
  };
}

function journalChunks(out: KbChunk[]): void {
  for (const post of JOURNAL_POSTS) {
    const url = `/blog/${post.id}`;
    const lead = `The Green Team journal article "${post.title}" (${post.category}, ${post.date})`;

    post.body.forEach((para, i) => {
      add(out, {
        id: `journal:${post.id}:p${i}`,
        title: post.title,
        source: 'journal',
        url,
        text: `${lead} argues: ${para}`,
      });
    });

    add(out, {
      id: `journal:${post.id}:takeaways`,
      title: `${post.title} — Takeaways`,
      source: 'journal',
      url,
      text: `${lead} summarises to these takeaways: ${post.takeaways.join(' ')} In full: ${post.excerpt}`,
    });
  }
}

function mapChunks(out: KbChunk[]): void {
  const base = { source: 'map' as const, url: '/map' };

  for (const z of KEY_ZONES) {
    add(out, {
      ...base,
      id: `map:zone:${z.id}`,
      title: `${z.name} — Environmental Hotspot`,
      text:
        `${z.name} is a ${z.hazard}-hazard pollution zone on The Green Team's Hyderabad environmental map, ` +
        `tagged "${z.tag}". Measured air quality index at ${z.name} is ${z.aqi} and ambient noise is ${z.noise} dB. ` +
        `The Green Team maps zones like ${z.name} so buyers can see what the curated sanctuaries are being compared against.`,
    });
  }

  const worst = [...KEY_ZONES].sort((a, b) => b.aqi - a.aqi).slice(0, 3);
  add(out, {
    ...base,
    id: 'map:key-zones:summary',
    title: 'Hyderabad Pollution Zones — Summary',
    text:
      `The Green Team's environmental map tracks ${KEY_ZONES.length} high-pollution zones across Hyderabad. ` +
      `The worst measured are ${worst.map(z => `${z.name} (AQI ${z.aqi}, ${z.noise} dB)`).join(', ')}. ` +
      `Across all mapped zones the air quality index ranges from ${Math.min(...KEY_ZONES.map(z => z.aqi))} to ` +
      `${Math.max(...KEY_ZONES.map(z => z.aqi))} and noise from ${Math.min(...KEY_ZONES.map(z => z.noise))} to ` +
      `${Math.max(...KEY_ZONES.map(z => z.noise))} dB — the baseline every curated sanctuary is measured against.`,
  });

  for (const f of NATURAL_FEATURES) {
    add(out, {
      ...base,
      id: `map:feature:${f.id}`,
      title: `${f.title} — Protected ${f.type === 'lake' ? 'Water Body' : 'Forest'}`,
      text:
        `${f.title} is a government-protected ${f.type === 'lake' ? 'lake or reservoir' : 'forest'} on ` +
        `The Green Team's Hyderabad environmental map, covering ${f.area}. ${f.description} ` +
        `${f.title} is one of the natural assets that anchors clean-air corridors around Hyderabad.`,
    });
  }

  for (const loc of MAP_LOCATIONS) {
    if (loc.type !== 'sanctuary') continue;
    add(out, {
      ...base,
      id: `map:location:${loc.id}`,
      title: `${loc.title} — Map Position`,
      propertyId: loc.id,
      text:
        `On The Green Team's environmental map, ${loc.title} is plotted at ${loc.location} with an air quality ` +
        `index of ${loc.aqi}${loc.noise != null ? ` and ambient noise of ${loc.noise} dB` : ''}. ` +
        `${loc.description ?? ''} ` +
        `${loc.forestRadius ? `A forest and green-cover radius of roughly ${inr(loc.forestRadius)} metres surrounds ${loc.title}.` : ''}`,
    });
  }

  const orrExits = MAP_LOCATIONS.filter(l => l.type === 'exit');
  add(out, {
    ...base,
    id: 'map:orr-exits',
    title: 'ORR Exits — Air Quality',
    text:
      `The Green Team's environmental map plots ${orrExits.length} Outer Ring Road (ORR) exits around Hyderabad ` +
      `with the measured air quality index at each: ` +
      `${orrExits.map(e => `${e.title} at ${e.location}, AQI ${e.aqi}`).join('; ')}. ` +
      `ORR Exit-14 at Tukkuguda is the access point for MODCON SYL Residences and the reference exit for Dates County.`,
  });

  const rrrExits = MAP_LOCATIONS.filter(l => l.type === 'rrr-exit');
  add(out, {
    ...base,
    id: 'map:rrr-exits',
    title: 'RRR Proposed Exits — Air Quality',
    text:
      `The Green Team's environmental map plots ${rrrExits.length} proposed Regional Ring Road (RRR) exits with ` +
      `their measured air quality index: ` +
      `${rrrExits.map(e => `${e.location}, AQI ${e.aqi}`).join('; ')}. ` +
      `The RRR corridor is materially cleaner than the ORR ring, and MODCON Agartha sits near the Toopran and ` +
      `Narsapur stretch of it — the infrastructure half of the Agartha investment thesis.`,
  });
}

const SIZE_BANDS: Array<{ label: string; min: number; max: number }> = [
  { label: 'under 1,000 sq yds', min: 0, max: 999 },
  { label: '1,000 – 1,499 sq yds', min: 1000, max: 1499 },
  { label: '1,500 – 1,999 sq yds', min: 1500, max: 1999 },
  { label: '2,000 – 2,999 sq yds', min: 2000, max: 2999 },
  { label: '3,000 sq yds and above', min: 3000, max: Infinity },
];

function layoutChunks(out: KbChunk[]): void {
  const base = { source: 'layout' as const, url: '/sanctuaries/agartha', propertyId: 'agartha' };

  for (const h of AGARTHA_HOTSPOTS) {
    add(out, {
      ...base,
      id: `layout:hotspot:${h.id}`,
      title: `MODCON Agartha Site Plan — ${h.label}`,
      text:
        `On the MODCON Agartha site plan, hotspot ${h.num} is "${h.label}" (${h.tag}). ${h.detail} ` +
        `Key figures for ${h.label} at MODCON Agartha: ${h.stats.map(s => `${s.label} — ${s.value}`).join('; ')}.`,
    });
  }

  const sizes = AGARTHA_PLOTS.map(p => p.area);
  const bands = SIZE_BANDS.map(b => {
    const inBand = AGARTHA_PLOTS.filter(p => p.area >= b.min && p.area <= b.max);
    if (!inBand.length) return '';
    const lo = Math.min(...inBand.map(p => p.area));
    const hi = Math.max(...inBand.map(p => p.area));
    const span = lo === hi ? `${inr(lo)} sq yds` : `${inr(lo)} – ${inr(hi)} sq yds`;
    const cost =
      lo === hi
        ? `roughly ${formatRs(lo * AGARTHA_NOW_RATE)}`
        : `roughly ${formatRs(lo * AGARTHA_NOW_RATE)} – ${formatRs(hi * AGARTHA_NOW_RATE)}`;
    return `${inBand.length} plot${inBand.length === 1 ? '' : 's'} ${b.label} (${span}, ${cost} at ₹${inr(AGARTHA_NOW_RATE)} per sq yd)`;
  }).filter(Boolean);

  add(out, {
    ...base,
    id: 'layout:agartha:plot-inventory',
    title: 'MODCON Agartha — Plot Inventory by Size',
    text:
      `The MODCON Agartha interactive site plan maps ${AGARTHA_PLOTS.length} plots, ranging from ` +
      `${inr(Math.min(...sizes))} to ${inr(Math.max(...sizes))} sq yds. Broken down by size band: ${bands.join('; ')}. ` +
      `Every MODCON Agartha plot is priced at the same rate of ₹${inr(AGARTHA_NOW_RATE)} per sq yd, so plot value ` +
      `scales directly with size; the largest is Plot 3, the corner plot on the Narsapur forest boundary. ` +
      `These sizes are the plan positions used by the interactive layout — the developer's published plot range ` +
      `and current availability for MODCON Agartha are the figures on the property page, and they take precedence.`,
  });

  sylLayoutChunks(out);
}

/** SYL's sanctioned site plan: 15 villaments across two blocks, priced per SFT. */
function sylLayoutChunks(out: KbChunk[]): void {
  const base = { source: 'layout' as const, url: '/sanctuaries/syl', propertyId: 'syl' };

  for (const h of SYL_HOTSPOTS) {
    add(out, {
      ...base,
      id: `layout:syl:hotspot:${h.id}`,
      title: `MODCON SYL Residences Site Plan — ${h.label}`,
      text:
        `On the MODCON SYL Residences site plan, hotspot ${h.num} is "${h.label}" (${h.tag}). ${h.detail} ` +
        `Key figures for ${h.label} at MODCON SYL: ${h.stats.map(s => `${s.label} — ${s.value}`).join('; ')}.`,
    });
  }

  // Group identical unit sizes — buyers ask "what sizes are there", not "what is
  // unit 9", and the sanctioned plan only has six distinct sizes.
  const bySize = new Map<number, number>();
  for (const u of SYL_UNITS) bySize.set(u.area, (bySize.get(u.area) ?? 0) + 1);
  const sizes = [...bySize.entries()].sort((a, b) => a[0] - b[0]);
  const lines = sizes.map(
    ([area, n]) =>
      `${n} villament${n === 1 ? '' : 's'} of ${inr(area)} SFT (about ${formatRs(area * SYL_RATE)} at ₹${inr(SYL_RATE)} per SFT)`
  );
  const areas = SYL_UNITS.map(u => u.area);

  add(out, {
    ...base,
    id: 'layout:syl:unit-inventory',
    title: 'MODCON SYL Residences — Villament Sizes & Pricing',
    text:
      `The MODCON SYL Residences sanctioned site plan lays out ${SYL_UNITS.length} villaments in two blocks — ` +
      `Block B with 7 units to the north and Block A with 8 units to the south — separated by a central park, ` +
      `with the integrated commercial block on the western half of the 4.5-acre site. Unit sizes range from ` +
      `${inr(Math.min(...areas))} SFT to ${inr(Math.max(...areas))} SFT: ${lines.join('; ')}. ` +
      `MODCON SYL Residences is priced at ₹${inr(SYL_RATE)} per SFT. Each block is served by its own staircase ` +
      `lobby, internal roads are 16 m wide, and the single ${inr(Math.max(...areas))} SFT unit is the corner ` +
      `villament at the eastern end of Block A. The clubhouse is a separate 22,000 SFT G+2 building and is not ` +
      `one of these 15 villaments. Current availability and the final price for MODCON SYL should be confirmed ` +
      `with an adviser — the figures on the property page take precedence.`,
  });
}

function contactChunks(out: KbChunk[]): void {
  add(out, {
    id: 'contact:business',
    title: 'The Green Team — Contact & Business Details',
    source: 'contact',
    url: '/adviser-call',
    text:
      `${BUSINESS.name} — ${BUSINESS.legalDescriptor} — is an independent curation house operating from ` +
      `${BUSINESS.city}, ${BUSINESS.region} ${BUSINESS.postalCode}, India. Reach ${BUSINESS.name} by phone or ` +
      `WhatsApp on ${BUSINESS.phone}, or by email at ${BUSINESS.email}. The website is ${SITE_URL}; ` +
      `Instagram ${BUSINESS.instagram} and LinkedIn ${BUSINESS.linkedin}. ` +
      `${BUSINESS.name} is a channel partner, not the developer — buyers are introduced directly to the developer ` +
      `at the developer's own price, and site visits and enquiries are coordinated over WhatsApp.`,
  });

  add(out, {
    id: 'contact:investment-brackets',
    title: 'The Green Team — Investment Brackets',
    source: 'contact',
    url: '/adviser-call',
    text:
      `When enquiring with ${BUSINESS.name}, buyers choose an investment bracket so the adviser shortlists only ` +
      `what fits. The brackets offered are: ${INVESTMENT_BRACKETS.join(', ')}. ` +
      `The portfolio entry point sits in the first bracket, and the bracket a buyer selects drives which of the ` +
      `three sanctuaries the adviser puts in front of them.`,
  });

  const growth = ((AGARTHA_NOW_RATE - AGARTHA_OLD_RATE) / AGARTHA_OLD_RATE) * 100;
  add(out, {
    id: 'contact:agartha-rate-history',
    title: 'MODCON Agartha — Rate History',
    source: 'contact',
    url: '/sanctuaries/agartha',
    propertyId: 'agartha',
    text:
      `MODCON Agartha rate history: the VIP pre-launch rate was ₹${inr(AGARTHA_OLD_RATE)} per sq yd and the ` +
      `current rate is ₹${inr(AGARTHA_NOW_RATE)} per sq yd — an increase of about ${growth.toFixed(1)}%. ` +
      `A 1,000 sq yd plot at MODCON Agartha therefore moved from ${formatRs(1000 * AGARTHA_OLD_RATE)} to ` +
      `${formatRs(1000 * AGARTHA_NOW_RATE)} over that period. This rate history is the evidence The Green Team ` +
      `points to when explaining why early-phase pricing at any sanctuary is worth taking seriously; it is a ` +
      `record of what happened, not a guarantee of what will.`,
  });
}

function faqChunks(out: KbChunk[]): void {
  SALES_FAQ.forEach((entry, i) => {
    add(out, {
      id: `faq:${i + 1}`,
      title: `FAQ — ${entry.q}`,
      source: 'faq',
      text: `Q: ${entry.q}\nA: ${entry.a}`,
    });
  });
}

/**
 * The listing standard. Retrieved when a buyer asks why the portfolio is small,
 * what we refuse, or which areas we cover — the questions that decide whether
 * a curated shortlist reads as selective or as thin.
 */
function standardChunks(out: KbChunk[]): void {
  add(out, {
    id: 'standard:scope',
    title: 'The Green Team — areas covered',
    source: 'standard',
    url: '/standard',
    text:
      `The Green Team lists property in ${SERVICE_AREA.region} and its ORR–RRR growth corridor only, and nowhere ` +
      `else at present. ${SERVICE_AREA.detail} A buyer looking outside Hyderabad is told plainly that The Green ` +
      `Team is the wrong firm for that search rather than being taken on as an enquiry.`,
  });

  add(out, {
    id: 'standard:refusals',
    title: 'The Green Team — what we refuse to list',
    source: 'standard',
    url: '/standard',
    text:
      `The Green Team publishes what it turns down as part of its listing standard. It will not list: ` +
      `${DISQUALIFIERS.join('; ')}. In particular, assured-return, guaranteed-buyback and rental-guarantee ` +
      `structures are refused outright in any form, and a visualisation is never presented as a built home.`,
  });

  LISTING_STANDARD.forEach(pillar => {
    add(out, {
      id: `standard:${pillar.id}`,
      title: `Listing standard — ${pillar.title}`,
      source: 'standard',
      url: '/standard',
      text:
        `One of the six tests The Green Team applies before listing a property is "${pillar.title}". ` +
        `${pillar.summary} Specifically, the property must satisfy: ${pillar.tests.join('; ')}. ` +
        `A project that fails this test is not listed on thegreenteam.in, however good it looks.`,
    });
  });
}

export async function buildCorpus(): Promise<KbChunk[]> {
  const out: KbChunk[] = [];

  const portfolio = await getPortfolio();
  portfolio.forEach(propertyChunks(out));

  journalChunks(out);
  mapChunks(out);
  layoutChunks(out);
  contactChunks(out);
  faqChunks(out);
  standardChunks(out);

  return out;
}
