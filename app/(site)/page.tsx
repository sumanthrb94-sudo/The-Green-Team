import { Hero } from '@/components/home/Hero';
import { Manifesto } from '@/components/home/Manifesto';
import { BentoPortfolio } from '@/components/home/BentoPortfolio';
import { WhatWeDo } from '@/components/home/WhatWeDo';
import { TrustSignals } from '@/components/home/TrustSignals';
import { JournalPreview } from '@/components/home/JournalPreview';
import { EcosystemPillars } from '@/components/home/EcosystemPillars';
import { NewsletterHighlight } from '@/components/home/NewsletterHighlight';
import { Footer } from '@/components/Footer';
import { getPortfolio } from '@/lib/server/portfolio';

export const revalidate = 300;

export default async function HomePage() {
  const portfolio = await getPortfolio();
  return (
    <>
      <Hero />
      <Manifesto />
      <BentoPortfolio sanctuaries={portfolio} />
      <WhatWeDo />
      <TrustSignals />
      <JournalPreview />
      <EcosystemPillars />
      <NewsletterHighlight />
      <Footer />
    </>
  );
}
