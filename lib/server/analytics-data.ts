import 'server-only';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/server/session';
import type { DeviceKind } from '@/lib/analytics/types';

/**
 * Read models for Admin → Analytics.
 *
 * requireAdmin() runs first, at the data source, for the same reason it does in
 * admin-data.ts: a layout auth check does not stop a concurrently-rendered page
 * from fetching, and this data describes real people's visits.
 *
 * Aggregation happens in memory rather than via Firestore aggregation queries
 * because the range query needs only the automatic single-field index on `at`.
 * Adding `where('bot','==',false)` would require a composite index the operator
 * has to create by hand before the tab works at all — bots are filtered here
 * instead. At this site's traffic that is far cheaper than the ceremony; the
 * READ_CAP below is the guard if that ever stops being true.
 */

const READ_CAP = 50_000;

/**
 * Short-lived result cache.
 *
 * The dashboard reads every event in the window to aggregate, so a refresh, a
 * range toggle and a tab switch would each re-read the whole range — the one
 * genuinely expensive thing about this design. 60s of caching removes almost
 * all of that without making the numbers feel stale (the live counter is a
 * 5-minute window anyway).
 *
 * Safe to hold in module scope only because requireAdmin() is awaited *before*
 * the cache is ever consulted: a non-admin can never reach a cached read.
 */
const CACHE_TTL_MS = 60_000;
const cache = new Map<number, { at: number; data: AnalyticsSummary }>();

export interface Row {
  key: string;
  views: number;
  visitors: number;
  /** Mean engaged ms per pageview. Only meaningful on page rows. */
  avgEngagedMs?: number;
  avgScrollPct?: number;
}

export interface AnalyticsSummary {
  rangeDays: number;
  from: string;
  to: string;
  /** True when nothing has been recorded yet — the UI shows setup guidance. */
  empty: boolean;

  visitors: number;
  newVisitors: number;
  sessions: number;
  pageviews: number;
  /** Mean engaged seconds per pageview. */
  avgEngagedSec: number;
  /** Mean engaged seconds per session. */
  avgSessionSec: number;
  /** Share of sessions with exactly one pageview, 0-100. */
  bounceRate: number;
  pagesPerSession: number;

  /** Same metrics for the preceding equal-length window, for trend arrows. */
  prev: { visitors: number; sessions: number; pageviews: number; conversions: number };

  daily: { day: string; visitors: number; pageviews: number; conversions: number }[];
  topPages: Row[];
  channels: Row[];
  referrers: Row[];
  countries: Row[];
  cities: Row[];
  devices: Row[];
  browsers: Row[];
  os: Row[];
  campaigns: Row[];
  /** Event name → count, conversions first. */
  events: { name: string; count: number; visitors: number }[];
  /** Property page attention, richest signal for this business. */
  properties: Row[];
  funnel: { step: string; count: number; pct: number }[];
  /** Distinct visitors seen in the last 5 minutes. */
  liveVisitors: number;
  /** Most recent activity, newest first. */
  recent: { at: string; path: string; name: string; city: string; country: string; device: string; channel: string }[];
}

interface Ev {
  type: string;
  name: string;
  path: string;
  referrer: string;
  channel: string;
  utmCampaign?: string;
  engagedMs: number;
  scrollPct: number;
  sid: string;
  vid: string;
  newVisitor: boolean;
  device: DeviceKind;
  browser: string;
  os: string;
  country: string;
  region: string;
  city: string;
  propertyId?: string;
  bot: boolean;
  at: Date;
}

/** Count views and distinct visitors per key, optionally averaging engagement. */
function tally(
  events: Ev[],
  keyOf: (e: Ev) => string | undefined,
  opts: { engagement?: boolean; limit?: number } = {}
): Row[] {
  const acc = new Map<string, { views: number; vids: Set<string>; ms: number; scroll: number; n: number }>();
  for (const e of events) {
    const k = keyOf(e);
    if (!k) continue;
    let a = acc.get(k);
    if (!a) acc.set(k, (a = { views: 0, vids: new Set(), ms: 0, scroll: 0, n: 0 }));
    a.views++;
    a.vids.add(e.vid);
    if (opts.engagement && e.type === 'pageview') {
      a.ms += e.engagedMs;
      a.scroll += e.scrollPct;
      a.n++;
    }
  }
  return [...acc.entries()]
    .map(([key, a]) => ({
      key,
      views: a.views,
      visitors: a.vids.size,
      ...(opts.engagement
        ? {
            avgEngagedMs: a.n ? Math.round(a.ms / a.n) : 0,
            avgScrollPct: a.n ? Math.round(a.scroll / a.n) : 0,
          }
        : {}),
    }))
    .sort((x, y) => y.views - x.views)
    .slice(0, opts.limit ?? 12);
}

