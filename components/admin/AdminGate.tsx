'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck } from 'lucide-react';
import { useAuth } from '@/components/auth/AuthProvider';
import { Logo } from '@/components/brand/Logo';

export function AdminGate({ signedInAs }: { signedInAs: string | null }) {
  const { user, isAdmin, openAuth, signOutUser } = useAuth();
  const router = useRouter();

  // Session cookie is set asynchronously after client sign-in — refresh once it lands.
  useEffect(() => {
    if (isAdmin) router.refresh();
  }, [isAdmin, router]);

  return (
    <div className="min-h-svh bg-forest-section flex flex-col items-center justify-center gap-8 px-6 text-center">
      <Logo onDark />
      <div className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center">
        <ShieldCheck className="w-6 h-6 text-[#a3b18a]" />
      </div>
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Admin access required</h1>
        <p className="text-white/45 text-sm max-w-sm">
          {signedInAs
            ? `Signed in as ${signedInAs}, which is not on the admin list.`
            : 'Sign in with an authorised admin account to open the dashboard.'}
        </p>
      </div>
      {user ? (
        <div className="flex gap-3">
          <button
            onClick={() => router.refresh()}
            className="px-6 py-3.5 rounded-2xl bg-[#a3b18a] text-[#0a1208] text-[9px] uppercase tracking-[0.4em] font-bold hover:bg-[#b8c8a0] transition-all"
          >
            Retry
          </button>
          <button
            onClick={() => void signOutUser().then(() => router.refresh())}
            className="px-6 py-3.5 rounded-2xl border border-white/20 text-white/60 text-[9px] uppercase tracking-[0.4em] font-bold hover:text-white transition-all"
          >
            Switch account
          </button>
        </div>
      ) : (
        <button
          onClick={openAuth}
          className="px-8 py-4 rounded-2xl bg-[#a3b18a] text-[#0a1208] text-[9px] uppercase tracking-[0.4em] font-bold hover:bg-[#b8c8a0] transition-all"
        >
          Sign In
        </button>
      )}
    </div>
  );
}
