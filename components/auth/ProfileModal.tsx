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
 * email field is required and there is no way past it — no Skip, no close, no
 * dismissing the backdrop. Everything else on the form stays optional.
 */
import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, X } from 'lucide-react';
import { useAuth } from './AuthProvider';

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
  /** No address on file means no way to reach this member: the step is required. */
  const required = needsEmail;

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
      // A required step must not close on a failed save — that would strand the
      // member with no address and no second prompt until their next visit.
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
          onClick={required ? undefined : closeProfile}
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
              {!required && (
                <button onClick={closeProfile} aria-label="Skip" className="p-2 rounded-full hover:bg-primary/10">
                  <X className="w-5 h-5 text-on-surface/60" />
                </button>
              )}
            </div>
            <p className="font-serif italic text-2xl text-on-surface mb-1">
              {required ? 'Where should we send it?' : 'One quick thing'}
            </p>
            <p className="text-sm text-on-surface/60 mb-7">
              {required
                ? 'Your number gets you in; an email is how we send pricing sheets, site-visit confirmations and the monthly briefing. We never sell your details.'
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
                  <label htmlFor="pf-email" className={labelCls}>Email · Required</label>
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
                <Check className="w-4 h-4" /> {saving ? 'Saving…' : required ? 'Continue' : 'Complete Profile'}
              </button>
              {!required && (
                <button
                  onClick={closeProfile}
                  className="px-6 py-4 rounded-2xl border border-outline/25 text-sm text-on-surface/60 hover:text-on-surface transition-all"
                >
                  Skip
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
