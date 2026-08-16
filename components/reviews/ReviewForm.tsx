'use client';

/**
 * Review submission. Posts to /api/reviews, which stores it as `pending` —
 * nothing appears publicly until it is approved in Admin → Reviews.
 */
import { useState } from 'react';
import { Check, Star } from 'lucide-react';
import { track } from '@/lib/analytics';
import { cn } from '@/lib/utils';

export function ReviewForm({ propertyId }: { propertyId?: string }) {
  const [name, setName] = useState('');
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rating) {
      setError('Please pick a rating.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, rating, text, propertyId }),
      });
      if (!res.ok) throw new Error();
      track.review(rating, propertyId);
      setDone(true);
    } catch {
      setError('Something went wrong — please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (done) {
    return (
      <div className="flex flex-col items-center text-center gap-3 py-8">
        <span className="w-12 h-12 rounded-full border border-primary/40 flex items-center justify-center">
          <Check className="w-5 h-5 text-primary" />
        </span>
        <p className="font-semibold text-lg">Thank you.</p>
        <p className="text-sm opacity-60">We read every review before it goes live.</p>
      </div>
    );
  }

  const field =
    'w-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/15 rounded-xl px-4 py-3 outline-none focus:border-primary/60 transition-colors';

  return (
    <form onSubmit={submit} className="space-y-4 max-w-lg">
      <div className="flex items-center gap-1.5" role="radiogroup" aria-label="Rating">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} star${n > 1 ? 's' : ''}`}
            onClick={() => setRating(n)}
            className="p-1 transition-transform hover:scale-110"
          >
            <Star
              className={cn(
                'w-7 h-7 transition-colors',
                n <= rating ? 'fill-[#c8a951] text-[#c8a951]' : 'text-black/20 dark:text-white/25'
              )}
            />
          </button>
        ))}
      </div>
      <input
        required
        value={name}
        onChange={e => setName(e.target.value)}
        placeholder="Your name *"
        className={field}
      />
      <textarea
        required
        rows={4}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="What was your experience? *"
        className={cn(field, 'resize-y')}
      />
      {error && <p className="text-sm text-[#c0553f]">{error}</p>}
      <button
        type="submit"
        disabled={loading}
        className="px-7 py-3.5 rounded-xl bg-primary text-white text-xs uppercase tracking-[0.25em] font-bold hover:opacity-90 transition-opacity disabled:opacity-60"
      >
        {loading ? 'Sending…' : 'Submit Review'}
      </button>
    </form>
  );
}
