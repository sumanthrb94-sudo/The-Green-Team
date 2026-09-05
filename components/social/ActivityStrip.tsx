'use client';

/**
 * The momentum strip — real activity figures, rendered as quiet stat chips.
 *
 * Fetches from /api/activity (which decides what is real enough to show), so
 * this component holds no numbers of its own — it renders whatever the server
 * hands back and renders nothing if that list is empty. No layout-shift: it
 * reserves no space until it has something true to say.
 */
import { useEffect, useState } from 'react';

interface ActivityItem {
  id: string;
  label: string;
  value: string;
  emphasis?: boolean;
}

export function ActivityStrip({ className = '' }: { className?: string }) {
  const [items, setItems] = useState<ActivityItem[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/activity')
      .then(r => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: { items: ActivityItem[] }) => {
        if (!cancelled) setItems(d.items ?? []);
      })
      .catch(() => {
        if (!cancelled) setItems([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // No bar at all until there is something true to show — no empty strip, no
  // layout shift reserved for nothing.
  if (!items || items.length === 0) return null;

  return (
    <div className={`border-b border-outline/10 bg-surface-container-low/40 ${className}`}>
      <div className="max-w-7xl mx-auto px-6 md:px-14 py-5 flex flex-wrap items-center gap-x-8 gap-y-3" aria-label="Current activity">
      {items.map(it => (
        <div key={it.id} className="flex items-baseline gap-2">
          <span
            className={
              it.emphasis
                ? 'font-headline font-extrabold text-lg text-[#c8a951]'
                : 'font-headline font-extrabold text-lg text-on-surface'
            }
          >
            {it.value}
          </span>
          <span className="text-[11px] uppercase tracking-[0.2em] text-secondary/60 font-bold">{it.label}</span>
          {it.emphasis && (
            <span className="ml-1 flex items-center gap-1.5 text-[9px] uppercase tracking-widest text-[#c8a951]/80 font-bold">
              <span className="relative flex h-1.5 w-1.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#c8a951] opacity-60" />
                <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-[#c8a951]" />
              </span>
              Filling
            </span>
          )}
        </div>
      ))}
      </div>
    </div>
  );
}
