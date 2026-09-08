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
import { recordTouch } from '@/lib/analytics/attribution';
import { sessionRef, withRef } from '@/lib/analytics/ref';
import { onConsentChange } from '@/lib/consent';

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

    // Where this visit came from, banked before any internal navigation can
    // overwrite it with "Direct". Consent-gated inside recordTouch.
    recordTouch();
    // Mint the session reference now rather than on the first beacon. A visitor
    // can tap WhatsApp before any beacon has fired — on the home page that is
    // in fact the common case — and the code has to already exist for that tap
    // to be traceable. Consent-gated inside sessionRef, and re-run when consent
    // is granted, because the banner is answered after this effect has mounted.
    sessionRef();
    const stopWatchingConsent = onConsentChange(() => {
      recordTouch();
      sessionRef();
    });

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
      stopWatchingConsent();
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
 * Section-level attention — where on a page a visitor actually stops.
 *
 * Scroll depth alone cannot answer that: a visit that reached 90% might have
 * flicked past everything, and a visit that stopped at 40% might have spent two
 * minutes on the price panel. So each `<section id="…">` is watched by an
 * IntersectionObserver and accrues time only while it is genuinely on screen —
 * more than half visible, tab in the foreground, visitor not idle. On exit the
 * accrued sections are reported as one small event each.
 *
 * This is a first-party heatmap of dwell rather than of mouse position. Mouse
 * heatmaps are the famous kind and they are close to useless on a site where
 * most traffic is a phone: there is no cursor to record. Where the eye stopped
 * on a scroll is what there is to measure, and it is the thing that decides
 * what belongs above the fold.
 */
const SECTION_MIN_MS = 1000; // below this it was scrolled past, not read

function SectionTracker({ pathname }: { pathname: string }) {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined') return;

    const dwell = new Map<string, number>();
    const visibleSince = new Map<string, number>();
    let lastActivity = Date.now();
    const markActive = () => {
      lastActivity = Date.now();
    };

    const engaged = () =>
      document.visibilityState === 'visible' && Date.now() - lastActivity < IDLE_MS;

    const close = (id: string, now: number) => {
      const since = visibleSince.get(id);
      if (since === undefined) return;
      visibleSince.delete(id);
      if (engaged()) dwell.set(id, (dwell.get(id) ?? 0) + (now - since));
    };

    const observer = new IntersectionObserver(
      entries => {
        const now = Date.now();
        for (const entry of entries) {
          const id = entry.target.id;
          if (!id) continue;
          if (entry.isIntersecting) {
            if (!visibleSince.has(id)) visibleSince.set(id, now);
          } else {
            close(id, now);
          }
        }
      },
      // "Overlaps the middle third of the screen", not "is 50% visible".
      //
      // A visible-fraction threshold is the obvious choice and it is wrong
      // here: a section taller than the viewport can never be 50% visible, so
      // on a phone the tallest and most important sections would record zero
      // dwell forever while short ones looked hot. Shrinking the root to a
      // central band and firing at any overlap measures the same idea — is
      // this what they are looking at — independently of section height.
      { rootMargin: '-35% 0px -35% 0px', threshold: 0 }
    );

    // Deferred a frame so the section elements of the new route exist.
    const attach = window.setTimeout(() => {
      document.querySelectorAll<HTMLElement>('section[id], [data-section]').forEach(el => {
        if (el.id || el.dataset.section) observer.observe(el);
      });
    }, 0);

    let flushed = false;
    const flush = () => {
      if (flushed) return;
      flushed = true;
      const now = Date.now();
      for (const id of [...visibleSince.keys()]) close(id, now);
      for (const [id, ms] of dwell) {
        if (ms < SECTION_MIN_MS) continue;
        sendEvent('section_dwell', {
          path: pathname,
          meta: { s: id.slice(0, 40), ms: Math.round(ms) },
        });
      }
    };

    const activityEvents = ['mousemove', 'keydown', 'pointerdown', 'touchstart', 'scroll'] as const;
    activityEvents.forEach(e => window.addEventListener(e, markActive, { passive: true }));
    window.addEventListener('pagehide', flush);

    return () => {
      flush();
      window.clearTimeout(attach);
      observer.disconnect();
      activityEvents.forEach(e => window.removeEventListener(e, markActive));
      window.removeEventListener('pagehide', flush);
    };
  }, [pathname]);

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
        // Carry the session reference into the message the visitor is about to
        // send. Done here, at the document level, rather than at each of the
        // dozen WHATSAPP.* call sites — one place to get right, and it covers
        // the links Groot renders at runtime too.
        //
        // Rewriting el.href inside a listener is safe: the browser reads the
        // attribute when it performs the default navigation, which happens
        // after every listener has run. No preventDefault, so a middle-click or
        // a long-press-copy still gets the same, correct URL.
        const ref = sessionRef();
        if (ref && el instanceof HTMLAnchorElement) {
          const withCode = withRef(href, ref);
          if (withCode !== href) el.href = withCode;
        }
        sendEvent('whatsapp_click', {
          meta: { href: href.slice(0, 120), ...(ref ? { ref } : {}) },
        });
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

function Trackers() {
  const pathname = usePathname();
  return (
    <>
      <Tracker />
      <SectionTracker pathname={pathname} />
      <ClickTracker />
    </>
  );
}

export function PageTracker() {
  // useSearchParams requires a Suspense boundary or it opts the tree into CSR.
  return (
    <Suspense fallback={null}>
      <Trackers />
    </Suspense>
  );
}
