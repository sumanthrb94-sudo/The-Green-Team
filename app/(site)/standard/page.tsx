import type { Metadata } from 'next';
import Link from 'next/link';
import { Check, X, MapPin } from 'lucide-react';
import { Footer } from '@/components/Footer';
import { SITE_URL, WHATSAPP } from '@/lib/data/contact';
import { getPortfolio } from '@/lib/server/portfolio';
import {
  CITY_AQI_BASELINE,
  DISQUALIFIERS,
  LISTING_STANDARD,
  MAX_AQI,
  MAX_NOISE_DB,
  SERVICE_AREA,
  measureAgainstStandard,
} from '@/lib/data/standard';

export const metadata: Metadata = {
  title: 'Our Listing Standard — How We Choose What to List',
  description:
    'The bar a property must clear before we list it: measured air and noise, clean title, access that already exists, and a developer who has delivered. Hyderabad only.',
  alternates: { canonical: `${SITE_URL}/standard` },
  openGraph: {
    type: 'website',
    siteName: 'The Green Team',
    title: 'Our Listing Standard | The Green Team',
    description:
      'Why we list three projects and not three hundred — the standard, and the list of what we turn down.',
    url: `${SITE_URL}/standard`,
    images: [{ url: `${SITE_URL}/agartha-render.jpg` }],
  },
};

export const revalidate = 300;

/**
 * The page that answers the obvious objection to a curated portfolio: "only
 * three listings?" Publishing the bar — and the refusals underneath it — turns
 * a thin catalogue into the reason to trust the catalogue.
 */
