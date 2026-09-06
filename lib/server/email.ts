import 'server-only';
import { BUSINESS } from '@/lib/data/contact';
import { renderWelcome, WELCOME_SUBJECT } from '@/emails/welcome';
import { renderLeadConfirmation, LEAD_SUBJECT } from '@/emails/lead-confirmation';
import { renderSiteVisit, SITE_VISIT_SUBJECT } from '@/emails/site-visit';
import { renderNewsletterWelcome, NEWSLETTER_WELCOME_SUBJECT } from '@/emails/newsletter-welcome';
import { renderListingReceived, LISTING_SUBJECT } from '@/emails/listing-received';

/**
 * Transactional email — one message to one person, triggered by something they
 * just did (signed in, submitted an enquiry). Distinct from the newsletter,
 * which batches to a list from the admin route.
 *
 * Same discipline as the Resend contact sync: fire-and-forget. A welcome email
 * failing must never fail the sign-in that triggered it, so every call is
 * `void`-ed by the caller and every error is logged, not thrown. No key → no-op,
 * so dev and preview stay silent and test sign-ups send nothing.
 */

const FROM = `The Green Team <${BUSINESS.email}>`;

/**
 * Returns whether Resend actually accepted the message, so a caller can avoid
 * recording "sent" for something that never left. A suppressed address (test
 * suite, no key) reports false: nothing was delivered.
 */
async function send(to: string, subject: string, html: string): Promise<boolean> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return false;

  const email = to.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return false;
  if (email.endsWith('.test') || email.includes('example.')) return false; // never to test suites

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [email], reply_to: BUSINESS.email, subject, html }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[email] ${subject} → ${res.status}: ${text.slice(0, 200)}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error('[email] send failed:', err);
    return false;
  }
}

/** First sign-in welcome. */
export async function sendWelcomeEmail(to: string, name?: string): Promise<boolean> {
  return send(to, WELCOME_SUBJECT, await renderWelcome(name));
}

/** Newsletter subscription confirmation — not the member welcome, which
 *  promises per-unit pricing a subscriber cannot see. */
export async function sendNewsletterWelcome(to: string): Promise<boolean> {
  return send(to, NEWSLETTER_WELCOME_SUBJECT, await renderNewsletterWelcome());
}

/** Site-visit booking confirmation. */
export async function sendSiteVisitConfirmation(to: string, name?: string, detail?: string): Promise<boolean> {
  return send(to, SITE_VISIT_SUBJECT, await renderSiteVisit({ name, detail }));
}

/**
 * Confirmation for a captured lead, choosing the template by source: a site-
 * visit booking gets the visit email, everything else the general enquiry one.
 * One entry point so the leads route does not branch on strings itself.
 */
export async function sendLeadConfirmation(
  to: string,
  name?: string,
  intent?: string,
  source?: string
): Promise<boolean> {
  // Supply side: a developer/owner asking to list must never get the buyer
  // confirmation ("an adviser will help you find a home… sign in for pricing").
  if (source === 'list-property') {
    return send(to, LISTING_SUBJECT, await renderListingReceived({ name, intent }));
  }
  if (source && /site-visit/i.test(source)) {
    return sendSiteVisitConfirmation(to, name, intent);
  }
  return send(to, LEAD_SUBJECT, await renderLeadConfirmation({ name, intent }));
}
