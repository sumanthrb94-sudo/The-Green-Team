'use client';

/**
 * Crossfading backdrop for the hero.
 *
 * Three stills of what the business actually sells — a house at the forest
 * edge, a planted tower, the view out from a balcony — cycling behind the
 * headline. Deliberately slow: this is a texture wash, not a carousel competing
 * for attention, and a fast or sliding transition behind live text reads as a
 * glitch rather than as motion.
 *
 * Each slide ships twice: a 16:9 landscape master and a 9:16 portrait
 * recomposition of the same scene. A phone gets the portrait one. That is art
 * direction, not a resize — a landscape frame cropped to a 390×844 viewport
 * throws away most of the photograph and keeps whichever sliver `object-position`
 * happened to point at.
 *
 * Which is why this is a hand-written `<picture>` rather than next/image.
 * next/image has no art-direction story: it emits a single `<img>`, so serving a
 * different *photograph* per breakpoint means rendering both and hiding one, and
 * a hidden image with `priority` is still preloaded. `<picture>` evaluates
 * `media` before it fetches anything, so exactly one file is ever downloaded.
 * Nothing is lost by dropping next/image here — on this plan its loader
 * (lib/image-loader.ts) only rewrites the path to a variant that
 * scripts/optimize-images.mjs already generated, which is what the `srcSet`
 * below does directly.
 *
 * Three things keep it from costing anything:
 *
 *   - only the first slide is eager; the other two are `loading="lazy"`, so
 *     nothing changes about first paint.
 *   - the timer never starts until the tab is visible, and stops when it is
 *     hidden, so a backgrounded tab is not decoding images nobody sees.
 *   - `prefers-reduced-motion` pins it to the first slide permanently. Someone
 *     who has asked the OS for less movement gets a still image, not a slower
 *     fade.
 */
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

export interface Slide {
  /** Landscape master, e.g. `/hero-villa.webp`. Variants are derived. */
  src: string;
  /** Portrait recomposition of the same scene, served below `PHONE`. */
  portraitSrc: string;
  /** Object position for the landscape crop on mid-width screens. */
  position?: string;
}

const HOLD_MS = 7000;
const FADE_MS = 2000;

/** Below this, the portrait photograph is the better frame. */
const PHONE = '(max-width: 767px)';

const LANDSCAPE_WIDTHS = [400, 800, 1200];
const PORTRAIT_WIDTHS = [400, 800, 1200];

/**
 * A portrait frame is ~3x the pixels of a landscape one at the same width, so
 * an honest `100vw` would have a phone at DPR 3 pull the 1200 file — 407 kB for
 * the villa, against 126 kB before. Declaring 60vw lands every current phone
 * width on the 800 file and the browser upscales. On a decorative photograph
 * sitting under an 85%-opacity wash and two gradients that is invisible, and it
 * keeps the mobile hero roughly where it already was rather than tripling it.
 */
const SIZES = `${PHONE} 60vw, 100vw`;

/** `/hero-villa.webp` + [400,800] -> "/hero-villa-400.webp 400w, /hero-villa-800.webp 800w" */
const srcSet = (src: string, widths: number[]) =>
  widths.map(w => `${src.replace(/(\.[^.]+)$/, `-${w}$1`)} ${w}w`).join(', ');

export function HeroBackdrop({ slides }: { slides: Slide[] }) {
  const reduce = useReducedMotion() ?? false;
  const [active, setActive] = useState(0);
  // Refs, not state: the timer is reset by visibility changes and must not
  // re-render the hero to do it.
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (reduce || slides.length < 2) return;

    const stop = () => {
      if (timer.current !== null) window.clearInterval(timer.current);
      timer.current = null;
    };
    const start = () => {
      stop();
      timer.current = window.setInterval(
        () => setActive(i => (i + 1) % slides.length),
        HOLD_MS + FADE_MS
      );
    };

    const onVisibility = () => (document.visibilityState === 'visible' ? start() : stop());
    onVisibility();
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      stop();
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [reduce, slides.length]);

  return (
    <div className="absolute inset-0 opacity-[0.85]" aria-hidden>
      {/* No <link rel="preload"> for the first slide: React keys image preloads
          by `href`, and a media-switched preload has only an imageSrcSet, so the
          links were dropped on the floor rather than hoisted — verified in the
          rendered <head>. It buys nothing here anyway. This markup is server
          rendered and sits at the top of the document, so the preload scanner
          finds the <picture> in the same pass it would have found a head
          preload. `fetchPriority` is what actually moves it up the queue. */}
      {slides.map((s, i) => (
        <picture key={s.src}>
          <source media={PHONE} srcSet={srcSet(s.portraitSrc, PORTRAIT_WIDTHS)} sizes="60vw" />
          <source srcSet={srcSet(s.src, LANDSCAPE_WIDTHS)} sizes="100vw" />
          <img
            src={s.src}
            alt=""
            sizes={SIZES}
            // Only the first is eager. The rest are decorative and arrive later.
            loading={i === 0 ? 'eager' : 'lazy'}
            fetchPriority={i === 0 ? 'high' : 'low'}
            decoding="async"
            className="absolute inset-0 w-full h-full object-cover transition-opacity ease-in-out"
            style={{
              // The portrait frames are composed to be seen whole, so they are
              // centred; only the landscape crop needs steering.
              objectPosition: s.position ?? 'center',
              opacity: i === active ? 1 : 0,
              transitionDuration: `${FADE_MS}ms`,
            }}
          />
        </picture>
      ))}

      {/* The left wash still has to carry white display type, so it stays
          almost solid there — but it eases off far sooner than it used to.
          At the old via-92 the backdrop was crushed to black everywhere the
          text was not, which made three images a very expensive way to render
          a dark rectangle. */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#0a1208] via-[#0a1208]/80 to-[#0a1208]/25" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a1208] via-transparent to-[#0a1208]/50" />
    </div>
  );
}
