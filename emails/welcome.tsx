/**
 * Welcome email — sent once, the first time someone signs in.
 *
 * Transactional, not marketing: it acknowledges the account and sets the tone,
 * so no unsubscribe line. Preview with `npm run email`.
 */
import { Button, Section } from '@react-email/components';
import { render } from '@react-email/render';
import { SITE_URL } from '@/lib/data/contact';
import { EmailShell, P, BTN } from './components/EmailShell';

interface WelcomeEmailProps {
  /** First name if we have it; the greeting falls back gracefully without it. */
  name?: string;
}

export const WELCOME_SUBJECT = 'Welcome to The Green Team';

export function WelcomeEmail({ name }: WelcomeEmailProps) {
  const greeting = name ? `Welcome, ${name}.` : 'Welcome.';
  return (
    <EmailShell title="Welcome" preview="You now have access to the full portfolio — including per-unit pricing.">
      <P>{greeting}</P>
      <P>
        You are in. As a signed-in member you can now see the price for every plot and villament — not just
        the headline rate — across the portfolio, and your adviser can bring the live sheet with the
        negotiated price to a call.
      </P>
      <P>
        A quick word on how we work: we are an independent channel partner, not a listings portal. We put a
        project on the site only after it clears a fixed six-part standard — measured air and noise, clean
        title, real road access, a developer who has delivered, design that keeps the green it sells, and
        numbers we are willing to be quoted on. Three projects have cleared it so far. That is the point.
      </P>
      <Section style={{ marginTop: 28, textAlign: 'center' }}>
        <Button href={`${SITE_URL}/list`} style={BTN}>
          Explore the Portfolio
        </Button>
      </Section>
      <P>
        <span style={{ fontSize: 14, color: '#555' }}>
          When something catches your eye, reply to this email or message us on WhatsApp and we will set up a
          site visit. Going in person matters — better pricing is available there, and we negotiate it for you.
        </span>
      </P>
    </EmailShell>
  );
}

export function renderWelcome(name?: string): Promise<string> {
  return render(<WelcomeEmail name={name} />);
}

WelcomeEmail.PreviewProps = { name: 'Sumanth' } satisfies WelcomeEmailProps;

export default WelcomeEmail;
