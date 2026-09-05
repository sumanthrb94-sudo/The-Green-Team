import type { Metadata } from 'next';
import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Wind, VolumeX, Clock, ExternalLink, Check } from 'lucide-react';
import { SANCTUARIES, getSanctuary } from '@/lib/data/sanctuaries';
import { getPropertyById } from '@/lib/server/portfolio';
import { Gallery } from '@/components/property/Gallery';
import { LayoutPlan } from '@/components/property/LayoutPlan';
import { InvestPanel } from '@/components/property/InvestPanel';
import { Footer } from '@/components/Footer';
import { ReviewList } from '@/components/reviews/ReviewList';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { getApprovedReviews, aggregateRating } from '@/lib/server/reviews';
import { SITE_URL } from '@/lib/data/contact';
import { SITE_PLAN_CONFIG } from '@/lib/data/agartha-layout';

interface Props {
  params: Promise<{ id: string }>;
}

export function generateStaticParams() {
  return SANCTUARIES.map(s => ({ id: s.id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const s = getSanctuary(id);
  if (!s) return {};
  const description = s.metaDescription ?? s.description?.slice(0, 155);
  const image = `${SITE_URL}${s.image}`;
  return {
    title: `${s.title} — ${s.memberPrice}`,
    description,
    alternates: { canonical: `${SITE_URL}/sanctuaries/${s.id}` },
    openGraph: {
      type: 'website',
      siteName: 'The Green Team',
      title: `${s.title} | The Green Team`,
      description: s.tagline,
      url: `${SITE_URL}/sanctuaries/${s.id}`,
      images: [{ url: image }],
    },
    twitter: {
      card: 'summary_large_image',
      title: `${s.title} | The Green Team`,
      description: s.tagline,
      images: [image],
    },
  };
}

export const revalidate = 300;

export default async function SanctuaryPage({ params }: Props) {
  const { id } = await params;
  const s = await getPropertyById(id);
  if (!s) notFound();

  const reviews = await getApprovedReviews(id);
  const rating = aggregateRating(reviews);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: s.title,
    description: s.description,
    image: `${SITE_URL}${s.image}`,
    brand: { '@type': 'Brand', name: s.architect },
    offers: {
      '@type': 'Offer',
      priceCurrency: 'INR',
      availability: 'https://schema.org/InStock',
      seller: { '@type': 'RealEstateAgent', name: 'The Green Team' },
    },
    // Only present when real approved reviews exist — see lib/server/reviews.ts
    ...(rating ? { aggregateRating: rating } : {}),
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'AQI', value: s.aqi },
      { '@type': 'PropertyValue', name: 'Ambient noise', value: `${s.noise} dB` },
      { '@type': 'PropertyValue', name: 'Commute', value: s.commute },
      ...(s.plotRange ? [{ '@type': 'PropertyValue', name: 'Sizes', value: s.plotRange }] : []),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero header */}
      <section className="relative min-h-[52vh] flex items-end overflow-hidden">
        <Image src={s.image} alt={s.title} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/30 to-black/20" />
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-12 pb-10">
          <p className="text-[9px] uppercase tracking-[0.5em] text-[#c8a951] font-bold mb-3">{s.tagline}</p>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="text-4xl md:text-6xl font-light text-white leading-tight">{s.title}</h1>
              <p className="mt-2 text-white/55 text-sm">{s.location}</p>
            </div>
            <div className="text-right">
              {s.pricePerSqYd ? (
                <p className="text-[9px] text-white/40 uppercase tracking-widest">
                  ₹{s.pricePerSqYd.toLocaleString('en-IN')}/sq yd
                </p>
              ) : null}
              <p className="text-3xl font-headline font-bold text-white">{s.memberPrice}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-6 mt-6">
            {[
              { Icon: Wind, text: `AQI ${s.aqi}` },
              { Icon: VolumeX, text: `${s.noise} dB` },
              { Icon: Clock, text: s.commute },
            ].map(({ Icon, text }) => (
              <span key={text} className="flex items-center gap-2 text-white/70 text-[10px] uppercase tracking-widest font-bold">
                <Icon className="w-3.5 h-3.5 text-[#a3b18a]" /> {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 md:px-12 py-14">
        <div className="grid lg:grid-cols-[1.6fr_1fr] gap-12 mb-14">
          <div>
            <p className="text-lg md:text-xl font-light text-secondary leading-relaxed">{s.description}</p>
            {s.brochureUrl && (
              <a
                href={s.brochureUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 mt-6 text-[10px] uppercase tracking-[0.4em] font-bold text-primary hover:underline underline-offset-4"
              >
                Developer Brochure <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          <div className="p-7 rounded-3xl border border-outline/15 bg-surface-container-low h-fit">
            <p className="text-[9px] uppercase tracking-[0.5em] font-bold text-secondary/50 mb-4">At a glance</p>
            <dl className="space-y-3 text-sm">
              {[
                ['Sizes', s.plotRange],
                ['Amenity', s.amenityAcres],
                ['Developer', s.architect],
                // SYL sells villaments, not plots — the noun follows the property.
                ...(s.plots
                  ? [[`${SITE_PLAN_CONFIG[s.id]?.noun ?? 'Plot'}s`, String(s.plots)] as [string, string]]
                  : []),
              ]
                .filter((r): r is [string, string] => Boolean(r[1]))
                .map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-4">
                    <dt className="text-secondary/60">{k}</dt>
                    <dd className="font-medium text-on-surface text-right">{v}</dd>
                  </div>
                ))}
            </dl>
          </div>
        </div>

        {s.features?.length ? (
          <div className="mb-14">
            <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-on-surface/60 mb-5">Features</p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {s.features.map(f => (
                <div key={f} className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-outline/12 bg-surface">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-on-surface/80">{f}</span>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {/* Single scroll — no tabs, no hidden content, fewer clicks. */}
        <div className="space-y-16">
          <div>
            <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-on-surface/60 mb-5">Gallery</p>
            <Gallery images={s.plotImages ?? [s.image]} title={s.title} />
          </div>
          {s.sitePlanSrc ? (
            <div>
              <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-on-surface/60 mb-5">Layout Plan</p>
              <LayoutPlan sanctuary={s} />
            </div>
          ) : null}
          <div>
            <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-on-surface/60 mb-5">Invest</p>
            <InvestPanel sanctuary={s} />
          </div>
        </div>

        <div className="mt-16 pt-10 border-t border-outline/10 flex flex-wrap gap-4 items-center justify-between">
          <p className="text-sm text-secondary">Explore the other curated sanctuaries:</p>
          <div className="flex flex-wrap gap-3">
            {SANCTUARIES.filter(x => x.id !== s.id).map(x => (
              <Link
                key={x.id}
                href={`/sanctuaries/${x.id}`}
                className="px-5 py-2.5 rounded-full border border-outline/25 text-[10px] uppercase tracking-widest font-bold text-on-surface/70 hover:border-primary hover:text-primary transition-all"
              >
                {x.title}
              </Link>
            ))}
          </div>
        </div>
      </section>

      <ReviewList reviews={reviews} />

      {/* Property-scoped review capture. Without this mount nothing could ever
          set `propertyId`, so per-property reviews (and the aggregateRating
          above) could only be populated by calling the API directly.
          Submissions land as `pending` and appear only after moderation. */}
      <section className="pb-20 px-6 md:px-24">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-light mb-2">
            Visited {s.title}? Tell us how it went.
          </h2>
          <p className="text-sm text-secondary/60 mb-6">
            Reviews are read by a person before they go live.
          </p>
          <ReviewForm propertyId={s.id} />
        </div>
      </section>

      <Footer />
    </>
  );
}
