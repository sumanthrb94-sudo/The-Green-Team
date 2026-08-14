import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/server/session';
import { demoEnabled } from '@/lib/server/demo-data';
import { sanitizePropertyInput } from '@/lib/server/property-input';

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (demoEnabled()) return NextResponse.json({ ok: true, demo: true });
  const { id } = await ctx.params;
  const body = await req.json();
  await adminDb().collection('properties').doc(id).update(sanitizePropertyInput(body));
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
  return NextResponse.json({ ok: true });
}
