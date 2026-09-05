'use client';

/**
 * The hero search bar — the single most recognisable gesture of a property
 * portal. A buyer picks a type, optionally types a locality, and lands directly
 * on the filtered results, exactly as they would on Housing.com. It carries the
 * dark-glass hero styling rather than the light page chrome, so it reads as part
 * of the cinematic header, not a form bolted on.
 */
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search } from 'lucide-react';
import { CATEGORIES } from '@/lib/data/categories';

export function HeroSearch() {
  const router = useRouter();
  const [type, setType] = useState('');
  const [q, setQ] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const sp = new URLSearchParams();
    if (type) sp.set('type', type);
    if (q.trim()) sp.set('q', q.trim());
    const s = sp.toString();
    router.push(type ? `/explore/${type}${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ''}` : `/list${s ? `?${s}` : ''}`);
  };

  return (
    <form
      onSubmit={submit}
      className="flex flex-col sm:flex-row items-stretch gap-2 p-2 rounded-3xl sm:rounded-full bg-white/[0.07] border border-white/12 backdrop-blur-xl max-w-xl"
    >
      {/* Type */}
      <div className="relative sm:border-r sm:border-white/10">
        <select
          value={type}
          onChange={e => setType(e.target.value)}
          aria-label="Property type"
          className="appearance-none w-full sm:w-auto h-12 pl-5 pr-10 bg-transparent text-white text-sm font-semibold rounded-full sm:rounded-none outline-none cursor-pointer"
        >
          <option value="" className="text-[#1a1c1a]">All types</option>
          {CATEGORIES.map(c => (
            <option key={c.slug} value={c.slug} className="text-[#1a1c1a]">
              {c.label}
            </option>
          ))}
        </select>
        <svg className="absolute right-4 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/50 pointer-events-none" viewBox="0 0 12 12" fill="none">
          <path d="M2.5 4.5L6 8l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>

      {/* Locality / name */}
      <input
        value={q}
        onChange={e => setQ(e.target.value)}
        placeholder="Narsapur, ORR, forest-edge…"
        aria-label="Locality or name"
        className="flex-1 h-12 px-5 bg-transparent text-white placeholder:text-white/40 text-sm outline-none"
      />

      {/* Submit */}
      <button
        type="submit"
        className="flex items-center justify-center gap-2 h-12 px-7 rounded-full bg-[#c8a951] text-[#1a1a0a] text-[10px] uppercase tracking-[0.3em] font-bold hover:bg-[#d9bb62] transition-all"
      >
        <Search className="w-4 h-4" />
        Search
      </button>
    </form>
  );
}
