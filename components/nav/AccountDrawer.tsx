'use client';

/**
 * The slide-in menu — the primary navigation on mobile (where the top-bar links
 * are hidden) and the account panel on every size.
 *
 * Ordered the way a property app orders it (the NoBroker pattern): the two
 * doors come first. An account row at the very top — "Sign in / Join" for a
 * visitor, name + role for a member — and directly under it a highlighted
 * "List your property" card for the supply side. Only then the browse list,
 * the sanctuaries, and the contact actions. It opens for everyone, not only
 * signed-in users.
 */
import Link from 'next/link';
import Image from 'next/image';
import { motion } from 'motion/react';
import {
  X,
  Home,
  BookOpen,
  LogOut,
  ShieldCheck,
  Phone,
  Trees,
  Building2,
  TrendingUp,
  MapPin,
  ChevronRight,
  User as UserIcon,
} from 'lucide-react';
import { Logo } from '@/components/brand/Logo';
import { useAuth } from '@/components/auth/AuthProvider';

const NAV_ITEMS = [
  { name: 'Home', href: '/', icon: Home },
  { name: 'Villas', href: '/explore/villas', icon: Building2 },
  { name: 'Plots & Farmland', href: '/explore/plots', icon: Trees },
  { name: 'Investments', href: '/explore/investments', icon: TrendingUp },
  { name: 'Sanctuary Map', href: '/map', icon: MapPin },
  { name: 'Journal', href: '/blog', icon: BookOpen },
];

const SANCTUARY_ITEMS = [
  { name: 'MODCON Agartha', id: 'agartha', sub: 'Narsapur Forest · From ₹78 L', img: '/gallery/agartha/11.webp' },
  { name: 'MODCON SYL Residences', id: 'syl', sub: 'Tukkuguda, ORR Exit-14 · Villaments', img: '/gallery/syl/1776279315359.webp' },
  { name: 'Dates County by Planet Green', id: 'dates-county', sub: 'Kandukur · ₹18,000/sq yd', img: '/gallery/dates-county/temple.jpg' },
];

