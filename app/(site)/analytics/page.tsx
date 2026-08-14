import type { Metadata } from 'next';
import { Advantage } from '@/components/home/Advantage';
import { EcosystemPillars } from '@/components/home/EcosystemPillars';
import { WhyItMatters } from '@/components/home/WhyItMatters';
import { Footer } from '@/components/Footer';
import { SITE_URL } from '@/lib/data/contact';

export const metadata: Metadata = {
  title: 'Edge + Nature — The Intelligence Gap',
  description:
    'Why early entry wins: the pre-investor phase explained, the four-point curation bar (forest adjacency, AQI under 25, design quality, 45-minute commute), and the city-versus-sanctuary comparison.',
  alternates: { canonical: `${SITE_URL}/analytics` },
};

export default function AnalyticsPage() {
  return (
    <>
      <Advantage isFullPage />
      <WhyItMatters />
      <EcosystemPillars isFullPage />
      <Footer />
    </>
  );
}
