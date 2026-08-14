'use client';

/**
 * First-visit prompt — one unified funnel: sign in with Google (full access)
 * or drop an email for the newsletter. Shows once, after a short delay, and
 * never again after dismissal, subscription, or sign-in.
 */
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X, Check } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

const SEEN_KEY = 'gt_welcome_v2';

export function WelcomeGate() {
  const { user, authReady, openAuth } = useAuth();
  const [show, setShow] = useState(false);
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (!authReady || user) return;
    try {
      if (localStorage.getItem(SEEN_KEY) || localStorage.getItem('gt_subscribed') === 'true') return;
    } catch {}
    const t = setTimeout(() => setShow(true), 6000);
    return () => clearTimeout(t);
  }, [authReady, user]);

  const dismiss = () => {
    setShow(false);
    try {
      localStorage.setItem(SEEN_KEY, '1');
    } catch {}
  };

  const subscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'modal' }),
      });
      if (!res.ok) throw new Error();
      setDone(true);
      try {
        localStorage.setItem('gt_subscribed', 'true');
        localStorage.setItem(SEEN_KEY, '1');
      } catch {}
      setTimeout(() => setShow(false), 1800);
    } catch {
      setBusy(false);
    }
  };

  return (
    <AnimatePresence>
      {show && !user && (
        <motion.div
          initial={{ opacity: 0, y: 60 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 60 }}
          transition={{ type: 'spring', damping: 26, stiffness: 260 }}
          className="fixed bottom-20 md:bottom-6 inset-x-3 md:inset-x-auto md:right-6 md:w-[380px] z-[9970] rounded-3xl bg-forest-section text-white shadow-2xl border border-white/10 p-6"
        >
          <button onClick={dismiss} aria-label="Dismiss" className="absolute top-3.5 right-3.5 p-1.5 rounded-full hover:bg-white/10 transition-all">
            <X className="w-4 h-4 text-white/60" />
          </button>
          {done ? (
            <div className="flex items-center gap-3 py-2">
              <span className="w-9 h-9 rounded-full border border-[#c8a951]/50 flex items-center justify-center">
                <Check className="w-4 h-4 text-[#c8a951]" />
              </span>
              <p className="font-headline font-bold">You&apos;re in — welcome to the circle.</p>
            </div>
          ) : (
            <>
              <p className="text-[8px] uppercase tracking-[0.5em] font-bold text-[#a3b18a] mb-2">The Green Team</p>
              <p className="font-headline font-bold text-lg leading-snug mb-1.5">
                Unlock all three sanctuaries
              </p>
              <p className="text-sm text-white/50 mb-5">
                One Google sign-in gets you every price, plot and briefing — Agartha, SYL &amp; Dates County.
              </p>
              <button
                onClick={() => {
                  dismiss();
                  openAuth();
                }}
                className="w-full py-3.5 rounded-2xl bg-[#a3b18a] text-[#0a1208] text-[10px] uppercase tracking-[0.35em] font-bold hover:bg-[#b8c8a0] transition-all"
              >
                Continue with Google
              </button>
              <div className="flex items-center gap-3 my-3.5">
                <span className="flex-1 h-px bg-white/10" />
                <span className="text-[8px] uppercase tracking-[0.3em] text-white/30 font-bold">or just the newsletter</span>
                <span className="flex-1 h-px bg-white/10" />
              </div>
              <form onSubmit={subscribe} className="flex gap-2">
                <input
                  type="email"
                  required
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="you@gmail.com"
                  className="flex-1 min-w-0 bg-white/5 border border-white/15 rounded-xl px-4 py-3 text-sm placeholder:text-white/25 outline-none focus:border-[#a3b18a]/60 transition-all"
                />
                <button
                  type="submit"
                  disabled={busy}
                  className="px-4 py-3 rounded-xl border border-[#c8a951]/40 text-[#c8a951] text-[9px] uppercase tracking-widest font-bold hover:bg-[#c8a951]/10 transition-all disabled:opacity-50"
                >
                  {busy ? '…' : 'Join'}
                </button>
              </form>
            </>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
