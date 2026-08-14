import { SANCTUARIES, type Sanctuary } from '@/lib/data/sanctuaries';
import { SanctuaryCard } from '@/components/property/SanctuaryCard';

export function SanctuariesGrid({
  sanctuaries = SANCTUARIES,
  heading = true,
}: {
  sanctuaries?: Sanctuary[];
  heading?: boolean;
}) {
  return (
    <section id="sanctuaries" className="py-20 px-6 md:px-24 bg-surface">
      <div className="max-w-7xl mx-auto">
        {heading && (
          <div className="mb-12 max-w-3xl">
            <span className="text-primary text-[10px] font-bold uppercase tracking-[0.6em] mb-4 block">
              Curated Portfolio
            </span>
            <h2 className="text-5xl md:text-7xl font-light text-on-surface">
              Curated <span className="font-serif italic text-primary">Sanctuaries.</span>
            </h2>
            <p className="text-lg md:text-xl font-light text-secondary leading-relaxed mt-6">
              Naturally organic, sustainable, and strictly premium — from the forest peripheral of Narsapur to the
              vertical landmarks of the highway.
            </p>
          </div>
        )}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
          {sanctuaries.map((s, i) => (
            <SanctuaryCard key={s.id} sanctuary={s} index={i} />
          ))}
        </div>
      </div>
    </section>
  );
}
