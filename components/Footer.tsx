import Link from 'next/link';
import { Instagram, Linkedin, Mail } from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { BUSINESS } from '@/lib/data/contact';

const AGENDA: { label: string; sub: string; href: string }[] = [
  { label: 'The Intelligence Gap', sub: 'Why early entry wins', href: '/analytics' },
  { label: 'Living Ecosystems', sub: 'Nature-first design philosophy', href: '/analytics#pillars' },
  { label: 'Sanctuary Map', sub: 'Environmental heatmap · AQI · Noise', href: '/map' },
  { label: 'MODCON Agartha', sub: 'Narsapur Forest · Open access', href: '/sanctuaries/agartha' },
  { label: 'MODCON SYL Residences', sub: 'Tukkuguda, ORR Exit-14', href: '/sanctuaries/syl' },
  { label: 'Dates County by Planet Green', sub: 'Kandukur · 4,000-acre reserve', href: '/sanctuaries/dates-county' },
  { label: 'Adviser Membership', sub: 'Reserved investor circle · By invitation', href: '/membership' },
];

export function Footer() {
  return (
    <footer className="bg-forest-section text-white">
      <div className="max-w-7xl mx-auto px-6 md:px-12 pt-20 pb-10">
        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10 mb-16">
          <div className="max-w-xl">
            <Logo onDark />
            <p className="mt-6 text-white/50 font-light leading-relaxed">
              Independent channel partners who curate forest-adjacent homes near Hyderabad — verified air, verified
              noise, verified commute, before we ever show you a brochure.
            </p>
          </div>
          <Link
            href="/membership"
            className="self-start px-10 py-5 border border-gold/50 text-gold text-[10px] uppercase tracking-[0.4em] font-bold hover:bg-gold hover:text-olive-900 transition-all duration-500"
          >
            Apply for Access
          </Link>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-px bg-white/5 border border-white/5 mb-16">
          {AGENDA.map(item => (
            <Link
              key={item.label}
              href={item.href}
              className="group bg-forest-section p-6 hover:bg-white/[0.03] transition-colors"
            >
              <p className="text-sm font-bold text-white/85 group-hover:text-white transition-colors">{item.label}</p>
              <p className="mt-1 text-[9px] uppercase tracking-[0.25em] text-white/35">{item.sub}</p>
            </Link>
          ))}
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-white/8">
          <p className="text-[9px] uppercase tracking-[0.3em] text-white/35">
            © {new Date().getFullYear()} The Green Team · Channel Partners · Hyderabad
          </p>
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
