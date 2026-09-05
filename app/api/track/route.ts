import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { allowedOrigin, clientIp, rateLimited } from '@/lib/server/rate-limit';
import { browserOf, channelOf, deviceOf, geoOf, hashIp, isBot, osOf, referrerHost } from '@/lib/analytics/enrich';
import type { TrackPayload } from '@/lib/analytics/types';

/**
 * First-party analytics ingest.
 *
 * Everything in the body is attacker-controlled (it is a public endpoint that
 * anyone can POST to), so every field is type-checked, length-capped and
 * range-clamped before it reaches Firestore. The endpoint always answers 204 —
 * even on a rejected payload — because a beacon has nobody to report an error
 * to, and a distinguishable error response just tells a spammer what to fix.
 */

const MAX_EVENT_NAME = 48;
const MAX_PATH = 300;
const MAX_META_KEYS = 8;

const str = (v: unknown, max: number): string =>
  typeof v === 'string' ? v.trim().slice(0, max) : '';

const clampInt = (v: unknown, min: number, max: number): number => {
  const n = typeof v === 'number' ? v : Number(v);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, Math.round(n)));
};

/** Only scalar values, only a handful of keys — meta is a label bag, not storage. */
function cleanMeta(v: unknown): Record<string, string | number> | undefined {
  if (!v || typeof v !== 'object' || Array.isArray(v)) return undefined;
  const out: Record<string, string | number> = {};
  let n = 0;
  for (const [k, val] of Object.entries(v as Record<string, unknown>)) {
    if (n >= MAX_META_KEYS) break;
    const key = k.slice(0, 32);
    if (typeof val === 'number' && Number.isFinite(val)) out[key] = val;
    else if (typeof val === 'string' && val) out[key] = val.slice(0, 120);
    else continue;
    n++;
  }
  return n ? out : undefined;
}

export async function POST(req: NextRequest) {
  // A beacon is fire-and-forget; 204 regardless keeps it cheap and silent.
  const ok = () => new NextResponse(null, { status: 204 });

  if (!allowedOrigin(req)) return ok();

  const ip = clientIp(req);
  // Generous: a real session legitimately fires a pageview per route plus
  // interaction events. This only catches scripted flooding.
  if (rateLimited('track', ip, { max: 240, windowMs: 10 * 60 * 1000 })) return ok();

  try {
    const body = (await req.json()) as TrackPayload;

    const type = body.type === 'event' ? 'event' : 'pageview';
    const path = str(body.path, MAX_PATH) || '/';
    const sid = str(body.sid, 40);
    const vid = str(body.vid, 40);
    if (!sid || !vid) return ok(); // no identity → unusable row

    const name = type === 'event' ? str(body.name, MAX_EVENT_NAME) : 'pageview';
    if (type === 'event' && !name) return ok();

    const ua = req.headers.get('user-agent') ?? '';
    const selfHost = req.headers.get('host') ?? '';
    const refHost = referrerHost(str(body.referrer, 500) || undefined, selfHost);

    // UTM comes off the tracked path, so a campaign link is attributed even
    // though the beacon never sends the query string separately.
    let utmSource = '', utmMedium = '', utmCampaign = '';
    const qIndex = path.indexOf('?');
    if (qIndex !== -1) {
      const q = new URLSearchParams(path.slice(qIndex + 1));
      utmSource = (q.get('utm_source') ?? '').slice(0, 40);
      utmMedium = (q.get('utm_medium') ?? '').slice(0, 40);
      utmCampaign = (q.get('utm_campaign') ?? '').slice(0, 60);
    }

    const day = new Date().toISOString().slice(0, 10);
    const geo = geoOf(req.headers);

    // Optional fields are spread in only when present. Firestore rejects an
    // explicit `undefined` (ignoreUndefinedProperties is off), and because this
    // route swallows errors to stay silent for beacons, writing one would fail
    // invisibly — which is exactly how interaction events were being lost while
    // pageviews, which always carry a title, kept working.
    const title = str(body.title, 160);
    const propertyId = str(body.propertyId, 60);
    const meta = cleanMeta(body.meta);

    await adminDb()
      .collection('analytics_events')
      .add({
        type,
        name,
        // Store the path without its query string so page reports group
        // cleanly; the campaign lives in the utm fields above.
        path: qIndex === -1 ? path : path.slice(0, qIndex),
        ...(title ? { title } : {}),
        referrer: refHost,
        channel: channelOf(refHost, utmSource),
        ...(utmSource ? { utmSource } : {}),
        ...(utmMedium ? { utmMedium } : {}),
        ...(utmCampaign ? { utmCampaign } : {}),
        // 2h ceiling: anything longer is a stuck timer, not a reader.
        engagedMs: type === 'pageview' ? clampInt(body.engagedMs, 0, 7_200_000) : 0,
        scrollPct: type === 'pageview' ? clampInt(body.scrollPct, 0, 100) : 0,
        sid,
        vid,
        newVisitor: body.newVisitor === true,
        device: deviceOf(ua, typeof body.vw === 'number' ? body.vw : undefined),
        browser: browserOf(ua),
        os: osOf(ua),
        country: geo.country,
        region: geo.region,
        city: geo.city,
        ...(propertyId ? { propertyId } : {}),
        ...(meta ? { meta } : {}),
        ipHash: hashIp(ip, day),
        bot: isBot(ua),
        at: FieldValue.serverTimestamp(),
      });

    return ok();
  } catch (err) {
    // Still 204 to the browser — a beacon has nobody to show an error to — but
    // never swallow it entirely: a silent write failure here once cost every
    // interaction event while pageviews kept flowing, which looked like "no one
    // clicks anything" rather than a bug. This line makes it visible in logs.
    console.error('[track] ingest failed:', err);
    return ok();
  }
}
