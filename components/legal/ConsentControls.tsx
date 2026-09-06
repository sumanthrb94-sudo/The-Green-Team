'use client';

/**
 * The same choice, on the cookie policy page, showing what it currently is.
 *
 * This is the half most sites leave out: a policy that describes a banner the
 * reader dismissed months ago, with no way to revisit the answer. Withdrawal
 * has to be as easy as consent, so it is one button, in the document that
 * explains it.
 */
import { useEffect, useState } from 'react';
import { Check, X } from 'lucide-react';
import { readConsent, writeConsent, onConsentChange, type ConsentState } from '@/lib/consent';
import { cn } from '@/lib/utils';

export function ConsentControls() {
  const [state, setState] = useState<ConsentState>('unknown');
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setState(readConsent());
    setReady(true);
    return onConsentChange(setState);
  }, []);

  const label =
    state === 'granted'
      ? 'Analytics is on. You accepted it.'
      : state === 'denied'
        ? 'Analytics is off. You refused it, and nothing is being measured.'
        : 'You have not answered yet, so analytics is off.';

  return (
    <div className="my-5 p-5 rounded-2xl border border-outline/20 bg-surface-container-low">
      <p className="text-sm text-on-surface mb-4">{ready ? label : 'Checking your choice…'}</p>
      <div className="flex flex-wrap gap-3">
        <button
          onClick={() => writeConsent('granted')}
          disabled={!ready || state === 'granted'}
          className={cn(
            'inline-flex items-center gap-2 px-6 py-3 rounded-full text-[10px] uppercase tracking-[0.25em] font-bold transition-all disabled:opacity-45 disabled:cursor-default',
            'bg-primary text-on-primary hover:opacity-90',
          )}
        >
          <Check className="w-3.5 h-3.5" /> Accept analytics
        </button>
        <button
          onClick={() => writeConsent('denied')}
          disabled={!ready || state === 'denied'}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-outline/30 text-on-surface/75 text-[10px] uppercase tracking-[0.25em] font-bold hover:border-outline/60 hover:text-on-surface transition-all disabled:opacity-45 disabled:cursor-default"
        >
          <X className="w-3.5 h-3.5" /> Refuse and delete
        </button>
      </div>
      <p className="text-xs text-secondary/70 mt-4">
        Refusing also deletes the analytics cookies already on this device.
      </p>
    </div>
  );
}
