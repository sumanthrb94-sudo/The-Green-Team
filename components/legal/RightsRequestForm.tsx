'use client';

/**
 * The form for everyone who never made an account.
 *
 * It asks for the least that lets us find a record and answer it, states the
 * deadline before you send rather than after, and — importantly — shows the
 * reference and the date once you have. A right you cannot chase is not much of
 * a right.
 */
import { useState } from 'react';
import { Check, ShieldCheck } from 'lucide-react';
import { LEGAL } from '@/lib/data/legal';

const KINDS = [
  { id: 'access', label: 'Show me what you hold' },
  { id: 'correction', label: 'Correct my details' },
  { id: 'erasure', label: 'Erase my data' },
  { id: 'withdraw-consent', label: 'Withdraw my consent' },
  { id: 'grievance', label: 'Make a complaint' },
] as const;

export function RightsRequestForm() {
  const [kind, setKind] = useState<string>('access');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState<{ reference: string; answerBy: string } | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const r = await fetch('/api/rights', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind, name, email, phone, details }),
      });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error ?? '');
      setDone({ reference: data.reference, answerBy: data.answerBy });
    } catch (err) {
      setError(
        String(err).includes('email address or a phone')
          ? 'Give us an email address or a phone number, so we can find your record and reply.'
          : 'Could not send that. Please email us instead and we will treat it the same way.'
      );
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="my-6 p-6 rounded-2xl border border-primary/25 bg-primary/5">
        <div className="flex items-start gap-3">
          <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-on-surface">We have your request.</p>
            <p className="text-sm text-secondary mt-2 leading-relaxed">
              Your reference is <strong className="font-mono text-on-surface">{done.reference}</strong>. We
              will answer <strong>by {done.answerBy}</strong>. We may ask you to confirm who you are
              first — we will not hand anybody&rsquo;s data to somebody who cannot show it is theirs.
            </p>
            <p className="text-sm text-secondary mt-3">
              If we miss that date, you can complain to the {LEGAL.dataProtectionBoard}.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const input =
    'w-full bg-surface-container border border-outline/20 rounded-2xl px-4 py-3.5 text-sm text-on-surface placeholder:text-secondary/40 outline-none focus:border-primary/60 transition-all';
  const label = 'block text-[10px] uppercase tracking-[0.25em] font-bold text-secondary/50 mb-2';

  return (
    <form onSubmit={submit} className="my-6 space-y-5">
      <fieldset>
        <legend className={label}>What do you want us to do?</legend>
        <div className="flex flex-wrap gap-2">
          {KINDS.map(k => (
            <button
              key={k.id}
              type="button"
              onClick={() => setKind(k.id)}
              aria-pressed={kind === k.id}
              className={`px-4 py-2.5 rounded-full text-[11px] font-bold transition-all border ${
                kind === k.id
                  ? 'bg-primary text-on-primary border-primary'
                  : 'border-outline/25 text-secondary hover:border-primary/40'
              }`}
            >
              {k.label}
            </button>
          ))}
        </div>
      </fieldset>

      <div className="grid sm:grid-cols-2 gap-4">
        <div>
          <label htmlFor="rr-email" className={label}>Email you gave us</label>
          <input id="rr-email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className={input} />
        </div>
        <div>
          <label htmlFor="rr-phone" className={label}>…or the number you gave us</label>
          <input id="rr-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+91 98xxx xxxxx" className={input} />
        </div>
      </div>
      <div>
        <label htmlFor="rr-name" className={label}>Your name (optional)</label>
        <input id="rr-name" value={name} onChange={e => setName(e.target.value)} placeholder="So we can find you faster" className={input} />
      </div>
      <div>
        <label htmlFor="rr-details" className={label}>Anything else we should know (optional)</label>
        <textarea id="rr-details" rows={3} value={details} onChange={e => setDetails(e.target.value)} className={input} />
      </div>

      {error && <p className="text-sm text-error">{error}</p>}

      <div className="flex flex-wrap items-center gap-4">
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-primary text-on-primary text-[10px] uppercase tracking-[0.3em] font-bold hover:opacity-90 transition-all disabled:opacity-60"
        >
          <ShieldCheck className="w-4 h-4" /> {busy ? 'Sending…' : 'Send request'}
        </button>
        <p className="text-xs text-secondary/70">
          Answered within {LEGAL.dataRequestDays} days; a complaint within {LEGAL.grievanceResolutionDays}.
        </p>
      </div>
    </form>
  );
}
