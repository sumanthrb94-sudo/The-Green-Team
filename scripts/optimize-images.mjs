#!/usr/bin/env node
/**
 * Generates optimised WebP and compressed originals for every raster image
 * under /public that does NOT already have a matching .webp sibling.
 *
 * Run via:  node scripts/optimize-images.mjs
 * Or as:   npm run optimize-images   (called automatically on prebuild)
 *
 * Strategy:
 *   - PNG  → lossless WebP  + re-compressed PNG  (quality 85)
 *   - JPG  → lossy WebP    + re-compressed JPEG (quality 82)
 *   - JPEG → same as JPG
 *   Skips SVGs and files that already have a .webp twin.
 */

import sharp from 'sharp';
import { readdir, stat } from 'fs/promises';
import { join, extname, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC_DIR = join(__dirname, '..', 'public');

const JPEG_QUALITY = 82;
const PNG_QUALITY  = 85;
const WEBP_QUALITY = 80; // lossy WebP; lossless used for PNGs

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

async function processImage(filePath) {
  const ext = extname(filePath).toLowerCase();
  if (!['.jpg', '.jpeg', '.png'].includes(ext)) return;

  const webpPath = filePath.replace(/\.(jpg|jpeg|png)$/i, '.webp');

  // Check if WebP twin already exists
  try {
    await stat(webpPath);
    skipped++;
    return; // already done
  } catch {
    // doesn't exist — continue
  }

  const isPNG = ext === '.png';

  try {
    const src = sharp(filePath);

    // Generate WebP
    await src
      .clone()
      .webp(isPNG
        ? { lossless: true }
        : { quality: WEBP_QUALITY, effort: 4 })
      .toFile(webpPath);

    // Re-compress the original in-place
    const originalBuffer = isPNG
      ? await src.clone().png({ quality: PNG_QUALITY, compressionLevel: 8 }).toBuffer()
      : await src.clone().jpeg({ quality: JPEG_QUALITY, mozjpeg: true }).toBuffer();

    await sharp(originalBuffer).toFile(filePath);

    const rel = filePath.replace(PUBLIC_DIR, '');
    console.log(`✓  ${rel}  →  ${basename(webpPath)}`);
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
