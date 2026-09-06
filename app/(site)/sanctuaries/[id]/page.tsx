import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { Wind, VolumeX, Clock, Check, Camera } from 'lucide-react';
import { SANCTUARIES, getSanctuary } from '@/lib/data/sanctuaries';
import { getPropertyById, getPortfolio } from '@/lib/server/portfolio';
import { Gallery } from '@/components/property/Gallery';
import { LayoutPlan } from '@/components/property/LayoutPlan';
import { InvestPanel } from '@/components/property/InvestPanel';
import { PdpTabs, type PdpSection } from '@/components/property/PdpTabs';
import { KeyFacts } from '@/components/property/KeyFacts';
import { PricingStrip } from '@/components/property/PricingStrip';
import { Highlights } from '@/components/property/Highlights';
import { LocationAdvantages } from '@/components/property/LocationAdvantages';
import { EmiCalculator } from '@/components/property/EmiCalculator';
import { DeveloperCard } from '@/components/property/DeveloperCard';
import { PdpStickyBar } from '@/components/property/PdpStickyBar';
import { ListingCard } from '@/components/portal/ListingCard';
import { Footer } from '@/components/Footer';
import { ReviewList } from '@/components/reviews/ReviewList';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { getApprovedReviews, aggregateRating } from '@/lib/server/reviews';
import { SITE_URL } from '@/lib/data/contact';
import { estimateFromPrice } from '@/lib/data/listing';

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

/** Consistent section heading: eyebrow + bold title. */
function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="mb-6">
      <p className="text-[9px] uppercase tracking-[0.4em] font-bold text-secondary/50 mb-2">{eyebrow}</p>
      <h2 className="font-headline font-extrabold tracking-[-0.02em] text-2xl md:text-3xl text-on-surface leading-tight">{title}</h2>
    </div>
  );
}

/**
 * The property page — a portal-grade, sectioned detail page (the 99acres
 * shape): sticky section tabs, key facts, pricing strip, highlights, photos,
 * site plan, amenities, location, pricing & investment, EMI, the developer card
 * with the lead form, reviews, and similar listings — plus a mobile action bar.
 * Everything shown is real listing data; sections with nothing to show are
 * simply omitted, and their tab with them.
 */
