/**
 * Site-visit booking confirmation — distinct from the general enquiry.
 *
 * Fires when a lead's source is a site visit AND it carries an email. It sets
 * expectations for the visit itself (a half-day for the forest sites, office-
 * first for SYL) rather than just "we'll call", because someone booking a visit
 * has moved further down the funnel than someone asking a question.
 * Transactional — no unsubscribe. Preview with `npm run email`.
 */
import { Button, Section } from '@react-email/components';
import { render } from '@react-email/render';
import { SITE_URL, BUSINESS } from '@/lib/data/contact';
import { EmailShell, P, BTN } from './components/EmailShell';

interface SiteVisitProps {
  name?: string;
  /** The stored lead intent, e.g. "Site visit - MODCON Agartha, this weekend". */
  detail?: string;
}

export const SITE_VISIT_SUBJECT = 'Your site visit — an adviser will confirm the slot';

export function SiteVisitEmail({ name, detail }: SiteVisitProps) {
  const greeting = name ? `Thank you, ${name}.` : 'Thank you.';
  const wa = `https://wa.me/${BUSINESS.whatsappNumber}`;
  return (
    <EmailShell title="Site visit requested" preview="An adviser will call within 24 hours to lock your slot.">
      <P>{greeting}</P>
      <P>
        Your site visit is requested. An adviser will call you within 24 hours to fix a slot that suits you
        and coordinate it with the developer&apos;s site team.
      </P>
      {detail ? (
        <P>
          <span style={{ fontSize: 14, color: '#555' }}>
            What you asked to see: <em>{detail}</em>
          </span>
        </P>
      ) : null}
      <P>
        A quick note on what to expect. A forest site — Agartha or Dates County — is best seen as a half-day,
        travel from the city included; it is worth the trip to stand on the land and feel the air. SYL is
        usually seen at the Financial District office first, then on site. Going in person also matters
        commercially: better than the listed rate is available on a visit, and we negotiate it for you.
      </P>
      <Section style={{ marginTop: 28, textAlign: 'center' }}>
        <Button href={`${SITE_URL}/list`} style={BTN}>
          Explore the Portfolio
        </Button>
      </Section>
      <P>
        <span style={{ fontSize: 14, color: '#555' }}>
          Need to change the time or ask something first? Message us on{' '}
          <a href={wa} style={{ color: '#2d3a1d' }}>
            WhatsApp
          </a>{' '}
          or just reply to this email.
        </span>
      </P>
    </EmailShell>
  );
}

export function renderSiteVisit(props: SiteVisitProps): Promise<string> {
  return render(<SiteVisitEmail {...props} />);
}

SiteVisitEmail.PreviewProps = {
  name: 'Ram',
  detail: 'Site visit - MODCON Agartha, this weekend',
} satisfies SiteVisitProps;

export default SiteVisitEmail;
