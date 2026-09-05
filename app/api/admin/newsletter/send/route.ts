import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/server/session';
import { fetchNewsletter } from '@/lib/server/admin-data';
import { BUSINESS, SITE_URL } from '@/lib/data/contact';

/**
 * Newsletter dispatch — sends a composed issue to every subscriber via Resend.
 * Requires RESEND_API_KEY in the environment and a verified sending domain
 * (thegreenteam.in) in the Resend account. `test: true` sends only to the
 * signed-in admin so an issue can be proofed before the real send.
 */

const FROM = `The Green Team <dispatch@thegreenteam.in>`;
const BATCH = 100;

function renderHtml(subject: string, body: string): string {
  const paragraphs = body
    .split(/\n{2,}/)
    .map(p => `<p style="margin:0 0 18px;line-height:1.75;">${p.replace(/\n/g, '<br/>')}</p>`)
    .join('');
  return `<!doctype html><html><body style="margin:0;background:#f4f4ef;font-family:Georgia,'Times New Roman',serif;color:#1a1c1a;">
  <div style="max-width:600px;margin:0 auto;padding:32px 20px;">
    <div style="background:#1a2410;border-radius:20px 20px 0 0;padding:36px 36px 28px;text-align:center;">
      <p style="margin:0;color:#a3b18a;font-family:Arial,sans-serif;font-size:10px;letter-spacing:5px;text-transform:uppercase;font-weight:bold;">The Green Team</p>
      <p style="margin:10px 0 0;color:#faf9f6;font-size:26px;font-style:italic;">${subject}</p>
    </div>
    <div style="background:#faf9f6;padding:36px;font-size:16px;">
      ${paragraphs}
      <div style="margin-top:28px;text-align:center;">
        <a href="${SITE_URL}/list" style="display:inline-block;background:#2d3a1d;color:#ffffff;text-decoration:none;padding:14px 34px;border-radius:999px;font-family:Arial,sans-serif;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:bold;">View the Sanctuaries</a>
      </div>
    </div>
    <div style="background:#1a2410;border-radius:0 0 20px 20px;padding:24px 36px;text-align:center;">
      <p style="margin:0;color:rgba(255,255,255,0.45);font-family:Arial,sans-serif;font-size:11px;line-height:1.8;">
        The Green Team · Channel Partners · Hyderabad<br/>
        WhatsApp ${BUSINESS.phone} · <a href="${SITE_URL}" style="color:#a3b18a;">thegreenteam.in</a>
      </p>
    </div>
  </div>
</body></html>`;
}

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

  const html = renderHtml(String(subject).slice(0, 200), String(body).slice(0, 20000));

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
