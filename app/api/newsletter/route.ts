import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { allowedOrigin, clientIp, rateLimited } from '@/lib/server/rate-limit';
import { upsertContact, SEGMENT } from '@/lib/server/resend';
import { sendWelcomeEmail } from '@/lib/server/email';

const SOURCES = new Set(['modal', 'inline', 'mobile_quick', 'footer']);

export async function POST(req: NextRequest) {
  if (!allowedOrigin(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (rateLimited('newsletter', clientIp(req), { max: 10, windowMs: 10 * 60 * 1000 })) {
    return NextResponse.json({ error: 'too many requests' }, { status: 429 });
  }
  try {
    const body = await req.json();
    const email = String(body.email ?? '').trim().toLowerCase().slice(0, 200);
    const source = SOURCES.has(body.source) ? body.source : 'inline';
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return NextResponse.json({ error: 'invalid email' }, { status: 400 });
    }
    await adminDb().collection('newsletter').add({
      email,
      source,
      createdAt: FieldValue.serverTimestamp(),
    });
    // Firestore is the record; Resend is where the broadcast goes out from.
    void upsertContact({ email, segments: [SEGMENT.newsletter()], properties: { source } });
    // Confirm the subscription immediately so the new member gets something in
    // their inbox, not silence. Fire-and-forget: the signup is saved regardless.
    void sendWelcomeEmail(email);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
