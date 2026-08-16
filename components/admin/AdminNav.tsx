'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

const TABS = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/leads', label: 'Leads' },
  { href: '/admin/chats', label: 'Chats' },
  { href: '/admin/properties', label: 'Properties' },
  { href: '/admin/newsletter', label: 'Newsletter' },
  { href: '/admin/reviews', label: 'Reviews' },
  { href: '/admin/users', label: 'Users' },
];

export function AdminNav() {
  const pathname = usePathname();
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
