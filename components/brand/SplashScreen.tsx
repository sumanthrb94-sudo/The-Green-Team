'use client';

/**
 * Launch splash — the brand mark assembling on the forest screen while the app
 * gets ready, then lifting into the landing page.
 *
 * Gating: it stays until the document has fully loaded AND the auth/backend
 * skeleton is ready (`authReady`), with a floor so the sequence completes and
 * a ceiling so it can never block if something hangs. Once per session: a hard
 * reload or a later visit in the same tab goes straight to the page.
 *
 * The animation is CSS keyframes (see globals.css, `gt-*`) rather than JS, so
 * it starts from the server-rendered HTML before React hydrates — which is
 * precisely the window it exists to cover. Reduced-motion users get a fade.
 */
import { useEffect, useRef, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/components/auth/AuthProvider';

const LEAF = 'M46 94 C39 72 27 58 34 40 C41 22 66 17 82 31 C95 43 90 64 72 74 C60 80 51 86 46 94 Z';
const KEY = 'gt_splash_seen';
const MIN_MS = 2400; // long enough for the sequence to land
const MAX_MS = 5000; // never hold the door longer than this

export function SplashScreen() {
  const pathname = usePathname();
  const { authReady } = useAuth();
  // Rendered visible by default so the SSR HTML carries it; the mount effect
  // decides whether this session has already seen it.
  const [state, setState] = useState<'showing' | 'leaving' | 'gone'>(pathname.startsWith('/admin') ? 'gone' : 'showing');
  const startedAt = useRef<number>(0);
  const done = useRef(false);

  useEffect(() => {
    if (state !== 'showing') return;
    try {
      if (sessionStorage.getItem(KEY)) {
        setState('gone');
        return;
      }
    } catch {}
    startedAt.current = performance.now();
    document.body.classList.add('modal-open');
    return () => document.body.classList.remove('modal-open');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (state !== 'showing' || !startedAt.current) return;
    const finish = () => {
      if (done.current) return;
      done.current = true;
      try {
        sessionStorage.setItem(KEY, '1');
      } catch {}
      setState('leaving');
      setTimeout(() => {
        document.body.classList.remove('modal-open');
        setState('gone');
      }, 700);
    };
    const check = () => {
      const elapsed = performance.now() - startedAt.current;
      const loaded = document.readyState === 'complete';
      if ((loaded && authReady && elapsed >= MIN_MS) || elapsed >= MAX_MS) finish();
    };
    check();
    const iv = setInterval(check, 100);
    window.addEventListener('load', check);
    return () => {
      clearInterval(iv);
      window.removeEventListener('load', check);
    };
  }, [state, authReady]);

  if (state === 'gone') return null;

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading The Green Team"
      className={`gt-splash fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-[#0a1208] text-white transition-all duration-700 ease-out ${
        state === 'leaving' ? 'opacity-0 scale-[1.03] pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* soft radial glow behind the mark */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden>
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[28rem] h-[28rem] rounded-full bg-[#a3b18a]/10 blur-3xl gt-glow" />
      </div>

      {/* the mark, assembling */}
      <div className="relative w-36 h-36 md:w-44 md:h-44 gt-breathe">
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" aria-hidden>
          <defs>
            <clipPath id="gt-splash-clip">
              <path d={LEAF} />
            </clipPath>
          </defs>
          {/* back leaf: settles in. The CSS animation transforms the OUTER group
              while the mirror/offset lives on the INNER group's attribute — a CSS
              transform on the same element would override the mirror and hide
              the leaf behind the front one. */}
          <g className="gt-back">
            <g transform="translate(8 -10) matrix(-1 0 0 1 100 0)">
              <path d={LEAF} fill="#faf9f6" />
            </g>
          </g>
          {/* front leaf: outline draws, then fills */}
          <path
            d={LEAF}
            pathLength={1}
            fill="none"
            stroke="#a3b18a"
            strokeWidth={1.6}
            strokeLinejoin="round"
            className="gt-draw"
          />
          <path d={LEAF} fill="#a3b18a" className="gt-fill" />
          <path clipPath="url(#gt-splash-clip)" d="M0 0 H60 C54 38 51 68 46 94 H0 Z" fill="#b9c6a4" className="gt-fill" />
        </svg>
      </div>

      {/* wordmark + the two lines */}
      <div className="mt-8 text-center px-6">
        <p className="gt-up font-headline font-extrabold tracking-[0.28em] text-[15px] md:text-base text-white" style={{ animationDelay: '1.3s' }}>
          THE GREEN TEAM
        </p>
        <p className="gt-up mt-5 text-sm md:text-base font-light text-white/70 leading-relaxed" style={{ animationDelay: '1.65s' }}>
          Curated forest-adjacent homes near Hyderabad.
        </p>
        <p className="gt-up mt-1 text-sm md:text-base font-light text-white/55 leading-relaxed" style={{ animationDelay: '1.9s' }}>
          Verified for air, quiet and title.
        </p>
      </div>

      {/* loading line */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-40 h-px bg-white/10 overflow-hidden" aria-hidden>
        <div className="gt-bar h-full w-1/3 bg-[#c8a951]" />
      </div>
    </div>
  );
}
