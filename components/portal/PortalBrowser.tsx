'use client';

/**
 * The portal browser — the search-and-results surface that makes this feel like
 * a listing platform (NoBroker / Housing.com) rather than a brochure: a search
 * box, type / budget / stage filters, a sort control, a live result count, and
 * a responsive grid of listing cards.
 *
 * Everything runs client-side over the in-memory portfolio (the set is small
 * and curated), and every change is mirrored into the URL so a filtered view is
 * shareable and the hero search can deep-link straight into it. On a phone the
 * budget / stage / sort controls fold into a bottom sheet behind a Filters
 * button, so the results stay the hero of the screen.
 */
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Search, SlidersHorizontal, X, MapPin } from 'lucide-react';
import type { Sanctuary } from '@/lib/data/sanctuaries';
import { CATEGORIES, STAGES } from '@/lib/data/categories';
import {
  applyFilters,
  BUDGET_BANDS,
  EMPTY_FILTERS,
  filtersFromParams,
  paramsFromFilters,
  SORT_OPTIONS,
  type Filters,
  type SortId,
} from '@/lib/data/listing';
import { ListingCard } from '@/components/portal/ListingCard';
import { cn } from '@/lib/utils';

export function PortalBrowser({
  all,
  lockedCategory,
}: {
  all: Sanctuary[];
  /** When set, the type filter is fixed (used on a category page). */
  lockedCategory?: string;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();

  const initial = useMemo(() => {
    const f = filtersFromParams(params);
    return lockedCategory ? { ...f, category: lockedCategory } : f;
  }, [params, lockedCategory]);

  const [filters, setFilters] = useState<Filters>(initial);
  const [query, setQuery] = useState(initial.q);
  const [sheetOpen, setSheetOpen] = useState(false);

  // Push filters into the URL (debounced for the free-text box).
  const syncUrl = useCallback(
    (f: Filters) => {
      const forUrl = lockedCategory ? { ...f, category: '' } : f;
      router.replace(`${pathname}${paramsFromFilters(forUrl)}`, { scroll: false });
    },
    [router, pathname, lockedCategory],
  );

  const debounce = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (debounce.current) clearTimeout(debounce.current);
    debounce.current = setTimeout(() => {
      setFilters(f => {
        const next = { ...f, q: query };
        syncUrl(next);
        return next;
      });
    }, 300);
    return () => {
      if (debounce.current) clearTimeout(debounce.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  const set = (patch: Partial<Filters>) => {
    setFilters(f => {
      const next = { ...f, ...patch };
      syncUrl(next);
      return next;
    });
  };

  const results = useMemo(() => applyFilters(all, filters), [all, filters]);

  const activeCount =
    (filters.budget ? 1 : 0) +
    (filters.stage ? 1 : 0) +
    (filters.sort !== 'featured' ? 1 : 0) +
    (!lockedCategory && filters.category ? 1 : 0);

  const clearAll = () => {
    const cleared = { ...EMPTY_FILTERS, category: lockedCategory ?? '' };
    setFilters(cleared);
    setQuery('');
    syncUrl(cleared);
  };

  return (
    <div>
      {/* ── Search + type chips (always visible) ─────────────────────────── */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-secondary/50 pointer-events-none" />
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Search by name, locality or feature…"
              aria-label="Search listings"
              className="w-full h-12 pl-11 pr-10 rounded-full bg-surface-container border border-outline/15 text-sm text-on-surface placeholder:text-secondary/45 outline-none focus:border-primary/50 transition-colors"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                aria-label="Clear search"
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-secondary/50 hover:text-on-surface"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Mobile filter trigger */}
          <button
            onClick={() => setSheetOpen(true)}
            className="md:hidden relative flex items-center gap-2 h-12 px-4 rounded-full bg-surface-container border border-outline/15 text-sm font-semibold text-on-surface"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Filters
            {activeCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-primary text-on-primary text-[10px] font-bold flex items-center justify-center">
                {activeCount}
              </span>
            )}
          </button>
        </div>

        {/* Type chips */}
        {!lockedCategory && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar -mx-1 px-1 pb-0.5">
            <Chip active={!filters.category} onClick={() => set({ category: '' })}>
              All properties
            </Chip>
            {CATEGORIES.map(c => (
              <Chip key={c.slug} active={filters.category === c.slug} onClick={() => set({ category: c.slug })}>
                {c.label}
              </Chip>
            ))}
          </div>
        )}

        {/* Inline controls (desktop) */}
        <div className="hidden md:flex items-center gap-3">
          <SelectPill
            label="Budget"
            value={filters.budget}
            onChange={v => set({ budget: v })}
            options={[{ value: '', label: 'Any budget' }, ...BUDGET_BANDS.map(b => ({ value: b.id, label: b.label }))]}
          />
          <SelectPill
            label="Stage"
            value={filters.stage}
            onChange={v => set({ stage: v })}
            options={[{ value: '', label: 'Any stage' }, ...STAGES.map(s => ({ value: s.value, label: s.label }))]}
          />
          <div className="flex-1" />
          <SelectPill
            label="Sort"
            value={filters.sort}
            onChange={v => set({ sort: v as SortId })}
            options={SORT_OPTIONS.map(o => ({ value: o.id, label: o.label }))}
          />
        </div>
      </div>

      {/* ── Results toolbar ──────────────────────────────────────────────── */}
      <div className="flex items-center justify-between gap-4 mt-7 mb-5">
        <p className="text-sm text-secondary/80">
          <span className="font-bold text-on-surface tabular-nums">{results.length}</span>{' '}
          {results.length === 1 ? 'property' : 'properties'}
          <span className="hidden sm:inline"> · </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-secondary/60">
            <MapPin className="w-3.5 h-3.5 text-primary/50" /> Hyderabad
          </span>
        </p>
        {activeCount > 0 && (
          <button
            onClick={clearAll}
            className="text-[10px] uppercase tracking-[0.2em] font-bold text-primary hover:underline underline-offset-4"
          >
            Clear all
          </button>
        )}
      </div>

      {/* ── Results grid ─────────────────────────────────────────────────── */}
      {results.length ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {results.map(s => (
            <ListingCard key={s.id} sanctuary={s} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-dashed border-outline/30 p-10 md:p-14 text-center">
          <p className="font-serif text-2xl md:text-3xl font-light text-on-surface mb-3">
            Nothing matches those filters yet.
          </p>
          <p className="text-sm text-secondary/70 max-w-md mx-auto leading-relaxed mb-6">
            We list a property only when it clears all six parts of our standard, so the set is small on
            purpose. Widen the filters, or tell us what you are looking for and we will watch for it.
          </p>
          <button
            onClick={clearAll}
            className="inline-block px-6 py-3 rounded-full border border-outline/25 text-[10px] uppercase tracking-[0.3em] font-bold text-on-surface/70 hover:border-primary hover:text-primary transition-all"
          >
            Clear filters
          </button>
        </div>
      )}

      {/* ── Mobile filter sheet ──────────────────────────────────────────── */}
      {sheetOpen && (
        <div className="md:hidden fixed inset-0 z-[950]" role="dialog" aria-modal="true" aria-label="Filters">
          <div className="absolute inset-0 bg-black/40" onClick={() => setSheetOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 rounded-t-3xl bg-surface border-t border-outline/15 p-6 pb-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-headline font-bold text-lg text-on-surface">Filters</h2>
              <button onClick={() => setSheetOpen(false)} aria-label="Close filters" className="text-secondary/60 hover:text-on-surface">
                <X className="w-5 h-5" />
              </button>
            </div>

            <SheetGroup label="Budget">
              <ChipWrap>
                <Chip active={!filters.budget} onClick={() => set({ budget: '' })} small>Any</Chip>
                {BUDGET_BANDS.map(b => (
                  <Chip key={b.id} active={filters.budget === b.id} onClick={() => set({ budget: b.id })} small>{b.label}</Chip>
                ))}
              </ChipWrap>
            </SheetGroup>

            <SheetGroup label="Delivery stage">
              <ChipWrap>
                <Chip active={!filters.stage} onClick={() => set({ stage: '' })} small>Any</Chip>
                {STAGES.map(s => (
                  <Chip key={s.value} active={filters.stage === s.value} onClick={() => set({ stage: s.value })} small>{s.label}</Chip>
                ))}
              </ChipWrap>
            </SheetGroup>

            <SheetGroup label="Sort by">
              <ChipWrap>
                {SORT_OPTIONS.map(o => (
                  <Chip key={o.id} active={filters.sort === o.id} onClick={() => set({ sort: o.id })} small>{o.label}</Chip>
                ))}
              </ChipWrap>
            </SheetGroup>

            <div className="flex gap-3 mt-8">
              <button
                onClick={clearAll}
                className="flex-1 py-3.5 rounded-full border border-outline/25 text-[11px] uppercase tracking-[0.2em] font-bold text-on-surface/70"
              >
                Clear all
              </button>
              <button
                onClick={() => setSheetOpen(false)}
                className="flex-1 py-3.5 rounded-full bg-primary text-on-primary text-[11px] uppercase tracking-[0.2em] font-bold"
              >
                Show {results.length} {results.length === 1 ? 'result' : 'results'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ── small pieces ──────────────────────────────────────────────────────── */

function Chip({
  active,
  onClick,
  children,
  small,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  small?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'flex-shrink-0 rounded-full border font-bold uppercase tracking-[0.15em] transition-all',
        small ? 'px-3.5 py-2 text-[10px]' : 'px-4 py-2.5 text-[10px]',
        active
          ? 'bg-primary text-on-primary border-primary'
          : 'bg-surface border-outline/20 text-secondary/70 hover:text-on-surface hover:border-outline/45',
      )}
    >
      {children}
    </button>
  );
}

function ChipWrap({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap gap-2">{children}</div>;
}

function SheetGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mb-6">
      <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-secondary/50 mb-3">{label}</p>
      {children}
    </div>
  );
}

function SelectPill({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  const active = value !== '' && value !== 'featured';
  return (
    <label
      className={cn(
        'relative inline-flex items-center gap-2 h-11 pl-4 pr-9 rounded-full border cursor-pointer transition-colors',
        active ? 'border-primary/50 bg-primary/5' : 'border-outline/20 bg-surface-container hover:border-outline/40',
      )}
    >
      <span className="text-[9px] uppercase tracking-[0.2em] font-bold text-secondary/50">{label}</span>
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        aria-label={label}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      >
        {options.map(o => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <span className="text-sm font-semibold text-on-surface pointer-events-none max-w-[9rem] truncate">
        {options.find(o => o.value === value)?.label}
      </span>
      <svg className="absolute right-3.5 w-3.5 h-3.5 text-secondary/50 pointer-events-none" viewBox="0 0 12 12" fill="none">
        <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </label>
  );
}
