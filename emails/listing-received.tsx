/**
 * Listing-request acknowledgement — for a developer or owner who asked to list
 * a property. Distinct from the buyer confirmation, which tells the reader an
 * adviser will help them find a home and invites them to sign in for pricing;
 * neither is right for the supply side. Transactional, so no unsubscribe line.
 */
import { Button, Section } from '@react-email/components';
import { render } from '@react-email/render';
import { SITE_URL } from '@/lib/data/contact';
import { EmailShell, P, BTN } from './components/EmailShell';

interface ListingReceivedProps {
  name?: string;
  /** What they told us, echoed back. */
  intent?: string;
}

export const LISTING_SUBJECT = 'We have your listing request — The Green Team';

export function ListingReceivedEmail({ name, intent }: ListingReceivedProps) {
  const greeting = name ? `Thank you, ${name}.` : 'Thank you.';
  return (
    <EmailShell title="Listing request received" preview="We review it against our standard and call within two working days.">
      <P>{greeting}</P>
      <P>
        We have your request to list a property with The Green Team. Here is what happens next: we check what you
        shared against our six-part standard — measured air and noise, clear title and approvals, real road
        access, a developer who has delivered, design that keeps the green it sells, and numbers we can quote.
        If it looks like a fit, we call within two working days to arrange a site visit.
      </P>
      {intent ? (
        <P>
          <span style={{ fontSize: 14, color: '#555' }}>
            You told us: <em>{intent}</em>
          </span>
        </P>
      ) : null}
      <Section style={{ marginTop: 28, textAlign: 'center' }}>
        <Button href={`${SITE_URL}/standard`} style={BTN}>
          Read the standard
        </Button>
      </Section>
      <P>
        <span style={{ fontSize: 14, color: '#555' }}>
          If you have a brochure, approvals or a layout to hand, just reply to this email with them attached.
        </span>
      </P>
    </EmailShell>
  );
}

export function renderListingReceived(props: ListingReceivedProps): Promise<string> {
  return render(<ListingReceivedEmail {...props} />);
}

ListingReceivedEmail.PreviewProps = {
  name: 'Ravi',
  intent: 'Interest: Listing my property (owner / developer) · Message: 12-acre farm plots near Shankarpally',
} satisfies ListingReceivedProps;

export default ListingReceivedEmail;