const dayKey = (d: Date) => d.toISOString().slice(0, 10);

async function loadRange(from: Date, to: Date): Promise<Ev[]> {
  const snap = await adminDb()
    .collection('analytics_events')
    .where('at', '>=', Timestamp.fromDate(from))
    .where('at', '<', Timestamp.fromDate(to))
    .orderBy('at', 'desc')
    .limit(READ_CAP)
    .get();

  return snap.docs.map(d => {
    const x = d.data();
    return {
      type: String(x.type ?? 'pageview'),
      name: String(x.name ?? 'pageview'),
      path: String(x.path ?? '/'),
      referrer: String(x.referrer ?? 'direct'),
      channel: String(x.channel ?? 'Direct'),
      utmCampaign: x.utmCampaign ? String(x.utmCampaign) : undefined,
      engagedMs: Number(x.engagedMs ?? 0),
      scrollPct: Number(x.scrollPct ?? 0),
      sid: String(x.sid ?? ''),
      vid: String(x.vid ?? ''),
      newVisitor: x.newVisitor === true,
      device: (x.device ?? 'desktop') as DeviceKind,
      browser: String(x.browser ?? 'Other'),
      os: String(x.os ?? 'Other'),
      country: String(x.country ?? 'Unknown'),
      region: String(x.region ?? 'Unknown'),
      city: String(x.city ?? 'Unknown'),
      propertyId: x.propertyId ? String(x.propertyId) : undefined,
      bot: x.bot === true,
      at: x.at?.toDate?.() ?? new Date(0),
    };
  });
}

/** Conversion steps in funnel order, widest first. */
const FUNNEL: { step: string; match: (e: Ev) => boolean }[] = [
  { step: 'Visited the site', match: e => e.type === 'pageview' },
  { step: 'Viewed a property', match: e => e.path.startsWith('/sanctuaries/') },
  { step: 'Engaged (chat or WhatsApp)', match: e => e.name === 'chat_open' || e.name === 'whatsapp_click' },
  { step: 'Submitted a lead', match: e => e.name === 'generate_lead' || e.name === 'site_visit' },
];

