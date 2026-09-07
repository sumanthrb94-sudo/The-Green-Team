import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/server/session';
import { demoEnabled } from '@/lib/server/demo-data';
import { sanitizePropertyInput } from '@/lib/server/property-input';

export async function POST(req: NextRequest) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (demoEnabled()) return NextResponse.json({ ok: true, demo: true });
  const body = await req.json();
  if (!body.title || !body.location) {
    return NextResponse.json({ error: 'title and location required' }, { status: 400 });
  }
  const ref = await adminDb()
    .collection('properties')
    .add({ ...sanitizePropertyInput(body), createdAt: FieldValue.serverTimestamp() });
  // The admin lists are cached for 30s; an admin must never watch
  // their own edit reappear as the old value.
  revalidateTag('admin', 'max');
  return NextResponse.json({ ok: true, id: ref.id });
}
