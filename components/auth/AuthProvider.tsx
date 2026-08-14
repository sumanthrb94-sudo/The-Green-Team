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
    return Boolean(data?.isNew);
  } catch {
    return false;
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authReady, setAuthReady] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const sessionExchanged = useRef(false);

  const captureLocation = useCallback((u: User) => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition(
      pos =>
        postProfile(u, {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          locationAccuracy: pos.coords.accuracy,
        }),
      () => {}, // denied — silent
      { timeout: 8000, maximumAge: 300000 }
    );
  }, []);

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
      setTimeout(() => captureLocation(u), 1500);
      void postProfile(u).then(wasNewDoc => {
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
    [captureLocation, exchangeSession]
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
        setTimeout(() => captureLocation(u), 2000);
      }
      if (!u) {
        sessionExchanged.current = false;
        setIsAdmin(false);
      }
    });
    return unsub;
  }, [captureLocation, exchangeSession, onSignedIn]);

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
        signOutUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}
