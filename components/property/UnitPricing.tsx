'use client';

/**
 * The unit-by-unit price sheet, behind a sign-in gate.
 *
 * The gate is inline and non-blocking on purpose. Nothing is covered by a modal
 * and no redirect happens — a visitor who does not want to sign in keeps reading
 * the property, the photographs, the site plan, the standard and the headline
 * rate. Only the per-unit breakdown waits for an identity. A wall in front of a
 * ₹1 Cr research session sends people to a portal; a card beside the thing they
 * already want does not.
 *
 * Data arrives from /api/pricing/[id] after sign-in rather than being rendered
 * into the page, so the numbers are genuinely absent from the HTML and from the
 * JS bundle for a logged-out visitor. That matters twice: it makes the gate real
 * rather than a CSS blur anyone can inspect around, and it keeps what Google
 * sees identical to what a logged-out person sees.
 */
import { useCallback, useEffect, useState } from 'react';
import { Lock, Star, ArrowRight } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { sendEvent } from '@/lib/analytics/beacon';
import { formatRs } from '@/lib/utils';

interface UnitRow {
  label: string;
  qty: string;
  price: number;
  star?: boolean;
}
interface PriceSheet {
  rateLabel: string;
  rows: UnitRow[];
  note: string;
}

export function UnitPricing({
  sanctuaryId,
  rateLabel,
  noun = 'plot',
}: {
  sanctuaryId: string;
  /** Shown publicly above the gate so the headline rate never disappears. */
  rateLabel: string;
  noun?: string;
}) {
  const { user, authReady, openAuth } = useAuth();
  const [sheet, setSheet] = useState<PriceSheet | null>(null);
  const [state, setState] = useState<'idle' | 'loading' | 'error'>('idle');

  useEffect(() => {
    if (!authReady || !user) return;
    let cancelled = false;
    setState('loading');
    fetch(`/api/pricing/${encodeURIComponent(sanctuaryId)}`, { credentials: 'same-origin' })
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((data: PriceSheet) => {
        if (cancelled) return;
        setSheet(data);
        setState('idle');
        sendEvent('pricing_unlocked', { propertyId: sanctuaryId });
      })
      .catch(() => {
        if (!cancelled) setState('error');
      });
    return () => {
      cancelled = true;
    };
  }, [authReady, user, sanctuaryId]);

  // One impression per property view, so the funnel counts people reaching the
  // gate against people who sign in rather than counting re-renders.
  useEffect(() => {
    if (authReady && !user) sendEvent('pricing_gate_view', { propertyId: sanctuaryId });
  }, [authReady, user, sanctuaryId]);

  const onSignIn = useCallback(() => {
    sendEvent('pricing_gate_signin_click', { propertyId: sanctuaryId });
    openAuth();
  }, [openAuth, sanctuaryId]);

  // Signed in and loaded — the actual sheet.
  if (user && sheet) {
    return (
      <div>
        <div className="rounded-2xl border border-outline/15 overflow-hidden divide-y divide-outline/10">
          {sheet.rows.map(r => (
            <div
              key={r.label}
              className={`grid grid-cols-[1.2fr_1fr_auto] items-center gap-3 px-5 py-4 text-sm ${
                r.star ? 'bg-gold/10' : ''
              }`}
            >
              <span className="text-on-surface/60 flex items-center gap-1.5">
                {r.star && <Star className="w-3.5 h-3.5 text-gold fill-gold" />}
                {r.label}
              </span>
              <span className="font-medium text-on-surface/80">{r.qty}</span>
              <span className="font-headline font-bold text-on-surface">{formatRs(r.price)}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[11px] leading-relaxed text-secondary/60">{sheet.note}</p>
      </div>
    );
  }

  if (user && state === 'loading') {
    return (
      <div className="rounded-2xl border border-outline/15 divide-y divide-outline/10 animate-pulse">
        {[0, 1, 2, 3, 4].map(i => (
          <div key={i} className="flex items-center justify-between px-5 py-4">
            <span className="h-3 w-32 rounded bg-outline/15" />
            <span className="h-3 w-20 rounded bg-outline/15" />
            <span className="h-3 w-24 rounded bg-outline/20" />
          </div>
        ))}
      </div>
    );
  }

  if (user && state === 'error') {
    return (
      <div className="rounded-2xl border border-outline/15 p-6 text-sm text-secondary/70">
        Could not load the price sheet just now. Refresh the page, or ask us on WhatsApp and we will send
        it across.
      </div>
    );
  }

  // Logged out — the gate.
  return (
    <div className="rounded-2xl border border-dashed border-outline/30 bg-surface-container-low p-7">
      <div className="flex items-start gap-4">
        <span className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Lock className="w-4 h-4 text-primary" />
        </span>
        <div className="min-w-0">
          <p className="font-headline font-bold text-on-surface">
            See the price for every {noun}
          </p>
          <p className="mt-1.5 text-sm text-secondary/70 leading-relaxed">
            The rate is <strong className="text-on-surface">{rateLabel}</strong> — that stays public. Sign in
            to see what each individual {noun} works out to, what is and is not included, and to have your
            adviser bring the live sheet with the negotiated price.
          </p>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              onClick={onSignIn}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-primary text-on-primary text-[10px] uppercase tracking-[0.3em] font-bold hover:opacity-90 transition-opacity"
            >
              Sign in with Google
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] text-secondary/50">
              Takes a second. Keep browsing without it — everything else on this page is open.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
