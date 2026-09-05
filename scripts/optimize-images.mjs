/**
 * Compress everything under public/ in place, and emit responsive variants.
 *
 *   node scripts/optimize-images.mjs          # report only, changes nothing
 *   node scripts/optimize-images.mjs --write  # rewrite files + variants + manifest
 *
 * Why this exists rather than Next's optimizer: `next.config.ts` cannot use the
 * platform image optimizer (it was returning 402 on the production plan), so
 * whatever sits in public/ is exactly what ships to a phone. Without variants a
 * 1600px render is downloaded into a 224px card — measured, not theorised.
 *
 * So each image gets:
 *   foo.webp        the full-size file, recompressed in place (path unchanged,
 *                   so every existing reference keeps working)
 *   foo-400.webp    responsive variants beside it
 *   foo-800.webp
 *   foo-1200.webp
 *
 * plus `lib/image-manifest.json`, listing which paths have variants. The custom
 * loader in `lib/image-loader.ts` reads that manifest, so an image that was
 * never processed passes through untouched instead of 404-ing on a guess.
 */
import sharp from 'sharp';
import fs from 'node:fs';
import path from 'node:path';

const WRITE = process.argv.includes('--write');
const ROOT = 'public';
const MANIFEST = 'lib/image-manifest.json';

// 1600 is past 2x a phone's logical width, which is where every photo here is
// actually consumed. Site plans keep more because people pinch into the fine
// linework; logos need far less than either.
const MAX_EDGE = 1600;
const MAX_EDGE_PLAN = 1920;
const MAX_EDGE_LOGO = 900;

/** Variant widths. A 390pt phone at 3x asks for ~1170, so 1200 is the realistic top end. */
const VARIANTS = [400, 800, 1200];

const isLogo = p => /(^|\/)(logos?|favicon|icon)(\/|-)/i.test(p);
const isPlan = p => /(layout|site-?plan|render)/i.test(p);
const capFor = p => (isLogo(p) ? MAX_EDGE_LOGO : isPlan(p) ? MAX_EDGE_PLAN : MAX_EDGE);
/** Don't recurse into variants we generated on a previous run. */
const isVariant = p => VARIANTS.some(w => p.includes(`-${w}.`));

function walk(dir) {
  let out = [];
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) out = out.concat(walk(p));
    else if (/\.(jpe?g|png|webp)$/i.test(e.name) && !isVariant(p)) out.push(p);
  }
  return out;
}

/** Encode a pipeline to the same format as the source, at the right quality. */
function encode(pipe, ext) {
  if (ext === '.png') return pipe.png({ compressionLevel: 9, palette: true, quality: 82, effort: 9 });
  if (ext === '.webp') return pipe.webp({ quality: 74, effort: 6 });
  return pipe.jpeg({ quality: 76, mozjpeg: true, progressive: true });
}

const files = walk(ROOT);
let totalBefore = 0;
let totalAfter = 0;
let variantBytes = 0;
let rewritten = 0;
let variantCount = 0;
const rows = [];
const manifest = {};

for (const file of files) {
  const before = fs.statSync(file).size;
  const ext = path.extname(file).toLowerCase();
  totalBefore += before;

  try {
    const meta = await sharp(file).metadata();
    const cap = capFor(file);
    const longest = Math.max(meta.width ?? 0, meta.height ?? 0);

    // --- the full-size file, in place ---
    let base = sharp(file, { animated: ext === '.webp' });
    if (longest > cap) {
      base = base.resize({ width: cap, height: cap, fit: 'inside', withoutEnlargement: true });
    }
    let buf;
    if (ext === '.png') {
      // Flat graphics palette down hard; photos saved as PNG do not. Try both.
      const [pal, deep] = await Promise.all([
        encode(base.clone(), ext).toBuffer(),
        base.clone().png({ compressionLevel: 9, palette: false, effort: 9 }).toBuffer(),
      ]);
      buf = pal.length <= deep.length ? pal : deep;
    } else {
      buf = await encode(base.clone(), ext).toBuffer();
    }

    // Only rewrite on a real win — a 1% gain is just git churn.
    const keep = buf.length < before * 0.97;
    const after = keep ? buf.length : before;
    totalAfter += after;
    if (keep) {
      rewritten++;
      rows.push({ f: file, before, after, dims: [meta.width, meta.height], cap });
      if (WRITE) fs.writeFileSync(file, buf);
    }

    // --- responsive variants ---
    // Logos are already tiny and never rendered at multiple sizes; skip them.
    const finalWidth = Math.min(meta.width ?? 0, longest > cap ? cap : meta.width ?? 0);
    if (!isLogo(file)) {
      const made = [];
      for (const w of VARIANTS) {
        // Never upscale: a variant wider than the source is wasted bytes.
        if (w >= finalWidth) continue;
        const out = file.replace(/(\.[^.]+)$/, `-${w}$1`);
        const vbuf = await encode(
          sharp(file, { animated: ext === '.webp' }).resize({ width: w, withoutEnlargement: true }),
          ext
        ).toBuffer();
        variantBytes += vbuf.length;
        variantCount++;
        made.push(w);
        if (WRITE) fs.writeFileSync(out, vbuf);
      }
      if (made.length) manifest['/' + path.relative(ROOT, file).split(path.sep).join('/')] = made;
    }
  } catch (err) {
    console.error(`skip ${file}: ${err.message}`);
    totalAfter += before;
  }
}

if (WRITE) {
  fs.mkdirSync(path.dirname(MANIFEST), { recursive: true });
  fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
}

rows.sort((a, b) => b.before - b.after - (a.before - a.after));
const mb = n => (n / 1048576).toFixed(2);
const kb = n => Math.round(n / 1024);

console.log(`\n${WRITE ? 'REWROTE' : 'WOULD REWRITE'} ${rewritten} of ${files.length} files`);
console.log(`${WRITE ? 'wrote' : 'would write'} ${variantCount} responsive variants (${mb(variantBytes)} MB)\n`);
console.log('biggest savings on the full-size files:');
for (const r of rows.slice(0, 10)) {
  const pct = Math.round((1 - r.after / r.before) * 100);
  console.log(
    `  ${String(kb(r.before)).padStart(5)}KB → ${String(kb(r.after)).padStart(5)}KB  (-${String(pct).padStart(2)}%)  ${r.dims[0]}x${r.dims[1]}  ${r.f}`
  );
}
console.log(
  `\nfull-size total: ${mb(totalBefore)} MB → ${mb(totalAfter)} MB  (-${Math.round((1 - totalAfter / totalBefore) * 100)}%)`
);
console.log(`manifest: ${Object.keys(manifest).length} images have variants`);
if (!WRITE) console.log('\n(dry run — pass --write to apply)');
