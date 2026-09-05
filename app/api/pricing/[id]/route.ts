import { NextRequest, NextResponse } from 'next/server';
import { getSessionUser } from '@/lib/server/session';
import { getPriceSheet } from '@/lib/data/pricing';
import { allowedOrigin } from '@/lib/server/rate-limit';

/**
 * The unit-by-unit price sheet, for signed-in visitors.
 *
 * Any signed-in account passes — this is lead capture, not authorisation, so it
 * deliberately does NOT call requireAdmin(). The gate exists so a serious buyer
 * identifies themselves at the moment their intent is highest, not to protect a
 * secret: the headline rate stays public on the page, in the title, the meta
 * description and the Product JSON-LD.
 *
 * Serving this from an API route rather than rendering it server-side keeps the
 * property pages on ISR (reading the session cookie during render would force
 * every one of them dynamic) and keeps the page HTML identical for Google and
 * for a logged-out visitor, which is what stops the gate from being cloaking.
 */
export async function GET(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  if (!allowedOrigin(req)) {
    return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  }

  const user = await getSessionUser();
  if (!user) {
    // 401 is the signal the client uses to render the sign-in card.
    return NextResponse.json({ error: 'sign_in_required' }, { status: 401 });
  }

  const { id } = await ctx.params;
  const sheet = getPriceSheet(id);
  if (!sheet) {
    return NextResponse.json({ error: 'not_found' }, { status: 404 });
  }

  return NextResponse.json(sheet, {
    // Per-user and never shared by a CDN — this is gated content.
    headers: { 'Cache-Control': 'private, no-store' },
  });
}
