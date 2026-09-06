'use client';

/**
 * The consent ask.
 *
 * Two things make it lawful rather than decorative. Refusing is exactly as
 * prominent and exactly as quick as accepting — no greyed-out "manage
 * preferences" maze, no pre-selected toggles — and nothing is measured before
 * the answer, so the page has already loaded without analytics by the time this
 * appears. Dismissing it without answering is not consent: the banner comes
 * back next visit.
 */
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'motion/react';
import { Cookie } from 'lucide-react';
import { readConsent, writeConsent, onConsentChange, type ConsentState } from '@/lib/consent';

export function ConsentBanner() {
  const [state, setState] = useState<ConsentState>('granted'); // assume answered until we can check
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(readConsent());
    setReady(true);
    return onConsentChange(setState);
  }, []);

  const answer = (choice: 'granted' | 'denied') => {
    writeConsent(choice);
    setState(choice);
  };

  return (
    <AnimatePresence>
      {ready && state === 'unknown' && (
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 24 }}
          transition={{ type: 'spring', damping: 28, stiffness: 300 }}
          role="dialog"
          aria-modal="false"
          aria-label="Cookie choice"
          className="fixed bottom-20 md:bottom-5 inset-x-3 md:inset-x-5 z-[9980] mx-auto max-w-3xl rounded-2xl bg-surface border border-outline/20 shadow-2xl p-5 md:p-6"
        >
          <div className="flex flex-col md:flex-row md:items-center gap-5">
            <div className="flex items-start gap-3 min-w-0 flex-1">
              <Cookie className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" aria-hidden />
              <p className="text-sm text-on-surface/85 leading-relaxed">
                We would like to count visits so we can see which pages work. Nothing is measured
                unless you say yes, we run no advertising trackers, and refusing costs you nothing
                here.{' '}
                <Link href="/cookies" className="text-primary hover:underline underline-offset-4 whitespace-nowrap">
                  What we&apos;d set
                </Link>
              </p>
            </div>
            {/* Equal weight on purpose: a refusal must be as easy as a consent. */}
            <div className="grid grid-cols-2 gap-2.5 md:flex md:flex-shrink-0">
              <button
                onClick={() => answer('denied')}
                className="px-6 py-3 rounded-full border border-outline/30 text-on-surface/75 text-[10px] uppercase tracking-[0.25em] font-bold hover:border-outline/60 hover:text-on-surface transition-all"
              >
                No thanks
              </button>
              <button
                onClick={() => answer('granted')}
                className="px-6 py-3 rounded-full bg-primary text-on-primary text-[10px] uppercase tracking-[0.25em] font-bold hover:opacity-90 transition-all"
              >
                Accept
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
