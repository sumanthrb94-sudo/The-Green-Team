import { NextResponse, type NextRequest } from 'next/server';
import { EXPERIMENT_COOKIE, newVisitorId } from '@/lib/experiments';

/**
 * Issues the visitor id used to bucket A/B experiments.
 *
 * Doing it in the proxy (Next 16's successor to middleware) means the cookie exists before the first page renders,
 * so variants are assigned server-side and the visitor never sees the control
 * variant flash before being switched — the usual failure of client-side A/B
 * tooling.
 *
 * The id is random and carries no personal data; it only keeps a visitor in the
 * same bucket across visits so the test measures what it claims to.
 */
export function proxy(req: NextRequest) {
  const res = NextResponse.next();
  if (!req.cookies.get(EXPERIMENT_COOKIE)) {
    res.cookies.set(EXPERIMENT_COOKIE, newVisitorId(), {
      maxAge: 60 * 60 * 24 * 180,
      sameSite: 'lax',
      path: '/',
      httpOnly: false,
    });
  }
  return res;
}

export const config = {
  // Static assets and API routes gain nothing from a bucketing cookie.
  matcher: ['/((?!api|_next/static|_next/image|favicon|.*\\.(?:svg|png|jpg|jpeg|webp|ico|txt|xml|webmanifest)$).*)'],
};
