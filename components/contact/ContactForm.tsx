'use client';

/**
 * The unified contact form — one lead-capture surface for every intent (a
 * pricing question, a site visit, an investment brief, or just "call me").
 * Everything funnels into the same `leads` pipeline the admin dashboard reads,
 * tagged by what the visitor picked, so there is a single inbox rather than a
 * scatter of channel-specific forms.
 *
 * Capturing email (optional) is what lets Resend send the confirmation +
 * welcome mail; phone is what the adviser actually calls. Either is enough.
 */
import { useState } from 'react';
import { Check, Send, Phone } from 'lucide-react';
import { INVESTMENT_BRACKETS, WHATSAPP, BUSINESS } from '@/lib/data/contact';
import { track, markConverted } from '@/lib/analytics';
import { cn } from '@/lib/utils';

const INTERESTS = [
  { value: 'villas', label: 'A villa / villament' },
  { value: 'plots', label: 'A plot / farmland' },
  { value: 'investments', label: 'An investment' },
  { value: 'site-visit', label: 'Booking a site visit' },
  { value: 'general', label: 'General enquiry' },
] as const;

const PROPERTIES = [
  { id: '', label: 'Not sure yet / all' },
  { id: 'agartha', label: 'MODCON Agartha' },
  { id: 'syl', label: 'MODCON SYL Residences' },
  { id: 'dates-county', label: 'Dates County' },
] as const;

export function ContactForm({
  defaultInterest = 'general',
  defaultProperty = '',
}: {
  defaultInterest?: string;
  defaultProperty?: string;
}) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [interest, setInterest] = useState(defaultInterest);
  const [property, setProperty] = useState(defaultProperty);
  const [bracket, setBracket] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim() && !email.trim()) {
      setError('Please leave a phone number or an email so we can reach you.');
      return;
    }
    setLoading(true);
    setError('');
    const interestLabel = INTERESTS.find(i => i.value === interest)?.label ?? interest;
    const propLabel = PROPERTIES.find(p => p.id === property)?.label;
    const intent = [
      `Interest: ${interestLabel}`,
      property ? `Property: ${propLabel}` : null,
      bracket ? `Budget: ${bracket}` : null,
      message.trim() ? `Message: ${message.trim()}` : null,
    ]
      .filter(Boolean)
      .join(' · ');
    // A site-visit intent is tagged as such so the confirmation email uses the
    // site-visit template and the admin pipeline can prioritise it.
    const source = interest === 'site-visit' ? 'contact-site-visit' : 'contact';
    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, email, intent, source }),
      });
      if (!res.ok) throw new Error();
      track.lead(source, bracket || undefined);
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
      <div className="flex flex-col items-center text-center gap-4 py-12">
        <span className="w-14 h-14 rounded-full border border-primary/40 flex items-center justify-center">
          <Check className="w-6 h-6 text-primary" />
        </span>
        <p className="font-headline font-bold text-2xl text-on-surface">Thank you — message received.</p>
        <p className="text-secondary text-sm max-w-sm">
          An adviser will reach out <span className="text-primary font-semibold">within 24 hours</span>. Prefer
          to talk now?
        </p>
        <a
          href={WHATSAPP.generic}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#25D366] text-white text-[10px] uppercase tracking-[0.25em] font-bold hover:opacity-90 transition-all"
        >
          <WaIcon /> Chat on WhatsApp
        </a>
      </div>
    );
  }

  const input =
    'w-full bg-surface-container border border-outline/15 rounded-2xl px-4 py-3.5 text-sm text-on-surface placeholder:text-secondary/40 outline-none focus:border-primary/50 transition-all';

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid sm:grid-cols-2 gap-4">
        <input
          required
          aria-label="Your name"
          autoComplete="name"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Your name *"
          className={input}
        />
        <input
          type="tel"
          aria-label="Your phone number"
          autoComplete="tel"
          value={phone}
          onChange={e => setPhone(e.target.value)}
          placeholder="+91 phone number"
          className={input}
        />
      </div>
      <input
        type="email"
        aria-label="Your email"
        autoComplete="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Email (for the brochure & confirmation)"
        className={input}
      />

      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="I'm interested in">
          <select value={interest} onChange={e => setInterest(e.target.value)} aria-label="Interest" className={cn(input, 'appearance-none cursor-pointer')}>
            {INTERESTS.map(i => (
              <option key={i.value} value={i.value}>{i.label}</option>
            ))}
          </select>
        </Field>
        <Field label="Property">
          <select value={property} onChange={e => setProperty(e.target.value)} aria-label="Property" className={cn(input, 'appearance-none cursor-pointer')}>
            {PROPERTIES.map(p => (
              <option key={p.id} value={p.id}>{p.label}</option>
            ))}
          </select>
        </Field>
      </div>

      <div>
        <p className="text-[10px] uppercase tracking-[0.25em] font-bold text-secondary/50 mb-2.5">Budget (optional)</p>
        <div className="flex flex-wrap gap-2">
          {INVESTMENT_BRACKETS.map(b => (
            <button
              key={b}
              type="button"
              onClick={() => setBracket(bracket === b ? '' : b)}
              className={cn(
                'px-4 py-2 rounded-full text-xs border transition-all',
                bracket === b
                  ? 'bg-primary text-on-primary border-primary font-bold'
                  : 'border-outline/20 text-secondary/70 hover:border-outline/45',
              )}
            >
              {b}
            </button>
          ))}
        </div>
      </div>

      <textarea
        aria-label="Message"
        value={message}
        onChange={e => setMessage(e.target.value)}
        placeholder="Anything specific we should know? (optional)"
        rows={3}
        className={cn(input, 'resize-none')}
      />

      {error && <p className="text-sm text-error">{error}</p>}

      <button
        type="submit"
        disabled={loading}
        className="w-full flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-primary text-on-primary text-[10px] uppercase tracking-[0.4em] font-bold hover:opacity-90 transition-all disabled:opacity-60"
      >
        <Send className="w-4 h-4" />
        {loading ? 'Sending…' : 'Send message'}
      </button>

      <div className="flex items-center justify-center gap-5 pt-1">
        <a href={`tel:${BUSINESS.phone.replace(/\s/g, '')}`} className="inline-flex items-center gap-1.5 text-xs text-secondary/70 hover:text-primary transition-colors">
          <Phone className="w-3.5 h-3.5" /> {BUSINESS.phone}
        </a>
        <a href={WHATSAPP.generic} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-secondary/70 hover:text-[#25D366] transition-colors">
          <WaIcon /> WhatsApp
        </a>
      </div>
      <p className="text-center text-[10px] text-secondary/40">Free · We respond within 24 hours · No spam</p>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[10px] uppercase tracking-[0.25em] font-bold text-secondary/50 mb-2">{label}</span>
      {children}
    </label>
  );
}

function WaIcon() {
  return (
    <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 fill-current" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884" />
    </svg>
  );
}
