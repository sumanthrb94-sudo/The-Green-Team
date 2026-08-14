'use client';

/**
 * Sign-in modal — Google (popup with in-app-browser redirect fallback),
 * email/password (sign in ⇄ create), and phone OTP via invisible reCAPTCHA.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithRedirect,
  RecaptchaVerifier,
  type ConfirmationResult,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { X, Send, ArrowRight } from 'lucide-react';
import { auth, googleProvider } from '@/lib/firebase/client';
import { useAuth } from './AuthProvider';
import { Logo } from '@/components/brand/Logo';

const FRIENDLY: Record<string, string> = {
  'auth/user-not-found': 'No account found for that email. Try signing up instead.',
  'auth/wrong-password': 'Incorrect password. Please try again.',
  'auth/invalid-credential': 'Incorrect email or password. Please try again.',
  'auth/email-already-in-use': 'Email already registered. Sign in instead.',
  'auth/weak-password': 'Password should be at least 6 characters.',
  'auth/invalid-email': 'That email address looks invalid.',
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/popup-blocked': 'Pop-up blocked — trying a redirect instead…',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and retry.',
  'auth/network-request-failed': 'Network error — check your connection.',
  'auth/unauthorized-domain': 'This domain is not authorised for sign-in.',
  'auth/invalid-verification-code': 'That OTP is incorrect. Please re-check.',
  'auth/operation-not-allowed': 'This sign-in method is disabled.',
};
const friendly = (code?: string) => (code && FRIENDLY[code]) || 'Something went wrong. Please try again.';

const isInAppBrowser = () =>
  typeof navigator !== 'undefined' &&
  /Instagram|FBAN|FBAV|LinkedInApp|TikTok|MicroMessenger|Line\//i.test(navigator.userAgent);

const wasNew = (u: User) => u.metadata.creationTime === u.metadata.lastSignInTime;

export function AuthModal() {
  const { authModalOpen, closeAuth, onSignedIn } = useAuth();

  const [method, setMethod] = useState<'root' | 'email' | 'phone'>('root');
  const [emailMode, setEmailMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState<'google' | 'email' | 'phone' | null>(null);
  const [error, setError] = useState('');
  const confirmRef = useRef<ConfirmationResult | null>(null);
  const recaptchaRef = useRef<RecaptchaVerifier | null>(null);

  useEffect(() => {
    if (!authModalOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeAuth();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [authModalOpen, closeAuth]);

  useEffect(() => {
    if (!authModalOpen) {
      setMethod('root');
      setEmailMode('signin');
      setEmail('');
      setPassword('');
      setPhone('');
      setOtp('');
      setOtpSent(false);
      setError('');
      setLoading(null);
      confirmRef.current = null;
    }
  }, [authModalOpen]);

  const finish = useCallback(
    (cred: UserCredential) => onSignedIn(cred.user, wasNew(cred.user)),
    [onSignedIn]
  );

  const handleGoogle = async () => {
    setError('');
    setLoading('google');
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
      setLoading(null);
    }
  };

  const handleEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading('email');
    try {
      const cred =
        emailMode === 'signup'
          ? await createUserWithEmailAndPassword(auth, email, password)
          : await signInWithEmailAndPassword(auth, email, password);
      finish(cred);
    } catch (err) {
      setError(friendly((err as { code?: string }).code));
    } finally {
      setLoading(null);
    }
  };

  const sendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading('phone');
    try {
      if (!recaptchaRef.current) {
        recaptchaRef.current = new RecaptchaVerifier(auth, 'recaptcha-container', { size: 'invisible' });
      }
      let formatted = phone.trim().replace(/\s/g, '');
      if (!formatted.startsWith('+')) {
        const digits = formatted.replace(/\D/g, '');
        formatted = digits.length === 10 ? `+91${digits}` : `+${digits}`;
      }
      confirmRef.current = await signInWithPhoneNumber(auth, formatted, recaptchaRef.current);
      setOtpSent(true);
      setOtp('');
    } catch (err) {
      setError(friendly((err as { code?: string }).code));
    } finally {
      setLoading(null);
    }
  };

  const verifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!confirmRef.current) return;
    setError('');
    setLoading('phone');
    try {
      finish(await confirmRef.current.confirm(otp));
    } catch (err) {
      setError(friendly((err as { code?: string }).code));
    } finally {
      setLoading(null);
    }
  };

  const inputCls =
    'w-full bg-surface-container-low border border-outline/25 rounded-2xl px-5 py-4 text-sm text-on-surface placeholder:text-on-surface/30 outline-none focus:border-primary transition-all';
  const labelCls = 'block text-[9px] uppercase tracking-[0.4em] font-bold text-on-surface/50 mb-2';

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
            className="w-full sm:max-w-4xl bg-surface rounded-t-3xl sm:rounded-3xl overflow-hidden shadow-2xl grid md:grid-cols-[1fr_1.1fr] max-h-[92vh]"
          >
            {/* Brand panel */}
            <div className="hidden md:flex flex-col justify-between bg-forest-section p-10 text-white relative overflow-hidden">
              <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full bg-primary/20 blur-3xl" />
              <Logo onDark />
              <div>
                <p className="font-serif italic text-4xl leading-tight text-white/95">
                  Where the forest
                  <br />
                  becomes home.
                </p>
                <p className="mt-6 text-[10px] uppercase tracking-[0.45em] text-white/40 font-bold">
                  Independent Sanctuary Curators
                </p>
              </div>
              <p className="text-[9px] uppercase tracking-[0.35em] text-white/30">
                Pre-launch access · Exclusive investor pricing
              </p>
            </div>

            {/* Methods */}
            <div className="p-7 sm:p-10 overflow-y-auto">
              <div className="flex items-start justify-between mb-8">
                <div>
                  <p className="text-[9px] uppercase tracking-[0.5em] text-primary/70 font-bold mb-1">
                    Unlock the Sanctuaries
                  </p>
                  <h2 className="text-2xl font-bold text-on-surface">Sign in to The Green Team</h2>
                </div>
                <button
                  onClick={closeAuth}
                  aria-label="Close"
                  className="p-2 rounded-full hover:bg-primary/10 transition-all"
                >
                  <X className="w-5 h-5 text-on-surface/70" />
                </button>
              </div>

              {error && (
                <p className="mb-5 text-sm text-error bg-error/10 border border-error/20 rounded-xl px-4 py-3">
                  {error}
                </p>
              )}

              <button
                onClick={handleGoogle}
                disabled={loading !== null}
                className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl border border-outline/30 bg-surface-container-low hover:border-primary/50 hover:shadow-md transition-all text-sm font-medium text-on-surface disabled:opacity-60"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                  <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
                </svg>
                <span>{loading === 'google' ? 'Connecting…' : 'Continue with Google'}</span>
              </button>

              <div className="flex items-center gap-4 my-6">
                <span className="flex-1 h-px bg-outline/20" />
                <span className="text-[9px] uppercase tracking-[0.4em] text-on-surface/30 font-bold">or</span>
                <span className="flex-1 h-px bg-outline/20" />
              </div>

              {method !== 'email' ? (
                <button
                  onClick={() => setMethod('email')}
                  className="w-full py-3.5 rounded-2xl border border-outline/25 text-on-surface/70 text-sm hover:border-primary/40 hover:text-on-surface transition-all"
                >
                  Continue with Email
                </button>
              ) : (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  onSubmit={handleEmail}
                  className="space-y-4 overflow-hidden"
                >
                  <div>
                    <label htmlFor="auth-email" className={labelCls}>Email</label>
                    <input
                      id="auth-email"
                      name="email"
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="email@domain.com"
                      className={inputCls}
                    />
                  </div>
                  <div>
                    <label htmlFor="auth-password" className={labelCls}>Password</label>
                    <input
                      id="auth-password"
                      name="password"
                      type="password"
                      required
                      minLength={6}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className={inputCls}
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={loading !== null}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-on-primary text-sm font-bold hover:opacity-95 transition-all disabled:opacity-60"
                  >
                    <ArrowRight className="w-4 h-4" />
                    {loading === 'email' ? 'Please wait…' : emailMode === 'signin' ? 'Sign In' : 'Create Account'}
                  </button>
                  <p className="text-center text-xs text-on-surface/50">
                    {emailMode === 'signin' ? "Don't have an account?" : 'Have an account?'}{' '}
                    <button
                      type="button"
                      onClick={() => setEmailMode(m => (m === 'signin' ? 'signup' : 'signin'))}
                      className="font-bold text-primary underline-offset-2 hover:underline"
                    >
                      {emailMode === 'signin' ? 'Sign Up' : 'Sign In'}
                    </button>
                  </p>
                </motion.form>
              )}

              <div className="h-4" />

              {method !== 'phone' ? (
                <button
                  onClick={() => setMethod('phone')}
                  className="w-full py-3.5 rounded-2xl border border-outline/25 text-on-surface/70 text-sm hover:border-primary/40 hover:text-on-surface transition-all"
                >
                  Continue with Phone
                </button>
              ) : (
                <motion.form
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  onSubmit={otpSent ? verifyOtp : sendOtp}
                  className="space-y-4 overflow-hidden"
                >
                  {!otpSent ? (
                    <div>
                      <label htmlFor="auth-phone" className={labelCls}>Phone Number</label>
                      <input
                        id="auth-phone"
                        name="phone"
                        type="tel"
                        required
                        value={phone}
                        onChange={e => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                        className={inputCls}
                      />
                      <p className="mt-2 text-[10px] text-on-surface/40">We&apos;ll send you an OTP to verify</p>
                    </div>
                  ) : (
                    <div>
                      <label htmlFor="auth-otp" className={labelCls}>Enter OTP</label>
                      <input
                        id="auth-otp"
                        name="otp"
                        inputMode="numeric"
                        required
                        maxLength={6}
                        value={otp}
                        onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                        placeholder="6-digit code"
                        className={`${inputCls} tracking-[0.6em] text-center font-bold`}
                      />
                    </div>
                  )}
                  <button
                    type="submit"
                    disabled={loading !== null}
                    className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-on-primary text-sm font-bold hover:opacity-95 transition-all disabled:opacity-60"
                  >
                    <Send className="w-4 h-4" />
                    {loading === 'phone'
                      ? otpSent ? 'Verifying…' : 'Sending OTP…'
                      : otpSent ? 'Verify OTP' : 'Send OTP'}
                  </button>
                  {otpSent && (
                    <button
                      type="button"
                      onClick={() => { setOtpSent(false); setOtp(''); }}
                      className="w-full text-center text-xs text-on-surface/50 hover:text-on-surface transition-colors"
                    >
                      Change number / resend
                    </button>
                  )}
                </motion.form>
              )}

              <p className="mt-8 text-center text-[9px] uppercase tracking-[0.3em] text-on-surface/25 leading-relaxed">
                By continuing, you agree to our terms.
                <br />
                We never spam — only sanctuary intelligence.
              </p>
            </div>
          </motion.div>
          <div id="recaptcha-container" />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
