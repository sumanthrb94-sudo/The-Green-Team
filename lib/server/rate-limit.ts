import 'server-only';
import type { NextRequest } from 'next/server';
import { SITE_URL } from '@/lib/data/contact';

/**
 * Burst protection + origin check for the public, unauthenticated write
 * endpoints (lead capture, newsletter, reviews). These `add()` a Firestore
 * document on every POST, so without a limiter a scripted loop drives Firestore
 * cost and floods the admin queues.
 *
 * The limiter is per-container (module-scope map), so it bounds a single
 * abusive source hitting a warm instance rather than giving a global guarantee
 * — the same posture the chat route uses. Combined with the per-field length
 * caps already in each route, that covers the realistic abuse case for a
 * low-traffic marketing site. A durable cross-instance cap would need a shared
 * store (e.g. a Firestore counter), which is deliberately out of scope here.
 */

const buckets = new Map<string, number[]>();

export function clientIp(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

/**
 * Returns true when this IP has exceeded `max` requests within `windowMs` for
 * the given bucket key. Different endpoints pass different keys so they don't
 * share a budget.
 */
export function rateLimited(
  key: string,
  ip: string,
  { max, windowMs }: { max: number; windowMs: number }
): boolean {
  const now = Date.now();
  const id = `${key}:${ip}`;
  const recent = (buckets.get(id) ?? []).filter(t => now - t < windowMs);
  recent.push(now);
  buckets.set(id, recent);
  if (buckets.size > 5000) buckets.clear(); // crude cap so the map can't grow unbounded
  return recent.length > max;
}

/**
 * Rejects cross-origin POSTs without hardcoding the served hostname. Same-origin
 * fetches (apex, www, a preview URL) always pass; a browser cannot forge the
 * Origin header, so this is a real CSRF/abuse control for state-changing routes.
 * Server-side callers and same-origin form posts that omit Origin are allowed.
 */
export function allowedOrigin(req: NextRequest): boolean {
  const origin = req.headers.get('origin');
  if (!origin) return true;
  let originHost: string;
  try {
    originHost = new URL(origin).host.toLowerCase();
  } catch {
    return false;
  }
  const selfHost = req.headers.get('host')?.toLowerCase();
  if (selfHost && originHost === selfHost) return true;
  try {
    if (originHost === new URL(SITE_URL).host.toLowerCase()) return true;
  } catch {
    /* SITE_URL is a constant */
  }
  return originHost.endsWith('.vercel.app') || originHost === 'localhost' || originHost.startsWith('localhost:');
}
