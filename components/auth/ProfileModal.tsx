'use client';

/**
 * Post-sign-up profile capture — it asks for whatever the sign-in method did
 * not already give us, and nothing more.
 *
 * Google hands over a verified email and a name but no phone, so we ask for the
 * phone and everything here is optional; we can already reach that member.
 *
 * Phone OTP hands over a number and nothing else, and a member we cannot email
 * gets no welcome, no pricing sheet, no site-visit confirmation and never
 * reaches the Members segment. So when there is no address on the account the
 * email field is emphasised and the copy says plainly what skipping costs.
 *
 * It is emphasised, not mandatory. An earlier version had no way past this step
 * — no Skip, no close, no dismissing the backdrop — and the first traceable
 * lead the site ever produced showed what that costs. He arrived from Google,
 * read the whole Agartha page, signed up by OTP to see the price sheet, hit
 * this modal, and left for WhatsApp sixty-six seconds later without ever seeing
 * a price. His opening message asked for the pricing this modal was standing in
 * front of.
 *
 * A wall in front of someone who has already given us a working phone number
 * buys an email we could have asked for later, at the price of the thing they
 * actually came for. So it asks once per session, states the cost, and lets
 * them past.
 */
import { useCallback, useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, X } from 'lucide-react';
import { useAuth } from './AuthProvider';
import { sendEvent } from '@/lib/analytics/beacon';

export function ProfileModal() {
  const { user, profileModalOpen, closeProfile, refreshUser } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [occupation, setOccupation] = useState('');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const needsEmail = Boolean(user && !user.email);
  const needsPhone = Boolean(user && !user.phoneNumber);

  /**
   * Closing without giving an address is recorded, because letting people past
   * this step is a trade — an email now against the page they came for — and
   * the only way to know whether it was the right trade is to count both sides.
   * `profile_email_skipped` against `sign_up` is that ratio.
   */
  const dismiss = useCallback(() => {
    if (needsEmail) sendEvent('profile_email_skipped');
    closeProfile();
  }, [needsEmail, closeProfile]);

  /** Escape closes it, like any other dialog. Nothing here is worth trapping someone in. */
  useEffect(() => {
    if (!profileModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') dismiss();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [profileModalOpen, dismiss]);

  const save = async () => {
    if (!user) return closeProfile();
    const mail = email.trim().toLowerCase();
    if (needsEmail) {
      if (!mail) {
        setError('We need an email address to send you pricing and confirmations.');
        return;
      }
      if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(mail)) {
        setError("That email doesn't look right.");
        return;
      }
    }
    setError('');
    setSaving(true);
    try {
      const idToken = await user.getIdToken();
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          ...(name.trim() ? { name: name.trim() } : {}),
          ...(needsEmail && mail ? { email: mail } : {}),
          ...(phone.trim() ? { phone: phone.trim() } : {}),
          ...(occupation.trim() ? { occupation: occupation.trim() } : {}),
          ...(city.trim() ? { city: city.trim() } : {}),
        }),
      });
      // Someone who typed an address and pressed save meant it, so a failed
      // write keeps the dialog open and says so rather than closing silently
      // and losing what they entered. Dismissing is still one click away.
      if (!res.ok) throw new Error();
      // The server just put the name on the Auth record; pick it up now so the
      // menu greets them by name instead of by phone number.
      await refreshUser();
      closeProfile();
    } catch {
      setError('Could not save that. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const inputCls =
    'w-full bg-surface-container-low border border-outline/25 rounded-2xl px-5 py-4 text-sm text-on-surface placeholder:text-on-surface/30 outline-none focus:border-primary transition-all';
  const labelCls = 'block text-[9px] uppercase tracking-[0.4em] font-bold text-on-surface/50 mb-2';

  return (
    <AnimatePresence>
      {profileModalOpen && user && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={dismiss}
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-6"
        >
          <motion.div
            initial={{ y: 40, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, scale: 0.98, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            onClick={e => e.stopPropagation()}
            className="w-full sm:max-w-lg bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl p-8 sm:p-10"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-[9px] uppercase tracking-[0.5em] text-primary/70 font-bold">Welcome</p>
                <h2 className="text-xl font-bold text-on-surface mt-1">
                  {user.displayName || user.email?.split('@')[0] || 'Member'}
                </h2>
              </div>
              <button onClick={dismiss} aria-label="Close" className="p-2 rounded-full hover:bg-primary/10">
                <X className="w-5 h-5 text-on-surface/60" />
              </button>
            </div>
            <p className="font-serif italic text-2xl text-on-surface mb-1">
              {needsEmail ? 'Where should we send it?' : 'One quick thing'}
            </p>
            <p className="text-sm text-on-surface/60 mb-7">
              {needsEmail
                ? 'You’re in — the pricing is on the page behind this. An email is how we send the plot-wise sheet, site-visit confirmations and the monthly briefing. We never sell your details.'
                : 'Help us match you with the right sanctuary. Totally optional — skip anytime.'}
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="pf-name" className={labelCls}>Full Name</label>
                <input id="pf-name" value={name} onChange={e => setName(e.target.value)}
                  placeholder={user.displayName ?? 'Your name'} className={inputCls} />
              </div>
              {needsEmail && (
                <div>
                  <label htmlFor="pf-email" className={labelCls}>Email · How we send the sheet</label>
                  <input id="pf-email" type="email" required inputMode="email" autoComplete="email" value={email}
                    onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={inputCls} />
                </div>
              )}
              {needsPhone && (
                <div>
                  <label htmlFor="pf-phone" className={labelCls}>Phone (for your adviser)</label>
                  <input id="pf-phone" type="tel" inputMode="tel" autoComplete="tel" value={phone}
                    onChange={e => setPhone(e.target.value)} placeholder="+91 98xxx xxxxx" className={inputCls} />
                </div>
              )}
              <div>
                <label htmlFor="pf-occupation" className={labelCls}>What do you do?</label>
                <input id="pf-occupation" value={occupation} onChange={e => setOccupation(e.target.value)}
                  placeholder="e.g. Software Engineer at Google" className={inputCls} />
              </div>
              <div>
                <label htmlFor="pf-city" className={labelCls}>Where are you based?</label>
                <input id="pf-city" value={city} onChange={e => setCity(e.target.value)}
                  placeholder="e.g. Hyderabad" className={inputCls} />
              </div>
            </div>

            {error && <p className="mt-4 text-sm text-error">{error}</p>}

            <div className="flex gap-3 mt-8">
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-on-primary text-sm font-bold hover:opacity-95 transition-all disabled:opacity-60"
              >
                <Check className="w-4 h-4" /> {saving ? 'Saving…' : needsEmail ? 'Save and continue' : 'Complete Profile'}
              </button>
              {/* The escape hatch is labelled with what they came for. Someone who
                  signed up at the pricing gate wants the price sheet, not a form,
                  and hiding the way out is how that person ends up on WhatsApp
                  asking for a number the page could have shown them. */}
              <button
                onClick={dismiss}
                className="px-6 py-4 rounded-2xl border border-outline/25 text-sm text-on-surface/60 hover:text-on-surface transition-all whitespace-nowrap"
              >
                {needsEmail ? 'See pricing' : 'Skip'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
