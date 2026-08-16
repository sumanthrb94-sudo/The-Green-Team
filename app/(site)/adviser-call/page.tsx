import type { Metadata } from 'next';
import { AdviserCallSection } from '@/components/adviser/AdviserCallForm';
import { ExperimentImpression } from '@/components/analytics/ExperimentImpression';
import { Footer } from '@/components/Footer';
import { SITE_URL } from '@/lib/data/contact';
import { getVariant } from '@/lib/server/experiment';
import { EXPERIMENTS } from '@/lib/experiments';

export const metadata: Metadata = {
  title: 'Request an Adviser Call — Free, Within 24 Hours',
  description:
    'One call, every answer: pricing, plots, and site visits for forest-adjacent sanctuaries near Hyderabad. Free adviser call within 24 hours.',
  alternates: { canonical: `${SITE_URL}/adviser-call` },
};

/**
 * The adviser_cta experiment runs here rather than on the home page: reading
 * the bucketing cookie forces dynamic rendering, and the home page is on ISR
 * (`revalidate = 300`). Trading everyone's TTFB for a CTA test would cost more
 * than the test could win. This page is the dedicated conversion destination —
 * and where paid traffic should land — so it is the right place to measure.
 */
export default async function AdviserCallPage() {
  const variant = await getVariant('adviserCta');
  return (
    <>
      <ExperimentImpression id={EXPERIMENTS.adviserCta.id} variant={variant} />
      <AdviserCallSection variant={variant} />
      <Footer />
    </>
  );
}
