import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminAuth, adminDb } from '@/lib/firebase/admin';

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
    return NextResponse.json({ ok: true, isNew });
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
}
