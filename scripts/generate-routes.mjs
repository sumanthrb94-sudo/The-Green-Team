#!/usr/bin/env node
/**
 * Post-build: generates property-specific static HTML pages so each property
 * URL (e.g. /agartha) is served with the correct <title>, <meta description>,
 * canonical, OG and Twitter tags — visible to crawlers before JS executes.
 *
 * Vercel serves a static file at /agartha/index.html in preference to the
 * catch-all SPA rewrite, so the crawler sees property meta immediately.
 * A tiny inline script sets window.__INITIAL_PROPERTY__ so the React app
 * auto-opens the matching property modal on that URL.
 */

import { readFile, writeFile, mkdir } from 'fs/promises';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DIST_DIR  = join(__dirname, '..', 'dist');
const BASE_URL  = 'https://thegreenteam.in';

const PROPERTIES = [
  {
    id: 'agartha',
    title: 'MODCON Agartha — Forest Farm Plots from ₹68.7L | The Green Team',
    description:
      '25-acre permaculture farm estate on the Narsapur forest boundary. AQI 12, ambient noise 18 dB, 40 min from Hyderabad Financial District. 36 plots from ₹68.7L. Winner: Best Sustainable Eco-Friendly Project, Outlook Business 2024.',
    canonical: `${BASE_URL}/agartha`,
    image:     `${BASE_URL}/gallery/agartha/11.webp`,
    imageAlt:  'MODCON Agartha — forest farm estate near Hyderabad curated by The Green Team',
  },
  {
    id: 'syl',
    title: 'MODCON SYL Residences — Villaments at Tukkuguda | The Green Team',
    description:
      'Biophilic luxury villaments at ORR Exit-14, Tukkuguda, Hyderabad. AQI 22, 10 min to airport, 30–45 min to Financial District. 2,500–4,500 SFT from ₹4,499/SFT. Curated by The Green Team.',
    canonical: `${BASE_URL}/syl`,
    image:     `${BASE_URL}/gallery/syl/1776279315359.webp`,
    imageAlt:  'MODCON SYL Residences — villaments at Tukkuguda Hyderabad curated by The Green Team',
  },
  {
    id: 'dates-county',
    title: 'Dates County by Planet Green — Eco Villa Plots | The Green Team',
    description:
      '300+ acre eco-luxury villa-plot community at Kandukur, adjacent to a 4,000-acre reserve forest. AQI 18, 15 min to Hyderabad Airport. ₹18,000/sq yd. RERA registered. Curated by The Green Team.',
    canonical: `${BASE_URL}/dates-county`,
    image:     `${BASE_URL}/gallery/dates-county/temple.webp`,
    imageAlt:  'Dates County by Planet Green — eco villa plots at Kandukur near Hyderabad curated by The Green Team',
  },
];

// Regex-replace a single-line meta/link attribute value
function replaceMeta(html, attrSelector, newValue) {
  return html.replace(
    new RegExp(`(${attrSelector}[^>]*content=")[^"]*(")`),
    `$1${newValue}$2`
  );
}

async function generateRoute(templateHtml, prop) {
  let html = templateHtml;

  // title tag
  html = html.replace(/<title>[^<]*<\/title>/, `<title>${prop.title}</title>`);

  // meta description
  html = html.replace(
    /(<meta name="description" content=")[^"]*(")/,
    `$1${prop.description}$2`
  );

  // canonical
  html = html.replace(
    /(<link rel="canonical" href=")[^"]*(")/,
    `$1${prop.canonical}$2`
  );

  // og:title
  html = html.replace(
    /(<meta property="og:title" content=")[^"]*(")/,
    `$1${prop.title}$2`
  );

  // og:description
  html = html.replace(
    /(<meta property="og:description" content=")[^"]*(")/,
    `$1${prop.description}$2`
  );

  // og:url
  html = html.replace(
    /(<meta property="og:url" content=")[^"]*(")/,
    `$1${prop.canonical}$2`
  );

  // og:image + og:image:secure_url
  html = html.replace(
    /(<meta property="og:image" content=")[^"]*(")/,
    `$1${prop.image}$2`
  );
  html = html.replace(
    /(<meta property="og:image:secure_url" content=")[^"]*(")/,
    `$1${prop.image}$2`
  );
  html = html.replace(
    /(<meta property="og:image:alt" content=")[^"]*(")/,
    `$1${prop.imageAlt}$2`
  );

  // twitter:title / description / image / image:alt
  html = html.replace(
    /(<meta name="twitter:title" content=")[^"]*(")/,
    `$1${prop.title}$2`
  );
  html = html.replace(
    /(<meta name="twitter:description" content=")[^"]*(")/,
    `$1${prop.description}$2`
  );
  html = html.replace(
    /(<meta name="twitter:image" content=")[^"]*(")/,
    `$1${prop.image}$2`
  );
  html = html.replace(
    /(<meta name="twitter:image:alt" content=")[^"]*(")/,
    `$1${prop.imageAlt}$2`
  );

  // Inject initial-property signal so the React app auto-opens this property
  html = html.replace(
    '</body>',
    `  <script>window.__INITIAL_PROPERTY__="${prop.id}";</script>\n</body>`
  );

  return html;
}

async function main() {
  console.log('🗺  Generating property routes …\n');

  const template = await readFile(join(DIST_DIR, 'index.html'), 'utf8');

  for (const prop of PROPERTIES) {
    const dir  = join(DIST_DIR, prop.id);
    await mkdir(dir, { recursive: true });
    const html = await generateRoute(template, prop);
    await writeFile(join(dir, 'index.html'), html, 'utf8');
    console.log(`✓  /${prop.id}/index.html`);
  }

  console.log(`\nDone — ${PROPERTIES.length} property routes generated.`);
}

main();
