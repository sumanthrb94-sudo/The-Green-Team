import type { Metadata } from 'next';
import { PreInvestorGold } from '@/components/home/PreInvestorGold';
import { Footer } from '@/components/Footer';
import { SITE_URL } from '@/lib/data/contact';

export const metadata: Metadata = {
  title: 'Pre-Investor Gold — SYL Residences at ₹4,499/SFT',
  description:
    'The pre-investor window on MODCON SYL Residences: lowest phase pricing at ₹4,499/SFT, first pick of villaments, and full appreciation from the ground up in Tukkuguda’s 4th City corridor.',
  alternates: { canonical: `${SITE_URL}/preinvestor-gold` },
};

export default function PreInvestorGoldPage() {
  return (
    <>
      <PreInvestorGold />
      <Footer />
    </>
  );
}
