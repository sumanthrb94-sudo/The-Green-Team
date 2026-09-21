/**
 * Seed stills for the Agartha permaculture campaign (films 1–4).
 *
 *   GEMINI_API_KEY=... node scripts/generate-campaign-stills.mjs
 *
 * These are FIRST FRAMES, not finished art. Each one gets animated afterwards,
 * and a clip is only as good as the frame it starts from — hand a video model
 * an empty or wrongly-shaped frame and it invents its way out of the gap. So
 * every still is generated at 9:16 natively, matching the film format, and
 * approved before anything is animated.
 *
 * Campaign constraints, from campaign/PERMACULTURE-CAMPAIGN.md:
 *   - no people, no faces, no hands — objects and spaces only
 *   - no text, no logos, no readable screens
 *   - these depict a plan, never a finished built thing
 *   - the shared palette line is appended verbatim to every prompt
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) { console.error('Set GEMINI_API_KEY'); process.exit(1); }
const OUT = 'marketing/agartha-ugc/campaign/stills';
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Verbatim from the campaign doc. Do not reword — it is what makes 12 clips
 *  from 4 films read as one campaign rather than twelve stock shots. */
const PALETTE =
  'muted desaturated palette, deep forest green and warm kraft brown, soft ' +
  'overcast daylight from one side, shallow depth of field, subtle film grain, ' +
  'no text or branding anywhere';

const RULES =
  'Vertical 9:16 cinematic still. Photorealistic. Absolutely NO people, no ' +
  'faces, no hands, no figures — objects and spaces only. No text, no ' +
  'captions, no logos, no signage, no readable screens. Deccan plateau, ' +
  'Telangana, India — native dry deciduous vegetation, not temperate or ' +
  'tropical rainforest. Sharp edge to edge, no letterboxing, no black bars, ' +
  'no empty strips.';

const SHOTS = [
  { id: 'f1-a', film: 'Film 1 · the land is already planted', slot: 'A — the problem',
    brief: 'Bare tilled red-brown earth stretching away, a single rough granite boundary stone, nothing growing. Empty and unpromising. Hard flat light.' },
  { id: 'f1-b', film: 'Film 1', slot: 'B — the turn',
    brief: 'A young sapling newly planted, a black drip emitter beside its base, a dark wet patch spreading through dry soil. Close, low to the ground.' },

  { id: 'f2-a', film: 'Film 2 · who farms it when you are not there', slot: 'A — the problem',
    brief: 'A weed-choked abandoned plot behind a rusted wire fence, boundary stones half-buried in overgrowth. Neglected for years.' },
  { id: 'f2-b', film: 'Film 2', slot: 'B — the turn',
    brief: 'Interior of a clean open-sided cattle shed — straw bedding, feed troughs, a compost heap steaming faintly in cool morning air. Indian desi cattle. No people.' },

  { id: 'f3-a', film: 'Film 3 · water', slot: 'A — the problem',
    brief: 'Cracked dry earth in a hard-edged crazed pattern, brittle grey stubble, harsh overhead summer light. Parched.' },
  { id: 'f3-b', film: 'Film 3', slot: 'B — the turn',
    brief: 'Extreme macro on a black drip emitter, one bead of water swelling at its mouth about to fall, soil beneath already darkening.' },

  { id: 'f4-a', film: 'Film 4 · you can eat it', slot: 'A — the problem',
    brief: 'A perfectly clipped ornamental lawn with trimmed decorative hedging. Pretty, sterile, nothing edible anywhere. Observational and flat.' },
  { id: 'f4-b', film: 'Film 4', slot: 'B — the turn',
    brief: 'A spiral herb garden seen from above, stone-edged, planted with herbs moving in a light wind; ripe vegetables on the plant nearby.' },
  { id: 'f4-c', film: 'Film 4', slot: 'C — resolution',
    brief: 'A farm-to-table setting at dusk — rough timber table, ceramic plates, just-picked vegetables in a bowl, warm low light. Absolutely no people.' },
];

mkdirSync(OUT, { recursive: true });
for (const s of SHOTS) {
  const body = { contents: [{ role: 'user', parts: [{ text: `${s.brief}\n\n${RULES}\n\n${PALETTE}` }] }],
    generationConfig: { responseModalities: ['IMAGE'], imageConfig: { aspectRatio: '9:16', imageSize: '2K' } } };
  let done = false;
  for (let a = 0; a < 3 && !done; a++) {
    if (a) await sleep(a * 30000);
    const r = await fetch('https://generativelanguage.googleapis.com/v1beta/models/gemini-3-pro-image:generateContent',
      { method: 'POST', headers: { 'x-goog-api-key': KEY, 'content-type': 'application/json' }, body: JSON.stringify(body) });
    const j = await r.json();
    if (j.error) { console.log(`  ${s.id}: ${j.error.code} ${String(j.error.message).slice(0,70)}`); if (j.error.code === 402) process.exit(1); continue; }
    const part = j?.candidates?.[0]?.content?.parts?.find(p => p.inlineData);
    if (!part) { console.log(`  ${s.id}: no image`); continue; }
    writeFileSync(`${OUT}/${s.id}.png`, Buffer.from(part.inlineData.data, 'base64'));
    console.log(`  ${s.id}  ${s.slot}`);
    done = true;
  }
  await sleep(6000);
}
console.log('done');
