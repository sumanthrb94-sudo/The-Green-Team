'use client';

/**
 * The admin gate renders outside the (site) layout, so it brings its own
 * AuthModal instance for the sign-in flow.
 */
import { AuthModal } from '@/components/auth/AuthModal';

export function AuthProviderBoundary({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <AuthModal />
    </>
  );
}
