import 'server-only';
import { BUSINESS } from '@/lib/data/contact';
import { renderWelcome, WELCOME_SUBJECT } from '@/emails/welcome';
import { renderLeadConfirmation, LEAD_SUBJECT } from '@/emails/lead-confirmation';
import { renderSiteVisit, SITE_VISIT_SUBJECT } from '@/emails/site-visit';

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

async function send(to: string, subject: string, html: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  if (!key) return;

  const email = to.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;
  if (email.endsWith('.test') || email.includes('example.')) return; // never to test suites

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM, to: [email], reply_to: BUSINESS.email, subject, html }),
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      console.error(`[email] ${subject} → ${res.status}: ${text.slice(0, 200)}`);
    }
  } catch (err) {
    console.error('[email] send failed:', err);
  }
}

/** First sign-in welcome. */
export async function sendWelcomeEmail(to: string, name?: string): Promise<void> {
  await send(to, WELCOME_SUBJECT, await renderWelcome(name));
}

/** Site-visit booking confirmation. */
export async function sendSiteVisitConfirmation(to: string, name?: string, detail?: string): Promise<void> {
  await send(to, SITE_VISIT_SUBJECT, await renderSiteVisit({ name, detail }));
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
): Promise<void> {
  if (source && /site-visit/i.test(source)) {
    await sendSiteVisitConfirmation(to, name, intent);
    return;
  }
  await send(to, LEAD_SUBJECT, await renderLeadConfirmation({ name, intent }));
}
