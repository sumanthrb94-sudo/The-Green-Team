import type { Metadata } from 'next';
import { AccountClient } from '@/components/account/AccountClient';
import { Footer } from '@/components/Footer';

/** A private page: never indexed, never in the sitemap. */
export const metadata: Metadata = {
  title: 'Your profile',
  robots: { index: false, follow: false },
};

export default function AccountPage() {
  return (
    <>
      <div className="pt-14">
        <AccountClient />
      </div>
      <Footer />
    </>
  );
}
