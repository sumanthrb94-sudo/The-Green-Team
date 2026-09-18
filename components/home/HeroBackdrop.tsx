'use client';

/**
 * Crossfading backdrop for the hero.
 *
 * Three stills of what the business actually sells — a house at the forest
 * edge, planted balconies in the canopy, the view out from one — cycling behind
 * the headline. Deliberately slow: this is a texture wash at 50% opacity, not a
 * carousel competing for attention, and a fast or sliding transition behind
 * live text reads as a glitch rather than as motion.
 *
 * Three things keep it from costing anything:
 *
 *   - only the first slide is `priority`; it stays the LCP element and the
 *     other two are fetched lazily, so nothing changes about first paint.
 *   - the timer never starts until the tab is visible, and stops when it is
 *     hidden, so a backgrounded tab is not decoding images nobody sees.
 *   - `prefers-reduced-motion` pins it to the first slide permanently. Someone
 *     who has asked the OS for less movement gets a still image, not a slower
 *     fade.
 */
import Image from 'next/image';
import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'motion/react';

export interface Slide {
  src: string;
  /** Object position, so the subject survives the crop on a tall phone. */
  position?: string;
}

const HOLD_MS = 7000;
const FADE_MS = 2000;

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
      {slides.map((s, i) => (
        <Image
          key={s.src}
          src={s.src}
          alt=""
          fill
          // Only the first is eager. The rest are decorative and arrive later.
          priority={i === 0}
          loading={i === 0 ? undefined : 'lazy'}
          sizes="100vw"
          className="object-cover transition-opacity ease-in-out"
          style={{
            objectPosition: s.position ?? 'center',
            opacity: i === active ? 1 : 0,
            transitionDuration: `${FADE_MS}ms`,
          }}
        />
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