export function AccountDrawer({ onClose, isDark }: { onClose: () => void; isDark: boolean }) {
  const { user, isAdmin, signOutUser, openAuth } = useAuth();
  const avatarLetter = (user?.displayName?.[0] || user?.email?.[0] || user?.phoneNumber?.[1] || '?').toUpperCase();
  const divider = isDark ? '1px solid rgba(255,255,255,0.05)' : '1px solid rgba(45,58,29,0.07)';

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[9995] bg-black/35 backdrop-blur-[2px]"
      />
      <motion.aside
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 bottom-0 z-[9996] w-[min(360px,100vw)] flex flex-col bg-surface shadow-2xl overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
      >
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: divider }}>
          <Logo />
          <button onClick={onClose} aria-label="Close menu" className="p-2 rounded-full hover:bg-primary/8 transition-all">
            <X className="w-5 h-5 text-on-surface/70" />
          </button>
        </div>

        {/* ── Door 1: account row — the first thing on the menu ─────────── */}
        <div className="px-5 pt-5">
          {user ? (
            <Link
              href="/account"
              onClick={onClose}
              className="flex items-center gap-3 p-3.5 rounded-2xl bg-primary text-on-primary hover:opacity-95 transition-opacity"
            >
              {user.photoURL ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.photoURL} referrerPolicy="no-referrer" alt="" className="w-11 h-11 rounded-full object-cover flex-shrink-0" />
              ) : (
                <span className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center font-bold text-base flex-shrink-0">
                  {avatarLetter}
                </span>
              )}
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold truncate">{user.displayName || user.email || user.phoneNumber}</span>
                <span className="block text-[9px] uppercase tracking-[0.25em] opacity-70 mt-0.5">
                  {isAdmin ? 'Admin' : 'Member'} · View profile
                </span>
              </span>
              <ChevronRight className="w-5 h-5 opacity-70 flex-shrink-0" />
            </Link>
          ) : (
            <button
              onClick={() => { openAuth(); onClose(); }}
              className="w-full flex items-center gap-3 p-3.5 rounded-2xl bg-primary text-on-primary text-left hover:shadow-lg hover:shadow-primary/20 transition-all"
            >
              <span className="w-11 h-11 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                <UserIcon className="w-5 h-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-bold">Sign in / Join</span>
                <span className="block text-[11px] opacity-75 mt-0.5">See unit-level pricing · Save shortlists</span>
              </span>
              <ChevronRight className="w-5 h-5 opacity-70 flex-shrink-0" />
            </button>
          )}
        </div>

        {/* ── Door 2: list your property — right under the account row ────── */}
        <div className="px-5 pt-3 pb-5" style={{ borderBottom: divider }}>
          <Link
            href="/contact?interest=list-property"
            onClick={onClose}
            className="flex items-center gap-3 p-3.5 rounded-2xl border border-outline/15 bg-surface-container-low hover:border-primary/40 transition-all group"
          >
            <span className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center text-primary flex-shrink-0">
              <Building2 className="w-5 h-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-bold text-on-surface group-hover:text-primary transition-colors whitespace-nowrap">
                List your property
              </span>
              <span className="flex items-center gap-2 mt-1">
                <span className="text-[11px] text-secondary/70">Developers &amp; owners</span>
                <span className="px-2 py-0.5 rounded-full bg-gold/15 text-gold text-[8px] uppercase tracking-[0.2em] font-extrabold whitespace-nowrap">
                  Get curated
                </span>
              </span>
            </span>
            <ChevronRight className="w-5 h-5 text-secondary/40 group-hover:text-primary flex-shrink-0 transition-colors" />
          </Link>
        </div>

        {/* ── Browse ───────────────────────────────────────────────────── */}
        <div className="px-5 pt-5 pb-5" style={{ borderBottom: divider }}>
          <p className="text-[7px] uppercase tracking-[0.55em] text-secondary/40 font-bold mb-3 px-1">Browse</p>
          <div className="flex flex-col">
            {NAV_ITEMS.map(({ name, href, icon: Icon }) => (
              <Link
                key={href}
                href={href}
                onClick={onClose}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-primary/6 transition-all group"
              >
                <Icon className="w-4 h-4 text-primary/50 group-hover:text-primary transition-colors" />
                <span className="text-[11px] uppercase tracking-[0.32em] font-bold text-on-surface/60 group-hover:text-on-surface transition-colors">
                  {name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Sanctuaries ──────────────────────────────────────────────── */}
        <div className="px-5 pt-5 pb-5" style={{ borderBottom: divider }}>
          <p className="text-[7px] uppercase tracking-[0.55em] text-secondary/40 font-bold mb-3 px-1">Sanctuaries</p>
          <div className="flex flex-col gap-2">
            {SANCTUARY_ITEMS.map(s => (
              <Link
                key={s.id}
                href={`/sanctuaries/${s.id}`}
                onClick={onClose}
                className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-primary/5 transition-all group"
              >
                <span className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 relative">
                  <Image src={s.img} alt={s.name} fill sizes="40px" className="object-cover" />
                </span>
                <span className="min-w-0">
                  <span className="block text-[11px] font-bold text-on-surface truncate group-hover:text-primary transition-colors">
                    {s.name}
                  </span>
                  <span className="block text-[8px] uppercase tracking-widest text-secondary/50 truncate">{s.sub}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Contact / account actions ────────────────────────────────── */}
        <div className="px-5 pt-5 pb-6 mt-auto">
          <div className="flex flex-col gap-2.5">
            {isAdmin && (
              <Link
                href="/admin"
                onClick={onClose}
                className="w-full py-3 rounded-xl bg-primary/10 text-primary text-[9px] uppercase tracking-[0.4em] font-bold flex items-center justify-center gap-2 hover:bg-primary/20 transition-all"
              >
                <ShieldCheck className="w-3.5 h-3.5" /> Admin Dashboard
              </Link>
            )}
            <Link
              href="/contact"
              onClick={onClose}
              className="w-full py-3.5 rounded-xl bg-gold text-[#1a1a0a] text-[9px] uppercase tracking-[0.4em] font-bold flex items-center justify-center gap-2 hover:bg-gold-bright transition-all"
            >
              <Phone className="w-3.5 h-3.5" /> Contact
            </Link>
            {user && (
              <button
                onClick={() => { void signOutUser(); onClose(); }}
                className="w-full py-3 rounded-xl border border-outline/25 text-on-surface/60 text-[9px] uppercase tracking-[0.4em] font-bold flex items-center justify-center gap-2 hover:text-on-surface transition-all"
              >
                <LogOut className="w-3.5 h-3.5" /> Sign Out
              </button>
            )}
          </div>
          <p className="mt-5 text-center text-[8px] uppercase tracking-[0.3em] text-secondary/30">
            © {new Date().getFullYear()} The Green Team · Hyderabad
          </p>
        </div>
      </motion.aside>
    </>
  );
}
