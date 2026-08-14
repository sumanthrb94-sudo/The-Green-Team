'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { AnimatePresence, motion } from 'motion/react';
import { Moon, Sun, ShieldCheck, User as UserIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/brand/Logo';
import { useAuth } from '@/components/auth/AuthProvider';
import { AccountDrawer } from './AccountDrawer';

const NAV = [
  { name: 'Map', href: '/map' },
  { name: 'Edge + Nature', href: '/analytics' },
  { name: 'Blog', href: '/blog' },
  { name: 'Pre-Investor Gold', href: '/preinvestor-gold', gold: true },
  { name: 'Membership', href: '/membership' },
];

export function Navbar() {
  const pathname = usePathname();
  const { user, isAdmin, openAuth } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const toggleDark = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle('dark', next);
    try {
      localStorage.setItem('gt_dark', String(next));
    } catch {}
  };

  const avatarLetter = (user?.displayName?.[0] || user?.email?.[0] || user?.phoneNumber?.[1] || '?').toUpperCase();

  return (
    <>
      <header className="sticky top-0 z-[900] glass">
        <nav className="h-14 flex items-center justify-between px-4 md:px-6 max-w-[1600px] mx-auto">
          <Logo />

          <div className="hidden md:flex items-center gap-7">
            {NAV.map(item => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'text-[10px] uppercase tracking-[0.35em] font-bold transition-colors',
                  item.gold
                    ? 'text-gold hover:text-gold-bright'
                    : pathname === item.href
                      ? 'text-primary'
                      : 'text-secondary/50 hover:text-on-surface'
                )}
              >
                {item.name}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-1.5">
            {isAdmin && (
              <Link
                href="/admin"
                className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-[8px] uppercase tracking-widest font-bold rounded-full hover:bg-primary/20 transition-all"
              >
                <ShieldCheck className="w-3 h-3" /> Admin
              </Link>
            )}
            <button
              onClick={toggleDark}
              title={isDark ? 'Light mode' : 'Dark mode'}
              aria-label="Toggle theme"
              className="w-9 h-9 rounded-full flex items-center justify-center text-secondary/50 hover:text-primary hover:bg-primary/5 transition-all"
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={() => (user ? setDrawerOpen(true) : openAuth())}
              aria-label={user ? 'Account' : 'Sign in'}
              className="w-9 h-9 rounded-full flex items-center justify-center overflow-hidden ring-2 ring-transparent hover:ring-primary/25 transition-all"
            >
              {user ? (
                user.photoURL ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={user.photoURL}
                    referrerPolicy="no-referrer"
                    alt="Profile"
                    className="w-9 h-9 object-cover rounded-full"
                  />
                ) : (
                  <span className="w-9 h-9 rounded-full bg-primary text-on-primary flex items-center justify-center font-bold text-sm">
                    {avatarLetter}
                  </span>
                )
              ) : (
                <span className="w-9 h-9 rounded-full border border-outline/40 flex items-center justify-center">
                  <UserIcon className="w-4 h-4 text-secondary/60" />
                </span>
              )}
            </button>
          </div>
        </nav>
      </header>

      <AnimatePresence>
        {drawerOpen && <AccountDrawer onClose={() => setDrawerOpen(false)} isDark={isDark} />}
      </AnimatePresence>
      {/* keep motion import used even when drawer closed */}
      <motion.span className="hidden" />
    </>
  );
}
