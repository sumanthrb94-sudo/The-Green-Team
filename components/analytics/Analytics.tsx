'use client';

/**
 * Loads GA4 and Microsoft Clarity, and reports client-side route changes.
 *
 * Both are `afterInteractive`, so neither blocks first paint — analytics must
 * never be the reason a page feels slow.
 *
 * Renders nothing at all when the keys are absent, which is the normal state
 * in local dev and on preview deployments — and nothing until the visitor has
 * accepted analytics. That gate is the point: under the DPDP Act these tags
 * may not load first and ask afterwards, so no script tag is even emitted
 * until consent is granted, and refusing later stops the reporting.
 */
import Script from 'next/script';
import { usePathname, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { GA_ID, CLARITY_ID } from '@/lib/analytics';
import { readConsent, onConsentChange } from '@/lib/consent';
import { identifyCurrent, startClarity, stopClarity } from '@/lib/analytics/clarity';

/**
 * The App Router does not fire a browser navigation between routes, so GA4's
 * automatic page_view only ever sees the first load. This sends the rest.
 */
function RouteChangeReporter() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    if (!GA_ID || typeof window === 'undefined' || !window.gtag) return;
    const qs = searchParams?.toString();
    window.gtag('event', 'page_view', {
      page_path: qs ? `${pathname}?${qs}` : pathname,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, searchParams]);

  return null;
}

/**
 * Clarity's lifecycle, kept apart from GA4's because it is genuinely different:
 * GA4 is a script tag that only needs to be emitted, while Clarity is an API
 * that has to be started, told who the visitor is on every page, and told to
 * stop if consent is withdrawn.
 */
function ClarityLoader() {
  const pathname = usePathname();

  useEffect(() => {
    startClarity();
    // Withdrawing consent mid-session must actually stop the recorder rather
    // than just stopping the next page from starting it.
    return onConsentChange(state => (state === 'granted' ? startClarity() : stopClarity()));
  }, []);

  useEffect(() => {
    // Crossing into /admin on a client-side navigation, with the recorder
    // already running from a public page, is the one way customer names and
    // phone numbers could reach Microsoft. startClarity's check only fires at
    // start, so the boundary is enforced again on every route change.
    if (pathname.startsWith('/admin')) {
      stopClarity();
      return;
    }
    startClarity();
    // Re-asserted per route, per Microsoft's guidance. The identity itself is
    // pushed in by AuthProvider — see setClarityIdentity for why it is not a hook.
    identifyCurrent();
  }, [pathname]);

  return null;
}

export function Analytics() {
  // Read on the client only: the server has no way to know the answer, and
  // rendering the tags optimistically would load them before the yes.
  const [allowed, setAllowed] = useState(false);
  useEffect(() => {
    setAllowed(readConsent() === 'granted');
    return onConsentChange(state => setAllowed(state === 'granted'));
  }, []);

  if (!GA_ID && !CLARITY_ID) return null;
  if (!allowed) return null;

  return (
    <>
      {GA_ID && (
        <>
          <Script
            src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
            strategy="afterInteractive"
          />
          <Script id="ga4-init" strategy="afterInteractive">
            {`
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              window.gtag = gtag;
              gtag('js', new Date());
              // send_page_view off: RouteChangeReporter owns page_view so the
              // first load isn't counted twice.
              gtag('config', '${GA_ID}', { send_page_view: false });
              gtag('event', 'page_view', {
                page_path: window.location.pathname + window.location.search,
                page_location: window.location.href,
                page_title: document.title
              });
            `}
          </Script>
          {/* useSearchParams needs a Suspense boundary or it opts the whole tree into CSR */}
          <Suspense fallback={null}>
            <RouteChangeReporter />
          </Suspense>
        </>
      )}

      {/* Clarity is loaded through @microsoft/clarity rather than an inline
          snippet. The snippet only starts it; the package's typed API is what
          lets a recording be tagged with our own session reference, named with
          the member behind it, and prioritised when the visitor shows intent —
          which is the difference between a pile of videos and something a
          WhatsApp message can be traced into. */}
      {CLARITY_ID && <ClarityLoader />}
    </>
  );
}
