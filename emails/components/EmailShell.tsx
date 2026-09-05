/**
 * Shared chrome for every email — the forest header, cream body and footer.
 *
 * One place for the brand so a colour or a footer line changes once, not per
 * template. Kept free of any `server-only` import so the `npm run email`
 * preview tool can render templates that use it.
 */
import { Body, Container, Head, Heading, Hr, Html, Link, Preview, Section, Text } from '@react-email/components';
import { BUSINESS, SITE_URL } from '@/lib/data/contact';

export const COLORS = {
  forest: '#1a2410',
  cream: '#faf9f6',
  sage: '#a3b18a',
  green: '#2d3a1d',
  page: '#f4f4ef',
  ink: '#1a1c1a',
} as const;

export function EmailShell({
  title,
  preview,
  children,
  /** Marketing mail needs an unsubscribe line; transactional mail does not. */
  unsubscribe = false,
}: {
  title: string;
  preview: string;
  children: React.ReactNode;
  unsubscribe?: boolean;
}) {
  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body style={{ margin: 0, backgroundColor: COLORS.page, fontFamily: "Georgia, 'Times New Roman', serif", color: COLORS.ink }}>
        <Container style={{ maxWidth: 600, margin: '0 auto', padding: '32px 20px' }}>
          <Section style={{ backgroundColor: COLORS.forest, borderRadius: '20px 20px 0 0', padding: '36px 36px 28px', textAlign: 'center' }}>
            <Text style={{ margin: 0, color: COLORS.sage, fontFamily: 'Arial, sans-serif', fontSize: 10, letterSpacing: 5, textTransform: 'uppercase', fontWeight: 'bold' }}>
              The Green Team
            </Text>
            <Heading as="h1" style={{ margin: '10px 0 0', color: COLORS.cream, fontSize: 26, fontStyle: 'italic', fontWeight: 400 }}>
              {title}
            </Heading>
          </Section>

          <Section style={{ backgroundColor: COLORS.cream, padding: 36, fontSize: 16 }}>{children}</Section>

          <Section style={{ backgroundColor: COLORS.forest, borderRadius: '0 0 20px 20px', padding: '24px 36px', textAlign: 'center' }}>
            <Text style={{ margin: 0, color: 'rgba(255,255,255,0.45)', fontFamily: 'Arial, sans-serif', fontSize: 11, lineHeight: 1.8 }}>
              The Green Team · Channel Partners · Hyderabad
              <br />
              WhatsApp {BUSINESS.phone} ·{' '}
              <Link href={SITE_URL} style={{ color: COLORS.sage }}>
                thegreenteam.in
              </Link>
            </Text>
            {unsubscribe && (
              <>
                <Hr style={{ borderColor: 'rgba(255,255,255,0.12)', margin: '16px 0 12px' }} />
                <Text style={{ margin: 0, color: 'rgba(255,255,255,0.3)', fontFamily: 'Arial, sans-serif', fontSize: 10, lineHeight: 1.7 }}>
                  You are receiving this because you subscribed at thegreenteam.in. Reply to this email to
                  unsubscribe.
                </Text>
              </>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

/** A body paragraph in the shared style. */
export function P({ children }: { children: React.ReactNode }) {
  return <Text style={{ margin: '0 0 18px', lineHeight: 1.75 }}>{children}</Text>;
}

const BTN = {
  backgroundColor: COLORS.green,
  color: '#ffffff',
  padding: '14px 34px',
  borderRadius: 999,
  fontFamily: 'Arial, sans-serif',
  fontSize: 11,
  letterSpacing: 3,
  textTransform: 'uppercase' as const,
  fontWeight: 'bold',
  textDecoration: 'none',
};
export { BTN };
