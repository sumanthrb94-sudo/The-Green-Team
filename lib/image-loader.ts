'use client';

import manifest from './image-manifest.json';

/**
 * Custom Next image loader.
 *
 * The platform image optimizer is unavailable on this plan (it returned 402),
 * so responsive sizes are pre-generated at build time by
 * `scripts/optimize-images.mjs` and this loader just points at the right one.
 * That gets real `srcset` behaviour — a phone downloads the 400px file instead
 * of the 1600px one — without depending on any optimizer at runtime.
 *
 * Anything not in the manifest (SVGs, remote URLs, images added without
 * re-running the script) passes straight through, so a missing variant is
 * never a broken image.
 */
const VARIANTS: Record<string, number[]> = manifest;

export default function imageLoader({ src, width }: { src: string; width: number; quality?: number }) {
  const sizes = VARIANTS[src];
  if (!sizes || sizes.length === 0) return src;

  // Smallest variant that still covers the requested width; if the request is
  // larger than every variant, fall back to the full-size original.
  const pick = sizes.find(w => w >= width);
  if (!pick) return src;

  return src.replace(/(\.[^.]+)$/, `-${pick}$1`);
}
