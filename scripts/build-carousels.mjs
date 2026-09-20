/**
 * Build per-project carousel posts from the real project renders.
 *
 *   node scripts/build-carousels.mjs               # all three, 4:5 feed posts
 *   node scripts/build-carousels.mjs agartha       # one project
 *   node scripts/build-carousels.mjs --story       # 9:16 stories instead
 *
 * No AI, no API key, no credits. This composites the renders the developers
 * actually gave us and sets type over them.
 *
 * That is not a fallback, it is the safer artefact. A generative pass at a
 * vertical crop reinvents architecture — the first video batch turned an
 * Agartha plunge pool into a pergola that does not exist on the site. Here the
 * photograph is untouched: a smart crop to 4:5 and a gradient scrim. What the
 * buyer sees is what the drawings show.
 *
 * Output: marketing/ugc-cast/out/<project>/NN-<slug>.jpg at 2160x2700 (4:5,
 * comfortably past Instagram's 1080x1350 so it survives their recompression).
 */
import sharp from 'sharp';
import { mkdirSync, existsSync } from 'node:fs';

/**
 * Two formats off one layout.
 *
 * A story is not a taller post. Instagram and WhatsApp overlay their own UI on
 * the top and bottom of a 9:16 frame — avatar and close button above, reply
 * box and sticker row below — so type parked at the bottom edge, which is
 * correct for a feed post, gets covered. `SAFE` lifts the whole text block
 * clear of it.
 */
const STORY = process.argv.includes('--story');
const W = 2160;
const H = STORY ? 3840 : 2700;
const SAFE = STORY ? 620 : 0;   // bottom reserved for platform chrome
const INK = '#0a1208', GOLD = '#c8a951', SAGE = '#a3b18a';
const OUT = STORY ? 'marketing/ugc-cast/out-story' : 'marketing/ugc-cast/out';

/** SVG is XML: an unescaped & or < silently kills the whole overlay. */
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

const scrim = (from, to, y0, y1) => `
  <linearGradient id="g" x1="0" y1="${y0}" x2="0" y2="${y1}" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="${from}" stop-opacity="0"/>
    <stop offset="0.55" stop-color="${to}" stop-opacity="0.82"/>
    <stop offset="1" stop-color="${to}" stop-opacity="0.97"/>
  </linearGradient>`;

function coverSvg({ eyebrow, title, tagline }) {
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><defs>${scrim(INK, INK, H * (STORY ? 0.18 : 0.3), H - SAFE * 0.4)}</defs>
  <rect x="0" y="${H * (STORY ? 0.18 : 0.3)}" width="${W}" height="${H}" fill="url(#g)"/>
  <circle cx="150" cy="${H - SAFE - 700}" r="13" fill="${GOLD}"/>
  <text x="196" y="${H - SAFE - 686}" font-family="Work Sans" font-weight="700" font-size="40" letter-spacing="14" fill="#ffffff" opacity="0.72">${esc(eyebrow)}</text>
  <text x="146" y="${H - SAFE - 480}" font-family="Outfit" font-weight="700" font-size="150" letter-spacing="-4" fill="#ffffff">${esc(title)}</text>
  <text x="150" y="${H - SAFE - 360}" font-family="Work Sans" font-size="60" fill="${SAGE}">${esc(tagline)}</text>
  <rect x="150" y="${H - SAFE - 250}" width="300" height="5" fill="${GOLD}" opacity="0.85"/>
  <text x="150" y="${H - SAFE - 150}" font-family="Work Sans" font-weight="700" font-size="38" letter-spacing="10" fill="#ffffff" opacity="0.6">SWIPE</text>
  <text x="392" y="${H - SAFE - 148}" font-family="Work Sans" font-weight="700" font-size="44" fill="${GOLD}">&#8594;</text>
  </svg>`;
}

function statSvg({ value, label, sub }) {
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><defs>${scrim(INK, INK, H * (STORY ? 0.24 : 0.38), H - SAFE * 0.4)}</defs>
  <rect x="0" y="${H * (STORY ? 0.24 : 0.38)}" width="${W}" height="${H}" fill="url(#g)"/>
  <text x="150" y="${H - SAFE - 420}" font-family="Outfit" font-weight="700" font-size="230" letter-spacing="-8" fill="${GOLD}">${esc(value)}</text>
  <text x="154" y="${H - SAFE - 300}" font-family="Outfit" font-weight="700" font-size="76" fill="#ffffff">${esc(label)}</text>
  ${sub ? `<text x="156" y="${H - SAFE - 200}" font-family="Work Sans" font-size="48" fill="#ffffff" opacity="0.62">${esc(sub)}</text>` : ''}
  </svg>`;
}

