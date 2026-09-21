/**
 * Animate the approved permaculture seed stills into clips.
 *
 *   GEMINI_API_KEY=... node scripts/animate-campaign.mjs f3-b     # one clip
 *   GEMINI_API_KEY=... node scripts/animate-campaign.mjs          # all nine
 *
 * Each still is the FIRST FRAME, never a loose reference — that is what pins a
 * clip to the approved image instead of the model's idea of it.
 *
 * Motion is deliberately minimal. The slot briefs in PERMACULTURE-CAMPAIGN.md
 * say "static", "imperceptible drift", "slow push" — and beyond the fact that
 * the campaign asked for it, small moves are what keep a video model from
 * reinventing the frame. Every instruction to move is an invitation to
 * redraw; "very slow push in" gave a model enough room to turn an Agartha
 * plunge pool into a pergola that does not exist. So: one move per clip, named
 * plainly, plus an explicit instruction that nothing may enter the frame.
 *
 * Serial. Eight concurrent jobs tripped the per-minute quota once already.
 */
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';

const KEY = process.env.GEMINI_API_KEY;
if (!KEY) { console.error('Set GEMINI_API_KEY'); process.exit(1); }
const STILLS = 'marketing/agartha-ugc/campaign/stills';
const OUT = 'marketing/agartha-ugc/campaign/clips';
const sleep = ms => new Promise(r => setTimeout(r, ms));

/** Byte-identical across all nine. Consistency lives here. */
const HOLD =
  'Live-action cinematic footage. The camera move is the ONLY movement besides ' +
  'natural ambient motion already implied by the scene. Nothing enters the ' +
  'frame: no people, no faces, no hands, no animals arriving, no vehicles. Do ' +
  'not add, remove or redesign any object, structure or planting — the frame ' +
  'stays exactly as composed. No text, no captions, no subtitles, no logos, no ' +
  'watermark. Natural ambient sound only, no music, no speech, no voiceover. ' +
  'Muted desaturated palette, deep forest green and warm kraft brown, soft ' +
  'overcast daylight from one side, shallow depth of field, subtle film grain.';

const SHOTS = {
  'f1-a': 'Locked-off static shot with an almost imperceptible slow push in. Dry air, the faintest movement in distant scrub.',
  'f1-b': 'Very slow push in toward the sapling. The dark wet patch spreads a little through the soil; the leaves stir slightly.',
  'f2-a': 'Static shot with an imperceptible drift. Dry weeds move faintly in a light wind; the fence does not move.',
  'f2-b': 'Very slow lateral drift sideways across the shed. Steam rises gently from the compost; the cattle shift weight slightly and continue feeding.',
  'f3-a': 'Locked-off static shot. Heat shimmer over the cracked earth; brittle stubble trembles in a dry breeze.',
  'f3-b': 'Very slow push in on the emitter. One bead of water swells at its mouth, releases, and falls; the soil beneath darkens where it lands.',
  'f4-a': 'Static observational shot, no camera move at all. Only the faintest movement in the clipped foliage.',
  'f4-b': 'Very slow drift across the spiral garden. The herbs move in a light wind.',
  'f4-c': 'Very slow push in toward the table. Candle flames move; the light continues to fall. Nobody arrives, no hands enter the frame.',
};

async function animate(id) {
  const prompt = `${SHOTS[id]}\n\n${HOLD}`;
  const img = readFileSync(`${STILLS}/${id}.png`).toString('base64');
  const start = await fetch('https://generativelanguage.googleapis.com/v1beta/models/veo-3.1-generate-preview:predictLongRunning',
    { method: 'POST', headers: { 'x-goog-api-key': KEY, 'content-type': 'application/json' },
      body: JSON.stringify({ instances: [{ prompt, image: { bytesBase64Encoded: img, mimeType: 'image/png' } }],
        parameters: { aspectRatio: '9:16', resolution: '1080p' } }) });
  const op = await start.json();
  if (!op.name) return `${id} START FAILED ${JSON.stringify(op.error?.message || op).slice(0, 120)}`;
  for (let i = 0; i < 40; i++) {
    await sleep(15000);
    const j = await (await fetch(`https://generativelanguage.googleapis.com/v1beta/${op.name}`, { headers: { 'x-goog-api-key': KEY } })).json();
    if (!j.done) continue;
    if (j.error) return `${id} ERROR ${JSON.stringify(j.error).slice(0, 120)}`;
    const v = j.response?.generateVideoResponse?.generatedSamples?.[0]?.video ?? j.response?.generatedVideos?.[0]?.video;
    if (!v) return `${id} NO VIDEO`;
    const buf = v.uri ? Buffer.from(await (await fetch(v.uri, { headers: { 'x-goog-api-key': KEY } })).arrayBuffer())
                      : Buffer.from(v.bytesBase64Encoded, 'base64');
    mkdirSync(OUT, { recursive: true });
    writeFileSync(`${OUT}/${id}.mp4`, buf);
    return `${id} ok ${(buf.length / 1024 / 1024).toFixed(1)}MB`;
  }
  return `${id} TIMED OUT`;
}

const only = process.argv[2];
const ids = only ? [only] : Object.keys(SHOTS);
for (const id of ids) { console.log(await animate(id)); await sleep(10000); }
