/**
 * The newsletter, on the shared EmailShell.
 *
 * Preview locally with `npm run email`. The default export renders with sample
 * copy for that tool; the send route calls renderNewsletter() with the real
 * subject and body.
 */
import { Button, Section } from '@react-email/components';
import { render } from '@react-email/render';
import { SITE_URL } from '@/lib/data/contact';
import { EmailShell, P, BTN } from './components/EmailShell';

interface NewsletterEmailProps {
  subject: string;
  /** Plain text from the admin composer: blank lines split paragraphs. */
  body: string;
}

/** Blank line → new paragraph; single newline → line break within one. */
function toParagraphs(body: string): string[][] {
  return body
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => p.split('\n'));
}

export function NewsletterEmail({ subject, body }: NewsletterEmailProps) {
  return (
    <EmailShell title={subject} preview={subject} unsubscribe>
      {toParagraphs(body).map((lines, i) => (
        <P key={i}>
          {lines.map((line, j) => (
            <span key={j}>
              {line}
              {j < lines.length - 1 ? <br /> : null}
            </span>
          ))}
        </P>
      ))}
      <Section style={{ marginTop: 28, textAlign: 'center' }}>
        <Button href={`${SITE_URL}/list`} style={BTN}>
          Explore the Portfolio
        </Button>
      </Section>
    </EmailShell>
  );
}

export function renderNewsletter(subject: string, body: string): Promise<string> {
  return render(<NewsletterEmail subject={subject} body={body} />);
}

NewsletterEmail.PreviewProps = {
  subject: 'The forest is filling up',
  body:
    'Two plots at MODCON Agartha were reserved this week, both on the RRR-facing edge.\n\nIf a forest-adjacent plot is on your mind, the current rate window is worth a conversation — better than the listed rate is available on an in-person visit, and we negotiate that for you.\n\nReply and tell us what you are looking for.',
} satisfies NewsletterEmailProps;

export default NewsletterEmail;
