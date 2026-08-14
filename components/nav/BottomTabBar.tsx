'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MapPin, Award, TrendingDown, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'home', href: '/', label: 'Home', icon: Home },
  { id: 'map', href: '/map', label: 'Map', icon: MapPin },
  { id: 'gold', href: '/preinvestor-gold', label: 'Gold', icon: Award },
  { id: 'analytics', href: '/analytics', label: 'Edge + Nature', icon: TrendingDown },
  { id: 'join', href: '/membership', label: 'Join', icon: Shield },
];

export function BottomTabBar() {
  const pathname = usePathname();
  return (
    <nav
      aria-label="Primary"
      className="md:hidden fixed bottom-0 inset-x-0 z-[9980] glass pb-[env(safe-area-inset-bottom)]"
    >
      <div className="flex items-stretch justify-around">
        {TABS.map(({ href, label, icon: Icon, id }) => {
          const active = pathname === href;
          return (
            <Link
              key={id}
              href={href}
              className={cn(
                'flex flex-col items-center gap-1 py-2.5 px-2 min-w-14 transition-colors',
                active ? 'text-primary' : 'text-secondary/45'
              )}
            >
              <Icon className="w-4 h-4" />
              <span className="text-[7px] uppercase tracking-[0.2em] font-bold text-center leading-tight">{label}</span>
              <span className={cn('h-0.5 w-6 rounded-full', active ? 'bg-primary' : 'bg-transparent')} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
