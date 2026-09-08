import 'server-only';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/server/session';
import { isRef } from '@/lib/analytics/ref';
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

/**
 * One person, as far as this site can tell.
 *
 * `vid` is a random first-party id, not an identity. `uid` is only present when
 * the visitor was signed in at the time, and it is the thing that turns
 * "someone looked at Agartha four times" into "this member did" — which is the
 * difference between a statistic and a call worth making.
 */
export interface VisitorRow {
  vid: string;
  uid?: string;
  /** ISO. Full timestamps, year included — a returning buyer is the signal. */
  firstSeen: string;
  lastSeen: string;
  sessions: number;
  pageviews: number;
  engagedSec: number;
  city: string;
  country: string;
  device: string;
  channel: string;
  /** Most-viewed property, when there is one. */
  focus?: string;
  /** Conversion events this visitor fired, e.g. ['whatsapp_click']. */
  did: string[];
  /** Latest session reference, for the trace lookup. */
  ref?: string;
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
  /**
   * The pricing gate, counted in people. This is the sharpest funnel on the
   * site — everything above it is interest, and this is the step where interest
   * either becomes a contactable member or walks away — so it is reported
   * separately rather than being averaged into the buyer funnel.
   */
  gate: { views: number; signInClicks: number; unlocked: number };
  /**
   * Where on a page people actually stop. Two independent measures, because
   * each lies on its own: scroll depth says how far down they got but not
   * whether they read anything, and section dwell says where the time went but
   * not whether they ever reached the bottom.
   */
  attention: {
    path: string;
    samples: number;
    /** Share of visits reaching each quarter of the page, 0-100. */
    depth: [number, number, number, number];
    /** Named sections by mean engaged seconds, hottest first. */
    sections: { id: string; avgSec: number; samples: number }[];
  }[];
  /**
   * The visitor list behind every number above. Named `people` because
   * `visitors` is already the count — and because that is what these are.
   */
  people: VisitorRow[];
  /** Distinct visitors seen in the last 5 minutes. */
  liveVisitors: number;
  /** Most recent activity, newest first. */
  recent: {
    at: string;
    path: string;
    name: string;
    city: string;
    country: string;
    device: string;
    channel: string;
    /** Session reference, so a row in the feed opens as a full trace. */
    ref?: string;
  }[];
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
  uid?: string;
  newVisitor: boolean;
  device: DeviceKind;
  browser: string;
  os: string;
  country: string;
  region: string;
  city: string;
  propertyId?: string;
  ref?: string;
  meta?: Record<string, string | number>;
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
      uid: x.uid ? String(x.uid) : undefined,
      newVisitor: x.newVisitor === true,
      device: (x.device ?? 'desktop') as DeviceKind,
      browser: String(x.browser ?? 'Other'),
      os: String(x.os ?? 'Other'),
      country: String(x.country ?? 'Unknown'),
      region: String(x.region ?? 'Unknown'),
      city: String(x.city ?? 'Unknown'),
      propertyId: x.propertyId ? String(x.propertyId) : undefined,
      ref: x.ref ? String(x.ref) : undefined,
      meta: (x.meta ?? undefined) as Record<string, string | number> | undefined,
      bot: x.bot === true,
      at: x.at?.toDate?.() ?? new Date(0),
    };
  });
}

/**
 * Per-page attention profile.
 *
 * The depth buckets are cumulative reach, not a histogram: "68% of visits got
 * at least halfway". That is the number that tells you whether the thing you
 * put at 70% of the page is being seen at all, which a histogram of stopping
 * points does not.
 */
