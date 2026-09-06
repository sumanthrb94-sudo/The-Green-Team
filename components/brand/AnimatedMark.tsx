/**
 * The two-leaf mark, assembling — back leaf settles, front leaf's outline draws
 * itself, then the fill lands.
 *
 * Lifted out of SplashScreen so the launch animation and the sign-in screen are
 * the same mark drawn by the same keyframes, rather than two drawings that drift
 * apart. Colours are props because it runs on the dark launch canvas and on the
 * light auth sheet.
 *
 * The animation is plain CSS (`.gt-splash` in globals.css), so it plays from the
 * server HTML before hydration and respects prefers-reduced-motion for free.
 */
export const LEAF = 'M46 94 C39 72 27 58 34 40 C41 22 66 17 82 31 C95 43 90 64 72 74 C60 80 51 86 46 94 Z';

export function AnimatedMark({
  id,
  className = '',
  back = '#faf9f6',
  front = '#a3b18a',
  highlight = '#b9c6a4',
  breathe = true,
}: {
  /** Unique per instance — two clipPaths sharing an id would collide. */
  id: string;
  className?: string;
  back?: string;
  front?: string;
  highlight?: string;
  breathe?: boolean;
}) {
  return (
    <div className={`gt-splash ${className}`}>
      <div className={`relative w-full h-full ${breathe ? 'gt-breathe' : ''}`}>
        <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible" aria-hidden>
          <defs>
            <clipPath id={`${id}-clip`}>
              <path d={LEAF} />
            </clipPath>
          </defs>
          {/* Back leaf. The CSS animation transforms the OUTER group while the
              mirror/offset lives on the INNER group's attribute — a CSS
              transform on the same element would override the mirror and hide
              this leaf behind the front one. */}
          <g className="gt-back">
            <g transform="translate(8 -10) matrix(-1 0 0 1 100 0)">
              <path d={LEAF} fill={back} />
            </g>
          </g>
          {/* Front leaf: outline draws, then fills. */}
          <path d={LEAF} pathLength={1} fill="none" stroke={front} strokeWidth={1.6} strokeLinejoin="round" className="gt-draw" />
          <path d={LEAF} fill={front} className="gt-fill" />
          <path clipPath={`url(#${id}-clip)`} d="M0 0 H60 C54 38 51 68 46 94 H0 Z" fill={highlight} className="gt-fill" />
        </svg>
      </div>
    </div>
  );
}
