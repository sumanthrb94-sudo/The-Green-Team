/**
 * "Contact the developer" — the portal's builder card, with the one difference
 * that matters: the introduction goes through The Green Team, who verified the
 * listing on site. The lead form is the unified ContactForm, prefilled for
 * this property, so every enquiry lands in the same pipeline.
 */
import { Building, ShieldCheck, ExternalLink, FileText } from 'lucide-react';
import { ContactForm } from '@/components/contact/ContactForm';
import type { Sanctuary } from '@/lib/data/sanctuaries';

export function DeveloperCard({ sanctuary: s }: { sanctuary: Sanctuary }) {
  return (
    <div className="grid lg:grid-cols-[1fr_1.4fr] gap-6 lg:gap-8">
      <div className="space-y-4">
        <div className="p-6 rounded-3xl border border-outline/12 bg-surface-container-low">
          <div className="flex items-center gap-4">
            <span className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center flex-shrink-0">
              <Building className="w-6 h-6" />
            </span>
            <div className="min-w-0">
              <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-secondary/50">Developer</p>
              <p className="font-headline font-bold text-lg text-on-surface leading-tight">{s.architect ?? 'Developer'}</p>
            </div>
          </div>
          <div className="mt-5 pt-5 border-t border-outline/10 flex items-start gap-2.5 text-sm text-on-surface/80 leading-relaxed">
            <ShieldCheck className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
            <p>
              Curated and verified on site by <span className="font-semibold text-on-surface">The Green Team</span>. We
              introduce you directly to the developer — no middleman markup.
            </p>
          </div>
        </div>

        {s.brochureUrl && (
          <a
            href={s.brochureUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center justify-between gap-3 p-5 rounded-2xl border border-outline/12 bg-surface hover:border-primary/40 transition-all"
          >
            <span className="flex items-center gap-3 min-w-0">
              <FileText className="w-5 h-5 text-primary flex-shrink-0" />
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-on-surface group-hover:text-primary transition-colors">Official brochure</span>
                <span className="block text-[11px] text-secondary/60">From the developer</span>
              </span>
            </span>
            <ExternalLink className="w-4 h-4 text-secondary/50 flex-shrink-0" />
          </a>
        )}
      </div>

      <div className="rounded-3xl border border-outline/12 bg-surface-container-low p-5 md:p-7">
        <p className="font-headline font-bold text-lg text-on-surface mb-1">Talk to an adviser about {s.title}</p>
        <p className="text-sm text-secondary mb-5">Pricing, availability, a site visit — one form, a reply within 24 hours.</p>
        <ContactForm defaultInterest={s.category ?? 'general'} defaultProperty={s.id} />
      </div>
    </div>
  );
}
