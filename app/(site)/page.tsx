import { Hero } from '@/components/home/Hero';
import { WhatWeDo } from '@/components/home/WhatWeDo';
import { WhyItMatters } from '@/components/home/WhyItMatters';
import { SanctuariesGrid } from '@/components/home/SanctuariesGrid';
import { TrustSignals } from '@/components/home/TrustSignals';
import { JournalPreview } from '@/components/home/JournalPreview';
import { EcosystemPillars } from '@/components/home/EcosystemPillars';
import { NewsletterHighlight } from '@/components/home/NewsletterHighlight';
import { Footer } from '@/components/Footer';
import { getLiveProperties } from '@/lib/server/properties';
import { SANCTUARIES } from '@/lib/data/sanctuaries';

export const revalidate = 300;

export default async function HomePage() {
  const extra = await getLiveProperties();
  return (
    <>
      <Hero />
      <WhatWeDo />
      <WhyItMatters />
      <SanctuariesGrid sanctuaries={[...SANCTUARIES, ...extra]} />
      <TrustSignals />
      <JournalPreview />
      <EcosystemPillars />
      <NewsletterHighlight />
      <Footer />
    </>
  );
}