function buildAttention(pageviews: Ev[], dwell: Ev[]): AnalyticsSummary['attention'] {
  const pages = new Map<string, { depth: [number, number, number, number]; n: number }>();
  for (const e of pageviews) {
    let p = pages.get(e.path);
    if (!p) pages.set(e.path, (p = { depth: [0, 0, 0, 0], n: 0 }));
    p.n++;
    // A visit that reached 80% also reached 25, 50 and 75.
    if (e.scrollPct >= 25) p.depth[0]++;
    if (e.scrollPct >= 50) p.depth[1]++;
    if (e.scrollPct >= 75) p.depth[2]++;
    if (e.scrollPct >= 95) p.depth[3]++;
  }

  // Section dwell arrives as one event per section with meta { s, ms }.
  const sections = new Map<string, Map<string, { ms: number; n: number }>>();
  for (const e of dwell) {
    const id = String(e.meta?.s ?? '').slice(0, 40);
    const ms = Number(e.meta?.ms ?? 0);
    if (!id || !Number.isFinite(ms) || ms <= 0) continue;
    let byPage = sections.get(e.path);
    if (!byPage) sections.set(e.path, (byPage = new Map()));
    const cur = byPage.get(id) ?? { ms: 0, n: 0 };
    cur.ms += ms;
    cur.n++;
    byPage.set(id, cur);
  }

  return [...pages.entries()]
    .sort((a, b) => b[1].n - a[1].n)
    .slice(0, 8)
    .map(([path, p]) => ({
      path,
      samples: p.n,
      depth: p.depth.map(c => Math.round((c / p.n) * 100)) as [number, number, number, number],
      sections: [...(sections.get(path) ?? new Map()).entries()]
        .map(([id, s]) => ({ id, avgSec: Math.round(s.ms / s.n / 1000), samples: s.n }))
        .sort((a, b) => b.avgSec - a.avgSec)
        .slice(0, 10),
    }));
}

/** Roll every event up to the person who fired it. */
function buildVisitors(events: Ev[]): VisitorRow[] {
  const CONVERSIONS = new Set([
    'whatsapp_click',
    'chat_open',
    'generate_lead',
    'site_visit',
    'sign_up',
    'phone_click',
    'pricing_unlocked',
  ]);

  const acc = new Map<
    string,
    {
      uid?: string;
      first: Date;
      last: Date;
      sids: Set<string>;
      views: number;
      ms: number;
      city: string;
      country: string;
      device: string;
      channel: string;
      props: Map<string, number>;
      did: Set<string>;
      ref?: string;
    }
  >();

  // Events arrive newest-first, so the first row seen for a visitor is their
  // latest — which is what should win for city, device, channel and ref.
  for (const e of events) {
    if (!e.vid) continue;
    let a = acc.get(e.vid);
    if (!a) {
      acc.set(
        e.vid,
        (a = {
          uid: e.uid,
          first: e.at,
          last: e.at,
          sids: new Set(),
          views: 0,
          ms: 0,
          city: e.city,
          country: e.country,
          device: e.device,
          channel: e.channel,
          props: new Map(),
          did: new Set(),
          ref: e.ref,
        })
      );
    }
    if (e.uid && !a.uid) a.uid = e.uid;
    if (e.ref && !a.ref) a.ref = e.ref;
    if (e.at < a.first) a.first = e.at;
    if (e.at > a.last) a.last = e.at;
    a.sids.add(e.sid);
    if (e.type === 'pageview') {
      a.views++;
      a.ms += e.engagedMs;
    }
    // A channel is only meaningful when it is not the fallback.
    if (a.channel === 'Direct' && e.channel !== 'Direct') a.channel = e.channel;
    if (a.city === 'Unknown' && e.city !== 'Unknown') a.city = e.city;
    const prop = e.propertyId ?? (e.path.startsWith('/sanctuaries/') ? e.path.split('/')[2] : '');
    if (prop) a.props.set(prop, (a.props.get(prop) ?? 0) + 1);
    if (CONVERSIONS.has(e.name)) a.did.add(e.name);
  }

  return [...acc.entries()]
    .map(([vid, a]) => ({
      vid,
      ...(a.uid ? { uid: a.uid } : {}),
      firstSeen: a.first.toISOString(),
      lastSeen: a.last.toISOString(),
      sessions: a.sids.size,
      pageviews: a.views,
      engagedSec: Math.round(a.ms / 1000),
      city: a.city,
      country: a.country,
      device: a.device,
      channel: a.channel,
      ...(a.props.size
        ? { focus: [...a.props.entries()].sort((x, y) => y[1] - x[1])[0][0] }
        : {}),
      did: [...a.did],
      ...(a.ref ? { ref: a.ref } : {}),
    }))
    // Most engaged first: for a business with 84 visitors a month, the person
    // who spent eleven minutes reading Agartha is the whole report.
    .sort((x, y) => y.engagedSec - x.engagedSec || y.pageviews - x.pageviews)
    .slice(0, 100);
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

  // Gate funnel, counted in people. Hits would be misleading here: the unlock
  // event fires on every page load once someone is signed in, so nine
  // `pricing_unlocked` events can be — and currently are — one member.
  const peopleWho = (name: string) =>
    new Set(events.filter(e => e.name === name).map(e => e.vid)).size;
  const gate = {
    views: peopleWho('pricing_gate_view'),
    signInClicks: peopleWho('pricing_gate_signin_click'),
    unlocked: peopleWho('pricing_unlocked'),
  };

  // Attention: scroll-depth distribution plus named-section dwell, per page.
  const attention = buildAttention(pageviews, events.filter(e => e.name === 'section_dwell'));
  const visitorRows = buildVisitors(events);

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

    gate,
    attention,
    people: visitorRows,

    liveVisitors: new Set(events.filter(e => e.at.getTime() > liveCutoff).map(e => e.vid)).size,

    recent: events.slice(0, 60).map(e => ({
      at: e.at.toISOString(),
      path: e.path,
      name: e.type === 'pageview' ? 'pageview' : e.name,
      city: e.city,
      country: e.country,
      device: e.device,
      channel: e.channel,
      ...(e.ref ? { ref: e.ref } : {}),
    })),
  };

  cache.set(days, { at: Date.now(), data: summary });
  return summary;
}

