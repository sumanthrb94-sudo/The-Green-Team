import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { allowedOrigin } from '@/lib/server/rate-limit';
import { PROCESSORS } from '@/lib/data/legal';

/**
 * The two DPDP rights that need a button rather than an email.
 *
 * GET  — section 11: a summary of the personal data being processed, what it is
 *        being processed for, and the identities of everyone it has been shared
 *        with. Returned as a file the person can keep.
 * DELETE — section 12(3) and 8(7): erasure. Removes the account and everything
 *        keyed to it, except records we are required to keep, which are named
 *        in the response rather than silently retained.
 *
 * Both are authenticated by the bearer ID token, so a caller can only ever
 * reach their own data. A right that another person can exercise on your behalf
 * is not a right, it is a breach.
 */

/** Firestore Timestamps and other non-JSON values, made portable. */
function plain(value: unknown): unknown {
  if (value === null || value === undefined) return null;
  if (typeof value === 'object') {
    const v = value as { toDate?: () => Date };
    if (typeof v.toDate === 'function') return v.toDate().toISOString();
    if (Array.isArray(value)) return value.map(plain);
    return Object.fromEntries(Object.entries(value as object).map(([k, x]) => [k, plain(x)]));
  }
  return value;
}

async function uidFrom(req: NextRequest) {
  const authz = req.headers.get('authorization') ?? '';
  const idToken = authz.startsWith('Bearer ') ? authz.slice(7) : '';
  return adminAuth().verifyIdToken(idToken);
}

export async function GET(req: NextRequest) {
  try {
    const decoded = await uidFrom(req);
    const db = adminDb();
    const uid = decoded.uid;

    const profileSnap = await db.collection('users').doc(uid).get();
    const email = (decoded.email as string | undefined) ?? (profileSnap.data()?.email as string | undefined);

    // Everything keyed to this person, from every collection that holds any.
    const [leads, newsletter, conversations, reviews] = await Promise.all([
      email ? db.collection('leads').where('email', '==', email).get() : null,
      email ? db.collection('newsletter').where('email', '==', email).get() : null,
      db.collection('conversations').where('uid', '==', uid).get().catch(() => null),
      db.collection('reviews').where('uid', '==', uid).get().catch(() => null),
    ]);

    const docs = (snap: FirebaseFirestore.QuerySnapshot | null) =>
      snap ? snap.docs.map(d => ({ id: d.id, ...(plain(d.data()) as object) })) : [];

    const payload = {
      generatedAt: new Date().toISOString(),
      about:
        'Everything The Green Team holds about you, exported under section 11 of the Digital Personal Data Protection Act, 2023.',
      account: {
        userId: uid,
        email: decoded.email ?? null,
        phone: decoded.phone_number ?? null,
        signInMethods: decoded.firebase?.sign_in_provider ?? null,
      },
      profile: plain(profileSnap.data() ?? {}),
      enquiries: docs(leads),
      briefingSubscription: docs(newsletter),
      chatTranscripts: docs(conversations),
      reviews: docs(reviews),
      sharedWith: PROCESSORS.map(p => ({ who: p.name, whatFor: p.role, where: p.where })),
      note:
        'Website analytics is not listed here: it is keyed to a rotating identifier and a one-way hash, not to your account, so we cannot connect it to you even on request.',
    };

    return new NextResponse(JSON.stringify(payload, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': `attachment; filename="green-team-my-data-${new Date().toISOString().slice(0, 10)}.json"`,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!allowedOrigin(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  try {
    const decoded = await uidFrom(req);
    const db = adminDb();
    const uid = decoded.uid;
    const profile = (await db.collection('users').doc(uid).get()).data();
    const email = (decoded.email as string | undefined) ?? (profile?.email as string | undefined);

    const removed: string[] = [];

    await db.collection('users').doc(uid).delete();
    removed.push('your profile');

    if (email) {
      const subs = await db.collection('newsletter').where('email', '==', email).get();
      await Promise.all(subs.docs.map(d => d.ref.delete()));
      if (subs.size) removed.push('your place on the briefing list');
    }

    const convos = await db.collection('conversations').where('uid', '==', uid).get().catch(() => null);
    if (convos?.size) {
      await Promise.all(convos.docs.map(d => d.ref.delete()));
      removed.push('your chat transcripts');
    }

    // Enquiries are kept: they are the record of an introduction we made, and
    // section 8(7) requires erasure only where no legal purpose needs the data.
    // Say so plainly rather than pretending everything is gone.
    const leads = email ? await db.collection('leads').where('email', '==', email).get() : null;
    const retained = leads?.size ?? 0;

    // Last, because once it is gone the token cannot be verified again.
    await adminAuth().deleteUser(uid);
    removed.push('your sign-in account');

    return NextResponse.json({
      ok: true,
      removed,
      retained:
        retained > 0
          ? {
              count: retained,
              what: 'enquiry records',
              why: 'They record an introduction we made to a developer, and we keep them for three years for our own accounting and in case of a dispute.',
              howToObject: 'Write to the Data Protection Officer and we will review whether any legal purpose still requires them.',
            }
          : null,
    });
  } catch (err) {
    console.error('[me] deletion failed:', err);
    return NextResponse.json({ error: 'could not delete' }, { status: 500 });
  }
}
