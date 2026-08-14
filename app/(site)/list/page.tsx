import type { Metadata } from 'next';
import { SanctuariesGrid } from '@/components/home/SanctuariesGrid';
import { Footer } from '@/components/Footer';
import { getLiveProperties } from '@/lib/server/properties';
import { SANCTUARIES } from '@/lib/data/sanctuaries';
import { SITE_URL } from '@/lib/data/contact';

export const metadata: Metadata = {
  title: 'Curated Portfolio — Forest-Adjacent Properties Near Hyderabad',
  description:
    'Every sanctuary The Green Team curates: MODCON Agartha (Narsapur forest plots), MODCON SYL Residences (Tukkuguda villaments), and Dates County by Planet Green (Kandukur villa plots). Verified AQI, noise and commute.',
  alternates: { canonical: `${SITE_URL}/list` },
};

export const revalidate = 300;

export default async function ListPage() {
  const extra = await getLiveProperties();
  return (
    <>
      <div className="px-6 md:px-24 pt-16 max-w-7xl mx-auto">
        <span className="text-primary text-[10px] font-bold uppercase tracking-[0.6em] mb-4 block">
          Independent Sanctuaries
        </span>
        <h1 className="text-5xl md:text-7xl font-light text-on-surface">
          Curated <span className="font-serif italic text-primary">Portfolio.</span>
        </h1>
      </div>
      <SanctuariesGrid sanctuaries={[...SANCTUARIES, ...extra]} heading={false} />
      <Footer />
    </>
  );
}
