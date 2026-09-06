'use client';

/**
 * The sticky section bar on a property page — the 99acres pattern. A row of
 * horizontally scrollable tabs (Overview · Photos · Site plan · …) that
 * highlight as you scroll (IntersectionObserver scroll-spy) and jump on tap,
 * plus a compact title / price / share / shortlist row that slides in once
 * the hero has scrolled away, so the buyer never loses what they're looking at.
 */
import { useEffect, useRef, useState } from 'react';
import { Share2, Heart, Check } from 'lucide-react';
import { useShortlist } from '@/lib/shortlist';
import { cn } from '@/lib/utils';

export interface PdpSection {
  id: string;
  label: string;
}

export function PdpTabs({
  sections,
  title,
  price,
  propertyId,
}: {
  sections: PdpSection[];
  title: string;
  price: string;
  propertyId: string;
}) {
  const [active, setActive] = useState(sections[0]?.id ?? '');
  const [pastHero, setPastHero] = useState(false);
  const [copied, setCopied] = useState(false);
  const [saved, toggleSaved] = useShortlist(propertyId);
  const barRef = useRef<HTMLDivElement>(null);

  // Compact row appears once the hero has left the viewport.
  useEffect(() => {
    const hero = document.getElementById('pdp-hero');
    const onScroll = () => {
      const bottom = hero ? hero.getBoundingClientRect().bottom : 0;
      setPastHero(bottom < 72);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Scroll-spy: the topmost section crossing the reading band wins.
  useEffect(() => {
    const els = sections
      .map(s => document.getElementById(s.id))
      .filter((el): el is HTMLElement => Boolean(el));
    if (!els.length) return;
    const io = new IntersectionObserver(
      entries => {
        const visible = entries
          .filter(e => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActive(visible[0].target.id);
      },
      { rootMargin: '-30% 0px -60% 0px', threshold: 0 },
    );
    els.forEach(el => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  // Keep the active tab in view inside the scrollable bar.
  useEffect(() => {
    const el = barRef.current?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    el?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
  }, [active]);

  const go = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });

  const share = async () => {
    const url = window.location.href;
    if (typeof navigator.share === 'function') {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        return; // user dismissed the sheet — not an error
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {}
  };

  return (
    // Near-opaque, not `glass`: this bar sits over dense, high-contrast blocks
    // (dark EMI card, forms), and an 82% surface lets them bleed through.
    <div className="sticky top-14 z-[890] bg-surface/95 backdrop-blur-xl border-b border-outline/10">
      {/* Compact identity row */}
      <div
        className={cn(
          'max-w-6xl mx-auto px-6 md:px-12 flex items-center justify-between gap-3 overflow-hidden transition-all duration-300',
          pastHero ? 'max-h-16 py-2 opacity-100' : 'max-h-0 py-0 opacity-0',
        )}
        aria-hidden={!pastHero}
      >
        <div className="min-w-0">
          <p className="font-headline font-bold text-sm text-on-surface truncate">{title}</p>
          <p className="text-xs font-semibold text-primary">{price}</p>
        </div>
        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={share}
            aria-label={copied ? 'Link copied' : 'Share'}
            className="w-9 h-9 rounded-full border border-outline/20 flex items-center justify-center text-secondary/70 hover:border-primary hover:text-primary transition-all"
          >
            {copied ? <Check className="w-4 h-4 text-primary" /> : <Share2 className="w-4 h-4" />}
          </button>
          <button
            onClick={toggleSaved}
            aria-pressed={saved}
            aria-label={saved ? 'Remove from shortlist' : 'Add to shortlist'}
            className="w-9 h-9 rounded-full border border-outline/20 flex items-center justify-center text-secondary/70 hover:border-primary transition-all"
          >
            <Heart className={cn('w-4 h-4', saved && 'fill-[#e2857b] text-[#e2857b]')} />
          </button>
        </div>
      </div>

      {/* Section tabs */}
      <div
        ref={barRef}
        role="tablist"
        aria-label="Sections"
        className="max-w-6xl mx-auto px-6 md:px-12 flex gap-1 overflow-x-auto no-scrollbar"
      >
        {sections.map(s => (
          <button
            key={s.id}
            data-id={s.id}
            role="tab"
            aria-selected={active === s.id}
            onClick={() => go(s.id)}
            className={cn(
              'flex-shrink-0 px-3.5 py-3 text-[10px] uppercase tracking-[0.2em] font-bold border-b-2 transition-colors whitespace-nowrap',
              active === s.id ? 'border-primary text-primary' : 'border-transparent text-secondary/60 hover:text-on-surface',
            )}
          >
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}
