'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { track, markConverted } from '@/lib/analytics';

export function NewsletterHighlight() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, source: 'inline' }),
      });
      if (!res.ok) throw new Error();
      track.subscribe('inline');
      markConverted('subscribe');
      setDone(true);
      try {
        localStorage.setItem('gt_subscribed', 'true');
      } catch {}
    } catch {
      setError('Something went wrong — please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="py-24 px-6 md:px-24 bg-forest-section text-white">
      <div className="max-w-3xl mx-auto text-center">
        <span className="text-[#a3b18a] text-[10px] font-bold uppercase tracking-[0.6em] mb-5 block">
          The Intelligence Network
        </span>
        <h2 className="text-4xl md:text-6xl font-light leading-tight mb-6">
          Stay ahead of the
          <br />
          <span className="font-serif italic font-medium text-[#a3b18a]">resource curve.</span>
        </h2>
        <p className="text-white/45 text-lg font-light mb-12 max-w-xl mx-auto">
          Monthly environmental integrity reports, sanctuary valuations, and curation alerts. No spam — only
          sanctuary intelligence.
        </p>

        {done ? (
          <div className="flex items-center justify-center gap-3 text-[#c8a951]">
            <span className="w-10 h-10 rounded-full border border-[#c8a951]/50 flex items-center justify-center">
              <Check className="w-5 h-5" />
            </span>
            <p className="font-headline font-bold text-lg">You are on the list.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto">
            <input
              id="nl-highlight-email"
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 bg-white/5 border border-white/15 rounded-2xl px-6 py-4 text-white placeholder:text-white/25 outline-none focus:border-[#a3b18a]/60 transition-all"
            />
            <button
              type="submit"
              disabled={loading}
              className="px-8 py-4 bg-[#a3b18a] text-[#0a1208] text-[9px] uppercase tracking-[0.4em] font-bold rounded-2xl hover:bg-[#b8c8a0] transition-all disabled:opacity-60"
            >
              {loading ? 'Registering…' : 'Join the Collective'}
            </button>
          </form>
        )}
        {error && <p className="mt-4 text-sm text-[#f0776b]">{error}</p>}
      </div>
    </section>
  );
}