export default async function StandardPage() {
  const portfolio = await getPortfolio();
  const proof = measureAgainstStandard(portfolio);
  const byId = new Map(portfolio.map(p => [p.id, p]));

  return (
    <>
      <section className="pt-32 pb-12 px-6 md:px-24">
        <div className="max-w-4xl mx-auto">
          <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-primary mb-5">
            Our Standard
          </p>
          <h1 className="font-serif text-4xl md:text-6xl font-light leading-tight mb-6">
            We list three projects because only three passed.
          </h1>
          <p className="text-lg md:text-xl font-light text-secondary leading-relaxed max-w-2xl">
            A portal lists everything and lets you sort it out. We do the opposite: we measure
            projects against a fixed bar and introduce you only to the ones that clear it. Here is
            the bar, in full, including the things we refuse.
          </p>
        </div>
      </section>

      {/* Service area */}
      <section className="px-6 md:px-24 pb-14">
        <div className="max-w-4xl mx-auto">
          <div className="p-7 rounded-3xl border border-outline/15 bg-surface-container-low">
            <div className="flex items-start gap-4">
              <MapPin className="w-5 h-5 text-primary flex-shrink-0 mt-1" />
              <div>
                <p className="font-headline font-bold text-lg text-on-surface mb-2">
                  {SERVICE_AREA.headline}
                </p>
                <p className="text-sm text-secondary/75 leading-relaxed">{SERVICE_AREA.detail}</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* The six pillars */}
      <section className="px-6 md:px-24 pb-16">
        <div className="max-w-4xl mx-auto space-y-10">
          {LISTING_STANDARD.map((pillar, i) => (
            <div key={pillar.id} className="grid md:grid-cols-[auto_1fr] gap-6">
              <span className="font-headline text-4xl font-extrabold text-primary/20 leading-none">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h2 className="font-serif text-2xl md:text-3xl font-light mb-3">{pillar.title}</h2>
                <p className="text-secondary/75 leading-relaxed mb-5">{pillar.summary}</p>
                <ul className="space-y-2.5">
                  {pillar.tests.map(t => (
                    <li key={t} className="flex items-start gap-3">
                      <Check className="w-4 h-4 text-primary flex-shrink-0 mt-1" />
                      <span className="text-sm text-on-surface/80 leading-relaxed">{t}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Live proof — the portfolio measured against the bar, not asserted to pass it */}
      <section className="px-6 md:px-24 pb-16">
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-2xl md:text-3xl font-light mb-2">
            The current portfolio, measured
          </h2>
          <p className="text-sm text-secondary/60 mb-7">
            Against a Hyderabad city average of AQI {CITY_AQI_BASELINE}. Bar: AQI {MAX_AQI} or under,{' '}
            {MAX_NOISE_DB} dB or under.
          </p>

          <div className="overflow-x-auto rounded-3xl border border-outline/15">
            <table className="w-full text-sm min-w-[520px]">
              <thead>
                <tr className="border-b border-outline/12 bg-surface-container-low">
                  <th className="text-left font-bold text-[9px] uppercase tracking-[0.25em] text-secondary/50 px-5 py-4">
                    Project
                  </th>
                  <th className="text-right font-bold text-[9px] uppercase tracking-[0.25em] text-secondary/50 px-5 py-4">
                    AQI
                  </th>
                  <th className="text-right font-bold text-[9px] uppercase tracking-[0.25em] text-secondary/50 px-5 py-4">
                    Noise
                  </th>
                  <th className="text-right font-bold text-[9px] uppercase tracking-[0.25em] text-secondary/50 px-5 py-4">
                    Cleaner than city
                  </th>
                </tr>
              </thead>
              <tbody>
                {proof.map(p => {
                  const s = byId.get(p.id);
                  if (!s) return null;
                  return (
                    <tr key={p.id} className="border-b border-outline/8 last:border-0">
                      <td className="px-5 py-4">
                        <Link href={`/sanctuaries/${p.id}`} className="hover:text-primary transition-colors">
                          <span className="font-medium text-on-surface">{s.title}</span>
                          <span className="block text-xs text-secondary/50 mt-0.5">{s.location}</span>
                        </Link>
                      </td>
                      <td className="px-5 py-4 text-right tabular-nums">
                        <span className={p.passesAqi ? 'text-on-surface' : 'text-[#8a3d36] font-bold'}>
                          {p.aqi}
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right tabular-nums">
                        <span className={p.passesNoise ? 'text-on-surface' : 'text-[#8a3d36] font-bold'}>
                          {p.noise} dB
                        </span>
                      </td>
                      <td className="px-5 py-4 text-right tabular-nums font-bold text-primary">
                        {p.cleanerBy}×
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Refusals */}
      <section className="px-6 md:px-24 pb-20">
        <div className="max-w-4xl mx-auto">
          <div className="p-8 md:p-10 rounded-3xl bg-forest-section text-white">
            <h2 className="font-serif text-2xl md:text-3xl font-light mb-3">What we turn down</h2>
            <p className="text-white/60 text-sm mb-7 max-w-xl leading-relaxed">
              A standard that only lists what qualifies is marketing. This is the part that costs us
              commission, which is why it is the part worth publishing.
            </p>
            <ul className="grid sm:grid-cols-2 gap-3">
              {DISQUALIFIERS.map(d => (
                <li key={d} className="flex items-start gap-3">
                  <X className="w-4 h-4 text-[#c8a951] flex-shrink-0 mt-0.5" />
                  <span className="text-sm text-white/80 leading-relaxed">{d}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 md:px-24 pb-24">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-serif text-2xl md:text-4xl font-light mb-4">
            Have a property you think clears this?
          </h2>
          <p className="text-secondary/70 mb-8 max-w-lg mx-auto">
            If you are a developer or landowner in Hyderabad, send it over. We will tell you
            honestly which of the six it fails, and whether that is fixable.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <a
              href={WHATSAPP.generic}
              target="_blank"
              rel="noopener noreferrer"
              className="px-8 py-4 rounded-full bg-primary text-on-primary text-[10px] uppercase tracking-[0.3em] font-bold hover:opacity-90 transition-opacity"
            >
              Submit a property
            </a>
            <Link
              href="/adviser-call"
              className="px-8 py-4 rounded-full border border-outline/25 text-[10px] uppercase tracking-[0.3em] font-bold text-on-surface/70 hover:border-primary hover:text-primary transition-all"
            >
              Talk to an adviser
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}
