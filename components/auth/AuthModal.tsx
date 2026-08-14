'use client';

/**
 * Sign-in modal — Google only. One button, one identity. Popup first, with a
 * redirect fallback for in-app browsers (Instagram/Facebook/LinkedIn webviews)
 * and blocked popups.
 */
import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  signInWithPopup,
  signInWithRedirect,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { X } from 'lucide-react';
import { auth, googleProvider } from '@/lib/firebase/client';
import { useAuth } from './AuthProvider';
import { Logo } from '@/components/brand/Logo';

const FRIENDLY: Record<string, string> = {
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/popup-blocked': 'Pop-up blocked — trying a redirect instead…',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and retry.',
  'auth/network-request-failed': 'Network error — check your connection.',
  'auth/unauthorized-domain': 'This domain is not authorised for sign-in.',
  'auth/operation-not-allowed': 'This sign-in method is disabled.',
};
const friendly = (code?: string) => (code && FRIENDLY[code]) || 'Something went wrong. Please try again.';

const isInAppBrowser = () =>
  typeof navigator !== 'undefined' &&
  /Instagram|FBAN|FBAV|LinkedInApp|TikTok|MicroMessenger|Line\//i.test(navigator.userAgent);

const wasNew = (u: User) => u.metadata.creationTime === u.metadata.lastSignInTime;

export function AuthModal() {
  const { authModalOpen, closeAuth, onSignedIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!authModalOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeAuth();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [authModalOpen, closeAuth]);

  useEffect(() => {
    if (!authModalOpen) {
      setError('');
      setLoading(false);
    }
  }, [authModalOpen]);

  const finish = useCallback(
    (cred: UserCredential) => onSignedIn(cred.user, wasNew(cred.user)),
    [onSignedIn]
  );

  const handleGoogle = async () => {
    setError('');
    setLoading(true);
    try {
      if (isInAppBrowser()) {
        await signInWithRedirect(auth, googleProvider);
        return;
      }
      finish(await signInWithPopup(auth, googleProvider));
    } catch (err) {
      const code = (err as { code?: string }).code;
      if (code === 'auth/popup-blocked' || code === 'auth/popup-closed-by-user') {
        try {
          await signInWithRedirect(auth, googleProvider);
          return;
        } catch {
          /* fall through */
        }
      }
      setError(friendly(code));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {authModalOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-6"
          onClick={closeAuth}
        >
          <motion.div
            initial={{ y: 40, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, scale: 0.98, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="w-full sm:max-w-md bg-surface rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl"
          >
            <div className="bg-forest-section p-8 text-white relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/20 blur-3xl" />
              <div className="flex items-start justify-between relative">
                <Logo onDark />
                <button
                  onClick={closeAuth}
                  aria-label="Close"
                  className="p-2 -mr-2 -mt-2 rounded-full hover:bg-white/10 transition-all"
                >
                  <X className="w-5 h-5 text-white/70" />
                </button>
              </div>
              <p className="mt-8 font-serif italic text-3xl leading-tight text-white/95">
                Where the forest
                <br />
                becomes home.
              </p>
            </div>

            <div className="p-7 sm:p-8">
              <h2 className="text-xl font-bold text-on-surface mb-1">Sign in to The Green Team</h2>
              <p className="text-sm text-on-surface/50 mb-6">
                One Google sign-in. Full access to every sanctuary.
              </p>

              {error && (
                <p className="mb-5 text-sm text-error bg-error/10 border border-error/20 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <button
                onClick={handleGoogle}
                disabled={loading}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border border-outline/30 bg-surface-container-low hover:border-primary/50 hover:shadow-md transition-all text-sm font-medium text-on-surface disabled:opacity-60"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                  <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
                </svg>
                <span>{loading ? 'Connecting…' : 'Continue with Google'}</span>
              </button>

              <p className="mt-6 text-center text-[9px] uppercase tracking-[0.3em] text-on-surface/25 leading-relaxed">
                By continuing, you agree to our terms.
                <br />
                We never spam — only sanctuary intelligence.
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
