'use client';

/**
 * Sign-in modal — mobile number (SMS OTP) first, Google second.
 *
 * Phone leads because this is an Indian property portal: a buyer's mobile
 * number is the identity they actually use, and it's also the one thing the
 * adviser needs. It works inside Instagram/Facebook webviews too (no popup),
 * which is where most of the reel traffic lands. Google stays as the one-tap
 * alternative, with a redirect fallback for blocked popups.
 *
 * Firebase requires an (invisible) reCAPTCHA for web phone auth. The verifier
 * is created lazily on first send and torn down on close/error, because a
 * widget that has already failed once tends to stay stuck.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  RecaptchaVerifier,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithRedirect,
  type ConfirmationResult,
  type User,
  type UserCredential,
} from 'firebase/auth';
import { X, Smartphone, ArrowRight, ChevronLeft } from 'lucide-react';
import { auth, googleProvider } from '@/lib/firebase/client';
import { useAuth } from './AuthProvider';
import { Logo } from '@/components/brand/Logo';

const FRIENDLY: Record<string, string> = {
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/popup-blocked': 'Pop-up blocked — trying a redirect instead…',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and retry.',
  'auth/network-request-failed': 'Network error — check your connection.',
  'auth/unauthorized-domain': 'This domain is not authorised for sign-in.',
  'auth/operation-not-allowed': 'This sign-in method is not enabled yet — please use Google for now.',
  'auth/invalid-phone-number': "That number doesn't look right — enter a 10-digit mobile number.",
  'auth/missing-phone-number': 'Enter your mobile number first.',
  'auth/invalid-verification-code': "That code isn't right. Check the SMS and try again.",
  'auth/code-expired': 'That code has expired — request a new one.',
  'auth/quota-exceeded': 'SMS limit reached for now. Please use Google sign-in, or try again later.',
  'auth/captcha-check-failed': 'Verification failed — please try again.',
};
const friendly = (code?: string) => (code && FRIENDLY[code]) || 'Something went wrong. Please try again.';

const isInAppBrowser = () =>
  typeof navigator !== 'undefined' &&
  /Instagram|FBAN|FBAV|LinkedInApp|TikTok|MicroMessenger|Line\//i.test(navigator.userAgent);

const wasNew = (u: User) => u.metadata.creationTime === u.metadata.lastSignInTime;

/** Normalise what an Indian buyer types into E.164, or null if it isn't a mobile number. */
function toE164India(raw: string): string | null {
  let d = raw.replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? `+91${d}` : null;
}

const prettyPhone = (e164: string) => `${e164.slice(0, 3)} ${e164.slice(3, 8)} ${e164.slice(8)}`;

const RECAPTCHA_ID = 'gt-recaptcha';
const RESEND_SECONDS = 30;

