'use client';

/**
 * The search bar on the front door.
 *
 * The hero used to be a statement and nothing else — a visitor's first possible
 * action was a scroll. On a property site the first action should be a search,
 * the way it is on every portal a buyer has already used. This owns no results:
 * it hands the query to /list, which is the real search surface, so there is one
 * filtering implementation rather than two.
 *
 * Every link is built by the same serialiser /list parses with, so a renamed
 * filter or budget band can never leave a dead shortcut behind on the home page.
 *
 * The chips are not filters — one tap is a whole search for someone who already
 * knows they want land rather than a finished house.
 */
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { CATEGORIES } from '@/lib/data/categories';
import { BUDGET_BANDS, EMPTY_FILTERS, paramsFromFilters, type Filters } from '@/lib/data/listing';

const listHref = (patch: Partial<Filters>) => `/list${paramsFromFilters({ ...EMPTY_FILTERS, ...patch })}`;

const SHORTCUTS: { label: string; href: string }[] = [
  ...CATEGORIES.map(c => ({ label: c.label, href: listHref({ category: c.slug }) })),
  { label: BUDGET_BANDS[0].label, href: listHref({ budget: BUDGET_BANDS[0].id }) },
];

export function HeroSearch() {
  const router = useRouter();
  const [q, setQ] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(listHref({ q: q.trim() }));
  };

  return (
    <div>
      <form
        onSubmit={submit}
        role="search"
        className="flex items-center gap-2 p-2 rounded-2xl bg-white/[0.07] border border-white/15 backdrop-blur-xl focus-within:border-[#a3b18a]/50 transition-colors max-w-lg"
      >
        <Search className="w-4 h-4 text-white/40 ml-3 flex-shrink-0" aria-hidden />
        <label htmlFor="hero-search" className="sr-only">
          Search villas, plots and locations
        </label>
        <input
          id="hero-search"
          type="search"
          value={q}
          onChange={e => setQ(e.target.value)}
          placeholder="Search Narsapur, villas, farm plots…"
          className="flex-1 min-w-0 bg-transparent py-3 text-sm text-white placeholder:text-white/35 outline-none"
        />
        <button
          type="submit"
          className="px-6 py-3 rounded-xl bg-[#c8a951] text-[#1a1a0a] text-[9px] uppercase tracking-[0.3em] font-bold hover:bg-[#d9bb62] transition-all flex-shrink-0"
        >
          Search
        </button>
      </form>

      <div className="flex flex-wrap gap-2 mt-3.5">
        {SHORTCUTS.map(s => (
          <Link
            key={s.label}
            href={s.href}
            className="px-4 py-2 rounded-full border border-white/15 text-white/55 text-[10px] uppercase tracking-[0.2em] font-bold hover:border-[#a3b18a]/50 hover:text-white transition-all"
          >
            {s.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
