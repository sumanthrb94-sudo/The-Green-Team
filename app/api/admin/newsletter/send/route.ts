import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/session';
import { fetchNewsletter } from '@/lib/server/admin-data';
import { BUSINESS } from '@/lib/data/contact';
import { renderNewsletter } from '@/emails/newsletter';

/**
 * Newsletter dispatch — sends a composed issue to every subscriber via Resend.
 * Requires RESEND_API_KEY in the environment and a verified sending domain
 * (thegreenteam.in) in the Resend account. `test: true` sends only to the
 * signed-in admin so an issue can be proofed before the real send.
 *
 * The email body is a React Email component (emails/newsletter.tsx) — preview
 * it locally with `npm run email`.
 */

// Sent from the one real mailbox, which is also where replies land — no
// catch-all needed. Resend's domain-level DKIM authorises any From on the
// verified domain, so this works once thegreenteam.in is verified.
const FROM = `The Green Team <${BUSINESS.email}>`;
const BATCH = 100;

export async function POST(req: NextRequest) {
  let admin;
  try {
    admin = await requireAdmin();
  } catch {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: 'RESEND_API_KEY is not configured. Add it in Vercel → Environment Variables (and verify thegreenteam.in in Resend).' },
      { status: 501 }
    );
  }

  const { subject, body, test } = await req.json();
  if (!subject?.trim() || !body?.trim()) {
    return NextResponse.json({ error: 'subject and body are required' }, { status: 400 });
  }

  const html = await renderNewsletter(String(subject).slice(0, 200), String(body).slice(0, 20000));

  let recipients: string[];
  if (test) {
    if (!admin.email) return NextResponse.json({ error: 'admin session has no email' }, { status: 400 });
    recipients = [admin.email];
  } else {
    const subs = await fetchNewsletter();
    recipients = [...new Set(subs.map(s => s.email?.toLowerCase()).filter(e => e && !e.endsWith('.test')))] as string[];
  }
  if (!recipients.length) return NextResponse.json({ error: 'no subscribers' }, { status: 400 });

  let sent = 0;
  const errors: string[] = [];
  for (let i = 0; i < recipients.length; i += BATCH) {
    const batch = recipients.slice(i, i + BATCH).map(to => ({
      from: FROM,
      to: [to],
      // Sent from dispatch@ (Resend-signed, no inbox), but a reader who hits
      // reply should reach a mailbox someone actually watches — the published
      // contact address. Requires that address to receive mail: either a real
      // mailbox or catch-all pointed at admin@thegreenteam.in.
      reply_to: BUSINESS.email,
      subject: String(subject),
      html,
    }));
    const res = await fetch('https://api.resend.com/emails/batch', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(batch),
    });
    if (res.ok) {
      sent += batch.length;
    } else {
      const err = await res.json().catch(() => ({}));
      errors.push(err?.message ?? `batch failed (${res.status})`);
      if (res.status === 401 || res.status === 403) break; // bad key — stop early
    }
  }

  return NextResponse.json({ ok: errors.length === 0, sent, total: recipients.length, errors });
}
