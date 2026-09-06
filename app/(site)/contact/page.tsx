import type { Metadata } from 'next';
import { Phone, Mail, MapPin, Clock, MessageCircle } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { ContactForm } from '@/components/contact/ContactForm';
import { BUSINESS, WHATSAPP, SITE_URL } from '@/lib/data/contact';

export const metadata: Metadata = {
  title: 'Contact The Green Team — Talk to a Property Adviser in Hyderabad',
  description:
    'One form for every question — pricing, plots, site visits or investment. Reach The Green Team by form, WhatsApp, phone or email. A curated-property adviser replies within 24 hours.',
  alternates: { canonical: `${SITE_URL}/contact` },
  openGraph: {
    type: 'website',
    siteName: 'The Green Team',
    title: 'Contact The Green Team',
    description: 'Talk to a curated-property adviser in Hyderabad — form, WhatsApp, phone or email.',
    url: `${SITE_URL}/contact`,
    images: [{ url: `${SITE_URL}/agartha-render.jpg` }],
  },
};

export const revalidate = 3600;

interface Props {
  searchParams: Promise<{ interest?: string; property?: string }>;
}

const CHANNELS = [
  {
    icon: MessageCircle,
    label: 'WhatsApp',
    value: 'Fastest — chat now',
    href: WHATSAPP.generic,
    external: true,
    accent: 'text-[#25D366]',
  },
  {
    icon: Phone,
    label: 'Call us',
    value: BUSINESS.phone,
    href: `tel:${BUSINESS.phone.replace(/\s/g, '')}`,
    accent: 'text-primary',
  },
  {
    icon: Mail,
    label: 'Email',
    value: BUSINESS.email,
    href: `mailto:${BUSINESS.email}`,
    accent: 'text-primary',
  },
];

export default async function ContactPage({ searchParams }: Props) {
  const { interest = 'general', property = '' } = await searchParams;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact The Green Team',
    url: `${SITE_URL}/contact`,
    mainEntity: {
      '@type': 'Organization',
      name: BUSINESS.name,
      telephone: BUSINESS.phone,
      email: BUSINESS.email,
      address: {
        '@type': 'PostalAddress',
        addressLocality: BUSINESS.city,
        addressRegion: BUSINESS.region,
        postalCode: BUSINESS.postalCode,
        addressCountry: 'IN',
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }}
      />

      <section className="pt-24 md:pt-28 pb-16 px-6 md:px-14">
        <div className="max-w-6xl mx-auto">
          {interest === 'list-property' ? (
            <>
              <span className="text-primary text-[10px] font-bold uppercase tracking-[0.6em] mb-3 block">
                For developers & owners
              </span>
              <h1 className="font-headline font-extrabold tracking-[-0.02em] text-4xl md:text-6xl text-on-surface leading-[0.98]">
                List your property <span className="text-primary">with us.</span>
              </h1>
              <p className="text-base md:text-lg font-light text-secondary leading-relaxed mt-5 max-w-2xl">
                Tell us about the project — location, approvals, what stage it is at. If it clears our six-part
                standard, we visit, verify, and put it in front of buyers who came here for exactly this.
              </p>
            </>
          ) : (
            <>
              <span className="text-primary text-[10px] font-bold uppercase tracking-[0.6em] mb-3 block">
                One call. Every answer.
              </span>
              <h1 className="font-headline font-extrabold tracking-[-0.02em] text-4xl md:text-6xl text-on-surface leading-[0.98]">
                Let&apos;s talk about <span className="text-primary">your sanctuary.</span>
              </h1>
              <p className="text-base md:text-lg font-light text-secondary leading-relaxed mt-5 max-w-2xl">
                Pricing, plots, site visits, investment questions — all of it comes to the same desk. Leave a note
                below, or reach us on whichever channel suits you. A curated-property adviser replies within 24 hours.
              </p>
            </>
          )}

          <div className="grid lg:grid-cols-[1.4fr_1fr] gap-10 lg:gap-14 mt-12">
            {/* Form */}
            <div className="rounded-3xl border border-outline/12 bg-surface-container-low p-6 md:p-8">
              <ContactForm defaultInterest={interest} defaultProperty={property} />
            </div>

            {/* Direct channels + details */}
            <div className="flex flex-col gap-4">
              {CHANNELS.map(c => (
                <a
                  key={c.label}
                  href={c.href}
                  {...(c.external ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                  className="group flex items-center gap-4 p-5 rounded-2xl border border-outline/12 bg-surface hover:border-primary/35 transition-all"
                >
                  <span className={`w-11 h-11 rounded-full bg-primary/8 flex items-center justify-center flex-shrink-0 ${c.accent}`}>
                    <c.icon className="w-5 h-5" />
                  </span>
                  <span className="min-w-0">
                    <span className="block text-[9px] uppercase tracking-[0.3em] font-bold text-secondary/50">{c.label}</span>
                    <span className="block text-sm font-semibold text-on-surface truncate group-hover:text-primary transition-colors">{c.value}</span>
                  </span>
                </a>
              ))}

              <div className="rounded-2xl border border-outline/12 bg-surface p-5 mt-1">
                <div className="flex items-start gap-3 mb-4">
                  <MapPin className="w-4 h-4 text-primary/60 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-secondary/50 mb-1">Based in</p>
                    <p className="text-sm text-on-surface/85">Financial District · {BUSINESS.city}, {BUSINESS.region}</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <Clock className="w-4 h-4 text-primary/60 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-secondary/50 mb-1">Adviser hours</p>
                    <p className="text-sm text-on-surface/85">Mon–Sun · 9:00 AM – 8:00 PM IST</p>
                  </div>
                </div>
              </div>

              <p className="text-xs text-secondary/60 leading-relaxed px-1">
                In a hurry? Tap the chat bubble to ask <span className="text-primary font-semibold">Groot</span>, our
                assistant — it answers from real, current listing data and can book a site visit on the spot.
              </p>
            </div>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
