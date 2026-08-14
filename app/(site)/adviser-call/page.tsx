import type { Metadata } from 'next';
import { AdviserCallSection } from '@/components/adviser/AdviserCallForm';
import { Footer } from '@/components/Footer';
import { SITE_URL } from '@/lib/data/contact';

export const metadata: Metadata = {
  title: 'Request an Adviser Call — Free, Within 24 Hours',
  description:
    'One call, every answer: pricing, plots, and site visits for forest-adjacent sanctuaries near Hyderabad. Free adviser call within 24 hours.',
  alternates: { canonical: `${SITE_URL}/adviser-call` },
};

export default function AdviserCallPage() {
  return (
    <>
      <AdviserCallSection />
      <Footer />
    </>
  );
}
