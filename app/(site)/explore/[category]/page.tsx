import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Footer } from '@/components/Footer';
import { PortalGrid } from '@/components/portal/PortalGrid';
import { CATEGORIES, getCategory } from '@/lib/data/categories';
import { SITE_URL } from '@/lib/data/contact';
import { getPortfolio } from '@/lib/server/portfolio';

interface Props {
  params: Promise<{ category: string }>;
}

export function generateStaticParams() {
  return CATEGORIES.map(c => ({ category: c.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) return {};
  const url = `${SITE_URL}/explore/${cat.slug}`;
  return {
    title: cat.seoTitle,
    description: cat.seoDescription,
    alternates: { canonical: url },
    openGraph: {
      type: 'website',
      siteName: 'The Green Team',
      title: `${cat.title} | The Green Team`,
      description: cat.tagline,
      url,
      images: [{ url: `${SITE_URL}/agartha-render.jpg` }],
    },
    twitter: { card: 'summary_large_image', title: `${cat.title} | The Green Team`, description: cat.tagline },
  };
}

export const revalidate = 300;

/**
 * One category of the portal. The listing is filtered from the live portfolio
 * rather than hardcoded, so an admin tagging a new property drops it in here
 * without a deploy.
 */
export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const cat = getCategory(category);
  if (!cat) notFound();

  const portfolio = await getPortfolio();
  const items = portfolio.filter(cat.match);
  const others = CATEGORIES.filter(c => c.slug !== cat.slug);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: cat.title,
    description: cat.seoDescription,
    url: `${SITE_URL}/explore/${cat.slug}`,
    isPartOf: { '@type': 'WebSite', name: 'The Green Team', url: SITE_URL },
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: items.length,
      itemListElement: items.map((s, i) => ({
        '@type': 'ListItem',
        position: i + 1,
        name: s.title,
        url: `${SITE_URL}/sanctuaries/${s.id}`,
      })),
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <section className="pt-28 md:pt-32 pb-12 px-6 md:px-24">
        <div className="max-w-7xl mx-auto">
          <nav aria-label="Categories" className="flex flex-wrap gap-2 mb-8">
            <Link
              href="/list"
              className="px-4 py-2 rounded-full border border-outline/25 text-[9px] uppercase tracking-[0.3em] font-bold text-secondary/60 hover:text-on-surface transition-colors"
            >
              All
            </Link>
            {CATEGORIES.map(c => (
              <Link
                key={c.slug}
                href={`/explore/${c.slug}`}
                aria-current={c.slug === cat.slug ? 'page' : undefined}
                className={
                  c.slug === cat.slug
                    ? 'px-4 py-2 rounded-full bg-primary text-on-primary text-[9px] uppercase tracking-[0.3em] font-bold'
                    : 'px-4 py-2 rounded-full border border-outline/25 text-[9px] uppercase tracking-[0.3em] font-bold text-secondary/60 hover:text-on-surface transition-colors'
                }
              >
                {c.label}
              </Link>
            ))}
          </nav>

          <span className="text-primary text-[10px] font-bold uppercase tracking-[0.6em] mb-4 block">
            {cat.tagline}
          </span>
          <h1 className="font-serif text-5xl md:text-7xl font-light text-on-surface leading-[0.95]">
            {cat.title}
          </h1>
          <p className="text-lg md:text-xl font-light text-secondary leading-relaxed mt-6 max-w-2xl">
            {cat.intro}
          </p>
        </div>
      </section>

      <section className="px-6 md:px-24 pb-20">
        <div className="max-w-7xl mx-auto">
          <PortalGrid sanctuaries={items} />
        </div>
      </section>

      <section className="px-6 md:px-24 pb-24">
        <div className="max-w-7xl mx-auto border-t border-outline/12 pt-10">
          <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-secondary/50 mb-5">
            Also browse
          </p>
          <div className="flex flex-wrap gap-3">
            {others.map(c => (
              <Link
                key={c.slug}
                href={`/explore/${c.slug}`}
                className="group px-6 py-4 rounded-2xl border border-outline/15 hover:border-primary/40 transition-all"
              >
                <span className="block font-headline font-bold text-on-surface group-hover:text-primary transition-colors">
                  {c.title}
                </span>
                <span className="block text-xs text-secondary/60 mt-1">{c.tagline}</span>
              </Link>
            ))}
            <Link
              href="/standard"
              className="group px-6 py-4 rounded-2xl border border-outline/15 hover:border-primary/40 transition-all"
            >
              <span className="block font-headline font-bold text-on-surface group-hover:text-primary transition-colors">
                How we choose
              </span>
              <span className="block text-xs text-secondary/60 mt-1">The six-part bar every listing clears</span>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
