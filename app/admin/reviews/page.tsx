import { adminDb } from '@/lib/firebase/admin';
import { ReviewsModerator, type ModeratedReview } from '@/components/admin/ReviewsModerator';

export const dynamic = 'force-dynamic';

/** Every review, any status — the moderation queue. */
async function fetchAllReviews(): Promise<ModeratedReview[]> {
  try {
    const snap = await adminDb().collection('reviews').orderBy('createdAt', 'desc').get();
    return snap.docs.map(d => {
      const v = d.data();
      return {
        id: d.id,
        name: String(v.name ?? 'Anonymous'),
        rating: Number(v.rating ?? 0),
        text: String(v.text ?? ''),
        status: String(v.status ?? 'pending'),
        propertyId: v.propertyId ? String(v.propertyId) : undefined,
        createdAt: v.createdAt?.toDate?.()?.toISOString() ?? null,
      };
    });
  } catch {
    return [];
  }
}

export default async function AdminReviewsPage() {
  const reviews = await fetchAllReviews();
  const pending = reviews.filter(r => r.status === 'pending').length;
  return (
    <div>
      <h1 className="text-2xl font-bold text-on-surface mb-6">
        Reviews
        {pending > 0 && (
          <span className="text-[#c8a951] font-normal text-lg"> · {pending} awaiting</span>
        )}
      </h1>
      <ReviewsModerator reviews={reviews} />
    </div>
  );
}
