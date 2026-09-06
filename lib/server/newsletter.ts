import 'server-only';
import { after } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';
import { upsertContact, splitName, SEGMENT } from '@/lib/server/resend';
import { sendNewsletterWelcome } from '@/lib/server/email';

/**
 * Subscribing to the briefing, in exactly one place.
 *
 * There used to be two implementations: the form route, which wrote to
 * Firestore *and* synced Resend *and* sent the confirmation; and Groot's
 * `subscribe_newsletter` tool, which only wrote to Firestore. A person who
 * subscribed through the chatbot therefore got no confirmation email and never
 * reached the Resend audience the broadcast actually goes out from — they were
 * on a list that nothing sends to. Every caller now goes through here, so
 * "subscribed" means the same three things no matter where it was typed.
 */

/** Where the address was typed. One value per real surface — nothing else. */
export type SubscribeSource = 'footer' | 'groot';

export interface SubscribeResult {
  ok: boolean;
  /** True when the address was already on the list — no second record, no second email. */
  already: boolean;
  /** Set when the address failed validation, so a caller can return 400. */
  invalid?: boolean;
}

/**
 * Side effects run after the response where the platform allows it. `after()`
 * throws outside a request scope (and Groot calls this from inside an open
 * stream), so fall back to awaiting rather than dropping the work — a bare
 * `void` promise is what silently killed these calls in production before.
 */
function schedule(task: () => Promise<void>): Promise<void> | void {
  try {
    after(task);
  } catch {
    return task();
  }
}

export async function subscribeEmail({
  email: raw,
  source,
  name,
}: {
  email: string;
  source: SubscribeSource;
  name?: string;
}): Promise<SubscribeResult> {
  const email = String(raw ?? '').trim().toLowerCase().slice(0, 200);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    return { ok: false, already: false, invalid: true };
  }

  const col = adminDb().collection('newsletter');
  const existing = await col.where('email', '==', email).limit(1).get();

  // A repeat signup is usually someone checking it worked: keep Resend in sync,
  // but no second record and no second confirmation email.
  if (!existing.empty) {
    await schedule(async () => {
      await upsertContact({
        email,
        ...splitName(name),
        segments: [SEGMENT.newsletter()],
        properties: { source },
      });
    });
    return { ok: true, already: true };
  }

  await col.add({ email, source, createdAt: FieldValue.serverTimestamp() });
  await schedule(async () => {
    // Firestore is the record; Resend is where the broadcast goes out from.
    await upsertContact({
      email,
      ...splitName(name),
      segments: [SEGMENT.newsletter()],
      properties: { source },
    });
    // The newsletter confirmation, not the member welcome — a subscriber
    // cannot see per-unit pricing, so must not be promised it.
    await sendNewsletterWelcome(email);
  });
  return { ok: true, already: false };
}
