/**
 * Install a new homepage hero backdrop.
 *
 *   node scripts/set-hero.mjs ~/Downloads/green-team-hero-still.png
 *
 * Why a script rather than "just replace the file": `/hero-backdrop.jpg` is the
 * LCP image on the home page, and three things have to stay in step with it —
 * the 400/800/1200 responsive variants beside it, the entry in
 * `lib/image-manifest.json` that the custom loader reads, and the `.jpg`
 * extension that `Hero.tsx` and `journal.ts` both reference. Dropping a `.png`
 * in by hand silently breaks srcset: the loader finds no manifest entry, serves
 * the full-size file to every device, and the mobile LCP regresses to what it
 * was before the image pipeline existed.
 *
 * This converts whatever you give it (PNG, JPEG, WebP, HEIC) to the expected
 * JPEG, backs up the current hero, then regenerates every variant and the
 * manifest via the existing optimiser so there is one source of truth.
 */
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const TARGET = 'public/hero-backdrop.jpg';
/** Matches MAX_EDGE in scripts/optimize-images.mjs — the optimiser caps here anyway. */
const MAX_EDGE = 1600;
const QUALITY = 82;

const src = process.argv[2];
if (!src) {
  console.error('Usage: node scripts/set-hero.mjs <path-to-new-hero-image>');
  process.exit(1);
}
if (!fs.existsSync(src)) {
  console.error(`Not found: ${src}`);
  process.exit(1);
}

const meta = await sharp(src).metadata();
console.log(`Source: ${path.basename(src)} — ${meta.width}x${meta.height} ${meta.format}`);

if (meta.width < 1600) {
  console.warn(
    `\n⚠  Only ${meta.width}px wide. The hero is full-bleed (100vw); anything under 1600px\n` +
      `   will look soft on a desktop display. Continuing, but consider re-exporting larger.`
  );
}

// Keep the outgoing hero recoverable — this is the most visible image on the site.
if (fs.existsSync(TARGET)) {
  const backup = `public/hero-backdrop.previous.jpg`;
  fs.copyFileSync(TARGET, backup);
  console.log(`Backed up current hero → ${backup}`);
}

await sharp(src)
  .resize({ width: MAX_EDGE, withoutEnlargement: true })
  .jpeg({ quality: QUALITY, mozjpeg: true, progressive: true })
  .toFile(TARGET + '.tmp');

fs.renameSync(TARGET + '.tmp', TARGET);
const out = await sharp(TARGET).metadata();
const kb = (fs.statSync(TARGET).size / 1024).toFixed(0);
console.log(`Wrote ${TARGET} — ${out.width}x${out.height}, ${kb} KB`);

console.log('\nRegenerating responsive variants and the image manifest…');
execFileSync('node', ['scripts/optimize-images.mjs', '--write'], { stdio: 'inherit' });

console.log(
  '\nDone. Next: `rm -rf .next && npm run build` — the home page is on ISR, so a stale\n' +
    'prerender will keep serving the old hero until it is rebuilt.'
);