export async function getAnalytics(rangeDays = 30): Promise<AnalyticsSummary> {
  await requireAdmin();

  const days = Math.min(365, Math.max(1, Math.round(rangeDays)));

  const hit = cache.get(days);
  if (hit && Date.now() - hit.at < CACHE_TTL_MS) return hit.data;

  const to = new Date();
  const from = new Date(to.getTime() - days * 86_400_000);
  const prevFrom = new Date(from.getTime() - days * 86_400_000);

  const [rawCurrent, rawPrev] = await Promise.all([loadRange(from, to), loadRange(prevFrom, from)]);
  const events = rawCurrent.filter(e => !e.bot);
  const prevEvents = rawPrev.filter(e => !e.bot);

  const pageviews = events.filter(e => e.type === 'pageview');
  const visitors = new Set(events.map(e => e.vid));
  const sessions = new Set(events.map(e => e.sid));

  // Per-session rollup for bounce rate and session duration.
  const perSession = new Map<string, { views: number; ms: number }>();
  for (const e of pageviews) {
    let s = perSession.get(e.sid);
    if (!s) perSession.set(e.sid, (s = { views: 0, ms: 0 }));
    s.views++;
    s.ms += e.engagedMs;
  }
  const sessionList = [...perSession.values()];
  const bounced = sessionList.filter(s => s.views <= 1).length;

  const totalEngaged = pageviews.reduce((n, e) => n + e.engagedMs, 0);

  // Daily series, zero-filled so the chart shows quiet days honestly.
  const byDay = new Map<string, { vids: Set<string>; views: number; conversions: number }>();
  for (let i = 0; i < days; i++) {
    byDay.set(dayKey(new Date(from.getTime() + i * 86_400_000)), {
      vids: new Set(),
      views: 0,
      conversions: 0,
    });
  }
  const isConversion = (e: Ev) =>
    e.name === 'generate_lead' || e.name === 'site_visit' || e.name === 'sign_up';
  for (const e of events) {
    const slot = byDay.get(dayKey(e.at));
    if (!slot) continue;
    slot.vids.add(e.vid);
    if (e.type === 'pageview') slot.views++;
    if (isConversion(e)) slot.conversions++;
  }

  // Event roll-up.
  const evAcc = new Map<string, { count: number; vids: Set<string> }>();
  for (const e of events) {
    if (e.type !== 'event') continue;
    let a = evAcc.get(e.name);
    if (!a) evAcc.set(e.name, (a = { count: 0, vids: new Set() }));
    a.count++;
    a.vids.add(e.vid);
  }

  // Funnel counted in visitors, not hits — one person clicking WhatsApp five
  // times is one interested buyer, not five.
  const funnelCounts = FUNNEL.map(f => ({
    step: f.step,
    count: new Set(events.filter(f.match).map(e => e.vid)).size,
  }));
  const funnelTop = funnelCounts[0]?.count || 0;

  const liveCutoff = Date.now() - 5 * 60 * 1000;
  const propertyOf = (e: Ev) =>
    e.propertyId ?? (e.path.startsWith('/sanctuaries/') ? e.path.split('/')[2] : undefined);

  const summary: AnalyticsSummary = {
    rangeDays: days,
    from: from.toISOString(),
    to: to.toISOString(),
    empty: events.length === 0 && prevEvents.length === 0,

    visitors: visitors.size,
    newVisitors: new Set(events.filter(e => e.newVisitor).map(e => e.vid)).size,
    sessions: sessions.size,
    pageviews: pageviews.length,
    avgEngagedSec: pageviews.length ? Math.round(totalEngaged / pageviews.length / 1000) : 0,
    avgSessionSec: sessionList.length
      ? Math.round(sessionList.reduce((n, s) => n + s.ms, 0) / sessionList.length / 1000)
      : 0,
    bounceRate: sessionList.length ? Math.round((bounced / sessionList.length) * 100) : 0,
    pagesPerSession: sessionList.length
      ? Math.round((pageviews.length / sessionList.length) * 10) / 10
      : 0,

    prev: {
      visitors: new Set(prevEvents.map(e => e.vid)).size,
      sessions: new Set(prevEvents.map(e => e.sid)).size,
      pageviews: prevEvents.filter(e => e.type === 'pageview').length,
      conversions: prevEvents.filter(isConversion).length,
    },

    daily: [...byDay.entries()].map(([day, v]) => ({
      day,
      visitors: v.vids.size,
      pageviews: v.views,
      conversions: v.conversions,
    })),

    topPages: tally(pageviews, e => e.path, { engagement: true, limit: 15 }),
    channels: tally(events, e => e.channel, { limit: 10 }),
    referrers: tally(events, e => (e.referrer === 'direct' ? undefined : e.referrer), { limit: 10 }),
    countries: tally(events, e => e.country, { limit: 10 }),
    cities: tally(events, e => (e.city === 'Unknown' ? undefined : e.city), { limit: 12 }),
    devices: tally(events, e => e.device, { limit: 5 }),
    browsers: tally(events, e => e.browser, { limit: 8 }),
    os: tally(events, e => e.os, { limit: 8 }),
    campaigns: tally(events, e => e.utmCampaign, { limit: 10 }),

    events: [...evAcc.entries()]
      .map(([name, a]) => ({ name, count: a.count, visitors: a.vids.size }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15),

    properties: tally(pageviews, propertyOf, { engagement: true, limit: 10 }),

    funnel: funnelCounts.map(f => ({
      ...f,
      pct: funnelTop ? Math.round((f.count / funnelTop) * 100) : 0,
    })),

    liveVisitors: new Set(events.filter(e => e.at.getTime() > liveCutoff).map(e => e.vid)).size,

    recent: events.slice(0, 40).map(e => ({
      at: e.at.toISOString(),
      path: e.path,
      name: e.type === 'pageview' ? 'pageview' : e.name,
      city: e.city,
      country: e.country,
      device: e.device,
      channel: e.channel,
    })),
  };

  cache.set(days, { at: Date.now(), data: summary });
  return summary;
}
