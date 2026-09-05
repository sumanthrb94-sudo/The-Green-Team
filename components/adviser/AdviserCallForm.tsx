'use client';

/**
 * THE conversion form — name + phone + one-tap budget. Lives inline on the
 * home page (#adviser-call) and at /adviser-call. Writes a lead with source
 * 'adviser-call'; email/designation are qualified on the call itself.
 */
import { useState } from 'react';
import { Check, Phone } from 'lucide-react';
import { INVESTMENT_BRACKETS } from '@/lib/data/contact';
import { track, markConverted } from '@/lib/analytics';
import { cn } from '@/lib/utils';

export function AdviserCallForm({
  compact = false,
  ctaLabel = 'Request Adviser Call',
}: {
  compact?: boolean;
  /** Overridden by the adviser_cta experiment; see lib/experiments.ts. */
  ctaLabel?: string;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [bracket, setBracket] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone,
          intent: bracket ? `Budget: ${bracket}` : 'Adviser call request',
          source: 'adviser-call',
        }),
      });
      if (!res.ok) throw new Error();
      // Only after the lead is actually persisted — a conversion fired on
      // click would inflate the number with failed submits.
      track.lead('adviser-call', bracket || undefined);
      markConverted('lead');
      setDone(true);
    } catch {
      setError('Something went wrong — please try again or WhatsApp us.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center text-center gap-4 py-10">
        <span className="w-14 h-14 rounded-full border border-[#c8a951]/50 flex items-center justify-center">
          <Check className="w-6 h-6 text-[#c8a951]" />
        </span>
        <p className="font-headline font-bold text-2xl text-white">Done. We&apos;ll call you.</p>
        <p className="text-white/50 text-sm">
          Your adviser reaches out <span className="text-[#c8a951]">within 24 hours.</span>
        </p>
      </div>
    );
  }

  const input =
    'w-full bg-white/5 border border-white/15 rounded-2xl px-5 py-4 text-white placeholder:text-white/30 outline-none focus:border-[#a3b18a]/70 transition-all';

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className={cn('grid gap-4', compact ? '' : 'sm:grid-cols-2')}>
        {/* aria-label, not just placeholder: the placeholder disappears as soon
            as the visitor types, leaving a screen reader with an unnamed field. */}
        <input
          id="ac-name"
          required
          aria-label="Your name"
          autoComplete="name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name *"
          className={input}
        />
        <input
          id="ac-phone"
          type="tel"
          required
          aria-label="Your phone number"
          autoComplete="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+91 phone number *"
          className={input}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {INVESTMENT_BRACKETS.map(b => (
          <button
            key={b}
            type="button"
            onClick={() => setBracket(bracket === b ? '' : b)}
            className={cn(
              'px-4 py-2.5 rounded-full text-xs border transition-all',
              bracket === b
                ? 'bg-[#c8a951] text-[#1a1a0a] border-[#c8a951] font-bold'
                : 'border-white/15 text-white/55 hover:border-white/35'
            )}
          >
            {b}
          </button>
        ))}
      </div>
      {error && <p className="text-sm text-[#f0776b]">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2.5 py-5 rounded-2xl bg-[#c8a951] text-[#1a1a0a] text-[10px] uppercase tracking-[0.45em] font-bold hover:bg-[#d9bb62] transition-all disabled:opacity-60"
      >
        <Phone className="w-4 h-4" />
        {loading ? 'Sending…' : ctaLabel}
      </button>
      <p className="text-center text-[10px] text-white/30">
        Free · We call within 24 hours · No spam
      </p>
    </form>
  );
}

/**
 * Full-width dark section wrapper used on home and /adviser-call.
 *
 * `variant` comes from the adviser_cta experiment, resolved server-side by the
 * page so the correct label is in the first HTML response — no flicker.
 */
export function AdviserCallSection({ variant = 'control' }: { variant?: string }) {
  const outcome = variant === 'outcome';
  return (
    <section id="adviser-call" className="bg-[#141c0f] py-24 px-6 scroll-mt-14">
      <div className="max-w-xl mx-auto text-center mb-10">
        <span className="text-[#c8a951] text-[10px] font-bold uppercase tracking-[0.7em] mb-5 block">
          One call. Every answer.
        </span>
        <h2 className="font-headline font-extrabold tracking-[-0.02em] text-4xl md:text-6xl text-white leading-[1.0]">
          {outcome ? (
            <>
              Get the <span className="text-[#c8a951]">real numbers.</span>
            </>
          ) : (
            <>
              Request your <span className="text-[#c8a951]">adviser call.</span>
            </>
          )}
        </h2>
        <p className="mt-5 text-white/45 font-light">
          Pricing, plots, site visits — a private call within 24 hours.
        </p>
      </div>
      <div className="max-w-xl mx-auto">
        <AdviserCallForm ctaLabel={outcome ? 'Get Pricing & Availability' : 'Request Adviser Call'} />
      </div>
    </section>
  );
}