export default async function SanctuaryPage({ params }: Props) {
  const { id } = await params;
  const [s, portfolio, reviews] = await Promise.all([getPropertyById(id), getPortfolio(), getApprovedReviews(id)]);
  if (!s) notFound();

  const rating = aggregateRating(reviews);
  const photos = s.plotImages?.length ? s.plotImages : [s.image];
  const price = estimateFromPrice(s);
  const others = portfolio.filter(x => x.id !== s.id);

  const sections: PdpSection[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'gallery', label: 'Photos' },
    ...(s.sitePlanSrc ? [{ id: 'plan', label: 'Site plan' }] : []),
    ...(s.features?.length ? [{ id: 'features', label: 'Amenities' }] : []),
    { id: 'location', label: 'Location' },
    { id: 'insights', label: 'Pricing' },
    ...(price ? [{ id: 'emi', label: 'EMI' }] : []),
    { id: 'contact', label: 'Developer' },
    { id: 'reviews', label: 'Reviews' },
    ...(others.length ? [{ id: 'similar', label: 'Similar' }] : []),
  ];

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
    ...(rating ? { aggregateRating: rating } : {}),
    additionalProperty: [
      { '@type': 'PropertyValue', name: 'AQI', value: s.aqi },
      { '@type': 'PropertyValue', name: 'Ambient noise', value: `${s.noise} dB` },
      { '@type': 'PropertyValue', name: 'Commute', value: s.commute },
      ...(s.plotRange ? [{ '@type': 'PropertyValue', name: 'Sizes', value: s.plotRange }] : []),
      ...(s.rera ? [{ '@type': 'PropertyValue', name: 'RERA', value: s.rera }] : []),
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      {/* Hero */}
      <section id="pdp-hero" className="relative min-h-[70vh] md:min-h-[78vh] flex items-end overflow-hidden">
        <Image src={s.image} alt={s.title} fill priority sizes="100vw" className="object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a1208] via-[#0a1208]/35 to-[#0a1208]/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a1208]/50 to-transparent" />
        <a
          href="#gallery"
          className="absolute top-5 right-5 md:top-6 md:right-8 inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-black/45 backdrop-blur-sm border border-white/15 text-white text-[10px] uppercase tracking-[0.2em] font-bold hover:bg-black/60 transition-all"
        >
          <Camera className="w-3.5 h-3.5" /> {photos.length} photos
        </a>
        <div className="relative z-10 w-full max-w-6xl mx-auto px-6 md:px-12 pb-10 md:pb-14">
          <p className="text-[10px] uppercase tracking-[0.5em] text-[#c8a951] font-bold mb-4">{s.tagline}</p>
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div>
              <h1 className="font-headline font-extrabold tracking-[-0.02em] text-4xl md:text-6xl xl:text-7xl text-white leading-[0.95]">
                {s.title}
              </h1>
              <p className="mt-3 text-white/60 text-sm md:text-base">{s.location}</p>
            </div>
            <div className="text-right">
              {s.pricePerSqYd ? (
                <p className="text-[9px] text-white/45 uppercase tracking-widest">₹{s.pricePerSqYd.toLocaleString('en-IN')}/sq yd</p>
              ) : null}
              <p className="text-3xl md:text-4xl font-headline font-extrabold text-white">{s.memberPrice}</p>
            </div>
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-3 mt-7">
            {[
              { Icon: Wind, text: `AQI ${s.aqi}` },
              { Icon: VolumeX, text: `${s.noise} dB` },
              { Icon: Clock, text: s.commute },
            ].map(({ Icon, text }) => (
              <span key={text} className="flex items-center gap-2 text-white/75 text-[10px] uppercase tracking-widest font-bold">
                <Icon className="w-3.5 h-3.5 text-[#a3b18a]" /> {text}
              </span>
            ))}
          </div>
        </div>
      </section>

      <PdpTabs sections={sections} title={s.title} price={s.memberPrice} propertyId={s.id} />

      <div className="max-w-6xl mx-auto px-6 md:px-12">
        {/* Overview */}
        <section id="overview" className="scroll-mt-40 py-10 md:py-12">
          <KeyFacts sanctuary={s} />
          <PricingStrip sanctuary={s} />
          <div className="grid lg:grid-cols-[1.6fr_1fr] gap-10 mt-10">
            <div>
              <SectionHead eyebrow="About" title={s.title} />
              <p className="text-base md:text-lg font-light text-secondary leading-relaxed">{s.description}</p>
              <Highlights title={s.title} features={s.features ?? []} />
            </div>
            <aside className="h-fit rounded-3xl border border-outline/12 bg-surface-container-low p-6">
              <p className="text-[9px] uppercase tracking-[0.4em] font-bold text-secondary/50 mb-4">Environment · measured on site</p>
              <dl className="space-y-4">
                {[
                  { Icon: Wind, k: 'Air quality', v: `AQI ${s.aqi}`, sub: s.aqi <= 15 ? 'Pure air · city is 100–180' : 'Clean air · city is 100–180' },
                  { Icon: VolumeX, k: 'Ambient noise', v: `${s.noise} dB`, sub: s.noise <= 20 ? 'Near silent · city is 65+' : 'Quiet · city is 65+' },
                  { Icon: Clock, k: 'Commute', v: s.commute.split('·')[0].trim(), sub: 'measured, not estimated' },
                ].map(({ Icon, k, v, sub }) => (
                  <div key={k} className="flex items-start gap-3">
                    <span className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
                      <Icon className="w-4 h-4" />
                    </span>
                    <div>
                      <dt className="text-[9px] uppercase tracking-[0.25em] font-bold text-secondary/50">{k}</dt>
                      <dd className="font-headline font-bold text-on-surface">{v}</dd>
                      <dd className="text-[11px] text-secondary/60">{sub}</dd>
                    </div>
                  </div>
                ))}
              </dl>
            </aside>
          </div>
        </section>

        {/* Photos */}
        <section id="gallery" className="scroll-mt-40 py-10 md:py-12 border-t border-outline/10">
          <Gallery images={photos} title={s.title} />
        </section>

        {/* Site plan */}
        {s.sitePlanSrc ? (
          <section id="plan" className="scroll-mt-40 py-10 md:py-12 border-t border-outline/10">
            <SectionHead eyebrow="Layout" title="Site plan" />
            <LayoutPlan sanctuary={s} />
          </section>
        ) : null}

        {/* Amenities */}
        {s.features?.length ? (
          <section id="features" className="scroll-mt-40 py-10 md:py-12 border-t border-outline/10">
            <SectionHead eyebrow={`${s.features.length} listed`} title="Amenities & features" />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {s.features.map(f => (
                <div key={f} className="flex items-center gap-3 px-5 py-3.5 rounded-2xl border border-outline/12 bg-surface">
                  <Check className="w-4 h-4 text-primary flex-shrink-0" />
                  <span className="text-sm text-on-surface/85">{f}</span>
                </div>
              ))}
            </div>
          </section>
        ) : null}

        {/* Location */}
        <section id="location" className="scroll-mt-40 py-10 md:py-12 border-t border-outline/10">
          <SectionHead eyebrow="Location advantages" title="Getting there" />
          <LocationAdvantages sanctuary={s} />
        </section>

        {/* Pricing & investment (includes the gated unit sheet) */}
        <section id="insights" className="scroll-mt-40 py-10 md:py-12 border-t border-outline/10">
          <SectionHead eyebrow="Pricing & investment" title="The numbers" />
          <InvestPanel sanctuary={s} />
        </section>

        {/* EMI */}
        {price ? (
          <section id="emi" className="scroll-mt-40 py-10 md:py-12 border-t border-outline/10">
            <SectionHead eyebrow="Affordability" title="Estimate your EMI" />
            <EmiCalculator price={price} />
          </section>
        ) : null}

        {/* Developer + lead form */}
        <section id="contact" className="scroll-mt-40 py-10 md:py-12 border-t border-outline/10">
          <SectionHead eyebrow="Contact" title="Talk to the developer, through us" />
          <DeveloperCard sanctuary={s} />
        </section>
      </div>

      {/* Reviews */}
      <div id="reviews" className="scroll-mt-40 border-t border-outline/10">
        <ReviewList reviews={reviews} />
        <section className="py-14 px-6 md:px-24">
          <div className="max-w-4xl mx-auto">
            <h2 className="font-headline font-extrabold tracking-[-0.01em] text-2xl md:text-3xl mb-2">
              Visited {s.title}? Tell us how it went.
            </h2>
            <p className="text-sm text-secondary/60 mb-6">Reviews are read by a person before they go live.</p>
            <ReviewForm propertyId={s.id} />
          </div>
        </section>
      </div>

      {/* Similar */}
      {others.length ? (
        <section id="similar" className="scroll-mt-40 py-12 md:py-16 px-6 md:px-12 bg-surface-container-low border-t border-outline/10">
          <div className="max-w-6xl mx-auto">
            <SectionHead eyebrow="Also curated" title="Similar sanctuaries" />
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
              {others.map(x => (
                <ListingCard key={x.id} sanctuary={x} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <PdpStickyBar id={s.id} />
      <Footer />
    </>
  );
}
