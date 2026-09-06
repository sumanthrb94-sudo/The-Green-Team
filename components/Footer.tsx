import Link from 'next/link';
import { Instagram, Linkedin, Mail } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { BUSINESS } from '@/lib/data/contact';
import { LEGAL, LEGAL_LINKS } from '@/lib/data/legal';

/**
 * Three short columns, not eleven description cards.
 *
 * The cards each carried a label and a line of copy, which on a phone stacked
 * into roughly two thousand pixels of footer — a second website under the
 * website. A footer is a directory, not a pitch: the drawer and the top bar do
 * the selling, so these are plain links and the descriptions are gone.
 */
const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Sanctuaries',
    links: [
      { label: 'MODCON Agartha', href: '/sanctuaries/agartha' },
      { label: 'MODCON SYL Residences', href: '/sanctuaries/syl' },
      { label: 'Dates County', href: '/sanctuaries/dates-county' },
      { label: 'Sanctuary map', href: '/map' },
    ],
  },
  {
    title: 'Browse',
    links: [
      { label: 'All listings', href: '/list' },
      { label: 'Villas & villaments', href: '/explore/villas' },
      { label: 'Plots & farmland', href: '/explore/plots' },
      { label: 'Investments', href: '/explore/investments' },
    ],
  },
  {
    title: 'The Green Team',
    links: [
      { label: 'Our standard', href: '/standard' },
      { label: 'The journal', href: '/blog' },
      { label: 'List your property', href: '/contact?interest=list-property' },
      { label: 'Contact', href: '/contact' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="bg-forest-section text-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-14 md:pt-20 pb-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-8 mb-12">
          <div className="max-w-xl">
            <Logo onDark />
            <p className="mt-5 text-sm md:text-base text-white/50 font-light leading-relaxed">
              Independent channel partners who curate forest-adjacent homes near Hyderabad — verified air, verified
              noise, verified commute, before we ever show you a brochure.
            </p>
          </div>
          {/* Two equal buttons. Left to wrap they stacked at two different
              widths on a phone, which read as a mistake. */}
          <div className="grid grid-cols-2 gap-3 w-full lg:flex lg:w-auto self-start">
            <Link
              href="/contact?interest=list-property"
              className="px-5 lg:px-8 py-4 lg:py-5 text-center border border-white/20 text-white/70 text-[9px] lg:text-[10px] uppercase tracking-[0.25em] lg:tracking-[0.35em] font-bold hover:border-white/50 hover:text-white transition-all duration-500"
            >
              List your property
            </Link>
            <Link
              href="/contact"
              className="px-5 lg:px-8 py-4 lg:py-5 text-center bg-gold text-olive-900 text-[9px] lg:text-[10px] uppercase tracking-[0.25em] lg:tracking-[0.35em] font-bold hover:bg-gold-bright transition-all duration-500"
            >
              Contact
            </Link>
          </div>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-10 mb-14">
          {COLUMNS.map(col => (
            <div key={col.title}>
              <p className="text-[8px] uppercase tracking-[0.45em] text-white/30 font-bold mb-4">{col.title}</p>
              <ul className="space-y-2.5">
                {col.links.map(l => (
                  <li key={l.href}>
                    <Link href={l.href} className="text-sm text-white/60 hover:text-white transition-colors">
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-white/8">
          <div>
            <p className="text-[9px] uppercase tracking-[0.3em] text-white/35">
              © {new Date().getFullYear()} The Green Team · Channel Partners · Hyderabad
            </p>
            {/* RERA 2016 s.9/10: an agent's registration belongs on the advertisement. */}
            <p className="mt-2 text-[9px] uppercase tracking-[0.2em] text-white/25">
              {LEGAL.reraAuthority} agent reg. {LEGAL.reraAgentRegNo}
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1">
              {LEGAL_LINKS.map(l => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-[9px] uppercase tracking-[0.2em] text-white/45 hover:text-white transition-colors"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={BUSINESS.instagram}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Instagram"
              className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-all"
            >
              <Instagram className="w-4 h-4" />
            </a>
            <a
              href={BUSINESS.linkedin}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="LinkedIn"
              className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-all"
            >
              <Linkedin className="w-4 h-4" />
            </a>
            <a
              href={`mailto:${BUSINESS.email}`}
              aria-label="Email"
              className="w-9 h-9 rounded-full border border-white/15 flex items-center justify-center text-white/50 hover:text-white hover:border-white/40 transition-all"
            >
              <Mail className="w-4 h-4" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
