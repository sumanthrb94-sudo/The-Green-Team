/**
 * Session-cookie auth for the admin area and authenticated API calls.
 * The client exchanges a Firebase ID token for an httpOnly session cookie;
 * every privileged request verifies that cookie server-side. Admin status is
 * decided here (ADMIN_EMAILS env) — never in the browser.
 */
import 'server-only';
import { cookies } from 'next/headers';
import { adminAuth, isAdminEmail } from '@/lib/firebase/admin';

export const SESSION_COOKIE = 'gt_session';
export const SESSION_DAYS = 14;

export interface SessionUser {
  uid: string;
  email: string | null;
  name: string | null;
  picture: string | null;
  isAdmin: boolean;
}

export async function createSessionCookie(idToken: string) {
  const expiresIn = SESSION_DAYS * 24 * 60 * 60 * 1000;
  const decoded = await adminAuth().verifyIdToken(idToken);
  const cookie = await adminAuth().createSessionCookie(idToken, { expiresIn });
  return { cookie, expiresIn, decoded };
}

export async function getSessionUser(): Promise<SessionUser | null> {
  // Dev-only documentation mode — never active in production builds.
  if (process.env.NODE_ENV === 'development' && process.env.DEMO_ADMIN === '1') {
    return { uid: 'demo-admin', email: 'admin@demo.local', name: 'Demo Admin', picture: null, isAdmin: true };
  }
  const jar = await cookies();
  const session = jar.get(SESSION_COOKIE)?.value;
  if (!session) return null;
  try {
    const d = await adminAuth().verifySessionCookie(session, true);
    return {
      uid: d.uid,
      email: d.email ?? null,
      name: (d.name as string | undefined) ?? null,
      picture: (d.picture as string | undefined) ?? null,
      isAdmin: isAdminEmail(d.email),
    };
  } catch {
    return null;
  }
}

export async function requireAdmin(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user?.isAdmin) throw new Error('UNAUTHORIZED');
  return user;
}
