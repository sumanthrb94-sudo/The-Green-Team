import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { createSessionCookie, getSessionUser, SESSION_COOKIE } from '@/lib/server/session';
import { isAdminEmail } from '@/lib/firebase/admin';

/** Exchange a Firebase ID token for an httpOnly session cookie. */
export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json();
    if (typeof idToken !== 'string' || !idToken) {
      return NextResponse.json({ error: 'idToken required' }, { status: 400 });
    }
    const { cookie, expiresIn, decoded } = await createSessionCookie(idToken);
    const jar = await cookies();
    jar.set(SESSION_COOKIE, cookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: expiresIn / 1000,
      path: '/',
    });
    return NextResponse.json({ isAdmin: isAdminEmail(decoded.email) });
  } catch {
    return NextResponse.json({ error: 'invalid token' }, { status: 401 });
  }
}

/** Who am I (server-verified). */
export async function GET() {
  const user = await getSessionUser();
  return NextResponse.json({ user });
}

/** Sign out. */
export async function DELETE() {
  const jar = await cookies();
  jar.delete(SESSION_COOKIE);
  return NextResponse.json({ ok: true });
}
