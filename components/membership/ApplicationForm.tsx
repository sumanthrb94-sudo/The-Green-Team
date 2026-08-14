'use client';

/**
 * Adviser membership application. Submits to /api/leads — including `phone`,
 * which v1 collected but silently dropped — and enrols the email in the
 * newsletter, as before.
 */
import { useState } from 'react';
import { Check } from 'lucide-react';
import { INVESTMENT_BRACKETS } from '@/lib/data/contact';
import { cn } from '@/lib/utils';

const EMPTY = { name: '', email: '', phone: '', company: '', designation: '', investmentBracket: '', intent: '' };

export function ApplicationForm() {
  const [form, setForm] = useState(EMPTY);
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof typeof EMPTY, v: string) => setForm(f => ({ ...f, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const intent = [
        form.designation || form.company
          ? `${form.designation || 'Member'}${form.company ? ` at ${form.company}` : ''}`
          : '',
        form.investmentBracket ? `Budget: ${form.investmentBracket}` : '',
        form.intent,
      ]
        .filter(Boolean)
        .join(' | ');

      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          phone: form.phone,
          intent,
          source: 'membership',
        }),
      });
      if (!res.ok) throw new Error();
      void fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, source: 'modal' }),
      });
      setSubmitted(true);
    } catch {
      setError('Submission failed — please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const label = 'block text-[9px] uppercase tracking-[0.4em] font-bold text-white/40 mb-2';
  const input =
    'w-full bg-white/5 border border-white/12 rounded-2xl px-5 py-4 text-white placeholder:text-white/25 outline-none focus:border-[#c8a951]/60 transition-all';

  return (
    <section id="apply" className="relative py-24 px-6 md:px-16 overflow-hidden bg-[#141c0f]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#c8a951]/50 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-[#c8a951]/50 to-transparent" />

      <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.2fr] gap-16">
        <div className="lg:sticky lg:top-24 h-fit">
          <span className="text-[#c8a951] text-[10px] font-bold uppercase tracking-[0.7em] mb-6 block">
            Reserved Investor Circle
          </span>
          <h1 className="text-4xl md:text-6xl font-light text-white leading-tight mb-10">
            Request Your
            <br />
            <span className="font-serif italic font-medium text-[#c8a951]">Adviser Call.</span>
          </h1>
          <ol className="space-y-6">
            {[
              ['01', 'Personal Adviser Call', 'A private call within 24 hours to understand your goals.'],
              ['02', 'Pre-Launch Entry Price', 'Access to phase pricing before public distribution.'],
              ['03', 'Intelligence Briefings', 'Monthly environmental and valuation intelligence.'],
            ].map(([n, t, d]) => (
              <li key={n} className="flex gap-4">
                <span className="text-[10px] font-bold text-[#c8a951]/60 tracking-[0.4em] mt-1">{n}</span>
                <span>
                  <span className="block font-bold text-white/90">{t}</span>
                  <span className="block text-sm text-white/40 mt-1">{d}</span>
                </span>
              </li>
            ))}
          </ol>
          <p className="mt-10 text-[10px] text-white/30 leading-relaxed max-w-sm">
            Submitting the form auto-enrols you in the monthly intelligence dispatch. No spam, unsubscribe anytime.
          </p>
        </div>

        {submitted ? (
          <div className="flex flex-col items-center justify-center text-center p-12 rounded-3xl border border-[#c8a951]/30 bg-[#c8a951]/5">
            <span className="w-16 h-16 rounded-full border border-[#c8a951]/50 flex items-center justify-center mb-6">
              <Check className="w-7 h-7 text-[#c8a951]" />
            </span>
            <h2 className="text-3xl font-light text-white mb-3">Application Logged</h2>
            <p className="text-white/50">
              We&apos;ll be in touch <span className="text-[#c8a951]">within 24 hours.</span>
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-6">
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="m-name" className={label}>Full Name *</label>
                <input id="m-name" required value={form.name} onChange={e => set('name', e.target.value)}
                  placeholder="Your name" className={input} />
              </div>
              <div>
                <label htmlFor="m-phone" className={label}>Mobile *</label>
                <input id="m-phone" type="tel" required value={form.phone} onChange={e => set('phone', e.target.value)}
                  placeholder="+91 98765 43210" className={input} />
              </div>
            </div>
            <div>
              <label htmlFor="m-email" className={label}>Private Email *</label>
              <input id="m-email" type="email" required value={form.email} onChange={e => set('email', e.target.value)}
                placeholder="you@email.com" className={input} />
            </div>
            <div className="grid sm:grid-cols-2 gap-6">
              <div>
                <label htmlFor="m-designation" className={label}>Designation</label>
                <input id="m-designation" value={form.designation} onChange={e => set('designation', e.target.value)}
                  placeholder="e.g. Director" className={input} />
              </div>
              <div>
                <label htmlFor="m-company" className={label}>Company / Venture</label>
                <input id="m-company" value={form.company} onChange={e => set('company', e.target.value)}
                  placeholder="Company name" className={input} />
              </div>
            </div>
            <div>
              <p className={label}>Investment Appetite</p>
              <div className="flex flex-wrap gap-2">
                {INVESTMENT_BRACKETS.map(b => (
                  <button
                    key={b}
                    type="button"
                    onClick={() => set('investmentBracket', form.investmentBracket === b ? '' : b)}
                    className={cn(
                      'px-4 py-2.5 rounded-full text-xs border transition-all',
                      form.investmentBracket === b
                        ? 'bg-[#c8a951] text-[#1a1a0a] border-[#c8a951] font-bold'
                        : 'border-white/15 text-white/55 hover:border-white/35'
                    )}
                  >
                    {b}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label htmlFor="m-intent" className={label}>What draws you here?</label>
              <textarea id="m-intent" rows={3} value={form.intent} onChange={e => set('intent', e.target.value)}
                placeholder="Optional — tell us what you're looking for" className={input} />
            </div>
            {error && <p className="text-sm text-[#f0776b]">{error}</p>}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-5 rounded-2xl bg-[#c8a951] text-[#1a1a0a] text-[10px] uppercase tracking-[0.45em] font-bold hover:bg-[#d9bb62] transition-all disabled:opacity-60"
            >
              {loading ? 'Submitting…' : 'Request Adviser Call'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
