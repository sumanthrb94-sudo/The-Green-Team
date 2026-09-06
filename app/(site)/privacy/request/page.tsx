import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { LegalPage, Clause } from '@/components/legal/LegalPage';
import { RightsRequestForm } from '@/components/legal/RightsRequestForm';
import { SITE_URL } from '@/lib/data/contact';
import { LEGAL } from '@/lib/data/legal';

export const metadata: Metadata = {
  title: 'Your Data Rights',
  description:
    'See what The Green Team holds about you, correct it, have it erased, withdraw consent, or make a complaint — whether or not you have an account.',
  alternates: { canonical: `${SITE_URL}/privacy/request` },
};

/**
 * The counterpart to the buttons on the account page, for the larger group who
 * never made an account: everyone who typed a number into an enquiry form.
 *
 * Their rights under sections 11 to 13 are identical; only the way of reaching
 * them differs, because we cannot authenticate somebody who has no login.
 */
export default function RightsRequestPage() {
  return (
    <>
      <LegalPage
        title="Your Data Rights"
        intro="See what we hold, correct it, have it erased, take back your consent, or complain — with a deadline we publish rather than one we choose later."
      >
        <Clause n="1" title="If you have an account, this is faster">
          <p>
            Sign in and go to your{' '}
            <Link href="/account" className="text-primary hover:underline underline-offset-4">
              profile
            </Link>
            . You can download everything we hold as a file and delete your account outright, both
            immediately and without asking anyone. Use the form below only if you cannot sign in.
          </p>
        </Clause>

        <Clause n="2" title="If you only ever made an enquiry">
          <p>
            Most of the people whose details we hold never made an account — they gave a name and a
            number to have someone call them back. Sections 11 to 13 of the Digital Personal Data
            Protection Act, 2023 apply to you exactly as they do to a member, so this form does the
            same job.
          </p>
          <RightsRequestForm />
          <p className="text-sm">
            We will ask you to confirm who you are before we act. That is not obstruction — handing
            somebody&rsquo;s enquiry history to whoever types their phone number would be the breach
            this whole page exists to prevent.
          </p>
        </Clause>

        <Clause n="3" title="What happens next, and by when">
          <ul className="list-disc pl-5 space-y-2">
            <li>A complaint is acknowledged within <strong>{LEGAL.grievanceAckHours} hours</strong> and closed within <strong>{LEGAL.grievanceResolutionDays} days</strong>.</li>
            <li>Any other request is answered within <strong>{LEGAL.dataRequestDays} days</strong>.</li>
            <li>You get a reference number, so you can chase it.</li>
            <li>
              If we miss the deadline or the answer does not satisfy you, complain to the{' '}
              <strong>{LEGAL.dataProtectionBoard}</strong>. You must give us the first chance, but
              only the first.
            </li>
          </ul>
          <p>
            You can also write directly to {LEGAL.dpo.title} {LEGAL.dpo.name} at{' '}
            <a href={`mailto:${LEGAL.dpo.email}`} className="text-primary hover:underline underline-offset-4">
              {LEGAL.dpo.email}
            </a>
            , or to {LEGAL.grievanceOfficer.title} {LEGAL.grievanceOfficer.name} at{' '}
            <a href={`mailto:${LEGAL.grievanceOfficer.email}`} className="text-primary hover:underline underline-offset-4">
              {LEGAL.grievanceOfficer.email}
            </a>
            . An email is treated exactly like this form.
          </p>
        </Clause>
      </LegalPage>
      <Footer />
    </>
  );
}