/* ────────────────────────────────────────────────────────────────────────── */
/* Session trace — one visit, in order.                                       */
/* ────────────────────────────────────────────────────────────────────────── */

export interface TraceStep {
  at: string;
  kind: 'pageview' | 'event';
  name: string;
  path: string;
  title?: string;
  engagedSec: number;
  scrollPct: number;
  /** Seconds since the step before it, so gaps are visible. */
  gapSec: number;
  meta?: Record<string, string | number>;
}

export interface SessionTrace {
  found: boolean;
  /** What was searched for, normalised. */
  query: string;
  ref?: string;
  sid?: string;
  vid?: string;
  uid?: string;
  startedAt?: string;
  endedAt?: string;
  durationSec?: number;
  engagedSec?: number;
  city?: string;
  country?: string;
  device?: string;
  browser?: string;
  os?: string;
  channel?: string;
  referrer?: string;
  utmCampaign?: string;
  steps: TraceStep[];
  /** Leads whose attribution carries this reference. */
  leads: { id: string; name: string; phone?: string; source: string; createdAt?: string }[];
  /** Other visits by the same visitor id, newest first. */
  otherSessions: { sid: string; ref?: string; at: string; steps: number }[];
}

const EMPTY_TRACE = (query: string): SessionTrace => ({
  found: false,
  query,
  steps: [],
  leads: [],
  otherSessions: [],
});

/**
 * Resolve a session reference, a session id or a visitor id to the visit behind
 * it — the answer to "a WhatsApp message just arrived quoting GT-4KP2QX; who is
 * this and what were they reading?".
 *
 * Every query here is a single equality filter served by Firestore's automatic
 * single-field indexes, sorted in memory afterwards. That is deliberate: a
 * composite index would have to be created by hand in the console before the
 * lookup box worked at all, and a trace tool that 404s until somebody
 * remembers to do that is a trace tool nobody uses.
 */
