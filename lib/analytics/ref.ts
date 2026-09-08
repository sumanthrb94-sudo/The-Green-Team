/**
 * Session reference codes — the join between a WhatsApp conversation and the
 * browsing session that produced it.
 *
 * The problem this solves: a WhatsApp tap is the strongest intent signal on
 * this site and it is also the point at which the visitor disappears. The tap
 * is recorded here; the conversation happens on a phone. Nothing connects the
 * two, so "two leads came in on WhatsApp this week" cannot be traced back to a
 * page, a channel or a campaign — which is exactly the question worth asking.
 *
 * The fix is deliberately low-tech: a short opaque code is appended to the
 * message the visitor is about to send, and the same code is stamped on every
 * analytics event of that session. Paste it into Admin → Analytics and the
 * whole visit comes back. No third-party tool, no click-tracking redirect, no
 * extra network hop that could break the link to WhatsApp.
 *
 * What the code is NOT: it carries no personal data, it is not derived from
 * anything about the person, it dies with the session, and the visitor sends it
 * themselves in a message they chose to send. It rides on the same analytics
 * consent as everything else in this folder — refuse analytics and no code is
 * generated, so the message goes out clean.
 */

import { readConsent } from '@/lib/consent';

const REF_KEY = 'gt_ref';

/** Crockford-ish base32: no I, L, O or U, so a code read aloud is unambiguous. */
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ';
const CODE_LEN = 6;

function mint(): string {
  let out = '';
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    const bytes = new Uint8Array(CODE_LEN);
    crypto.getRandomValues(bytes);
    for (const b of bytes) out += ALPHABET[b % ALPHABET.length];
  } else {
    for (let i = 0; i < CODE_LEN; i++) {
      out += ALPHABET[Math.floor(Math.random() * ALPHABET.length)];
    }
  }
  return `GT-${out}`;
}

/**
 * The code for this session, minted on first use and stable thereafter.
 *
 * Returns '' when there is no session storage to hold it — the callers treat an
 * empty code as "no reference", which leaves the WhatsApp message untouched
 * rather than sending a code that resolves to nothing.
 */
export function sessionRef(): string {
  if (typeof window === 'undefined') return '';
  // Gated here rather than only at the call sites, so the promise made in the
  // privacy policy — refuse analytics and no code is created, and no WhatsApp
  // message carries one — holds no matter who calls this.
  if (readConsent() !== 'granted') return '';
  try {
    let r = sessionStorage.getItem(REF_KEY);
    if (!r || !/^GT-[0-9A-Z]{6}$/.test(r)) {
      r = mint();
      sessionStorage.setItem(REF_KEY, r);
    }
    return r;
  } catch {
    // Private mode, storage disabled: no stable code is possible, and a code
    // that changed on every click would be worse than none.
    return '';
  }
}

/** Server-side validation. The code is user-typed in the admin lookup box. */
export const isRef = (v: string): boolean => /^GT-[0-9A-Z]{6}$/.test(v.trim().toUpperCase());

/**
 * Put the reference at the end of a wa.me deep link's prefilled message.
 *
 * It goes last, after a blank line, so the buyer's own sentence is what shows
 * in the WhatsApp compose box and the code reads as a footer rather than
 * something they have to delete before sending. Anything that is not one of our
 * WhatsApp links is returned untouched.
 */
export function withRef(href: string, ref: string): string {
  if (!ref || !/(?:^|\/\/)(?:api\.)?wa\.me\//i.test(href)) return href;
  if (href.includes(ref)) return href;
  try {
    const url = new URL(href);
    const text = url.searchParams.get('text');
    if (text === null) return href;

    // Rebuilt by hand rather than with searchParams.set(), which serialises
    // spaces as '+' and would silently re-encode the entire existing message.
    // '+' means a space only under form encoding; WhatsApp's deep link is read
    // as a plain URI component, so a re-encoded message can arrive with literal
    // plus signs where the words should be. encodeURIComponent keeps the %20
    // form the links were written with in lib/data/contact.ts.
    const encoded = encodeURIComponent(`${text}\n\nRef: ${ref}`);
    return `${url.origin}${url.pathname}?text=${encoded}`;
  } catch {
    return href;
  }
}
