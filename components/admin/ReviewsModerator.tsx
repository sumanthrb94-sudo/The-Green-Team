'use client';

/** Approve / reject queue. Nothing reaches the public site until it is approved here. */
import { useState } from 'react';
import { Check, X, Star, RotateCcw } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ModeratedReview {
  id: string;
  name: string;
  rating: number;
  text: string;
  status: string;
  propertyId?: string;
  createdAt?: string | null;
}

export function ReviewsModerator({ reviews }: { reviews: ModeratedReview[] }) {
  const [items, setItems] = useState(reviews);
  const [busy, setBusy] = useState<string | null>(null);

  const setStatus = async (id: string, status: string) => {
    setBusy(id);
    // Optimistic: the queue is the admin's working surface, so it should feel
    // instant. Reverted below if the write fails.
    const prev = items;
    setItems(items.map(r => (r.id === id ? { ...r, status } : r)));
    try {
      const res = await fetch('/api/admin/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setItems(prev);
    } finally {
      setBusy(null);
    }
  };

  if (items.length === 0) {
    return (
      <p className="text-secondary/60 text-sm py-10 text-center">
        No reviews yet. Share the review link with buyers after a site visit — that is when they are
        most willing to write one.
      </p>
    );
  }

  const pending = items.filter(r => r.status === 'pending');
  const decided = items.filter(r => r.status !== 'pending');

  const Card = ({ r }: { r: ModeratedReview }) => (
    <div className="p-4 rounded-2xl bg-surface border border-outline/12">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="flex gap-0.5">
              {[1, 2, 3, 4, 5].map(n => (
                <Star
                  key={n}
                  className={cn(
                    'w-3.5 h-3.5',
                    n <= r.rating ? 'fill-[#c8a951] text-[#c8a951]' : 'text-outline/30'
                  )}
                />
              ))}
            </span>
            <span className="font-semibold text-on-surface text-sm">{r.name}</span>
            {r.propertyId && (
              <span className="text-[10px] uppercase tracking-widest text-secondary/50">
                {r.propertyId}
              </span>
            )}
            <span
              className={cn(
                'text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full border',
                r.status === 'approved' && 'bg-primary/10 text-primary border-primary/25',
                r.status === 'rejected' && 'bg-secondary/10 text-secondary/70 border-outline/25',
                r.status === 'pending' && 'bg-[#c8a951]/10 text-[#c8a951] border-[#c8a951]/30'
              )}
            >
              {r.status}
            </span>
          </div>
          <p className="text-sm text-secondary/80 leading-relaxed">{r.text}</p>
        </div>
        <div className="flex gap-1.5 flex-shrink-0">
          {r.status !== 'approved' && (
            <button
              onClick={() => setStatus(r.id, 'approved')}
              disabled={busy === r.id}
              aria-label="Approve"
              className="w-8 h-8 rounded-full border border-primary/30 text-primary flex items-center justify-center hover:bg-primary/10 transition-colors disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
            </button>
          )}
          {r.status === 'pending' && (
            <button
              onClick={() => setStatus(r.id, 'rejected')}
              disabled={busy === r.id}
              aria-label="Reject"
              className="w-8 h-8 rounded-full border border-outline/25 text-secondary/60 flex items-center justify-center hover:bg-outline/10 transition-colors disabled:opacity-50"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          {r.status !== 'pending' && (
            <button
              onClick={() => setStatus(r.id, 'pending')}
              disabled={busy === r.id}
              aria-label="Move back to pending"
              className="w-8 h-8 rounded-full border border-outline/25 text-secondary/60 flex items-center justify-center hover:bg-outline/10 transition-colors disabled:opacity-50"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-8">
      {pending.length > 0 && (
        <div>
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-secondary/50 mb-3">
            Awaiting review · {pending.length}
          </h2>
          <div className="space-y-2.5">
            {pending.map(r => (
              <Card key={r.id} r={r} />
            ))}
          </div>
        </div>
      )}
      {decided.length > 0 && (
        <div>
          <h2 className="text-[10px] uppercase tracking-[0.3em] text-secondary/50 mb-3">
            Decided · {decided.length}
          </h2>
          <div className="space-y-2.5">
            {decided.map(r => (
              <Card key={r.id} r={r} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
