import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { PortalGrid } from '@/components/portal/PortalGrid';
import { CATEGORIES } from '@/lib/data/categories';
import { SITE_URL } from '@/lib/data/contact';
import { getPortfolio } from '@/lib/server/portfolio';

export const metadata: Metadata = {
  title: 'Explore — Villas, Plots & Investment Property Near Hyderabad',
  description:
    'Browse every property The Green Team has curated near Hyderabad — villas and villaments, forest-edge plots and farmland, and investment opportunities with a documented price history. Filter by delivery stage.',
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
 * The portal hub. Categories first, because a buyer who already knows what
 * they want should reach it in one click; the full grid with a stage filter
 * underneath for the ones who want to see everything at once.
 */
export default async function ListPage() {
  const portfolio = await getPortfolio();
  const countIn = (slug: string) => portfolio.filter(CATEGORIES.find(c => c.slug === slug)!.match).length;

  return (
    <>
      <section className="pt-28 md:pt-32 pb-12 px-6 md:px-24">
        <div className="max-w-7xl mx-auto">
          <span className="text-primary text-[10px] font-bold uppercase tracking-[0.6em] mb-4 block">
            Curated, not listed
          </span>
          <h1 className="font-serif text-5xl md:text-7xl font-light text-on-surface leading-[0.95]">
            Explore the <span className="italic text-primary">portfolio.</span>
          </h1>
          <p className="text-lg md:text-xl font-light text-secondary leading-relaxed mt-6 max-w-2xl">
            Everything here passed the same six tests before it was allowed on the page. Start with the kind
            of place you are looking for, or see it all at once below.
          </p>
        </div>
      </section>

      {/* Category cards */}
      <section className="px-6 md:px-24 pb-16">
        <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-4 md:gap-5">
          {CATEGORIES.map(c => {
            const n = countIn(c.slug);
            return (
              <Link
                key={c.slug}
                href={`/explore/${c.slug}`}
                className="group relative p-7 md:p-8 rounded-3xl border border-outline/15 bg-surface-container-low hover:border-primary/40 hover:bg-surface transition-all"
              >
                <ArrowUpRight className="absolute top-6 right-6 w-4 h-4 text-primary/40 group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all" />
                <p className="text-[9px] uppercase tracking-[0.4em] font-bold text-secondary/50 mb-3">
                  {n} {n === 1 ? 'property' : 'properties'}
                </p>
                <h2 className="font-serif text-2xl md:text-3xl font-light text-on-surface group-hover:text-primary transition-colors">
                  {c.title}
                </h2>
                <p className="text-sm text-secondary/70 mt-2 leading-relaxed">{c.tagline}</p>
              </Link>
            );
          })}
        </div>
      </section>

      {/* Everything, filterable by stage */}
      <section className="px-6 md:px-24 pb-24">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-baseline justify-between gap-4 mb-6 flex-wrap">
            <h2 className="font-serif text-3xl md:text-4xl font-light text-on-surface">All sanctuaries</h2>
            <Link
              href="/standard"
              className="text-[10px] uppercase tracking-[0.3em] font-bold text-primary hover:underline underline-offset-4"
            >
              How we choose →
            </Link>
          </div>
          <PortalGrid sanctuaries={portfolio} />
        </div>
      </section>

      <Footer />
    </>
  );
}
