import type { Metadata } from 'next';
import { ApplicationForm } from '@/components/membership/ApplicationForm';
import { Footer } from '@/components/Footer';
import { SITE_URL } from '@/lib/data/contact';

export const metadata: Metadata = {
  title: 'Adviser Membership — Reserved Investor Circle',
  description:
    'Apply for a private adviser call with The Green Team: pre-launch entry pricing, first pick of curated inventory, and monthly environmental-intelligence briefings.',
  alternates: { canonical: `${SITE_URL}/membership` },
};

export default function MembershipPage() {
  return (
    <>
      <ApplicationForm />
      <Footer />
    </>
  );
}
