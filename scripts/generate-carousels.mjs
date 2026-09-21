/**
 * Generate the per-project UGC carousel posts.
 *
 *   GEMINI_API_KEY=... node scripts/generate-carousels.mjs            # all projects, 2K
 *   GEMINI_API_KEY=... node scripts/generate-carousels.mjs agartha    # one project
 *   GEMINI_API_KEY=... node scripts/generate-carousels.mjs --4k       # 4K masters instead
 *
 * Output lands in marketing/ugc-cast/out/<project>/ (gitignored — regenerate
 * rather than version 4K PNGs).
 *
 * THE RULE THAT MATTERS, learned the expensive way: a source render is
 * LANDSCAPE and a social post is VERTICAL. Handing a landscape still straight
 * to a generator targeting 4:5 gets you one of two failures, and the first
 * batch produced both — it either letterboxes and then crops in so hard the
 * building disappears, or it fills the empty frame by INVENTING architecture
 * that is not the project. The second is not a quality problem, it is a
 * misrepresentation problem: an ad showing a property we do not represent.
 *
 * So every frame here is composed vertically in a single generation that is
 * given both references at once — the model's identity image and the project
 * render — and asked to recompose, never to extend. Nothing is ever fed a
 * mismatched aspect ratio.
 *
 * Serial, not parallel. Eight concurrent jobs is what tripped the per-minute
 * quota last time; the throughput gain was zero because the rejects had to be
 * re-run anyway.
 */
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname } from 'node:path';

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) { console.error('Set GEMINI_API_KEY. Top up at https://ai.studio/projects if it returns 402.'); process.exit(1); }

const MODEL = 'gemini-3-pro-image';
/**
 * 2K by default: ~2048px on the short edge, already well past 1080p delivery
 * and roughly half the per-image cost of 4K. Pass --4k when you want masters
 * to crop into or print from, not when you want posts.
 */
const SIZE = process.argv.includes('--4k') ? '4K' : '2K';
const RATIO = '4:5';        // feed carousel. '9:16' for stories.
const OUT = 'marketing/ugc-cast/out';
const CAST = 'marketing/ugc-cast/tara-reference.png';

const b64 = p => readFileSync(p).toString('base64');
const mime = p => p.endsWith('.png') ? 'image/png' : p.endsWith('.jpg') ? 'image/jpeg' : 'image/webp';
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Byte-identical across every frame. Reworded blocks are where consistency dies. */
const STYLE =
  'Authentic UGC style: shot on a modern phone, natural available light, slightly ' +
  'imperfect candid framing. NOT a polished advertising render, NOT studio lit, NOT a ' +
  'stock photo. Full natural colour, no teal or blue cast, no heavy grading, no ' +
  'monochrome. Sharp edge to edge — no blurred bands, no vignetted strips, no empty ' +
  'areas, no letterboxing, no black bars. No text, no captions, no watermark, no logo.';

/** The instruction that prevents the invented-architecture failure. */
const FIDELITY =
  'Recompose the SCENE from the location image into a VERTICAL frame. Keep its ' +
  'architecture, materials, rooflines, planting and colour palette EXACTLY as given — ' +
  'this is a real project and the building must stay recognisably itself. Because the ' +
  'frame is taller, reveal more sky and canopy above and more ground and planting ' +
  'below. Do NOT invent new buildings, new structures or a different site. Do NOT add ' +
  'people, cars, signage or construction activity that is not in the source.';

const WITH_HOST =
  'IMAGE 1 is the person: keep her face, hair, skin tone and build EXACTLY the same — ' +
  'same woman, clearly recognisable, no change to facial features. She wears the same ' +
  'olive-green silk kurta with fine gold embroidery and cream dupatta. Place her ' +
  'naturally into the location at a plausible scale, with lighting and shadows that ' +
  'match the scene.\n\nIMAGE 2 is the location. ';

