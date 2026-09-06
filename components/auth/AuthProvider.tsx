'use client';

/**
 * Global auth context. Handles Firebase auth state, the session-cookie
 * exchange (server-verified admin), post-sign-in profile capture, and the
 * silent geolocation write carried over from v1.
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { onAuthStateChanged, getRedirectResult, signOut, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase/client';

interface AuthContextValue {
  user: User | null;
  isAdmin: boolean;
  authReady: boolean;
  authModalOpen: boolean;
  profileModalOpen: boolean;
  openAuth: () => void;
  closeAuth: () => void;
  closeProfile: () => void;
  onSignedIn: (user: User, isNew: boolean) => void;
  /** Re-read the Firebase profile after it changed server-side (a new name). */
  refreshUser: () => Promise<void>;
  signOutUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth outside AuthProvider');
  return ctx;
};

async function postProfile(user: User, extra: Record<string, unknown> = {}) {
  try {
    const idToken = await user.getIdToken();
    const res = await fetch('/api/profile', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
      body: JSON.stringify(extra),
    });
    const data = await res.json().catch(() => ({}));
    return { isNew: Boolean(data?.isNew), needsEmail: Boolean(data?.needsEmail) };
  } catch {
    return { isNew: false, needsEmail: false };
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  // `reload()` mutates the User object in place, so its reference never changes
  // and React would not re-render. This forces the pass that shows the new name.
  const [, bumpProfile] = useState(0);
  const sessionExchanged = useRef(false);


  const exchangeSession = useCallback(async (u: User) => {
    try {
      const idToken = await u.getIdToken();
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      });
      const data = await res.json().catch(() => ({}));
      setIsAdmin(Boolean(data?.isAdmin));
    } catch {
      setIsAdmin(false);
    }
  }, []);

  const onSignedIn = useCallback(
    (u: User, isNew: boolean) => {
      setUser(u);
      setAuthModalOpen(false);
      void exchangeSession(u);
      void postProfile(u).then(({ isNew: wasNewDoc, needsEmail }) => {
        // `needsEmail` keeps the step open for an OTP member who has still not
        // given us an address — there is no way to reach them without it.
        if (needsEmail) setProfileModalOpen(true);
        if (isNew || wasNewDoc) {
          setProfileModalOpen(true);
          void fetch('/api/leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              name: u.displayName || 'New User',
              email: u.email || undefined,
              phone: u.phoneNumber || undefined,
              intent: 'New Sign-up',
              source: 'signup',
            }),
          }).catch(() => {});
        }
      });
    },
    [exchangeSession]
  );

  useEffect(() => {
    getRedirectResult(auth)
      .then(result => {
        if (result?.user) {
          const m = result.user.metadata;
          onSignedIn(result.user, m.creationTime === m.lastSignInTime);
        }
      })
      .catch(() => {});

    const unsub = onAuthStateChanged(auth, u => {
      setUser(u);
      setAuthReady(true);
      if (u && !sessionExchanged.current) {
        sessionExchanged.current = true;
        void exchangeSession(u);
        // Asked once per session, not only at sign-up: someone who refreshed
        // past the profile step would otherwise stay unreachable forever.
        if (!u.email) {
          void postProfile(u).then(({ needsEmail }) => {
            if (needsEmail) setProfileModalOpen(true);
          });
        }
      }
      if (!u) {
        sessionExchanged.current = false;
        setIsAdmin(false);
      }
    });
    return unsub;
  }, [exchangeSession, onSignedIn]);

  /** Pull the Auth profile again — the server sets displayName when a member
   *  saves their name, and without this the menu keeps showing the old value
   *  (a phone number) until they sign out and back in. */
  const refreshUser = useCallback(async () => {
    try {
      await auth.currentUser?.reload();
      bumpProfile(n => n + 1);
    } catch {
      /* a stale greeting is not worth surfacing */
    }
  }, []);

  const signOutUser = useCallback(async () => {
    try {
      await signOut(auth);
      await fetch('/api/session', { method: 'DELETE' }).catch(() => {});
    } finally {
      setUser(null);
      setIsAdmin(false);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAdmin,
        authReady,
        authModalOpen,
        profileModalOpen,
        openAuth: () => setAuthModalOpen(true),
        closeAuth: () => setAuthModalOpen(false),
        closeProfile: () => setProfileModalOpen(false),
        onSignedIn,
        refreshUser,
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
