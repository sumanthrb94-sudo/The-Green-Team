/**
 * Demo stand-in for `firebase/auth`.
 *
 * Reproduces exactly the surface App.tsx imports, backed by an in-memory session
 * instead of Firebase Identity Platform. The signed-in identity is read from
 * `localStorage.gt_demo_auth` so a screenshot runner (or a human) can decide
 * whether the app boots as a guest, a member, or the admin.
 *
 *   localStorage.setItem('gt_demo_auth', JSON.stringify({ role: 'admin' }))
 *
 * Only loaded when Vite runs with `--config vite.demo.config.ts`.
 */

export interface DemoUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
  phoneNumber: string | null;
  emailVerified: boolean;
  isAnonymous: boolean;
  providerId: string;
  metadata: { creationTime: string; lastSignInTime: string };
  getIdToken: () => Promise<string>;
}

/** Must match ADMIN_EMAIL in src/App.tsx for the admin panel to unlock. */
const ADMIN_EMAIL = 'sumanthbolla97@gmail.com';

const AVATAR =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 96 96">
       <rect width="96" height="96" rx="48" fill="#1B4332"/>
       <circle cx="48" cy="38" r="16" fill="#95D5B2"/>
       <path d="M16 92c0-17.7 14.3-32 32-32s32 14.3 32 32z" fill="#95D5B2"/>
     </svg>`
  );

const OLD = new Date('2025-11-04T09:12:00Z').toUTCString();
const NOW = new Date('2026-08-13T06:30:00Z').toUTCString();

function makeUser(partial: Partial<DemoUser> & { uid: string }): DemoUser {
  return {
    email: null,
    displayName: null,
    photoURL: AVATAR,
    phoneNumber: null,
    emailVerified: true,
    isAnonymous: false,
    providerId: 'password',
    metadata: { creationTime: OLD, lastSignInTime: NOW },
    getIdToken: () => Promise.resolve('demo-id-token'),
    ...partial,
  };
}

export const DEMO_IDENTITIES: Record<string, DemoUser> = {
  admin: makeUser({
    uid: 'demo-admin-uid',
    email: ADMIN_EMAIL,
    displayName: 'Sumanth B · Admin',
    providerId: 'google.com',
  }),
  member: makeUser({
    uid: 'demo-member-uid',
    email: 'aarav.mehta@example.in',
    displayName: 'Aarav Mehta',
    providerId: 'google.com',
  }),
};

interface DemoAuth {
  currentUser: DemoUser | null;
  app: unknown;
  __listeners: Set<(u: DemoUser | null) => void>;
  __demo: true;
}

let authInstance: DemoAuth | null = null;

function readStoredRole(): { role?: string; isNew?: boolean } {
  try {
    const raw = localStorage.getItem('gt_demo_auth');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function storeRole(role: string | null) {
  try {
    if (role) localStorage.setItem('gt_demo_auth', JSON.stringify({ role }));
    else localStorage.removeItem('gt_demo_auth');
  } catch {
    /* ignore */
  }
}

function emit(auth: DemoAuth) {
  auth.__listeners.forEach(cb => cb(auth.currentUser));
}

export function getAuth(app?: unknown): DemoAuth {
  if (!authInstance) {
    const { role } = readStoredRole();
    authInstance = {
      currentUser: role && DEMO_IDENTITIES[role] ? DEMO_IDENTITIES[role] : null,
      app,
      __listeners: new Set(),
      __demo: true,
    };
  }
  return authInstance;
}

export function onAuthStateChanged(auth: DemoAuth, cb: (u: DemoUser | null) => void) {
  auth.__listeners.add(cb);
  // Firebase fires asynchronously on subscribe — mirror that so the app's
  // loading states behave the same way.
  setTimeout(() => cb(auth.currentUser), 0);
  return () => auth.__listeners.delete(cb);
}

function signIn(auth: DemoAuth, user: DemoUser, role: string) {
  auth.currentUser = user;
  storeRole(role);
  emit(auth);
  const isNew = user.metadata.creationTime === user.metadata.lastSignInTime;
  return { user, operationType: 'signIn' as const, providerId: user.providerId, isNew };
}

export function signInWithPopup(auth: DemoAuth, _provider?: unknown) {
  return Promise.resolve(signIn(auth, DEMO_IDENTITIES.member, 'member'));
}

export function signInWithRedirect(auth: DemoAuth, _provider?: unknown) {
  signIn(auth, DEMO_IDENTITIES.member, 'member');
  return Promise.resolve();
}

export function getRedirectResult(_auth: DemoAuth) {
  return Promise.resolve(null);
}

export function signInWithEmailAndPassword(auth: DemoAuth, email: string, password: string) {
  if (!password || password.length < 6) {
    return Promise.reject(Object.assign(new Error('weak password'), { code: 'auth/wrong-password' }));
  }
  const role = email.trim().toLowerCase() === ADMIN_EMAIL ? 'admin' : 'member';
  const base = DEMO_IDENTITIES[role];
  const user = makeUser({ ...base, email, providerId: 'password' });
  return Promise.resolve(signIn(auth, user, role));
}

export function createUserWithEmailAndPassword(auth: DemoAuth, email: string, password: string) {
  if (!password || password.length < 6) {
    return Promise.reject(Object.assign(new Error('weak password'), { code: 'auth/weak-password' }));
  }
  const user = makeUser({
    uid: `demo-${email.replace(/\W/g, '')}`,
    email,
    displayName: email.split('@')[0],
    providerId: 'password',
    metadata: { creationTime: NOW, lastSignInTime: NOW }, // creation === lastSignIn ⇒ new user
  });
  return Promise.resolve(signIn(auth, user, 'member'));
}

export function signOut(auth: DemoAuth) {
  auth.currentUser = null;
  storeRole(null);
  emit(auth);
  return Promise.resolve();
}

export function signInWithPhoneNumber(auth: DemoAuth, phoneNumber: string, _verifier?: unknown) {
  return Promise.resolve({
    verificationId: 'demo-verification-id',
    confirm: (code: string) => {
      if (code !== '123456') {
        return Promise.reject(Object.assign(new Error('bad code'), { code: 'auth/invalid-verification-code' }));
      }
      const user = makeUser({
        uid: `demo-phone-${phoneNumber.replace(/\D/g, '')}`,
        phoneNumber,
        displayName: 'Phone Member',
        providerId: 'phone',
        metadata: { creationTime: NOW, lastSignInTime: NOW },
      });
      return Promise.resolve(signIn(auth, user, 'member'));
    },
  });
}

export class RecaptchaVerifier {
  constructor(_auth: DemoAuth, _container: string, _params?: unknown) {}
  render() {
    return Promise.resolve(0);
  }
  verify() {
    return Promise.resolve('demo-recaptcha-token');
  }
  clear() {}
}

export class GoogleAuthProvider {
  static PROVIDER_ID = 'google.com';
  providerId = 'google.com';
  addScope(_s: string) {
    return this;
  }
  setCustomParameters(_p: Record<string, string>) {
    return this;
  }
}

export type User = DemoUser;
export type ConfirmationResult = ReturnType<typeof signInWithPhoneNumber> extends Promise<infer R> ? R : never;
