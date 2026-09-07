import { getSessionUser } from '@/lib/server/session';
import { fetchReviews } from '@/lib/server/admin-data';
import { ReviewsModerator, type ModeratedReview } from '@/components/admin/ReviewsModerator';

export const dynamic = 'force-dynamic';

/** Every review, any status — the moderation queue. Admin-gated at the source. */

export default async function AdminReviewsPage() {
  if (!(await getSessionUser())?.isAdmin) return null;
  const reviews = await fetchReviews();
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
