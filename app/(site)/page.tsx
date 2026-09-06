import type { Metadata } from 'next';
import { Hero } from '@/components/home/Hero';
import { ActivityStrip } from '@/components/social/ActivityStrip';
import { BentoPortfolio } from '@/components/home/BentoPortfolio';
import { ProofStrip } from '@/components/home/ProofStrip';
import { ListWithUs } from '@/components/home/ListWithUs';
import { AdviserCallSection } from '@/components/adviser/AdviserCallForm';
import { Footer } from '@/components/Footer';
import { getPortfolio } from '@/lib/server/portfolio';

// The root layout sets the OG url to SITE_URL but no canonical; declare it here
// so the money page can't be indexed under a parameterised/mirror URL.
export const metadata: Metadata = {
  alternates: { canonical: '/' },
};

export const revalidate = 300;

export default async function HomePage() {
  const portfolio = await getPortfolio();
  return (
    <>
      <Hero />
      {/* Real momentum — the component renders nothing (no bar) until there is
          something true to show, so there is never an empty strip. */}
      <ActivityStrip />
      <BentoPortfolio sanctuaries={portfolio} />
      <ProofStrip />
      <ListWithUs />
      <AdviserCallSection />
      <Footer />
    </>
  );
}
