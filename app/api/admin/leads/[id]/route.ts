import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase/admin';
import { requireAdmin } from '@/lib/server/session';
import { demoEnabled } from '@/lib/server/demo-data';

const STATUSES = new Set(['new', 'contacted', 'site-visit', 'closed']);

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  try {
    await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }
  if (demoEnabled()) return NextResponse.json({ ok: true, demo: true });
  const { id } = await ctx.params;
  const { status } = await req.json();
  if (!STATUSES.has(status)) return NextResponse.json({ error: 'bad status' }, { status: 400 });
  await adminDb().collection('leads').doc(id).update({ status });
  return NextResponse.json({ ok: true });
}
