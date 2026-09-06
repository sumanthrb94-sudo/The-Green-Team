'use client';

/**
 * Sign-in / sign-up — built to feel like a native app screen, not a web modal:
 * full-bleed on a phone, a segmented Sign in / Create account control, a
 * +91 phone step, and six separate OTP boxes that auto-advance, accept a
 * pasted code and submit themselves on the sixth digit.
 *
 * On the sign-up vs sign-in distinction: Firebase has no safe way to ask
 * "does this number already exist?" before sending a code — a lookup like that
 * is an account-enumeration oracle, which is why the SDK does not expose one.
 * So the toggle sets intent and wording, the same verification runs either way,
 * and afterwards `getAdditionalUserInfo().isNewUser` tells us authoritatively
 * what actually happened. If someone picks the wrong one we say so plainly and
 * carry on rather than making them start again.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  RecaptchaVerifier,
  getAdditionalUserInfo,
  signInWithPhoneNumber,
  signInWithPopup,
  signInWithRedirect,
  type ConfirmationResult,
  type UserCredential,
} from 'firebase/auth';
import { X, ChevronLeft, ArrowRight, Smartphone } from 'lucide-react';
import { auth, googleProvider } from '@/lib/firebase/client';
import { useAuth } from './AuthProvider';
import { AnimatedMark } from '@/components/brand/AnimatedMark';
import { cn } from '@/lib/utils';

const FRIENDLY: Record<string, string> = {
  'auth/popup-closed-by-user': 'Sign-in was cancelled.',
  'auth/popup-blocked': 'Pop-up blocked — trying a redirect instead…',
  'auth/too-many-requests': 'Too many attempts. Please wait a moment and retry.',
  'auth/network-request-failed': 'Network error — check your connection.',
  'auth/unauthorized-domain': 'This domain is not authorised for sign-in.',
  'auth/operation-not-allowed': 'Phone sign-in is not enabled yet — please use Google for now.',
  'auth/invalid-phone-number': "That number doesn't look right — enter a 10-digit mobile number.",
  'auth/missing-phone-number': 'Enter your mobile number first.',
  'auth/invalid-verification-code': "That code isn't right. Check the SMS and try again.",
  'auth/code-expired': 'That code has expired — request a new one.',
  'auth/quota-exceeded': 'SMS limit reached for now. Please use Google sign-in, or try again later.',
  'auth/captcha-check-failed': 'Verification failed — please try again.',
};
const friendly = (c?: string) => (c && FRIENDLY[c]) || 'Something went wrong. Please try again.';

const isInApp = () =>
  typeof navigator !== 'undefined' &&
  /Instagram|FBAN|FBAV|LinkedInApp|TikTok|MicroMessenger|Line\//i.test(navigator.userAgent);

function toE164India(raw: string): string | null {
  let d = raw.replace(/\D/g, '');
  if (d.length === 12 && d.startsWith('91')) d = d.slice(2);
  if (d.length === 11 && d.startsWith('0')) d = d.slice(1);
  return /^[6-9]\d{9}$/.test(d) ? `+91${d}` : null;
}
const pretty = (e: string) => `${e.slice(0, 3)} ${e.slice(3, 8)} ${e.slice(8)}`;

const RECAPTCHA_ID = 'gt-recaptcha';
const RESEND_SECONDS = 30;
type Mode = 'signin' | 'signup';

export function AuthModal() {
  const { authModalOpen, closeAuth, onSignedIn } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [phone, setPhone] = useState('');
  const [e164, setE164] = useState('');
  const [digits, setDigits] = useState<string[]>(Array(6).fill(''));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [cooldown, setCooldown] = useState(0);
  const confirmation = useRef<ConfirmationResult | null>(null);
  const verifier = useRef<RecaptchaVerifier | null>(null);
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const code = digits.join('');

  const teardown = useCallback(() => {
    try { verifier.current?.clear(); } catch {}
    verifier.current = null;
  }, []);

  useEffect(() => {
    if (!authModalOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && closeAuth();
    window.addEventListener('keydown', onKey);
    document.body.classList.add('modal-open');
    return () => { window.removeEventListener('keydown', onKey); document.body.classList.remove('modal-open'); };
  }, [authModalOpen, closeAuth]);

  useEffect(() => {
    if (authModalOpen) return;
    setStep('phone'); setPhone(''); setE164(''); setDigits(Array(6).fill(''));
    setError(''); setNotice(''); setLoading(false); setCooldown(0);
    confirmation.current = null; teardown();
  }, [authModalOpen, teardown]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  useEffect(() => { if (step === 'otp') setTimeout(() => boxes.current[0]?.focus(), 80); }, [step]);

  const finish = useCallback((cred: UserCredential) => {
    const isNew = getAdditionalUserInfo(cred)?.isNewUser ?? false;
    // Say plainly when what happened differs from what they picked.
    if (mode === 'signin' && isNew) setNotice('No account existed for that number, so we created one.');
    if (mode === 'signup' && !isNew) setNotice('You already had an account — signed you in.');
    onSignedIn(cred.user, isNew);
  }, [mode, onSignedIn]);

  const getVerifier = () => {
    if (!verifier.current) verifier.current = new RecaptchaVerifier(auth, RECAPTCHA_ID, { size: 'invisible' });
    return verifier.current;
  };

  const sendOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setError(''); setNotice('');
    const n = toE164India(phone);
    if (!n) { setError(FRIENDLY['auth/invalid-phone-number']); return; }
    setLoading(true);
    try {
      confirmation.current = await signInWithPhoneNumber(auth, n, getVerifier());
      setE164(n); setDigits(Array(6).fill('')); setStep('otp'); setCooldown(RESEND_SECONDS);
    } catch (err) {
      setError(friendly((err as { code?: string }).code));
      teardown();
    } finally { setLoading(false); }
  };

  const verify = useCallback(async (value: string) => {
    if (value.length !== 6 || !confirmation.current || loading) return;
    setError(''); setLoading(true);
    try {
      finish(await confirmation.current.confirm(value));
    } catch (err) {
      setError(friendly((err as { code?: string }).code));
      setDigits(Array(6).fill(''));
      setTimeout(() => boxes.current[0]?.focus(), 50);
    } finally { setLoading(false); }
  }, [finish, loading]);

  const setDigit = (i: number, raw: string) => {
    const v = raw.replace(/\D/g, '');
    if (!v) { const next = [...digits]; next[i] = ''; setDigits(next); return; }
    const next = [...digits];
    if (v.length > 1) {                         // pasted code
      for (let k = 0; k < 6 - i; k++) next[i + k] = v[k] ?? '';
      setDigits(next);
      const last = Math.min(i + v.length, 5);
      boxes.current[last]?.focus();
      if (next.join('').length === 6) void verify(next.join(''));
      return;
    }
    next[i] = v;
    setDigits(next);
    if (i < 5) boxes.current[i + 1]?.focus();
    if (next.join('').length === 6) void verify(next.join(''));
  };

  const onKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !digits[i] && i > 0) boxes.current[i - 1]?.focus();
    if (e.key === 'ArrowLeft' && i > 0) boxes.current[i - 1]?.focus();
    if (e.key === 'ArrowRight' && i < 5) boxes.current[i + 1]?.focus();
  };

  const google = async () => {
    setError(''); setNotice(''); setLoading(true);
    try {
      if (isInApp()) { await signInWithRedirect(auth, googleProvider); return; }
      finish(await signInWithPopup(auth, googleProvider));
    } catch (err) {
      const c = (err as { code?: string }).code;
      if (c === 'auth/popup-blocked' || c === 'auth/popup-closed-by-user') {
        try { await signInWithRedirect(auth, googleProvider); return; } catch {}
      }
      setError(friendly(c));
    } finally { setLoading(false); }
  };

  const signup = mode === 'signup';

  return (
    <AnimatePresence>
      {authModalOpen && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[9998] flex sm:items-center sm:justify-center bg-black/60 sm:backdrop-blur-md sm:p-6"
          onClick={e => { if (e.target === e.currentTarget) closeAuth(); }}
        >
          {/* Full-bleed sheet on a phone, a card from `sm` up */}
          <motion.div
            initial={{ y: '100%', opacity: 1 }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
            onClick={e => e.stopPropagation()}
            role="dialog" aria-modal="true" aria-label={signup ? 'Create account' : 'Sign in'}
            className="relative w-full h-[100dvh] sm:h-auto sm:max-w-md bg-surface sm:rounded-3xl overflow-y-auto flex flex-col sm:shadow-2xl"
          >
            <div id={RECAPTCHA_ID} />

            {/* App-style top bar */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-4 h-14 bg-surface/95 backdrop-blur-xl border-b border-outline/10 flex-shrink-0">
              {step === 'otp' ? (
                <button
                  onClick={() => { setStep('phone'); setError(''); }}
                  aria-label="Back"
                  className="w-10 h-10 -ml-2 rounded-full flex items-center justify-center text-on-surface/70 hover:bg-primary/8 transition-colors"
                >
                  <ChevronLeft className="w-6 h-6" />
                </button>
              ) : (
                <span />
              )}
              <button
                onClick={closeAuth}
                aria-label="Close"
                className="w-10 h-10 -mr-2 rounded-full flex items-center justify-center text-on-surface/60 hover:bg-primary/8 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 px-6 pt-6 pb-8 flex flex-col">
              {step === 'phone' ? (
                <>
                  {/* The mark assembles itself, the way it does at launch — the
                      same drawing and the same keyframes, so the door into the
                      app is recognisably the app. Everything below is unchanged. */}
                  <div className="flex flex-col items-center mb-7">
                    <AnimatedMark
                      id="gt-auth"
                      className="w-16 h-16"
                      back="#2d3a1d"
                      front="#2d3a1d"
                      highlight="#4a5c35"
                      breathe={false}
                    />
                    <div className="gt-splash">
                      <p
                        className="gt-up mt-4 font-headline font-extrabold tracking-[0.28em] text-[10px] text-on-surface/70"
                        style={{ animationDelay: '1.3s' }}
                      >
                        THE GREEN TEAM
                      </p>
                    </div>
                  </div>

                  {/* Segmented control */}
                  <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-surface-container border border-outline/10 mb-7">
                    {(['signin', 'signup'] as Mode[]).map(m => (
                      <button
                        key={m}
                        onClick={() => { setMode(m); setError(''); setNotice(''); }}
                        aria-pressed={mode === m}
                        className={cn(
                          'py-3 rounded-full text-[11px] uppercase tracking-[0.2em] font-bold transition-all',
                          mode === m ? 'bg-primary text-on-primary shadow-sm' : 'text-secondary/70',
                        )}
                      >
                        {m === 'signin' ? 'Sign in' : 'Create account'}
                      </button>
                    ))}
                  </div>

                  <h2 className="font-headline font-extrabold tracking-[-0.02em] text-3xl text-on-surface leading-tight">
                    {signup ? 'Create your account.' : 'Welcome back.'}
                  </h2>
                  <p className="text-secondary mt-2.5 mb-8 leading-relaxed">
                    {signup
                      ? 'Members see the price of every plot and villament, and can save a shortlist.'
                      : 'Enter your mobile number and we will text you a code.'}
                  </p>

                  {error && <p className="mb-5 text-sm text-error bg-error/10 border border-error/20 rounded-2xl px-4 py-3">{error}</p>}

                  <form onSubmit={sendOtp} className="space-y-4">
                    <div className="flex items-stretch gap-2">
                      <span className="flex items-center gap-2 px-4 rounded-2xl bg-surface-container border border-outline/20 text-on-surface font-semibold flex-shrink-0">
                        <Smartphone className="w-4 h-4 text-primary/70" /> +91
                      </span>
                      <input
                        type="tel" inputMode="numeric" autoComplete="tel-national" autoFocus
                        aria-label="Mobile number"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/[^\d\s]/g, '').slice(0, 12))}
                        placeholder="98765 43210"
                        className="flex-1 min-w-0 h-16 px-5 rounded-2xl bg-surface-container border border-outline/20 text-xl tracking-wide text-on-surface placeholder:text-secondary/35 outline-none focus:border-primary/60 transition-colors"
                      />
                    </div>
                    <button
                      type="submit" disabled={loading}
                      className="w-full flex items-center justify-center gap-2 h-16 rounded-2xl bg-primary text-on-primary text-[11px] uppercase tracking-[0.3em] font-bold hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-60"
                    >
                      {loading ? 'Sending code…' : signup ? 'Create account' : 'Send OTP'}
                      {!loading && <ArrowRight className="w-4 h-4" />}
                    </button>
                  </form>

                  <div className="flex items-center gap-4 my-7">
                    <span className="flex-1 h-px bg-outline/15" />
                    <span className="text-[9px] uppercase tracking-[0.3em] text-secondary/50 font-bold">or</span>
                    <span className="flex-1 h-px bg-outline/15" />
                  </div>

                  <button
                    onClick={google} disabled={loading}
                    className="w-full flex items-center justify-center gap-3 h-16 rounded-2xl border border-outline/25 bg-surface-container-low text-sm font-semibold text-on-surface hover:border-primary/40 active:scale-[0.99] transition-all disabled:opacity-60"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden>
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.27-4.74 3.27-8.1Z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23Z" />
                      <path fill="#FBBC05" d="M5.84 14.1a6.6 6.6 0 0 1 0-4.2V7.06H2.18a11 11 0 0 0 0 9.88l3.66-2.84Z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1A11 11 0 0 0 2.18 7.06l3.66 2.84C6.71 7.3 9.14 5.38 12 5.38Z" />
                    </svg>
                    Continue with Google
                  </button>

                  <p className="mt-auto pt-8 text-center text-[10px] uppercase tracking-[0.25em] text-secondary/40 leading-relaxed">
                    By continuing you agree to our terms.
                    <br />We never spam — only sanctuary intelligence.
                  </p>
                </>
              ) : (
                <>
                  <h2 className="font-headline font-extrabold tracking-[-0.02em] text-3xl text-on-surface leading-tight">
                    Enter the code.
                  </h2>
                  <p className="text-secondary mt-2.5 mb-8">
                    Sent by SMS to <span className="font-semibold text-on-surface">{pretty(e164)}</span>.
                  </p>

                  {error && <p className="mb-5 text-sm text-error bg-error/10 border border-error/20 rounded-2xl px-4 py-3">{error}</p>}

                  {/* Six boxes: auto-advance, paste-aware, self-submitting */}
                  <div className="flex gap-2 justify-between" onPaste={e => { e.preventDefault(); setDigit(0, e.clipboardData.getData('text')); }}>
                    {digits.map((d, i) => (
                      <input
                        key={i}
                        ref={el => { boxes.current[i] = el; }}
                        value={d}
                        onChange={e => setDigit(i, e.target.value)}
                        onKeyDown={e => onKeyDown(i, e)}
                        onFocus={e => e.target.select()}
                        type="tel" inputMode="numeric"
                        autoComplete={i === 0 ? 'one-time-code' : 'off'}
                        maxLength={6}
                        aria-label={`Digit ${i + 1}`}
                        className={cn(
                          'w-full aspect-square min-w-0 rounded-2xl border text-center text-2xl font-headline font-extrabold text-on-surface bg-surface-container outline-none transition-all',
                          d ? 'border-primary/60' : 'border-outline/20',
                          'focus:border-primary focus:ring-4 focus:ring-primary/10',
                        )}
                      />
                    ))}
                  </div>

                  <button
                    onClick={() => void verify(code)}
                    disabled={loading || code.length !== 6}
                    className="w-full h-16 mt-6 rounded-2xl bg-primary text-on-primary text-[11px] uppercase tracking-[0.3em] font-bold hover:opacity-90 active:scale-[0.99] transition-all disabled:opacity-40"
                  >
                    {loading ? 'Verifying…' : signup ? 'Create account' : 'Verify & sign in'}
                  </button>

                  <p className="mt-6 text-center text-sm text-secondary/70">
                    {cooldown > 0 ? `Resend code in ${cooldown}s` : (
                      <button onClick={() => sendOtp()} disabled={loading} className="font-semibold text-primary hover:underline underline-offset-4 disabled:opacity-60">
                        Resend code
                      </button>
                    )}
                  </p>
                </>
              )}

              {notice && (
                <p className="mt-6 text-sm text-primary bg-primary/8 border border-primary/20 rounded-2xl px-4 py-3">{notice}</p>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
