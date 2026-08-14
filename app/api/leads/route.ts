import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';

/**
 * Lead capture — writes via the Admin SDK so Firestore rules can deny all
 * client access to the `leads` collection. `phone` is persisted (v1 collected
 * it in the membership form but silently dropped it).
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const name = String(body.name ?? '').trim().slice(0, 200);
    const email = String(body.email ?? '').trim().slice(0, 200);
    const phone = String(body.phone ?? '').trim().slice(0, 40);
    const intent = String(body.intent ?? '').trim().slice(0, 1500);
    const source = String(body.source ?? 'unspecified').trim().slice(0, 60);
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
        createdAt: FieldValue.serverTimestamp(),
      });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
