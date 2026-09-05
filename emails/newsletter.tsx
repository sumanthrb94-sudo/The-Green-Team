/**
 * The newsletter template, as a React Email component.
 *
 * This replaces the hand-written HTML string that used to live in the send
 * route. Two things it buys: a local preview (`npm run email`, opens the
 * inbox-accurate render in a browser) so an issue can be eyeballed before it
 * goes out, and components that already carry the cross-client quirks — Outlook
 * table wrappers, `Button` padding hacks — so the layout survives Gmail and
 * Outlook without hand-tuning.
 *
 * The palette and structure match the previous email exactly, so nothing
 * visually regresses: forest header/footer, cream body, gold-green CTA.
 *
 * The default export renders with sample copy for the preview tool; the send
 * route calls renderNewsletter() with the real subject and body.
 */
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components';
import { render } from '@react-email/render';
import { BUSINESS, SITE_URL } from '@/lib/data/contact';

interface NewsletterEmailProps {
  subject: string;
  /** Plain text from the admin composer: blank lines split paragraphs. */
  body: string;
}

const FOREST = '#1a2410';
const CREAM = '#faf9f6';
const SAGE = '#a3b18a';
const GREEN = '#2d3a1d';

/** Blank line → new paragraph; single newline → line break within one. */
function toParagraphs(body: string): string[][] {
  return body
    .split(/\n{2,}/)
    .map(p => p.trim())
    .filter(Boolean)
    .map(p => p.split('\n'));
}

export function NewsletterEmail({ subject, body }: NewsletterEmailProps) {
  const paragraphs = toParagraphs(body);

  return (
    <Html lang="en">
      <Head />
      {/* Inbox preview line — the grey text next to the subject in most clients. */}
      <Preview>{subject}</Preview>
      <Body style={{ margin: 0, backgroundColor: '#f4f4ef', fontFamily: "Georgia, 'Times New Roman', serif", color: '#1a1c1a' }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: '32px 20px' }}>
          {/* Header */}
          <Section style={{ backgroundColor: FOREST, borderRadius: '20px 20px 0 0', padding: '36px 36px 28px', textAlign: 'center' }}>
            <Text style={{ margin: 0, color: SAGE, fontFamily: 'Arial, sans-serif', fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', fontWeight: 'bold' }}>
              The Green Team
            </Text>
            <Heading as="h1" style={{ margin: '10px 0 0', color: CREAM, fontSize: 26, fontStyle: 'italic', fontWeight: 400 }}>
              {subject}
            </Heading>
          </Section>

          {/* Body */}
          <Section style={{ backgroundColor: CREAM, padding: 36, fontSize: 16 }}>
            {paragraphs.map((lines, i) => (
              <Text key={i} style={{ margin: '0 0 18px', lineHeight: 1.75 }}>
                {lines.map((line, j) => (
                  <span key={j}>
                    {line}
                    {j < lines.length - 1 ? <br /> : null}
                  </span>
                ))}
              </Text>
            ))}

            <Section style={{ marginTop: 28, textAlign: 'center' }}>
              <Button
                href={`${SITE_URL}/list`}
                style={{
                  backgroundColor: GREEN,
                  color: '#ffffff',
                  padding: '14px 34px',
                  borderRadius: 999,
                  fontFamily: 'Arial, sans-serif',
                  fontSize: 11,
                  letterSpacing: 3,
                  textTransform: 'uppercase',
                  fontWeight: 'bold',
                  textDecoration: 'none',
                }}
              >
                Explore the Portfolio
              </Button>
            </Section>
          </Section>

          {/* Footer */}
          <Section style={{ backgroundColor: FOREST, borderRadius: '0 0 20px 20px', padding: '24px 36px', textAlign: 'center' }}>
            <Text style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontFamily: 'Arial, sans-serif', fontSize: 11, lineHeight: 1.8 }}>
              The Green Team · Channel Partners · Hyderabad
              <br />
              WhatsApp {BUSINESS.phone} ·{' '}
              <Link href={SITE_URL} style={{ color: SAGE }}>
                thegreenteam.in
              </Link>
            </Text>
            <Hr style={{ borderColor: 'rgba(255,255,255,0.12)', margin: '16px 0 12px' }} />
            <Text style={{ margin: 0, color: 'rgba(255,255,255,0.3)', fontFamily: 'Arial, sans-serif', fontSize: 10, lineHeight: 1.7 }}>
              You are receiving this because you subscribed at thegreenteam.in. Reply to this email to
              unsubscribe.
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

/** Render the template to an HTML string for Resend. */
export function renderNewsletter(subject: string, body: string): Promise<string> {
  return render(<NewsletterEmail subject={subject} body={body} />);
}

/** Sample data for the `npm run email` preview. */
NewsletterEmail.PreviewProps = {
  subject: 'The forest is filling up',
  body:
    'Two plots at MODCON Agartha were reserved this week, both on the RRR-facing edge.\n\nIf a forest-adjacent plot is on your mind, the current rate window is worth a conversation — better than the listed rate is available on an in-person visit, and we negotiate that for you.\n\nReply and tell us what you are looking for.',
} satisfies NewsletterEmailProps;

export default NewsletterEmail;
