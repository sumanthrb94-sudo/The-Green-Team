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
    // A phone-OTP user has no email on the token, so the profile step is the
    // only chance to ask for one. Accepted ONLY when the token carries no
    // email — otherwise a Google user could overwrite their verified address
    // with someone else's.
    let providedEmail: string | undefined;
    if (!decoded.email && typeof body.email === 'string') {
      const e = body.email.trim().toLowerCase().slice(0, 200);
      if (/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)) providedEmail = e;
    }

    const ref = adminDb().collection('users').doc(decoded.uid);
    const snap = await ref.get();
    const prev = snap.data();
    const isNew = !snap.exists;
    // Whichever address we know: verified from the token, just supplied, or
    // stored on a previous visit.
    const email = decoded.email ?? providedEmail ?? (prev?.email as string | undefined) ?? null;
    const authPhone = (decoded.phone_number as string | undefined) ?? undefined;
    await ref.set(
      {
        uid: decoded.uid,
        email,
        displayName: (decoded.name as string | undefined) ?? null,
        photoURL: (decoded.picture as string | undefined) ?? null,
        ...(authPhone ? { phone: authPhone } : {}),
        ...allowed,
        ...(isNew ? { firstSignIn: FieldValue.serverTimestamp() } : {}),
        lastSeen: FieldValue.serverTimestamp(),
      },
      { merge: true }
    );
    // Mirror to Resend so a sign-in is a contact the moment it happens. Fire and
    // forget: the profile write above is the source of truth and must not wait
    // on, or fail because of, an email provider.
    if (email) {
      const name = (allowed.name as string | undefined) ?? (decoded.name as string | undefined);
      void upsertContact({
        email,
        ...splitName(name),
        segments: [SEGMENT.members()],
        properties: {
          phone: (allowed.phone as string | undefined) ?? authPhone,
          city: allowed.city as string | undefined,
          occupation: allowed.occupation as string | undefined,
          source: 'sign-in',
        },
      });
      // Welcome once per account, ever. Guarded by a stored timestamp rather
      // than `isNew`, because a phone user's address only arrives at the
      // profile step — by which point the document already exists — and
      // because two concurrent sign-in writes must not both send.
      if (!prev?.welcomeSentAt) {
        void ref.set({ welcomeSentAt: FieldValue.serverTimestamp() }, { merge: true });
        void sendWelcomeEmail(email, splitName(name).firstName);
      }
    }

    return NextResponse.json({ ok: true, isNew });
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
}
