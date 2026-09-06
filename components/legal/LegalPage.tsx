import type { ReactNode } from 'react';
import Link from 'next/link';
import { AlertTriangle } from 'lucide-react';
import { LEGAL, LEGAL_LINKS, missingLegalDetails } from '@/lib/data/legal';

/**
 * The frame every policy shares: a heading, the version it is, the other two
 * policies, and — while any legally required detail is still blank — a notice
 * saying so.
 *
 * That notice is deliberate. A policy that prints "[TO BE COMPLETED]" where a
 * RERA number should be is embarrassing; one that silently omits it is a
 * problem. This makes the gap impossible to miss so it gets filled.
 */
export function LegalPage({
  title,
  intro,
  children,
}: {
  title: string;
  intro: string;
  children: ReactNode;
}) {
  const missing = missingLegalDetails();

  return (
    <div className="pt-24 md:pt-28 pb-24 px-6 md:px-14">
      <div className="max-w-3xl mx-auto">
        <span className="text-primary text-[10px] font-bold uppercase tracking-[0.6em] mb-4 block">Legal</span>
        <h1 className="font-headline font-extrabold tracking-[-0.02em] text-4xl md:text-5xl text-on-surface leading-[1.02]">
          {title}
        </h1>
        <p className="text-lg font-light text-secondary leading-relaxed mt-5">{intro}</p>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-2 mt-7 pb-7 border-b border-outline/15">
          <span className="text-[10px] uppercase tracking-[0.25em] font-bold text-secondary/60">
            Version {LEGAL.version} · In effect from {LEGAL.effectiveFrom}
          </span>
          {LEGAL_LINKS.filter(l => l.label !== title).map(l => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[10px] uppercase tracking-[0.25em] font-bold text-primary hover:underline underline-offset-4"
            >
              {l.label} →
            </Link>
          ))}
        </div>

        {missing.length > 0 && (
          <div className="mt-8 flex items-start gap-3 p-5 rounded-2xl bg-gold/10 border border-gold/30">
            <AlertTriangle className="w-5 h-5 text-gold flex-shrink-0 mt-0.5" />
            <div className="text-sm text-on-surface/85 leading-relaxed">
              <strong>This document is not finished.</strong> {missing.length} required detail
              {missing.length === 1 ? '' : 's'} — including the registered entity, its RERA agent
              registration and the named officers — have not been supplied yet, and a policy is only
              binding and useful once they are. Fill them in <code className="text-xs">lib/data/legal.ts</code>,
              and have an advocate review the whole document before relying on it.
            </div>
          </div>
        )}

        <article className="legal-body mt-10">{children}</article>
      </div>
    </div>
  );
}

/** A numbered clause. Numbering is real here — policies are cited by number. */
export function Clause({ n, title, children }: { n: string; title: string; children: ReactNode }) {
  return (
    <section id={`c${n.replace(/\./g, '-')}`} className="mb-9 scroll-mt-24">
      <h2 className="font-headline font-bold text-lg text-on-surface mb-3 flex gap-3">
        <span className="text-primary tabular-nums flex-shrink-0">{n}</span>
        <span>{title}</span>
      </h2>
      <div className="space-y-3 text-secondary leading-relaxed">{children}</div>
    </section>
  );
}
