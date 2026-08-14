'use client';

/** Post-sign-up profile capture — name / occupation / city, optional. */
import { useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Check, X } from 'lucide-react';
import { useAuth } from './AuthProvider';

export function ProfileModal() {
  const { user, profileModalOpen, closeProfile } = useAuth();
  const [name, setName] = useState('');
  const [occupation, setOccupation] = useState('');
  const [city, setCity] = useState('');
  const [saving, setSaving] = useState(false);

  const save = async () => {
    if (!user) return closeProfile();
    setSaving(true);
    try {
      const idToken = await user.getIdToken();
      await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${idToken}` },
        body: JSON.stringify({
          ...(name.trim() ? { name: name.trim() } : {}),
          ...(occupation.trim() ? { occupation: occupation.trim() } : {}),
          ...(city.trim() ? { city: city.trim() } : {}),
        }),
      });
    } finally {
      setSaving(false);
      closeProfile();
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
          className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-md p-0 sm:p-6"
        >
          <motion.div
            initial={{ y: 40, scale: 0.98, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 40, scale: 0.98, opacity: 0 }}
            transition={{ type: 'spring', damping: 26, stiffness: 300 }}
            className="w-full sm:max-w-lg bg-surface rounded-t-3xl sm:rounded-3xl shadow-2xl p-8 sm:p-10"
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-[9px] uppercase tracking-[0.5em] text-primary/70 font-bold">Welcome</p>
                <h2 className="text-xl font-bold text-on-surface mt-1">
                  {user.displayName || user.email?.split('@')[0] || 'Member'}
                </h2>
              </div>
              <button onClick={closeProfile} aria-label="Skip" className="p-2 rounded-full hover:bg-primary/10">
                <X className="w-5 h-5 text-on-surface/60" />
              </button>
            </div>
            <p className="font-serif italic text-2xl text-on-surface mb-1">One quick thing</p>
            <p className="text-sm text-on-surface/60 mb-7">
              Help us match you with the right sanctuary. Totally optional — skip anytime.
            </p>

            <div className="space-y-4">
              <div>
                <label htmlFor="pf-name" className={labelCls}>Full Name</label>
                <input id="pf-name" value={name} onChange={e => setName(e.target.value)}
                  placeholder={user.displayName ?? 'Your name'} className={inputCls} />
              </div>
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

            <div className="flex gap-3 mt-8">
              <button
                onClick={save}
                disabled={saving}
                className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-primary text-on-primary text-sm font-bold hover:opacity-95 transition-all disabled:opacity-60"
              >
                <Check className="w-4 h-4" /> {saving ? 'Saving…' : 'Complete Profile'}
              </button>
              <button
                onClick={closeProfile}
                className="px-6 py-4 rounded-2xl border border-outline/25 text-sm text-on-surface/60 hover:text-on-surface transition-all"
              >
                Skip
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
