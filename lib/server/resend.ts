import 'server-only';

/**
 * Resend contact sync.
 *
 * Every email the site collects — a newsletter tick, a Google sign-in, a
 * profile with a phone number — lands in Resend as a contact, tagged into the
 * segment that says how it arrived. That is what makes a broadcast possible
 * later without exporting a CSV out of Firestore by hand.
 *
 * Two rules, both deliberate:
 *
 * 1. Never fail the caller. A subscribe or a sign-in must succeed even if Resend
 *    is down, unconfigured, or rate-limiting. Firestore remains the source of
 *    truth; Resend is a mirror. Errors are logged, not thrown.
 *
 * 2. Never run when the key is absent. Local dev and preview deployments have
 *    no RESEND_API_KEY, and silently no-op is the correct behaviour there — it
 *    keeps test sign-ups from polluting the real contact list.
 */

const API = 'https://api.resend.com';

const key = () => process.env.RESEND_API_KEY ?? '';
export const SEGMENT = {
  newsletter: () => process.env.RESEND_SEGMENT_NEWSLETTER ?? '',
  members: () => process.env.RESEND_SEGMENT_MEMBERS ?? '',
};

export const resendEnabled = () => Boolean(key());

interface UpsertInput {
  email: string;
  firstName?: string;
  lastName?: string;
  /** Segment IDs. Missing/empty IDs are dropped rather than sent. */
  segments?: string[];
  /** Free-form attributes (phone, city, occupation, source). Strings only. */
  properties?: Record<string, string | undefined>;
}

/** Split "Sumanth Bolla" → first/last without inventing a surname. */
export function splitName(full?: string | null): { firstName?: string; lastName?: string } {
  const s = (full ?? '').trim();
  if (!s) return {};
  const i = s.indexOf(' ');
  if (i === -1) return { firstName: s };
  return { firstName: s.slice(0, i), lastName: s.slice(i + 1) };
}

/**
 * Create-or-update a contact. Resend keys contacts by email, so a repeat call
 * for the same address updates rather than duplicates; segment membership is
 * additive, so a newsletter subscriber who later signs in ends up in both.
 */
export async function upsertContact(
  input: UpsertInput & {
    /** Resend's own opt-out flag. Set when a member turns the briefing off, so
     *  the state lives where the broadcast is sent from, not only in Firestore. */
    unsubscribed?: boolean;
  }
): Promise<void> {
  if (!resendEnabled()) return;

  const email = input.email.trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return;
  // Test-suite addresses must never reach the real list.
  if (email.endsWith('.test') || email.includes('example.')) return;

  const segments = (input.segments ?? []).filter(Boolean);
  const properties: Record<string, string> = {};
  for (const [k, v] of Object.entries(input.properties ?? {})) {
    if (typeof v === 'string' && v.trim()) properties[k] = v.trim().slice(0, 200);
  }

  const headers = { Authorization: `Bearer ${key()}`, 'Content-Type': 'application/json' };
  const name = {
    ...(input.firstName ? { first_name: input.firstName.slice(0, 100) } : {}),
    ...(input.lastName ? { last_name: input.lastName.slice(0, 100) } : {}),
  };

  try {
    // Modern account-level contacts API: one call, segments attached inline.
    const res = await fetch(`${API}/contacts`, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        email,
        ...name,
        ...(segments.length ? { segments } : {}),
        ...(Object.keys(properties).length ? { properties } : {}),
        unsubscribed: input.unsubscribed ?? false,
      }),
    });
    if (res.ok || res.status === 409) return; // 409 = already exists; fine.

    // A 4xx here most likely means this account is on the segment-as-audience
    // model, where contacts are created per audience. Fall back to that shape
    // so sync works on either API version without a redeploy — this cannot be
    // exercised from the build sandbox, which has no egress to api.resend.com.
    if (res.status >= 400 && res.status < 500 && segments.length) {
      await Promise.all(
        segments.map(id =>
          fetch(`${API}/audiences/${id}/contacts`, {
            method: 'POST',
            headers,
            body: JSON.stringify({ email, ...name, unsubscribed: input.unsubscribed ?? false }),
          }).then(async r => {
            if (!r.ok && r.status !== 409) {
              const t = await r.text().catch(() => '');
              console.error(`[resend] legacy upsert ${r.status} (${id}): ${t.slice(0, 200)}`);
            }
          })
        )
      );
      return;
    }

    const text = await res.text().catch(() => '');
    console.error(`[resend] upsert ${res.status}: ${text.slice(0, 200)}`);
  } catch (err) {
    console.error('[resend] upsert failed:', err);
  }
}
