'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/analytics', label: 'Analytics' },
  { href: '/admin/leads', label: 'Leads' },
  { href: '/admin/chats', label: 'Chats' },
  { href: '/admin/properties', label: 'Properties' },
  { href: '/admin/newsletter', label: 'Newsletter' },
  { href: '/admin/reviews', label: 'Reviews' },
  { href: '/admin/users', label: 'Users' },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  // Every admin page is force-dynamic, and Next does not prefetch a dynamic
  // route on hover the way it does a static one — so each tab click paid a full
  // server round trip before anything moved. Warming them once on mount means
  // the payload is usually already there by the time the tab is clicked. Cheap,
  // because the reads behind them are cached for 30 seconds.
  useEffect(() => {
    const id = setTimeout(() => TABS.forEach(t => router.prefetch(t.href)), 300);
    return () => clearTimeout(id);
  }, [router]);
  return (
    <nav className="flex overflow-x-auto no-scrollbar border-t border-outline/10 px-4 md:px-6">
      {TABS.map(t => {
        const active = pathname === t.href;
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              'flex-shrink-0 px-5 py-3 text-[9px] uppercase tracking-[0.3em] font-bold border-b-2 -mb-px transition-all',
              active
                ? 'text-primary border-primary'
                : 'text-secondary/50 border-transparent hover:text-secondary'
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}
