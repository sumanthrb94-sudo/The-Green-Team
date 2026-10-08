import { revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/server/session';
import { demoEnabled } from '@/lib/server/demo-data';
import { publishBlockers, sanitizePropertyInput } from '@/lib/server/property-input';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (demoEnabled()) return NextResponse.json({ ok: true, demo: true });
  const { id } = await ctx.params;
  const body = await req.json();
  const patch = sanitizePropertyInput(body);
  const ref = adminDb().collection('properties').doc(id);
  const snap = await ref.get();
  if (!snap.exists) return NextResponse.json({ error: 'not found' }, { status: 404 });
  // Validate the document as it will be after the write, so a bare
  // { status: 'live' } toggle can't publish an incomplete listing.
  const missing = publishBlockers({ ...snap.data(), ...patch });
  if (missing.length) {
    return NextResponse.json({ error: `Required to publish: ${missing.join(', ')}`, missing }, { status: 400 });
  }
  await ref.update(patch);
  // The admin lists are cached for 30s; an admin must never watch
  // their own edit reappear as the old value.
  revalidateTag('admin', 'max');
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (demoEnabled()) return NextResponse.json({ ok: true, demo: true });
  const { id } = await ctx.params;
  await adminDb().collection('properties').doc(id).delete();
  // The admin lists are cached for 30s; an admin must never watch
  // their own edit reappear as the old value.
  revalidateTag('admin', 'max');
  return NextResponse.json({ ok: true });
}
