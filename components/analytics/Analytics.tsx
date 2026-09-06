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

      {CLARITY_ID && (
        <Script id="clarity-init" strategy="afterInteractive">
          {`
            (function(c,l,a,r,i,t,y){
              c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
              t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
              y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
            })(window, document, "clarity", "script", "${CLARITY_ID}");
          `}
        </Script>
      )}
    </>
  );
}
