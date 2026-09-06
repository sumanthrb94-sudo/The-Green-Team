import { Star } from 'lucide-react';
import type { Review } from '@/lib/server/reviews';
import { cn } from '@/lib/utils';

/**
 * Approved reviews. Renders nothing when there are none — an empty "Reviews"
 * heading advertises that nobody has reviewed you, which is worse than the
 * section being absent.
 */
export function ReviewList({ reviews }: { reviews: Review[] }) {
  if (reviews.length === 0) return null;

  const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;

  return (
    <section className="py-20 px-6 md:px-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-baseline gap-4 mb-10">
          <h2 className="font-headline font-extrabold tracking-[-0.02em] text-3xl md:text-4xl">What buyers say</h2>
          <span className="flex items-center gap-1.5 text-sm opacity-70">
            <Star className="w-4 h-4 fill-[#c8a951] text-[#c8a951]" />
            {avg.toFixed(1)} · {reviews.length} review{reviews.length > 1 ? 's' : ''}
          </span>
        </div>

        <ul className="grid gap-6 md:grid-cols-2">
          {reviews.map(r => (
            <li
              key={r.id}
              className="rounded-2xl border border-black/8 dark:border-white/10 p-6 bg-black/[0.02] dark:bg-white/[0.03]"
            >
              <div className="flex gap-0.5 mb-3" aria-label={`${r.rating} out of 5`}>
                {[1, 2, 3, 4, 5].map(n => (
                  <Star
                    key={n}
                    className={cn(
                      'w-4 h-4',
                      n <= r.rating ? 'fill-[#c8a951] text-[#c8a951]' : 'text-black/15 dark:text-white/20'
                    )}
                  />
                ))}
              </div>
              <p className="text-sm leading-relaxed opacity-85">{r.text}</p>
              <p className="mt-4 text-xs uppercase tracking-[0.18em] opacity-50">{r.name}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