function ctaSvg() {
  return `<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg"><defs>${scrim(INK, INK, 0, H)}</defs>
  <rect x="0" y="0" width="${W}" height="${H}" fill="${INK}" opacity="0.72"/>
  <rect x="0" y="0" width="${W}" height="${H}" fill="url(#g)"/>
  <circle cx="150" cy="${H / 2 - SAFE / 2 - 430}" r="13" fill="${GOLD}"/>
  <text x="196" y="${H / 2 - SAFE / 2 - 416}" font-family="Work Sans" font-weight="700" font-size="40" letter-spacing="14" fill="#ffffff" opacity="0.72">THE GREEN TEAM</text>
  <text x="146" y="${H / 2 - SAFE / 2 - 190}" font-family="Outfit" font-weight="700" font-size="136" letter-spacing="-4" fill="#ffffff">We don&#8217;t sell these.</text>
  <text x="146" y="${H / 2 - SAFE / 2 - 40}" font-family="Outfit" font-weight="700" font-size="136" letter-spacing="-4" fill="${SAGE}">We check them.</text>
  <text x="150" y="${H / 2 - SAFE / 2 + 110}" font-family="Work Sans" font-size="58" fill="#ffffff" opacity="0.72">Air &#183; quiet &#183; access &#183; title —</text>
  <text x="150" y="${H / 2 - SAFE / 2 + 190}" font-family="Work Sans" font-size="58" fill="#ffffff" opacity="0.72">verified before you ever see it.</text>
  <rect x="150" y="${H / 2 - SAFE / 2 + 290}" width="760" height="130" rx="65" fill="${GOLD}"/>
  <text x="228" y="${H / 2 - SAFE / 2 + 373}" font-family="Work Sans" font-weight="700" font-size="46" letter-spacing="6" fill="${INK}">thegreenteam.in</text>
  <text x="150" y="${H - SAFE - 120}" font-family="Work Sans" font-size="34" fill="#ffffff" opacity="0.38">Architectural renders. Homes not yet built.</text>
  </svg>`;
}

const PROJECTS = {
  agartha: {
    cover: { img: 'public/gallery/agartha/11.webp', eyebrow: 'NARSAPUR FOREST · HYDERABAD',
             title: 'MODCON Agartha', tagline: 'Where the forest becomes home.' },
    frames: [
      { img: 'public/gallery/agartha/3.webp',  value: '37',      label: 'farm plots',        sub: '726 sq yds to a full acre' },
      { img: 'public/gallery/agartha/18.webp', value: '2 acres', label: 'resort & clubhouse', sub: 'Bio-pool, farm-to-table, wellness' },
      { img: 'public/gallery/agartha/22.webp', value: '12',      label: 'AQI at the site',    sub: '50 minutes to Gachibowli' },
    ],
    cta: 'public/gallery/agartha/11.webp',
  },
  syl: {
    cover: { img: 'public/gallery/syl/syl-exterior-dusk.webp', eyebrow: 'TUKKUGUDA · ORR EXIT-14',
             title: 'MODCON SYL', tagline: 'Where luxury meets the treeline.' },
    frames: [
      { img: 'public/gallery/syl/syl-facade-sky.webp',     value: '155',        label: 'villaments',   sub: '3,882 to 7,000 SFT' },
      { img: 'public/gallery/syl/syl-balcony-detail.webp', value: '22,000 SFT', label: 'G+2 clubhouse', sub: 'Health · wellness · nature' },
      { img: 'public/gallery/syl/syl-street-dusk.webp',    value: '10 min',     label: 'to the airport', sub: 'Two minutes to ORR Exit-14' },
    ],
    cta: 'public/gallery/syl/syl-exterior-dusk.webp',
  },
  'dates-county': {
    // Only three of this gallery's images are usable: temple, project-highlight
    // and amenities. forest.jpg is an interior overlooking tennis courts,
    // field.jpg a green-roofed township aerial, water.jpg a meadow stream —
    // none of them Kandukur. They are deliberately not referenced here.
    cover: { img: 'public/gallery/dates-county/project-highlight.jpg', eyebrow: 'KANDUKUR · SRISAILAM HIGHWAY',
             title: 'Dates County', tagline: 'At the edge of a 4,000-acre forest.' },
    frames: [
      { img: 'public/gallery/dates-county/temple.jpg',    value: '300+',      label: 'acres',           sub: '40% open and recreational space' },
      { img: 'public/gallery/dates-county/amenities.jpg', value: '4,000',     label: 'acre reserve forest', sub: 'Adjacent to the township' },
      { img: 'public/gallery/dates-county/field.jpg',     value: '15 min',    label: 'to the airport',  sub: 'And 15 to ORR Exit-14', skip: true },
    ],
    cta: 'public/gallery/dates-county/project-highlight.jpg',
  },
};

/** Smart crop to 4:5 — sharp's attention strategy keeps the subject, and the
 *  photograph is otherwise untouched. No generative fill, so no invention. */
const base = img => sharp(img).resize(W, H, { fit: 'cover', position: sharp.strategy.attention });

async function frame(img, svg, out) {
  await base(img)
    .composite([{ input: Buffer.from(svg), top: 0, left: 0 }])
    .jpeg({ quality: 92, chromaSubsampling: '4:4:4' })
    .toFile(out);
  return out;
}

const arg = process.argv.slice(2).find(a => !a.startsWith('--'));
const wanted = arg ? [arg] : Object.keys(PROJECTS);
console.log(STORY ? `story 9:16 — ${W}x${H}` : `post 4:5 — ${W}x${H}`);
for (const key of wanted) {
  const p = PROJECTS[key];
  if (!p) { console.log(`skip ${key}`); continue; }
  const dir = `${OUT}/${key}`;
  mkdirSync(dir, { recursive: true });
  let n = 1;
  const pad = () => String(n++).padStart(2, '0');
  console.log(`\n${key}`);
  if (existsSync(p.cover.img)) console.log('  ' + await frame(p.cover.img, coverSvg(p.cover), `${dir}/${pad()}-cover.jpg`));
  for (const f of p.frames) {
    if (f.skip || !existsSync(f.img)) { console.log(`  (skipped ${f.img})`); continue; }
    console.log('  ' + await frame(f.img, statSvg(f), `${dir}/${pad()}-${f.label.replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.jpg`));
  }
  if (existsSync(p.cta)) console.log('  ' + await frame(p.cta, ctaSvg(), `${dir}/${pad()}-cta.jpg`));
}
console.log('\ndone');
