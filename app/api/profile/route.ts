import { NextRequest, NextResponse, after } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { upsertContact, splitName, SEGMENT } from '@/lib/server/resend';
import { sendWelcomeEmail } from '@/lib/server/email';
import { isSubscribed } from '@/lib/server/newsletter';

/** An account created within this window of the request is a genuine sign-up.
 *  Anything older that arrives here without a profile record is a repaired
 *  record for an existing member, and must not be welcomed. */
const SIGNUP_WINDOW_MS = 10 * 60 * 1000;

/** How long an unfinished welcome waits before it is tried again. This route
 *  runs on ordinary page loads, so without a floor a provider outage would mean
 *  a fresh attempt on every navigation for as long as it lasted. */
const WELCOME_RETRY_MS = 60 * 60 * 1000;

/** Read back your own profile, for the account page. Same rule as POST: the
 *  bearer token names the user, so nobody can read anyone else's record. */
export async function GET(req: NextRequest) {
  try {
    const authz = req.headers.get('authorization') ?? '';
    const idToken = authz.startsWith('Bearer ') ? authz.slice(7) : '';
    const decoded = await adminAuth().verifyIdToken(idToken);
    const d = (await adminDb().collection('users').doc(decoded.uid).get()).data() ?? {};
    const addr = (decoded.email as string) ?? (d.email as string) ?? '';
    return NextResponse.json({
      // The briefing is a setting on this page and nowhere else, so its state
      // has to come back with the rest of the profile.
      subscribed: addr ? await isSubscribed(addr) : false,
      name: (d.name as string) ?? (d.displayName as string) ?? (decoded.name as string) ?? '',
      email: (decoded.email as string) ?? (d.email as string) ?? '',
      // A provider-verified address is not editable here; a self-supplied one is.
      emailLocked: Boolean(decoded.email),
      phone: (d.phone as string) ?? (decoded.phone_number as string) ?? '',
      phoneLocked: Boolean(decoded.phone_number),
      city: (d.city as string) ?? '',
      occupation: (d.occupation as string) ?? '',
    });
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
}

/**
 * Authenticated profile upsert. The bearer ID token names the user — a caller
 * can only ever write their own users/{uid} document.
 *
 * This runs far more often than people expect: on sign-in, when the profile
 * step is submitted, when the account page saves, and on ordinary page loads
 * whenever the browser hands back a location. So nothing here may treat "this
 * request happened" as "this person just joined".
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
    const authPhone = (decoded.phone_number as string | undefined) ?? undefined;

    let isNew = false;
    let email: string | null = null;
    let shouldWelcome = false;

    // One transaction so two requests racing on the same sign-in cannot both
    // decide they are the first, and send the welcome twice.
    await adminDb().runTransaction(async tx => {
      const snap = await tx.get(ref);
      const prev = snap.data();
      isNew = !snap.exists;
      const prevEmail = (prev?.email as string | undefined) ?? null;
      // Whichever address we know: verified from the token, just supplied, or
      // stored on a previous visit.
      email = decoded.email ?? providedEmail ?? prevEmail ?? null;

      // The welcome belongs to one moment: the first time we have both an
      // account and an address to write to. That is a sign-up (a first Google
      // sign-in creates the account, so the two are the same event), or the
      // moment an OTP member finally gives us an email. Never a later sign-in.
      //
      // Deliberately derived from state rather than from a missing flag: every
      // account that predates this email would otherwise qualify, and five real
      // members from April would have been "welcomed" months after joining.
      const firstAddressForAccount = Boolean(email) && (isNew || !prevEmail);
      // An unfinished attempt stays owed until it is actually delivered, so a
      // send that fails is retried instead of being silently written off —
      // but no more than once an hour, since this route also runs on page loads.
      const lastTry = (prev?.welcomeAttemptedAt as { toMillis?: () => number } | undefined)?.toMillis?.() ?? 0;
      const owed = prev?.welcomePending === true && Date.now() - lastTry > WELCOME_RETRY_MS;
      shouldWelcome = !prev?.welcomeSentAt && (firstAddressForAccount || owed);

      tx.set(
        ref,
        {
          uid: decoded.uid,
          email,
          displayName: (decoded.name as string | undefined) ?? null,
          photoURL: (decoded.picture as string | undefined) ?? null,
          ...(authPhone ? { phone: authPhone } : {}),
          ...allowed,
          ...(isNew ? { firstSignIn: FieldValue.serverTimestamp() } : {}),
          ...(shouldWelcome ? { welcomePending: true, welcomeAttemptedAt: FieldValue.serverTimestamp() } : {}),
          lastSeen: FieldValue.serverTimestamp(),
        },
        { merge: true }
      );
    });

    // A profile record can be missing for an old member — created before this
    // route existed, or lost. That is a repair, not a sign-up, so check the age
    // of the Firebase account itself before treating it as one. Only ever runs
    // on the rare request that creates a record.
    if (shouldWelcome && isNew) {
      try {
        const created = Date.parse((await adminAuth().getUser(decoded.uid)).metadata.creationTime);
        if (Number.isFinite(created) && Date.now() - created > SIGNUP_WINDOW_MS) {
          shouldWelcome = false;
          await ref.set({ welcomePending: false }, { merge: true });
        }
      } catch {
        // Auth lookup failed — fall through and welcome. Erring towards sending
        // once is better than a new member hearing nothing at all.
      }
    }

    // Mirror to Resend so a sign-in is a contact the moment it happens.
    if (email) {
      const addr: string = email;
      const name = (allowed.name as string | undefined) ?? (decoded.name as string | undefined);
      // `after` runs once the response has been sent AND keeps the serverless
      // function alive until it finishes. A bare `void` promise here does not:
      // the platform freezes the instance the moment the response returns and
      // the in-flight socket to Resend is cut mid-request, which is exactly
      // why no email ever arrived in production.
      after(async () => {
        await upsertContact({
          email: addr,
          ...splitName(name),
          segments: [SEGMENT.members()],
          properties: {
            phone: (allowed.phone as string | undefined) ?? authPhone,
            city: allowed.city as string | undefined,
            occupation: allowed.occupation as string | undefined,
            source: 'sign-in',
          },
        });
        if (shouldWelcome) {
          // Stamp sent only once Resend has actually accepted the message; a
          // failure leaves `welcomePending` set, so the next visit retries.
          const sent = await sendWelcomeEmail(addr, splitName(name).firstName);
          if (sent) {
            await ref.set(
              { welcomeSentAt: FieldValue.serverTimestamp(), welcomePending: false },
              { merge: true }
            );
          }
        }
      });
    }

    // `needsEmail` is what makes the profile step mandatory rather than a
    // suggestion: an OTP member who closed it, or refreshed past it, is asked
    // again on their next visit until we actually have an address for them.
    return NextResponse.json({ ok: true, isNew, needsEmail: !email });
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
}
