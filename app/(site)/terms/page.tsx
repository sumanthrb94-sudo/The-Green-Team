import type { Metadata } from 'next';
import Link from 'next/link';
import { Footer } from '@/components/Footer';
import { LegalPage, Clause } from '@/components/legal/LegalPage';
import { BUSINESS, SITE_URL } from '@/lib/data/contact';
import { LEGAL } from '@/lib/data/legal';

export const metadata: Metadata = {
  title: 'Terms of Use',
  description:
    'The terms on which The Green Team, a registered real-estate agent, provides this website and its curation service.',
  alternates: { canonical: `${SITE_URL}/terms` },
};

/**
 * Terms for a channel partner, which is a narrower thing than a seller.
 *
 * The clauses that matter most are 3 and 4: we introduce, we do not sell, and
 * the contract is always between the buyer and the developer. Getting that
 * wrong is how an agent ends up liable for a developer's delay. RERA 2016 s.9
 * and s.10 govern the registration and conduct of an agent, and clause 2 states
 * the registration a buyer is entitled to see.
 */
export default function TermsPage() {
  return (
    <>
      <LegalPage
        title="Terms of Use"
        intro="What we do, what we do not do, and what you agree to by using this site. Short, because the important parts should be easy to find."
      >
        <Clause n="1" title="Agreeing to these terms">
          <p>
            This site is operated by {LEGAL.entityName}, trading as {BUSINESS.name}. By using it —
            browsing, enquiring, creating an account or messaging us — you agree to these terms and
            to our{' '}
            <Link href="/privacy" className="text-primary hover:underline underline-offset-4">
              Privacy Policy
            </Link>
            . If you do not agree, please do not use the site. You must be 18 or older and legally
            able to contract.
          </p>
        </Clause>

        <Clause n="2" title="We are a registered real-estate agent">
          <p>
            {BUSINESS.name} is a real-estate agent registered with the {LEGAL.reraAuthority} under
            the Real Estate (Regulation and Development) Act, 2016.
          </p>
          <p>
            <strong>RERA agent registration: {LEGAL.reraAgentRegNo}</strong> · Verify it at{' '}
            <a
              href={LEGAL.reraWebsite}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline underline-offset-4"
            >
              {LEGAL.reraWebsite.replace('https://', '')} ↗
            </a>
          </p>
          <p>
            Each project on this site carries its own RERA registration number on its page. You
            should verify a project&rsquo;s registration on the authority&rsquo;s website before you
            pay anything to anyone. Do not rely on a number printed by us; rely on the register.
          </p>
        </Clause>

        <Clause n="3" title="What we actually do">
          <p>
            We curate. We visit projects, measure air quality, noise and commute times ourselves,
            check the paperwork, and put on this site the few that clear our{' '}
            <Link href="/standard" className="text-primary hover:underline underline-offset-4">
              published standard
            </Link>
            . Then we introduce you to the developer and help you negotiate.
          </p>
          <p>
            <strong>We do not own, build, develop or sell any property listed here.</strong> We are
            not the promoter of any project. We are paid a brokerage by the developer on a completed
            transaction; we tell you that plainly because it is the arrangement across the whole
            industry and you should know it when weighing our advice.
          </p>
        </Clause>

        <Clause n="4" title="Your contract is with the developer, not with us">
          <p>
            Every booking, allotment, agreement to sell and conveyance is between you and the
            developer or seller. They alone are responsible for title, approvals, construction
            quality, specifications, amenities, possession dates, and every promise in their own
            booking documents. We are not a party to that contract and cannot perform it for them.
          </p>
          <p>
            <strong>Read the developer&rsquo;s agreement before you sign it, and take independent
            legal advice.</strong> Nothing we say, write or show you replaces the agreement you
            actually sign, and where the two differ, the signed agreement governs.
          </p>
        </Clause>

        <Clause n="5" title="Information on this site, and what it is not">
          <p>
            We take care to be accurate and we correct errors quickly. Even so: prices, availability,
            plot sizes, layouts, specifications, payment plans and possession timelines are set by
            developers and change without notice to us. Images, renders and site plans are
            indicative. Measured figures — air quality, noise, drive time — were recorded by us at a
            particular place and time and will vary.
          </p>
          <p>
            <strong>Nothing on this site is investment advice.</strong> Where we show past price
            movement or an appreciation figure, it is a record of what happened, not a forecast.
            Property prices fall as well as rise; returns are not guaranteed by us or by anyone. Any
            EMI figure is an arithmetic illustration on the numbers you typed, not an offer of
            finance or an assurance that any lender will lend.
          </p>
        </Clause>

        <Clause n="6" title="Your account">
          <p>
            You may create an account to see unit-level pricing and save a shortlist. Give accurate
            details, keep your phone and email secure, and tell us at once if someone else uses your
            account. You are responsible for what happens under it. We may suspend an account that
            is being used to abuse the site, to scrape it, or to impersonate somebody.
          </p>
          <p>
            You can close your account at any time from your{' '}
            <Link href="/account" className="text-primary hover:underline underline-offset-4">
              profile
            </Link>
            .
          </p>
        </Clause>

        <Clause n="7" title="Groot, our assistant">
          <p>
            Groot answers from our own property data. It is software, it can be wrong, and it is not
            an adviser. Nothing it says is an offer, a quotation, a valuation or advice, and no
            booking is made by talking to it. Confirm anything that matters with a human before you
            act on it — that is what the adviser call is for.
          </p>
        </Clause>

        <Clause n="8" title="What you may and may not do here">
          <p>
            Use the site for your own genuine property interest. Do not scrape it, copy our
            photographs, text, measurements or listings for a competing service, probe it for
            vulnerabilities, submit somebody else&rsquo;s details, or post anything unlawful,
            defamatory or misleading in a review or the chat.
          </p>
          <p>
            Everything on this site — text, photography, renders, the standard, the brand and the
            marks — belongs to us or to our partners and is protected by copyright. Reviews you post
            remain yours; by posting one you allow us to display it on the site, and we may decline
            to publish a review we cannot verify.
          </p>
        </Clause>

        <Clause n="9" title="Liability">
          <p>
            We provide this site with reasonable care but without any warranty that it will be
            uninterrupted or error-free. To the extent Indian law allows, we are not liable for
            indirect or consequential loss, for lost profit or lost opportunity, or for the acts and
            omissions of a developer, lender, contractor or authority.
          </p>
          <p>
            Nothing in these terms excludes liability that cannot lawfully be excluded — including
            for fraud, for death or personal injury caused by negligence, or under the Consumer
            Protection Act, 2019.
          </p>
        </Clause>

        <Clause n="10" title="Complaints">
          <p>
            Tell us and we will fix it. {LEGAL.grievanceOfficer.title}{' '}
            <strong>{LEGAL.grievanceOfficer.name}</strong>,{' '}
            <a href={`mailto:${LEGAL.grievanceOfficer.email}`} className="text-primary hover:underline underline-offset-4">
              {LEGAL.grievanceOfficer.email}
            </a>{' '}
            — acknowledged within {LEGAL.grievanceAckHours} hours, resolved within{' '}
            {LEGAL.grievanceResolutionDays} days.
          </p>
          <p>
            If that fails you may approach the {LEGAL.reraAuthority} for a matter about a project or
            an agent, a consumer forum under the Consumer Protection Act, 2019 ({LEGAL.consumerHelpline}),
            or the {LEGAL.dataProtectionBoard} for a matter about your personal data.
          </p>
        </Clause>

        <Clause n="11" title="Governing law, and changes">
          <p>
            These terms are governed by {LEGAL.governingLaw}, and {LEGAL.jurisdiction} have exclusive
            jurisdiction. If a clause is held unenforceable, the rest stands.
          </p>
          <p>
            We may change these terms. Material changes are announced on this page with a new version
            number and date before they take effect, and continuing to use the site afterwards means
            you accept them.
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
