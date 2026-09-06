'use client';

/**
 * First-visit prompt — one job: get a visitor to sign in, because a member sees
 * per-unit pricing and a stranger does not.
 *
 * It used to carry a second email box for the newsletter under an "or just the
 * newsletter" divider. Two asks in one popup is two ways to fail, and it made
 * the newsletter a thing we shouted at people on arrival. Subscribing now lives
 * in the footer, on every page, where someone chooses it rather than being
 * interrupted by it. Shows once, after a delay, never again after dismissal or
 * sign-in.
 */
import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { X } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';

const SEEN_KEY = 'gt_welcome_v2';

export function WelcomeGate() {
  const { user, authReady, openAuth } = useAuth();
  const [show, setShow] = useState(false);

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
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="absolute top-3.5 right-3.5 p-1.5 rounded-full hover:bg-white/10 transition-all"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
          <p className="text-[8px] uppercase tracking-[0.5em] font-bold text-[#a3b18a] mb-2">The Green Team</p>
          <p className="font-headline font-bold text-lg leading-snug mb-1.5">Unlock all three sanctuaries</p>
          <p className="text-sm text-white/50 mb-5">
            One sign-in gets you every price, plot and briefing — Agartha, SYL &amp; Dates County.
          </p>
          <button
            onClick={() => {
              dismiss();
              openAuth();
            }}
            className="w-full py-3.5 rounded-2xl bg-[#a3b18a] text-[#0a1208] text-[10px] uppercase tracking-[0.35em] font-bold hover:bg-[#b8c8a0] transition-all"
          >
            Sign in / Join
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
