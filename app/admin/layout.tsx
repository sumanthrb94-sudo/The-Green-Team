import type { Metadata } from 'next';
import Link from 'next/link';
import { getSessionUser } from '@/lib/server/session';
import { AdminNav } from '@/components/admin/AdminNav';
import { AdminGate } from '@/components/admin/AdminGate';
import { AuthProviderBoundary } from '@/components/admin/AuthProviderBoundary';
import { Logo } from '@/components/brand/Logo';

export const metadata: Metadata = {
  title: 'Admin',
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getSessionUser();

  if (!user?.isAdmin) {
    return (
      <AuthProviderBoundary>
        <AdminGate signedInAs={user?.email ?? null} />
      </AuthProviderBoundary>
    );
  }

  return (
    <div className="min-h-svh bg-surface-container-low">
      <header className="sticky top-0 z-50 glass">
        <div className="h-14 flex items-center justify-between px-4 md:px-6">
          <div className="flex items-center gap-4">
            <Logo iconOnly />
            <span className="text-[9px] uppercase tracking-[0.5em] font-bold text-primary">Admin</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden sm:block text-xs text-secondary/70">{user.email}</span>
            <Link
              href="/"
              className="px-4 py-2 rounded-full border border-outline/25 text-[9px] uppercase tracking-widest font-bold text-on-surface/60 hover:text-on-surface transition-all"
            >
              ← Back to site
            </Link>
          </div>
        </div>
        <AdminNav />
      </header>
      <main className="max-w-6xl mx-auto px-4 md:px-6 py-8">{children}</main>
    </div>
  );
}
