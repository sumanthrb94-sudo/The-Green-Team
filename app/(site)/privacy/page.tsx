import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { LegalPage, Clause } from '@/components/legal/LegalPage';
import { BUSINESS, SITE_URL } from '@/lib/data/contact';
import { DATA_WE_HOLD, PROCESSORS, LEGAL } from '@/lib/data/legal';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'How The Green Team collects, uses and protects your personal data, and the rights you have over it under the Digital Personal Data Protection Act, 2023.',
  alternates: { canonical: `${SITE_URL}/privacy` },
};

/**
 * The DPDP Act 2023 notice, written to be read.
 *
 * Section 5 requires the notice to be in clear and plain language and to say
 * what data, for what purpose, how to withdraw consent, how to complain to us
 * and how to complain to the Board. Section 6 requires consent to be free,
 * specific, informed, unconditional and unambiguous, and withdrawal to be as
 * easy as giving it. Sections 11 to 14 give the rights set out below.
 *
 * Every claim here matches something the software actually does. Where a right
 * is promised, the button that delivers it exists on the account page.
 */
export default function PrivacyPage() {
  return (
    <>
      <LegalPage
        title="Privacy Policy"
        intro="What we collect, why, who else sees it, how long we keep it, and how to make us stop. Written to be read once, not skimmed forever."
      >
        <Clause n="1" title="Who is responsible for your data">
          <p>
            {LEGAL.entityName}, trading as {BUSINESS.name} ({BUSINESS.legalDescriptor}), decides why
            and how your personal data is processed. Under the Digital Personal Data Protection Act,
            2023 (&ldquo;DPDP Act&rdquo;) that makes us the <strong>Data Fiduciary</strong> and you
            the <strong>Data Principal</strong>.
          </p>
          <p>
            Registered address: {LEGAL.registeredAddress}. Registration: {LEGAL.cin}. GSTIN:{' '}
            {LEGAL.gstin}.
          </p>
          <p>
            Questions about anything below go to <strong>{LEGAL.dpo.title}, {LEGAL.dpo.name}</strong>{' '}
            at{' '}
            <a href={`mailto:${LEGAL.dpo.email}`} className="text-primary hover:underline underline-offset-4">
              {LEGAL.dpo.email}
            </a>
            .
          </p>
        </Clause>

        <Clause n="2" title="What we collect, and exactly why">
          <p>
            This is the whole list. If something is not here, we are not collecting it. We ask for
            the least we can and still do the job — we do not require an address, a date of birth,
            an income figure or any identity document to use this site.
          </p>
          <div className="overflow-x-auto my-5 -mx-2">
            <table className="w-full text-sm border-collapse min-w-[640px]">
              <thead>
                <tr className="border-b border-outline/30">
                  {['What', 'Why', 'On what basis', 'Kept for'].map(h => (
                    <th
                      key={h}
                      className="text-left align-bottom py-2 pr-4 text-[9px] uppercase tracking-[0.2em] font-bold text-secondary/60"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {DATA_WE_HOLD.map(row => (
                  <tr key={row.what} className="border-b border-outline/12 align-top">
                    <td className="py-3 pr-4 text-on-surface font-medium">{row.what}</td>
                    <td className="py-3 pr-4">{row.why}</td>
                    <td className="py-3 pr-4">{row.basis}</td>
                    <td className="py-3 pr-4">{row.keptFor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            <strong>We never sell your personal data, and we never rent or trade your contact
            details.</strong> We do not run behavioural advertising and we do not build advertising
            profiles from your visits.
          </p>
        </Clause>

        <Clause n="3" title="Consent, and taking it back">
          <p>
            Where we rely on consent, you give it by a clear affirmative act — typing your details
            into a form and submitting it, accepting analytics in the cookie banner, or switching the
            monthly briefing on. We do not treat silence, a pre-ticked box or continued browsing as
            consent.
          </p>
          <p>
            <strong>Withdrawing consent is as easy as giving it</strong>, as the DPDP Act requires.
            Turn the briefing off with the same toggle on your{' '}
            <Link href="/account" className="text-primary hover:underline underline-offset-4">
              profile
            </Link>{' '}
            that turned it on. Refuse analytics from the cookie banner, or clear the choice and
            answer again. Withdraw everything by deleting your account. Withdrawal is not
            retrospective — it does not undo processing that was lawful before you withdrew — and it
            may mean we can no longer do the thing you asked for.
          </p>
          <p>
            Some processing does not rest on consent but on a <em>legitimate use</em> under section 7
            of the DPDP Act: chiefly, personal data you volunteered for a purpose and have not
            objected to — the details in an enquiry, so an adviser can call you back.
          </p>
        </Clause>

        <Clause n="4" title="Your rights, and the buttons that deliver them">
          <p>Under sections 11 to 14 of the DPDP Act you may:</p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Know what we hold.</strong> A summary of your personal data, what we are doing
              with it, and who else we have shared it with.{' '}
              <Link href="/account" className="text-primary hover:underline underline-offset-4">
                Download all of it
              </Link>{' '}
              from your profile, as a file, immediately.
            </li>
            <li>
              <strong>Correct or complete it.</strong> Every field we hold is editable on your
              profile, except an email or phone number a provider verified — write to us and we will
              change those.
            </li>
            <li>
              <strong>Have it erased.</strong> Delete your account from your profile and we remove
              your account, your profile, your chat transcripts and your place on the briefing list.
              We keep enquiry records where we are required to, or where they are needed for a legal
              claim — clause 6 says how long.
            </li>
            <li>
              <strong>Be heard.</strong> Grievance redressal is clause 9, and it has a deadline.
            </li>
            <li>
              <strong>Nominate someone.</strong> You may nominate a person to exercise these rights
              for you if you die or become incapable of exercising them. Write to the{' '}
              {LEGAL.dpo.title} and we will record it.
            </li>
          </ul>
          <p>
            We answer a request within {LEGAL.dataRequestDays} days. We may ask you to verify who you
            are first — the DPDP Act also places a duty on you not to impersonate someone else.
          </p>
        </Clause>

        <Clause n="5" title="Who else sees your data">
          <p>
            Only the processors below, each doing a defined job for us under contract, and never for
            their own marketing. We have not appointed a Consent Manager.
          </p>
          <div className="overflow-x-auto my-5 -mx-2">
            <table className="w-full text-sm border-collapse min-w-[620px]">
              <thead>
                <tr className="border-b border-outline/30">
                  {['Who', 'What they do for us', 'Where'].map(h => (
                    <th key={h} className="text-left align-bottom py-2 pr-4 text-[9px] uppercase tracking-[0.2em] font-bold text-secondary/60">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PROCESSORS.map(p => (
                  <tr key={p.name} className="border-b border-outline/12 align-top">
                    <td className="py-3 pr-4 text-on-surface font-medium">
                      <a href={p.policy} target="_blank" rel="noopener noreferrer" className="hover:text-primary">
                        {p.name} ↗
                      </a>
                    </td>
                    <td className="py-3 pr-4">{p.role}</td>
                    <td className="py-3 pr-4">{p.where}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p>
            We also pass your name and number to the developer of a project when you ask us to
            arrange a site visit or a booking with them — that is the introduction you came to us
            for, and we tell you at the time. We disclose data to a court, regulator or law
            enforcement agency where we are legally required to.
          </p>
          <p>
            <strong>Data leaving India.</strong> Several processors above operate outside India, so
            your data is processed abroad. Section 16 of the DPDP Act permits this except to
            countries the Central Government restricts by notification; we will stop using any
            processor that becomes non-compliant.
          </p>
        </Clause>

        <Clause n="6" title="How long we keep things">
          <p>
            The table in clause 2 gives the period for each kind of data. In short: your account
            lasts until you delete it; enquiry records are kept for three years from your last
            contact with us, because that is how long a dispute about an introduction can realistically
            arise; analytics is deleted after fourteen months; chat transcripts after twelve.
          </p>
          <p>
            When you withdraw consent and no legal purpose requires us to keep something, we erase
            it, as section 8(7) requires — we do not archive it indefinitely against a future use.
          </p>
        </Clause>

        <Clause n="7" title="How we protect it">
          <p>
            Reasonable security safeguards, as section 8(5) requires: traffic is encrypted end to
            end; the database is not reachable from a browser and every read and write goes through
            our server, which checks who you are first; unit pricing and every administrative screen
            are closed to anyone not signed in and authorised; our email provider holds only what it
            needs to send. Access is limited to the people who need it to answer you.
          </p>
          <p>
            <strong>If there is a breach</strong>, section 8(6) requires us to notify the{' '}
            {LEGAL.dataProtectionBoard} and each affected person. We will tell you what happened,
            what data was involved, what we have done, and what you should do — without waiting to
            finish investigating.
          </p>
        </Clause>

        <Clause n="8" title="Children">
          <p>
            This site is not intended for anyone under 18, and we do not knowingly collect a child&rsquo;s
            personal data. Section 9 of the DPDP Act requires verifiable parental consent before
            processing a child&rsquo;s data, and prohibits tracking, behavioural advertising and any
            processing likely to cause a detrimental effect on a child. We do none of those things to
            anyone. If you believe a child has given us data, write to the {LEGAL.dpo.title} and we
            will delete it.
          </p>
        </Clause>

        <Clause n="9" title="Complaints">
          <p>
            Write to our {LEGAL.grievanceOfficer.title},{' '}
            <strong>{LEGAL.grievanceOfficer.name}</strong>, at{' '}
            <a href={`mailto:${LEGAL.grievanceOfficer.email}`} className="text-primary hover:underline underline-offset-4">
              {LEGAL.grievanceOfficer.email}
            </a>
            . We acknowledge within {LEGAL.grievanceAckHours} hours and resolve within{' '}
            {LEGAL.grievanceResolutionDays} days.
          </p>
          <p>
            You must give us that chance first. If we do not answer, or the answer does not satisfy
            you, you may complain to the <strong>{LEGAL.dataProtectionBoard}</strong>. Nothing here
            takes away a right you have under any other law.
          </p>
        </Clause>

        <Clause n="10" title="Changes">
          <p>
            If we change how we use your data in a way that matters, we will say so on this page and
            email every member before it takes effect — not quietly re-date the document. The version
            and date at the top always say which text is current.
          </p>
          <p className="pt-3 text-sm">
            {BUSINESS.name} · {BUSINESS.city}, {BUSINESS.region} ·{' '}
            <a href={`mailto:${BUSINESS.email}`} className="text-primary hover:underline underline-offset-4">
              {BUSINESS.email}
            </a>{' '}
            · {BUSINESS.phone}
          </p>
        </Clause>
      </LegalPage>
      <Footer />
    </>
  );
}
