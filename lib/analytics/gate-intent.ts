/**
 * What the visitor was trying to unlock when they were asked to sign in.
 *
 * The pricing gate on a property page is the only place on this site where
 * somebody is stopped mid-intent, and it is therefore the highest-quality
 * signal the business gets: a person standing in front of the Agartha price
 * sheet, hand out. Until now the lead that sign-in produced said nothing but
 * "New Sign-up", so the adviser calling them back was starting from zero on a
 * call that could have started from "you were looking at Agartha".
 *
 * Stored in sessionStorage rather than passed through the auth flow because the
 * flow leaves the page entirely on a Google redirect. Read once and cleared, so
 * a later unrelated sign-up never inherits a stale property.
 */
export const GATE_INTENT_KEY = 'gt_gate_intent';

const NAMES: Record<string, string> = {
  agartha: 'MODCON Agartha',
  syl: 'MODCON SYL Residences',
  'dates-county': 'Dates County',
};

/**
 * The intent line for a lead created by signing up, or undefined when the
 * sign-up did not come from a pricing gate.
 */
export function takeGateIntent(): string | undefined {
  if (typeof window === 'undefined') return undefined;
  try {
    const id = sessionStorage.getItem(GATE_INTENT_KEY);
    if (!id) return undefined;
    sessionStorage.removeItem(GATE_INTENT_KEY);
    return `Signed up to see pricing for ${NAMES[id] ?? id}`;
  } catch {
    return undefined;
  }
}
