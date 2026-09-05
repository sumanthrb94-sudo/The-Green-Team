/**
 * Lead confirmation — sent when someone submits the adviser-call / enquiry form
 * with an email address.
 *
 * Transactional: it confirms a request the person just made, so no unsubscribe
 * line. Its job is to reassure ("we got it, a human will call") in the minutes
 * after submitting, which is exactly when a buyer wonders whether the form did
 * anything. Preview with `npm run email`.
 */
import { Button, Section } from '@react-email/components';
import { render } from '@react-email/render';
import { SITE_URL, BUSINESS } from '@/lib/data/contact';
import { EmailShell, P, BTN } from './components/EmailShell';

interface LeadConfirmationProps {
  name?: string;
  /** What they enquired about, echoed back so they know it was received. */
  intent?: string;
}

export const LEAD_SUBJECT = 'We have your request — an adviser will call';

export function LeadConfirmationEmail({ name, intent }: LeadConfirmationProps) {
  const greeting = name ? `Thank you, ${name}.` : 'Thank you.';
  const wa = `https://wa.me/${BUSINESS.whatsappNumber}`;
  return (
    <EmailShell title="Request received" preview="An adviser will call you within 24 hours.">
      <P>{greeting}</P>
      <P>
        We have your request and an adviser will call you within 24 hours — usually sooner. No call centre,
        no queue: someone who knows the projects, on your side of the table.
      </P>
      {intent ? (
        <P>
          <span style={{ fontSize: 14, color: '#555' }}>
            You told us: <em>{intent}</em>
          </span>
        </P>
      ) : null}
      <P>
        In the meantime you can browse the full portfolio, and — if you sign in — see the price for every
        individual plot and villament, not just the headline rate.
      </P>
      <Section style={{ marginTop: 28, textAlign: 'center' }}>
        <Button href={`${SITE_URL}/list`} style={BTN}>
          Explore the Portfolio
        </Button>
      </Section>
      <P>
        <span style={{ fontSize: 14, color: '#555' }}>
          Prefer to talk now? Message us on{' '}
          <a href={wa} style={{ color: '#2d3a1d' }}>
            WhatsApp
          </a>{' '}
          or just reply to this email.
        </span>
      </P>
    </EmailShell>
  );
}

export function renderLeadConfirmation(props: LeadConfirmationProps): Promise<string> {
  return render(<LeadConfirmationEmail {...props} />);
}

LeadConfirmationEmail.PreviewProps = {
  name: 'Ram',
  intent: 'Interested in MODCON Agartha · Budget ₹1 Cr – ₹2 Cr',
} satisfies LeadConfirmationProps;

export default LeadConfirmationEmail;
