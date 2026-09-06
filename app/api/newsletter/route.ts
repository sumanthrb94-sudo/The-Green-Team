import { NextRequest, NextResponse } from 'next/server';
import { allowedOrigin, clientIp, rateLimited } from '@/lib/server/rate-limit';
import { subscribeEmail } from '@/lib/server/newsletter';

/**
 * The only HTTP door to the briefing list. It carries no subscription logic of
 * its own — origin check, rate limit, then straight to `subscribeEmail`, which
 * Groot's tool calls too. There is one signup form on the site (the footer), so
 * there is one source tag; the route no longer accepts a caller-supplied one.
 */
export async function POST(req: NextRequest) {
  if (!allowedOrigin(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (rateLimited('newsletter', clientIp(req), { max: 10, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ error: 'too many requests' }, { status: 429 });
  }
  try {
    const body = await req.json();
    const result = await subscribeEmail({ email: String(body.email ?? ''), source: 'footer' });
    if (result.invalid) return NextResponse.json({ error: 'invalid email' }, { status: 400 });
    return NextResponse.json({ ok: true, already: result.already });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
