import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';
import { allowedOrigin, clientIp, rateLimited } from '@/lib/server/rate-limit';
import { subscribeEmail, unsubscribeEmail } from '@/lib/server/newsletter';

/**
 * The briefing, as a setting on your profile.
 *
 * There is one place on the site to turn it on, and it is your account page, so
 * this route is authenticated: the bearer token names the address. Nobody can
 * subscribe — or unsubscribe — anyone but themselves, which an open POST taking
 * an arbitrary email could never promise.
 *
 * It carries no subscription logic of its own; `subscribeEmail` is shared with
 * Groot's tool so a chatbot signup and a profile signup mean the same thing.
 */
async function addressOf(req: NextRequest): Promise<string | null> {
  const authz = req.headers.get('authorization') ?? '';
  const idToken = authz.startsWith('Bearer ') ? authz.slice(7) : '';
  const decoded = await adminAuth().verifyIdToken(idToken);
  if (decoded.email) return decoded.email;
  // A phone-OTP member's address lives on their profile, not on the token.
  const { adminDb } = await import('@/lib/firebase/admin');
  const d = (await adminDb().collection('users').doc(decoded.uid).get()).data();
  return (d?.email as string | undefined) ?? null;
}

export async function POST(req: NextRequest) {
  if (!allowedOrigin(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (rateLimited('newsletter', clientIp(req), { max: 10, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ error: 'too many requests' }, { status: 429 });
  }
  try {
    const email = await addressOf(req);
    if (!email) return NextResponse.json({ error: 'no address on file' }, { status: 400 });
    const result = await subscribeEmail({ email, source: 'profile' });
    if (result.invalid) return NextResponse.json({ error: 'invalid email' }, { status: 400 });
    return NextResponse.json({ ok: true, subscribed: true, already: result.already });
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!allowedOrigin(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    const email = await addressOf(req);
    if (!email) return NextResponse.json({ error: 'no address on file' }, { status: 400 });
    await unsubscribeEmail(email);
    return NextResponse.json({ ok: true, subscribed: false });
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
}