const PROJECTS = {
  agartha: [
    { id: '1-arrival', img: 'marketing/agartha-ugc/04-arrival-thatched-villa.jpg', host: true,
      brief: 'She walks the path toward the villa, half-turned back over her shoulder to camera, laughing. Shot from behind and slightly low, like a friend a few steps back.' },
    { id: '2-roofline', img: 'marketing/agartha-ugc/01-hero-green-roof-house.jpg',
      brief: 'The planted green roof reads clearly against the sky. Nobody in frame. The "wait, what is that" beat.' },
    { id: '3-path',     img: 'marketing/agartha-ugc/03-bamboo-arch-path.jpg',
      brief: 'Looking down the bamboo arch path, the tunnel of it drawing the eye through. Nobody in frame.' },
    { id: '4-detail',   img: 'marketing/agartha-ugc/06-pergola-courtyard-detail.jpg',
      brief: 'Close on the materials — timber, lime plaster, planting. Texture, held still. Nobody in frame.' },
    { id: '5-golden',   img: 'marketing/agartha-ugc/05-golden-hour-firepit.jpg', host: true,
      brief: 'She sits near the fire pit at last light, relaxed, looking out rather than at camera, holding a cup.' },
    { id: '6-wide',     img: 'marketing/agartha-ugc/02-wide-establishing.jpg', host: true,
      brief: 'She stands small in a wide frame so the whole house and treeline read behind her, smiling at camera. The closing card.' },
  ],
  syl: [
    { id: '1-facade',  img: 'public/gallery/syl/syl-facade-sky.webp',
      brief: 'Looking up the curved balcony edges into open sky, the way someone at the base would. Nobody in frame.' },
    { id: '2-balcony', img: 'public/gallery/syl/syl-balcony-detail.webp',
      brief: 'The planted balcony edge with trailing greenery. Keep the whole balcony legible — do not crop into anonymous repeating slabs.' },
    { id: '3-dusk',    img: 'public/gallery/syl/syl-exterior-dusk.webp', host: true,
      brief: 'She stands on the forecourt at dusk, the lit building behind her, turning to camera. Warm interior light against a deepening sky.' },
    { id: '4-street',  img: 'public/gallery/syl/syl-street-dusk.webp',
      brief: 'The approach along the street at dusk, the building reading as an address rather than an object. Nobody in frame.' },
    { id: '5-interior',img: 'public/gallery/syl/1776279343905.webp', host: true,
      brief: 'She stands by the glazing looking out at the green, half-turned to camera. Interior light, calm.' },
  ],
};

async function generate(project, shot) {
  const parts = [];
  if (shot.host) parts.push({ inlineData: { mimeType: 'image/png', data: b64(CAST) } });
  parts.push({ inlineData: { mimeType: mime(shot.img), data: b64(shot.img) } });
  parts.push({ text: `${shot.host ? WITH_HOST : 'The image is the location. '}${FIDELITY}\n\n${shot.brief}\n\n${STYLE}` });

  const body = { contents: [{ role: 'user', parts }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: RATIO, imageSize: SIZE } } };

  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt) { console.log(`    backoff ${attempt * 30}s`); await sleep(attempt * 30000); }
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
      { method: 'POST', headers: { 'x-goog-api-key': KEY, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json();
    if (j.error) { console.log(`    ${j.error.code}: ${String(j.error.message).slice(0, 90)}`); if (j.error.code === 402) process.exit(1); continue; }
    const part = j?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part) { console.log('    no image in response'); continue; }
    const out = `${OUT}/${project}/${shot.id}.png`;
    mkdirSync(dirname(out), { recursive: true });
    writeFileSync(out, Buffer.from(part.inlineData.data, 'base64'));
    return out;
  }
  return null;
}

const arg = process.argv.slice(2).find(a => !a.startsWith('--'));
const wanted = arg ? [arg] : Object.keys(PROJECTS);
for (const project of wanted) {
  const shots = PROJECTS[project];
  if (!shots) { console.log(`skip ${project}: no shot list`); continue; }
  console.log(`\n${project} — ${shots.length} frames at ${SIZE} ${RATIO}`);
  for (const shot of shots) {
    if (!existsSync(shot.img)) { console.log(`  ${shot.id}: missing ${shot.img}`); continue; }
    const out = await generate(project, shot);
    console.log(`  ${shot.id}: ${out ?? 'FAILED'}`);
    await sleep(6000);   // stay under the per-minute cap
  }
}
console.log('\ndone');
