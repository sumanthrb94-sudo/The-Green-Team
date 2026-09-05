import type { Metadata } from 'next';
import { ReviewForm } from '@/components/reviews/ReviewForm';
import { ReviewList } from '@/components/reviews/ReviewList';
import { Footer } from '@/components/Footer';
import { getApprovedReviews } from '@/lib/server/reviews';
import { SITE_URL } from '@/lib/data/contact';

export const metadata: Metadata = {
  title: 'Reviews — What Buyers Say',
  description:
    'Reviews from buyers who visited the forest-adjacent sanctuaries we curate near Hyderabad.',
  alternates: { canonical: `${SITE_URL}/reviews` },
};

export const revalidate = 300;

/**
 * The link to share after a site visit — the one moment a buyer is actually
 * willing to write something.
 */
export default async function ReviewsPage() {
  const reviews = await getApprovedReviews();
  return (
    <>
      <section className="pt-32 pb-10 px-6 md:px-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="font-serif text-4xl md:text-6xl font-light mb-4">Reviews</h1>
          <p className="opacity-60 max-w-xl">
            Visited one of our sanctuaries? Tell people what it was actually like. We read every
            review before it goes live.
          </p>
        </div>
      </section>

      <section className="px-6 md:px-24 pb-8">
        <div className="max-w-4xl mx-auto">
          <ReviewForm />
        </div>
      </section>

      <ReviewList reviews={reviews} />
      <Footer />
    </>
  );
}
