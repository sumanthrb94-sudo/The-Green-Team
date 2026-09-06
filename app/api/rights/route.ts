import { NextRequest, NextResponse, after } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { allowedOrigin, clientIp, rateLimited } from '@/lib/server/rate-limit';
import { LEGAL, COLLECTION_NOTICE } from '@/lib/data/legal';
import { sendRightsRequestAck, notifyRightsRequest } from '@/lib/server/email';

/**
 * Rights for people who never made an account.
 *
 * Most of the personal data this business holds belongs to people who typed a
 * name and a number into an enquiry form and never signed in — twenty-one of
 * them against eight members. The account page cannot serve them, but sections
 * 11 to 13 of the DPDP Act are theirs all the same, and section 13 wants a
 * readily available means of grievance redressal, not one behind a login.
 *
 * Deliberately does NOT return anyone's data. An unauthenticated endpoint that
 * answered "here is everything you hold on this number" would be a lookup
 * oracle for anybody who guessed a number. It records the request, starts the
 * statutory clock, and hands it to a human to verify identity and answer.
 */
const KINDS = new Set(['access', 'correction', 'erasure', 'withdraw-consent', 'grievance']);

export async function POST(req: NextRequest) {
  if (!allowedOrigin(req)) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (rateLimited('rights', clientIp(req), { max: 5, windowMs: 60 * 60 * 1000 })) {
    return NextResponse.json({ error: 'too many requests' }, { status: 429 });
  }

  try {
    const body = await req.json();
    const kind = KINDS.has(body.kind) ? String(body.kind) : 'access';
    const email = String(body.email ?? '').trim().toLowerCase().slice(0, 200);
    const phone = String(body.phone ?? '').replace(/[^\d+\s\-()]/g, '').trim().slice(0, 40);
    const details = String(body.details ?? '').trim().slice(0, 2000);
    const name = String(body.name ?? '').trim().slice(0, 200);

    // We need at least one way to find them and one way to answer them.
    const hasEmail = /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email);
    if (!hasEmail && phone.replace(/\D/g, '').length < 8) {
      return NextResponse.json({ error: 'need an email address or a phone number' }, { status: 400 });
    }

    // The clock the Privacy Policy publishes: a grievance is acknowledged in 24
    // hours and closed in 15 days; a data request is answered in 30.
    const isGrievance = kind === 'grievance';
    const dueDays = isGrievance ? LEGAL.grievanceResolutionDays : LEGAL.dataRequestDays;
    const dueBy = new Date(Date.now() + dueDays * 24 * 60 * 60 * 1000);

    const ref = await adminDb().collection('rights_requests').add({
      kind,
      name: name || null,
      email: hasEmail ? email : null,
      phone: phone || null,
      details: details || null,
      status: 'open',
      noticeVersion: COLLECTION_NOTICE.version,
      dueBy,
      createdAt: FieldValue.serverTimestamp(),
    });

    after(async () => {
      // Tell the officer first — the deadline is theirs to meet.
      await notifyRightsRequest({ id: ref.id, kind, name, email: hasEmail ? email : '', phone, details, dueBy });
      if (hasEmail) await sendRightsRequestAck(email, { kind, reference: ref.id, dueDays });
    });

    return NextResponse.json({
      ok: true,
      reference: ref.id,
      answerBy: dueBy.toISOString().slice(0, 10),
      acknowledgeWithinHours: LEGAL.grievanceAckHours,
    });
  } catch {
    return NextResponse.json({ error: 'failed' }, { status: 500 });
  }
}
