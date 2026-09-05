import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { upsertContact, splitName, SEGMENT } from '@/lib/server/resend';
import { sendWelcomeEmail } from '@/lib/server/email';

/**
 * Authenticated profile upsert. The bearer ID token names the user — a caller
 * can only ever write their own users/{uid} document.
 */
export async function POST(req: NextRequest) {
  try {
    const authz = req.headers.get('authorization') ?? '';
    const idToken = authz.startsWith('Bearer ') ? authz.slice(7) : '';
    const decoded = await adminAuth().verifyIdToken(idToken);

    const body = await req.json();
    const allowed: Record<string, unknown> = {};
    for (const k of ['name', 'occupation', 'city'] as const) {
      if (typeof body[k] === 'string' && body[k].trim()) allowed[k] = body[k].trim().slice(0, 200);
    }
    // Phone is the one field a channel partner actually needs to follow up.
    // Kept loose on purpose (digits, +, spaces, dashes) — the adviser confirms
    // it on the call; a strict regex here would only reject real numbers.
    if (typeof body.phone === 'string') {
      const ph = body.phone.replace(/[^\d+\s\-()]/g, '').trim().slice(0, 40);
      if (ph.replace(/\D/g, '').length >= 8) allowed.phone = ph;
    }
    for (const k of ['lat', 'lng', 'locationAccuracy'] as const) {
      if (typeof body[k] === 'number' && Number.isFinite(body[k])) allowed[k] = body[k];
    }

    const ref = adminDb().collection('users').doc(decoded.uid);
    const snap = await ref.get();
    const isNew = !snap.exists;
    await ref.set(
      {
        uid: decoded.uid,
        email: decoded.email ?? null,
        displayName: (decoded.name as string | undefined) ?? null,
        photoURL: (decoded.picture as string | undefined) ?? null,
        ...allowed,
        ...(isNew ? { firstSignIn: FieldValue.serverTimestamp() } : {}),
        lastSeen: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    // Mirror to Resend so a sign-in is a contact the moment it happens. Fire and
    // forget: the profile write above is the source of truth and must not wait
    // on, or fail because of, an email provider.
    if (decoded.email) {
      const name = (allowed.name as string | undefined) ?? (decoded.name as string | undefined);
      void upsertContact({
        email: decoded.email,
        ...splitName(name),
        segments: [SEGMENT.members()],
        properties: {
          phone: allowed.phone as string | undefined,
          city: allowed.city as string | undefined,
          occupation: allowed.occupation as string | undefined,
          source: 'sign-in',
        },
      });
      // Welcome email once, on the first sign-in only. Fire-and-forget for the
      // same reason as the contact sync — it must never fail the profile write.
      if (isNew) void sendWelcomeEmail(decoded.email, splitName(name).firstName);
    }

    return NextResponse.json({ ok: true, isNew });
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
}
