/**
 * Newsletter confirmation — "you're on the list".
 *
 * Distinct from the sign-in welcome on purpose: a subscriber is not a member
 * and cannot see per-unit pricing, so that email's promise would be false
 * here. This one says what they actually get and how often. It is marketing
 * consent mail, so it carries the unsubscribe line. Preview with `npm run email`.
 */
import { Button, Section } from '@react-email/components';
import { render } from '@react-email/render';
import { SITE_URL } from '@/lib/data/contact';
import { EmailShell, P, BTN } from './components/EmailShell';

export const NEWSLETTER_WELCOME_SUBJECT = "You're on the list — The Green Team";

export function NewsletterWelcomeEmail() {
  return (
    <EmailShell title="You're on the list" preview="Sanctuary intelligence, about once a month." unsubscribe>
      <P>Thank you for subscribing.</P>
      <P>
        About once a month we send a short note: which projects cleared our standard, what the air and noise
        readings said on site, where the ring-road and airport corridors are moving, and what prices actually
        did — not what a brochure says they will.
      </P>
      <P>No daily blasts, no spam. When a listing appears that fits you, this is where you hear it first.</P>
      <Section style={{ marginTop: 28, textAlign: 'center' }}>
        <Button href={`${SITE_URL}/list`} style={BTN}>
          See the current listings
        </Button>
      </Section>
    </EmailShell>
  );
}

export function renderNewsletterWelcome(): Promise<string> {
  return render(<NewsletterWelcomeEmail />);
}

export default NewsletterWelcomeEmail;