export function AuthModal() {
  const { authModalOpen, closeAuth, onSignedIn } = useAuth();
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [e164, setE164] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const confirmation = useRef<ConfirmationResult | null>(null);
  const verifier = useRef<RecaptchaVerifier | null>(null);
  const otpInput = useRef<HTMLInputElement>(null);

  const teardownRecaptcha = useCallback(() => {
    try {
      verifier.current?.clear();
    } catch {}
    verifier.current = null;
  }, []);

  useEffect(() => {
    if (!authModalOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeAuth();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [authModalOpen, closeAuth]);

  // Reset everything when the modal closes.
  useEffect(() => {
    if (authModalOpen) return;
    setStep('phone');
    setPhone('');
    setE164('');
    setOtp('');
    setError('');
    setLoading(false);
    setCooldown(0);
    confirmation.current = null;
    teardownRecaptcha();
  }, [authModalOpen, teardownRecaptcha]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => {
    if (step === 'otp') setTimeout(() => otpInput.current?.focus(), 50);
  }, [step]);

  const finish = useCallback(
    (cred: UserCredential) => onSignedIn(cred.user, wasNew(cred.user)),
    [onSignedIn]
  );

  const getVerifier = () => {
    if (!verifier.current) {
      verifier.current = new RecaptchaVerifier(auth, RECAPTCHA_ID, { size: 'invisible' });
    }
    return verifier.current;
  };

  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    const normalised = toE164India(phone);
    if (!normalised) {
      setError(FRIENDLY['auth/invalid-phone-number']);
      return;
    }
    setLoading(true);
    try {
      confirmation.current = await signInWithPhoneNumber(auth, normalised, getVerifier());
      setE164(normalised);
      setOtp('');
      setStep('otp');
      setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(friendly((err as { code?: string }).code));
      teardownRecaptcha(); // a failed widget must be rebuilt, not reused
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError('');
    const code = otp.replace(/\D/g, '');
    if (code.length !== 6 || !confirmation.current) {
      setError(FRIENDLY['auth/invalid-verification-code']);
      return;
    }
    setLoading(true);
    try {
      finish(await confirmation.current.confirm(code));
    } catch (err) {
      setError(friendly((err as { code?: string }).code));
    } finally {
      setLoading(false);
    }
  };

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

  const input =
    'w-full bg-surface-container border border-outline/20 rounded-2xl py-4 text-on-surface placeholder:text-secondary/40 outline-none focus:border-primary/60 transition-all';

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
            role="dialog"
            aria-modal="true"
            aria-label="Sign in"
          >
            <div className="bg-forest-section p-7 sm:p-8 text-white relative overflow-hidden">
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
              <p className="mt-7 font-headline font-extrabold tracking-[-0.02em] text-3xl leading-[1.0] text-white">
                Where the forest
                <br />
                <span className="text-[#a3b18a]">becomes home.</span>
              </p>
            </div>

            <div className="p-7 sm:p-8">
              {/* Firebase mounts the invisible reCAPTCHA here */}
              <div id={RECAPTCHA_ID} />

              {step === 'phone' ? (
                <>
                  <h2 className="text-xl font-bold text-on-surface mb-1">Sign in to The Green Team</h2>
                  <p className="text-sm text-on-surface/50 mb-6">
                    Your mobile number, one code. Full access to every sanctuary.
                  </p>

                  {error && (
                    <p className="mb-5 text-sm text-error bg-error/10 border border-error/20 rounded-xl px-4 py-3">
                      {error}
                    </p>
                  )}

                  <form onSubmit={sendOtp} className="space-y-3">
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2 text-sm font-semibold text-on-surface/70 pointer-events-none">
                        <Smartphone className="w-4 h-4 text-primary/70" /> +91
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        autoComplete="tel-national"
                        aria-label="Mobile number"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/[^\d\s]/g, '').slice(0, 13))}
                        placeholder="98765 43210"
                        className={`${input} pl-[5.25rem] pr-4 text-base tracking-wide`}
                      />
                    </div>
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-on-primary text-[10px] uppercase tracking-[0.35em] font-bold hover:opacity-90 transition-all disabled:opacity-60"
                    >
                      {loading ? 'Sending code…' : 'Send OTP'}
                      {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </form>

                  <div className="flex items-center gap-4 my-5">
                    <span className="flex-1 h-px bg-outline/15" />
                    <span className="text-[9px] uppercase tracking-[0.3em] text-secondary/50 font-bold">or</span>
                    <span className="flex-1 h-px bg-outline/15" />
                  </div>

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
                    <span>Continue with Google</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => { setStep('phone'); setError(''); setOtp(''); }}
                    className="inline-flex items-center gap-1 text-[10px] uppercase tracking-[0.25em] font-bold text-secondary/60 hover:text-primary transition-colors mb-4"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" /> Change number
                  </button>
                  <h2 className="text-xl font-bold text-on-surface mb-1">Enter the code</h2>
                  <p className="text-sm text-on-surface/50 mb-6">
                    We sent a 6-digit code by SMS to <span className="font-semibold text-on-surface/80">{prettyPhone(e164)}</span>.
                  </p>

                  {error && (
                    <p className="mb-5 text-sm text-error bg-error/10 border border-error/20 rounded-xl px-4 py-3">
                      {error}
                    </p>
                  )}

                  <form onSubmit={verifyOtp} className="space-y-3">
                    <input
                      ref={otpInput}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      aria-label="6-digit code"
                      value={otp}
                      onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      placeholder="••••••"
                      className={`${input} px-4 text-center text-2xl font-headline font-extrabold tracking-[0.5em]`}
                    />
                    <button
                      type="submit"
                      disabled={loading || otp.length !== 6}
                      className="w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-on-primary text-[10px] uppercase tracking-[0.35em] font-bold hover:opacity-90 transition-all disabled:opacity-50"
                    >
                      {loading ? 'Verifying…' : 'Verify & continue'}
                    </button>
                  </form>

                  <p className="mt-5 text-center text-sm text-secondary/70">
                    {cooldown > 0 ? (
                      <>Resend code in {cooldown}s</>
                    ) : (
                      <button
                        onClick={() => sendOtp()}
                        disabled={loading}
                        className="font-semibold text-primary hover:underline underline-offset-4 disabled:opacity-60"
                      >
                        Resend code
                      </button>
                    )}
                  </p>
                </>
              )}

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
