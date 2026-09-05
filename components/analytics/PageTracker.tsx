'use client';

/**
 * Measures each page visit and ships it once, on exit.
 *
 * "Time on page" here is *engaged* time: the clock only runs while the tab is
 * visible AND the visitor has interacted within the last IDLE_MS. Wall-clock
 * time on page is the number most tools quote and it is close to meaningless —
 * a tab left open overnight would read as an eight-hour visit. Engaged seconds
 * are what tell you whether someone actually read the Agartha page.
 *
 * The record is sent on pagehide/visibility-hidden via sendBeacon so it
 * survives the page being destroyed, and on route change so App Router
 * navigations (which never unload the document) still close out the visit.
 */
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useRef } from 'react';
import { consumeNewVisitor, send, sendEvent, sessionId, visitorId } from '@/lib/analytics/beacon';

/** Activity older than this stops the engagement clock. */
const IDLE_MS = 30_000;
/** Visits shorter than this are almost always bounces/prefetch noise. */
const MIN_REPORT_MS = 300;

function Tracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  // Refs, not state: these mutate on every scroll/mousemove and must never
  // trigger a re-render of the app shell.
  const engagedMs = useRef(0);
  const lastTick = useRef<number>(Date.now());
  const lastActivity = useRef<number>(Date.now());
  const maxScroll = useRef(0);
  const sent = useRef(false);
  const startedAt = useRef<number>(Date.now());

  useEffect(() => {
    // Reset for the new page.
    engagedMs.current = 0;
    lastTick.current = Date.now();
    lastActivity.current = Date.now();
    maxScroll.current = 0;
    sent.current = false;
    startedAt.current = Date.now();

    const path = searchParams?.toString() ? `${pathname}?${searchParams}` : pathname;

    const accrue = () => {
      const now = Date.now();
      const active = now - lastActivity.current < IDLE_MS;
      if (document.visibilityState === 'visible' && active) {
        engagedMs.current += now - lastTick.current;
      }
      lastTick.current = now;
    };

    const markActive = () => {
      lastActivity.current = Date.now();
    };

    const trackScroll = () => {
      markActive();
      const doc = document.documentElement;
      const scrollable = doc.scrollHeight - window.innerHeight;
      const pct = scrollable > 0 ? Math.round((window.scrollY / scrollable) * 100) : 100;
      if (pct > maxScroll.current) maxScroll.current = Math.min(100, Math.max(0, pct));
    };

    const flush = () => {
      accrue();
      if (sent.current) return;
      // Guard against double-send: pagehide and visibilitychange both fire on
      // mobile backgrounding, and each would otherwise write a record.
      if (Date.now() - startedAt.current < MIN_REPORT_MS) return;
      sent.current = true;
      send({
        type: 'pageview',
        path,
        title: document.title,
        referrer: document.referrer || undefined,
        engagedMs: Math.round(engagedMs.current),
        scrollPct: maxScroll.current,
        sid: sessionId(),
        vid: visitorId(),
        newVisitor: consumeNewVisitor(),
        vw: window.innerWidth,
      });
    };

    const onVisibility = () => {
      accrue();
      if (document.visibilityState === 'hidden') flush();
    };

    // A ticker keeps the accumulator honest even if the visitor never fires
    // another event — without it, engaged time would only update on activity.
    const ticker = window.setInterval(accrue, 5000);

    const activityEvents = ['mousemove', 'keydown', 'pointerdown', 'touchstart'] as const;
    activityEvents.forEach(e => window.addEventListener(e, markActive, { passive: true }));
    window.addEventListener('scroll', trackScroll, { passive: true });
    document.addEventListener('visibilitychange', onVisibility);
    window.addEventListener('pagehide', flush);

    return () => {
      flush(); // route change: close out the visit we're leaving
      window.clearInterval(ticker);
      activityEvents.forEach(e => window.removeEventListener(e, markActive));
      window.removeEventListener('scroll', trackScroll);
      document.removeEventListener('visibilitychange', onVisibility);
      window.removeEventListener('pagehide', flush);
    };
  }, [pathname, searchParams]);

  return null;
}

/**
 * Outbound and intent clicks, captured by delegation rather than by editing
 * every button. A WhatsApp tap is the strongest intent signal on this site and
 * it leaves the page, so it has to be caught at the document level.
 */
function ClickTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const el = (e.target as HTMLElement | null)?.closest<HTMLElement>('a[href], [data-track]');
      if (!el) return;

      const custom = el.dataset.track;
      if (custom) {
        sendEvent(custom, { propertyId: el.dataset.trackProperty, meta: el.dataset.trackMeta ? { v: el.dataset.trackMeta } : undefined });
        return;
      }

      const href = el.getAttribute('href') ?? '';
      if (!href) return;

      if (href.includes('wa.me') || href.includes('whatsapp.com')) {
        sendEvent('whatsapp_click', { meta: { href: href.slice(0, 120) } });
      } else if (href.startsWith('tel:')) {
        sendEvent('phone_click');
      } else if (href.startsWith('mailto:')) {
        sendEvent('email_click');
      } else if (/^https?:\/\//i.test(href) && !href.includes(window.location.host)) {
        let host = '';
        try {
          host = new URL(href).host;
        } catch {
          /* malformed href — record the click without a host */
        }
        sendEvent('outbound_click', { meta: { host } });
      }
    };

    document.addEventListener('click', onClick, { capture: true, passive: true });
    return () => document.removeEventListener('click', onClick, { capture: true });
  }, []);

  return null;
}

export function PageTracker() {
  // useSearchParams requires a Suspense boundary or it opts the tree into CSR.
  return (
    <Suspense fallback={null}>
      <Tracker />
      <ClickTracker />
    </Suspense>
  );
}
