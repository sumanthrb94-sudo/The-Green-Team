'use client';

/**
 * The briefing signup — the only one on the site.
 *
 * It used to exist three times: a full-bleed section repeated on the home page
 * and on every journal page, a second form inside the first-visit popup, and a
 * third path inside the chatbot. Three forms is three places to ask a visitor
 * for the same thing, and it competed with the enquiry CTA that actually earns
 * the business money. This lives in the footer, which is on every page, so it
 * is available everywhere and interrupts nowhere.
 */
import { useState } from 'react';
import { Check } from 'lucide-react';
import { track, markConverted } from '@/lib/analytics';

export function NewsletterSignup() {
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error();
      track.subscribe('footer');
      markConverted('subscribe');
      setDone(true);
      try {
        localStorage.setItem('gt_subscribed', 'true');
      } catch {}
    } catch {
      setError('Something went wrong — please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="flex items-center gap-3 text-gold">
        <span className="w-9 h-9 rounded-full border border-gold/50 flex items-center justify-center flex-shrink-0">
          <Check className="w-4 h-4" />
        </span>
        <p className="font-headline font-bold">You are on the list.</p>
      </div>
    );
  }

  return (
    <div>
      <p className="text-[9px] uppercase tracking-[0.45em] text-white/40 font-bold mb-3">The monthly briefing</p>
      <p className="text-sm text-white/50 font-light mb-4 max-w-sm leading-relaxed">
        Air and noise readings, new curations and honest price movement. Once a month, nothing else.
      </p>
      <form onSubmit={submit} className="flex flex-col sm:flex-row gap-2 max-w-md">
        <label htmlFor="nl-email" className="sr-only">
          Your email address
        </label>
        <input
          id="nl-email"
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          placeholder="your@email.com"
          className="flex-1 min-w-0 bg-white/5 border border-white/15 rounded-xl px-5 py-3.5 text-sm text-white placeholder:text-white/25 outline-none focus:border-white/40 transition-all"
        />
        <button
          type="submit"
          disabled={busy}
          className="px-7 py-3.5 rounded-xl bg-white/10 border border-white/15 text-white text-[9px] uppercase tracking-[0.35em] font-bold hover:bg-white/20 transition-all disabled:opacity-60"
        >
          {busy ? 'Joining…' : 'Subscribe'}
        </button>
      </form>
      {error && <p className="mt-3 text-sm text-[#f0776b]">{error}</p>}
    </div>
  );
}