export async function traceSession(rawQuery: string): Promise<SessionTrace> {
  await requireAdmin();

  const query = rawQuery.trim().slice(0, 60);
  if (!query) return EMPTY_TRACE(query);

  const db = adminDb();
  const col = db.collection('analytics_events');
  const upper = query.toUpperCase();

  // A reference code is the common case (pasted out of WhatsApp); fall back to
  // a raw session or visitor id so a row in the visitor table is clickable too.
  let snap = isRef(upper)
    ? await col.where('ref', '==', upper).limit(500).get()
    : await col.where('sid', '==', query).limit(500).get();
  if (snap.empty && !isRef(upper)) snap = await col.where('vid', '==', query).limit(500).get();
  if (snap.empty) return EMPTY_TRACE(query);

  const rows = snap.docs
    .map(d => {
      const x = d.data();
      return {
        at: (x.at?.toDate?.() ?? new Date(0)) as Date,
        type: String(x.type ?? 'pageview'),
        name: String(x.name ?? 'pageview'),
        path: String(x.path ?? '/'),
        title: x.title ? String(x.title) : undefined,
        engagedMs: Number(x.engagedMs ?? 0),
        scrollPct: Number(x.scrollPct ?? 0),
        sid: String(x.sid ?? ''),
        vid: String(x.vid ?? ''),
        uid: x.uid ? String(x.uid) : undefined,
        ref: x.ref ? String(x.ref) : undefined,
        city: String(x.city ?? 'Unknown'),
        country: String(x.country ?? 'Unknown'),
        device: String(x.device ?? 'desktop'),
        browser: String(x.browser ?? 'Other'),
        os: String(x.os ?? 'Other'),
        channel: String(x.channel ?? 'Direct'),
        referrer: String(x.referrer ?? 'direct'),
        utmCampaign: x.utmCampaign ? String(x.utmCampaign) : undefined,
        meta: (x.meta ?? undefined) as Record<string, string | number> | undefined,
      };
    })
    .sort((a, b) => a.at.getTime() - b.at.getTime());

  // A visitor-id query spans several visits; show the most recent one in full.
  const targetSid = rows[rows.length - 1].sid;
  const session = rows.filter(r => r.sid === targetSid);
  const head = session[0];

  const steps: TraceStep[] = session.map((r, i) => ({
    at: r.at.toISOString(),
    kind: r.type === 'event' ? 'event' : 'pageview',
    name: r.type === 'event' ? r.name : 'pageview',
    path: r.path,
    ...(r.title ? { title: r.title } : {}),
    engagedSec: Math.round(r.engagedMs / 1000),
    scrollPct: r.scrollPct,
    gapSec: i === 0 ? 0 : Math.round((r.at.getTime() - session[i - 1].at.getTime()) / 1000),
    ...(r.meta ? { meta: r.meta } : {}),
  }));

  // Leads carrying this reference. Wrapped because a missing index on a nested
  // field would otherwise take down the whole trace for the sake of a footnote.
  let leads: SessionTrace['leads'] = [];
  const code = head.ref;
  if (code) {
    try {
      const ls = await db.collection('leads').where('attribution.ref', '==', code).limit(10).get();
      leads = ls.docs.map(d => {
        const x = d.data();
        return {
          id: d.id,
          name: String(x.name ?? 'Unknown'),
          ...(x.phone ? { phone: String(x.phone) } : {}),
          source: String(x.source ?? 'unspecified'),
          createdAt: x.createdAt?.toDate?.()?.toISOString(),
        };
      });
    } catch (err) {
      console.error('[trace] lead lookup failed:', err);
    }
  }

  const bySid = new Map<string, { at: Date; ref?: string; n: number }>();
  for (const r of rows) {
    const s = bySid.get(r.sid) ?? { at: r.at, ref: r.ref, n: 0 };
    if (r.at > s.at) s.at = r.at;
    s.n++;
    bySid.set(r.sid, s);
  }

  const durationSec = Math.round(
    (session[session.length - 1].at.getTime() - head.at.getTime()) / 1000
  );

  return {
    found: true,
    query,
    ref: head.ref,
    sid: targetSid,
    vid: head.vid,
    uid: session.find(r => r.uid)?.uid,
    startedAt: head.at.toISOString(),
    endedAt: session[session.length - 1].at.toISOString(),
    durationSec,
    engagedSec: Math.round(session.reduce((n, r) => n + r.engagedMs, 0) / 1000),
    city: head.city,
    country: head.country,
    device: head.device,
    browser: head.browser,
    os: head.os,
    channel: head.channel,
    referrer: head.referrer,
    utmCampaign: head.utmCampaign,
    steps,
    leads,
    otherSessions: [...bySid.entries()]
      .filter(([sid]) => sid !== targetSid)
      .map(([sid, s]) => ({ sid, ref: s.ref, at: s.at.toISOString(), steps: s.n }))
      .sort((a, b) => b.at.localeCompare(a.at))
      .slice(0, 10),
  };
}
