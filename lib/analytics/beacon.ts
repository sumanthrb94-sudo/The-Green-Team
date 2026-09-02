/**
 * First-party analytics beacon.
 *
 * Why first-party at all, when GA4 and Clarity are already wired: both send
 * their data to someone else's dashboard. This pipeline keeps the numbers in
 * our own Firestore so they can be read straight into Admin → Analytics, and
 * so they survive an ad-blocker (roughly a third of traffic blocks
 * google-analytics.com outright, and property buyers research on desktop with
 * blockers on). The two are complements: GA4 for acquisition/ads attribution,
 * this for what actually happened on the page.
 *
 * Identity here is deliberately shallow — a random first-party id in
 * localStorage, no fingerprinting, no cross-site tracking, and the server
 * never stores a raw IP.
 */
import type { TrackPayload } from './types';

const VID_KEY = 'gt_vid';
const SID_KEY = 'gt_sid';
const SID_TS_KEY = 'gt_sid_ts';
/** A session ends after this long without activity — the usual analytics convention. */
const SESSION_IDLE_MS = 30 * 60 * 1000;

const rand = () =>
  typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID().replace(/-/g, '').slice(0, 20)
    : Math.random().toString(36).slice(2) + Date.now().toString(36);

/** Storage can throw (Safari private mode, cookies disabled) — never let it break the page. */
const read = (store: Storage, k: string): string | null => {
  try {
    return store.getItem(k);
  } catch {
    return null;
  }
};
const write = (store: Storage, k: string, v: string) => {
  try {
    store.setItem(k, v);
  } catch {
    /* analytics is never worth an exception */
  }
};

let freshVisitor = false;

export function visitorId(): string {
  if (typeof window === 'undefined') return '';
  let v = read(localStorage, VID_KEY);
  if (!v) {
    v = rand();
    freshVisitor = true;
    write(localStorage, VID_KEY, v);
  }
  return v;
}

/** True only for the first pageview of a brand-new visitor, then latches off. */
export function consumeNewVisitor(): boolean {
  const was = freshVisitor;
  freshVisitor = false;
  return was;
}

export function sessionId(): string {
  if (typeof window === 'undefined') return '';
  const now = Date.now();
  const last = Number(read(sessionStorage, SID_TS_KEY) ?? 0);
  let s = read(sessionStorage, SID_KEY);
  if (!s || !last || now - last > SESSION_IDLE_MS) s = rand();
  write(sessionStorage, SID_KEY, s);
  write(sessionStorage, SID_TS_KEY, String(now));
  return s;
}

/**
 * Deliver a payload. sendBeacon is used wherever available because it survives
 * the page being torn down — a normal fetch on `pagehide` is cancelled, which
 * is exactly when the most valuable record (time on page) is sent.
 */
export function send(payload: TrackPayload): void {
  if (typeof window === 'undefined') return;
  // Never record the operator's own admin browsing — self-traffic would
  // otherwise dominate the numbers on a site this size and make every report
  // useless. Checked here so no call site can forget.
  if (window.location.pathname.startsWith('/admin')) return;
  try {
    const body = JSON.stringify(payload);
    if (navigator.sendBeacon) {
      navigator.sendBeacon('/api/track', new Blob([body], { type: 'application/json' }));
      return;
    }
    void fetch('/api/track', {
      method: 'POST',
      body,
      headers: { 'Content-Type': 'application/json' },
      keepalive: true,
    }).catch(() => {});
  } catch {
    /* never surface an analytics failure to the visitor */
  }
}

/** Record a discrete interaction. Safe to call from anywhere, any time. */
export function sendEvent(
  name: string,
  opts: { path?: string; propertyId?: string; meta?: Record<string, string | number> } = {}
): void {
  if (typeof window === 'undefined') return;
  send({
    type: 'event',
    name,
    path: opts.path ?? window.location.pathname,
    sid: sessionId(),
    vid: visitorId(),
    propertyId: opts.propertyId,
    meta: opts.meta,
  });
}
