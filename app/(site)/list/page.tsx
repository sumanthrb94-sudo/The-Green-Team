import type { Metadata } from 'next';
import { Suspense } from 'react';
import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { PortalBrowser } from '@/components/portal/PortalBrowser';
import { SITE_URL } from '@/lib/data/contact';
import { getPortfolio } from '@/lib/server/portfolio';

export const metadata: Metadata = {
  title: 'Explore — Villas, Plots & Investment Property Near Hyderabad',
  description:
    'Search every property The Green Team has curated near Hyderabad — villas and villaments, forest-edge plots and farmland, and investment opportunities with a documented price history. Filter by budget, delivery stage and asset class.',
  alternates: { canonical: `${SITE_URL}/list` },
  openGraph: {
    type: 'website',
    siteName: 'The Green Team',
    title: 'Explore the Portfolio | The Green Team',
    description: 'Villas, plots and investment property near Hyderabad — curated, not listed.',
    url: `${SITE_URL}/list`,
    images: [{ url: `${SITE_URL}/agartha-render.jpg` }],
  },
};

export const revalidate = 300;

/**
 * The portal hub — a real search-and-results surface. The browser (search,
 * filters, sort, grid) is the whole page; the curation promise sits in one line
 * above it so the small, deliberate result count reads as selectivity.
 */
export default async function ListPage() {
  const portfolio = await getPortfolio();

  return (
    <>
      <section className="pt-24 md:pt-28 pb-6 px-6 md:px-14">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between gap-4 flex-wrap">
            <div>
              <span className="text-primary text-[10px] font-bold uppercase tracking-[0.6em] mb-3 block">
                Curated, not listed · Hyderabad
              </span>
              <h1 className="font-serif text-4xl md:text-6xl font-light text-on-surface leading-[0.98]">
                Find your <span className="italic text-primary">sanctuary.</span>
              </h1>
            </div>
            <Link
              href="/standard"
              className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary hover:underline underline-offset-4 pb-2"
            >
              How we choose →
            </Link>
          </div>
          <p className="text-base md:text-lg font-light text-secondary leading-relaxed mt-5 max-w-2xl">
            Every listing here cleared the same six tests before it was allowed on the page. Search, filter and
            sort the set below — or start with the kind of place you want from the type filter.
          </p>
        </div>
      </section>

      <section className="px-6 md:px-14 pb-24">
        <div className="max-w-7xl mx-auto">
          <Suspense fallback={<div className="h-40" />}>
            <PortalBrowser all={portfolio} />
          </Suspense>
        </div>
      </section>

      <Footer />
    </>
  );
}
