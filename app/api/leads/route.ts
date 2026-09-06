import { NextRequest, NextResponse, after } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { consentRecord } from '@/lib/data/legal';
import { allowedOrigin, clientIp, rateLimited } from '@/lib/server/rate-limit';
import { sendLeadConfirmation } from '@/lib/server/email';

/**
 * Lead capture — writes via the Admin SDK so Firestore rules can deny all
 * client access to the `leads` collection. `phone` is persisted (v1 collected
 * it in the membership form but silently dropped it).
 */
export async function POST(req: NextRequest) {
  if (!allowedOrigin(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (rateLimited('leads', clientIp(req), { max: 10, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ error: 'too many requests' }, { status: 429 });
  }
  try {
    const body = await req.json();
    const name = String(body.name ?? '').trim().slice(0, 200);
    const email = String(body.email ?? '').trim().slice(0, 200);
    const phone = String(body.phone ?? '').trim().slice(0, 40);
    const intent = String(body.intent ?? '').trim().slice(0, 1500);
    // Canonicalise the source. `adviser-call` and `adviser_call` both reached
    // Firestore from different versions of the form and split one channel into
    // two rows in every report — including the analytics attribution. Lowercase
    // + hyphens is the single spelling from here on.
    const source = String(body.source ?? 'unspecified')
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, '-')
      .slice(0, 60);
    if (!name && !email && !phone) {
      return NextResponse.json({ error: 'empty lead' }, { status: 400 });
    }
    await adminDb()
      .collection('leads')
      .add({
        name: name || 'Unknown',
        ...(email ? { email } : {}),
        ...(phone ? { phone } : {}),
        ...(intent ? { intent } : {}),
        source,
        status: 'new',
        // Evidence, not an assertion: which notice this person was shown, for
        // what purposes, and when. Stamped server-side from our own constant so
        // a caller cannot claim a consent it never displayed.
        consent: consentRecord(),
        createdAt: FieldValue.serverTimestamp(),
      });
    // Confirm receipt while the buyer is still on the page wondering if the form
    // worked. Transactional (they asked to be contacted), not marketing, so the
    // lead is deliberately NOT added to a mailing segment without consent.
    // Fire-and-forget: the lead is captured above regardless.
    // 'signup' is not an enquiry — it is the lead row that tells an adviser a
    // new account exists. That person already gets the welcome email from
    // /api/profile; sending the buyer confirmation too would be a second,
    // wrong email ("an adviser will call you about your enquiry") for someone
    // who only signed in.
    // `after` keeps the function alive until the send completes; a bare `void`
    // promise is killed when the response returns on serverless.
    if (email && source !== 'signup') {
      after(() => sendLeadConfirmation(email, name || undefined, intent || undefined, source));
    }
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
