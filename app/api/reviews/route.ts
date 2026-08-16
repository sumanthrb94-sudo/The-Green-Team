import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';

/**
 * Review submission.
 *
 * Reviews land as `status: 'pending'` and are never shown publicly until an
 * admin approves them in Admin → Reviews. That is deliberate: an unmoderated
 * review widget on a property site is a spam target, and a published review
 * carries a legal weight that an anonymous form post does not.
 *
 * Writes via the Admin SDK so Firestore rules can keep denying all client
 * access, same as `leads` and `newsletter`.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name ?? '').trim().slice(0, 120);
    const rating = Number(body.rating);
    const text = String(body.text ?? '').trim().slice(0, 2000);
    const propertyId = String(body.propertyId ?? '').trim().slice(0, 60);

    if (!name || !text) {
      return NextResponse.json({ error: 'name and review text are required' }, { status: 400 });
    }
    if (!Number.isFinite(rating) || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'rating must be 1-5' }, { status: 400 });
    }

    await adminDb()
      .collection('reviews')
      .add({
        name,
        rating: Math.round(rating),
        text,
        ...(propertyId ? { propertyId } : {}),
        status: 'pending',
        createdAt: FieldValue.serverTimestamp(),
      });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
