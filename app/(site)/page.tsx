import { Hero } from '@/components/home/Hero';
import { BentoPortfolio } from '@/components/home/BentoPortfolio';
import { ProofStrip } from '@/components/home/ProofStrip';
import { AdviserCallSection } from '@/components/adviser/AdviserCallForm';
import { NewsletterHighlight } from '@/components/home/NewsletterHighlight';
import { Footer } from '@/components/Footer';
import { getPortfolio } from '@/lib/server/portfolio';

export const revalidate = 300;

export default async function HomePage() {
  const portfolio = await getPortfolio();
  return (
    <>
      <Hero />
      <BentoPortfolio sanctuaries={portfolio} />
      <ProofStrip />
      <AdviserCallSection />
      <NewsletterHighlight />
      <Footer />
    </>
  );
}
