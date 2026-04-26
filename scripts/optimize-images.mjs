#!/usr/bin/env node
/**
 * Generates optimised WebP and compressed originals for every raster image
 * under /public that does NOT already have a matching .webp sibling.
 *
 * Also generates 800w WebP variants ({name}-800w.webp) for images wider than
 * 800 px — used by the Pic component's srcset for responsive delivery.
 *
 * Strategy:
 *   - PNG  → lossless WebP  + re-compressed PNG  (quality 85)
 *   - JPG  → lossy WebP    + re-compressed JPEG (quality 82)
 *   Skips SVGs, logos, and files that already have all variants.
 */

import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

const JPEG_QUALITY  = 82;
const PNG_QUALITY   = 85;
const WEBP_QUALITY  = 80;
const SRCSET_WIDTH  = 800;

let optimized = 0;
let skipped   = 0;
let failed    = 0;

async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const paths = [];
  for (const e of entries) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      paths.push(...(await walk(full)));
    } else if (e.isFile()) {
      paths.push(full);
    }
  }
  return paths;
}

async function exists(p) {
  try { await stat(p); return true; } catch { return false; }
}

async function processImage(filePath) {
  const ext = extname(filePath).toLowerCase();
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) return;

  // Skip already-generated srcset variants
  if (/-800w\.webp$/.test(filePath)) return;

  const webpPath  = filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');
  const webp800   = filePath.replace(/\.(jpg|jpeg|png)$/i, '-800w.webp');
  const isPNG     = ext === '.png';

  const webpExists  = await exists(webpPath);
  const webp800Exists = await exists(webp800);

  if (webpExists && webp800Exists) { skipped++; return; }

  try {
    const src  = sharp(filePath);
    const meta = await src.metadata();
    const needsFull = !webpExists;
    const needs800  = !webp800Exists && (meta.width ?? 0) > SRCSET_WIDTH;

    if (!needsFull && !needs800) { skipped++; return; }

    if (needsFull) {
      await src.clone()
        .webp(isPNG ? { lossless: true } : { quality: WEBP_QUALITY, effort: 4 })
        .toFile(webpPath);

      // Re-compress original in-place
      const buf = isPNG
        ? await src.clone().png({ quality: PNG_QUALITY, compressionLevel: 8 }).toBuffer()
        : await src.clone().jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();
      await sharp(buf).toFile(filePath);
    }

    if (needs800) {
      await src.clone()
        .resize({ width: SRCSET_WIDTH, withoutEnlargement: true })
        .webp({ quality: WEBP_QUALITY, effort: 4 })
        .toFile(webp800);
    }

    const rel = filePath.replace(PUBLIC_DIR, '');
    const tags = [needsFull && basename(webpPath), needs800 && basename(webp800)]
      .filter(Boolean).join(', ');
    console.log(`✓  ${rel}  →  ${tags}`);
    optimized++;
  } catch (err) {
    console.error(`✗  ${filePath}: ${err.message}`);
    failed++;
  }
}

async function main() {
  console.log('🖼  Optimising images in /public …\n');
  const files = await walk(PUBLIC_DIR);
  await Promise.all(files.map(processImage));
  console.log(`\nDone — ${optimized} optimised, ${skipped} already had WebP, ${failed} failed.`);
}

main();
