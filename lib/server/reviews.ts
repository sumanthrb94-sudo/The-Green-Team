import 'server-only';
import { adminDb } from '@/lib/firebase/admin';

export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  propertyId?: string;
  createdAt?: string;
}

/**
 * Approved reviews only — anything still `pending` is invisible to the public
 * site and to structured data.
 *
 * Returns an empty array when Firestore is unavailable rather than throwing,
 * so a credentials problem degrades to "no reviews shown" instead of a 500 on
 * every page that renders them.
 */
export async function getApprovedReviews(propertyId?: string): Promise<Review[]> {
  try {
    let q = adminDb().collection('reviews').where('status', '==', 'approved');
    if (propertyId) q = q.where('propertyId', '==', propertyId);
    const snap = await q.get();

    return snap.docs
      .map(d => {
        const v = d.data();
        return {
          id: d.id,
          name: String(v.name ?? 'Anonymous'),
          rating: Number(v.rating ?? 0),
          text: String(v.text ?? ''),
          propertyId: v.propertyId ? String(v.propertyId) : undefined,
          createdAt: v.createdAt?.toDate?.()?.toISOString(),
        };
      })
      // Sorted in memory: ordering by createdAt alongside two where() clauses
      // would need a composite index for a list this small.
      .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''));
  } catch {
    return [];
  }
}

/**
 * AggregateRating for JSON-LD.
 *
 * Returns null when there are no approved reviews. Emitting an aggregateRating
 * with no real reviews behind it is exactly the structured-data abuse Google
 * issues manual actions for, so the schema simply does not appear until the
 * ratings are real.
 */
export function aggregateRating(reviews: Review[]) {
  const rated = reviews.filter(r => r.rating >= 1 && r.rating <= 5);
  if (rated.length === 0) return null;
  const avg = rated.reduce((s, r) => s + r.rating, 0) / rated.length;
  return {
    '@type': 'AggregateRating',
    ratingValue: Number(avg.toFixed(1)),
    reviewCount: rated.length,
    bestRating: 5,
    worstRating: 1,
  };
}
