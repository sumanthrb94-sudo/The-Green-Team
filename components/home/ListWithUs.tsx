/**
 * The supply-side band — for developers and owners, not buyers. A listing
 * portal has two doors: "find a property" and "list a property". This is the
 * second one, kept deliberately quiet (one outline CTA on a light ground) so
 * it never competes with the buyer journey, and framed by the standard so it
 * reads as an invitation to be curated, not a "Post Property Free" button.
 */
import Link from 'next/link';
import { ArrowRight, ShieldCheck, Wind, FileCheck } from 'lucide-react';

const BAR = [
  { Icon: Wind, text: 'Measured air & noise' },
  { Icon: FileCheck, text: 'Clear title & approvals' },
  { Icon: ShieldCheck, text: 'Verified on site' },
];

export function ListWithUs() {
  return (
    <section className="py-12 sm:py-16 md:py-20 px-4 sm:px-6 md:px-14 bg-surface border-y border-outline/10">
      <div className="max-w-[1400px] mx-auto grid lg:grid-cols-[1.2fr_1fr] gap-6 sm:gap-10 lg:gap-16 items-center">
        <div>
          <span className="text-primary text-[9px] sm:text-[10px] font-bold uppercase tracking-[0.5em] sm:tracking-[0.6em] mb-2 sm:mb-4 block">
            For developers &amp; owners
          </span>
          <h2 className="font-headline font-extrabold tracking-[-0.02em] text-2xl sm:text-4xl md:text-5xl text-on-surface leading-[1.05]">
            Have a property that clears the bar?
            <br />
            <span className="text-primary">List it with us.</span>
          </h2>
          <p className="text-on-surface/60 text-sm sm:text-base md:text-lg leading-relaxed mt-3 sm:mt-5 max-w-xl">
            We list a handful of forest-adjacent projects near Hyderabad, not hundreds. If yours passes our
            six-part standard, it reaches buyers who came here specifically for this — and only this.
          </p>
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 mt-6 sm:mt-8">
            <Link
              href="/contact?interest=list-property"
              className="group inline-flex items-center justify-center gap-2 px-6 py-3.5 sm:px-8 sm:py-4 rounded-full border border-outline/30 text-[9px] sm:text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.35em] font-bold text-on-surface hover:border-primary hover:text-primary transition-all"
            >
              List your property
              <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
            </Link>
            <Link
              href="/standard"
              className="inline-flex items-center justify-center px-6 py-3.5 sm:px-8 sm:py-4 rounded-full text-[9px] sm:text-[10px] uppercase tracking-[0.3em] sm:tracking-[0.35em] font-bold text-secondary/70 hover:text-primary transition-all"
            >
              Read the standard
            </Link>
          </div>
        </div>

        <div className="grid gap-2.5 sm:gap-3">
          {BAR.map(({ Icon, text }) => (
            <div key={text} className="flex items-center gap-3.5 sm:gap-4 p-3.5 sm:p-5 rounded-2xl border border-outline/12 bg-surface-container-low">
              <span className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-primary/8 flex items-center justify-center text-primary flex-shrink-0">
                <Icon className="w-4 h-4" />
              </span>
              <span className="text-xs sm:text-sm font-semibold text-on-surface/85">{text}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
