/**
 * Analytics consent, stored where both the browser and the server can read it.
 *
 * DPDP s.6: consent must be a clear affirmative action, and withdrawing it must
 * be as easy as giving it. So the default is `unknown`, which behaves exactly
 * like `denied` — nothing is measured until somebody actually says yes — and
 * both answers are one click, from the banner or from the cookie policy page.
 *
 * A cookie rather than localStorage because the choice has to survive across
 * subdomains and be visible to the server if we ever need to prove it.
 */
export const CONSENT_COOKIE = 'gt_consent';
export const CONSENT_VERSION = 1;

export type ConsentState = 'granted' | 'denied' | 'unknown';

/** Read the current choice. Any unrecognised or older value means "ask again". */
export function readConsent(): ConsentState {
  if (typeof document === 'undefined') return 'unknown';
  const raw = document.cookie
    .split('; ')
    .find(c => c.startsWith(`${CONSENT_COOKIE}=`))
    ?.split('=')[1];
  if (!raw) return 'unknown';
  const [v, state] = decodeURIComponent(raw).split(':');
  if (Number(v) !== CONSENT_VERSION) return 'unknown';
  return state === 'granted' || state === 'denied' ? state : 'unknown';
}

/** Record a choice for a year, and tell the page so it can react immediately. */
export function writeConsent(state: Exclude<ConsentState, 'unknown'>): void {
  if (typeof document === 'undefined') return;
  const value = encodeURIComponent(`${CONSENT_VERSION}:${state}`);
  const secure = location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${CONSENT_COOKIE}=${value}; Path=/; Max-Age=${60 * 60 * 24 * 365}; SameSite=Lax${secure}`;
  if (state === 'denied') clearAnalyticsCookies();
  window.dispatchEvent(new CustomEvent<ConsentState>(CONSENT_EVENT, { detail: state }));
}

/** Forget the choice, so the banner asks again. Used by "change my mind". */
export function resetConsent(): void {
  if (typeof document === 'undefined') return;
  document.cookie = `${CONSENT_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax`;
  clearAnalyticsCookies();
  window.dispatchEvent(new CustomEvent<ConsentState>(CONSENT_EVENT, { detail: 'unknown' }));
}

/**
 * Refusing has to actually remove what was already set, or the refusal is
 * cosmetic. These are the analytics cookies named in the cookie policy.
 */
function clearAnalyticsCookies(): void {
  const host = location.hostname;
  const domains = [host, `.${host}`, `.${host.split('.').slice(-2).join('.')}`];
  for (const c of document.cookie.split('; ')) {
    const name = c.split('=')[0];
    if (!/^(_ga|_gid|_gat|_clck|_clsk)/.test(name)) continue;
    for (const d of domains) {
      document.cookie = `${name}=; Path=/; Domain=${d}; Max-Age=0`;
    }
    document.cookie = `${name}=; Path=/; Max-Age=0`;
  }
}

export const CONSENT_EVENT = 'gt:consent';

/** Subscribe to changes — used by the analytics loader and the banner. */
export function onConsentChange(fn: (state: ConsentState) => void): () => void {
  const handler = (e: Event) => fn((e as CustomEvent<ConsentState>).detail);
  window.addEventListener(CONSENT_EVENT, handler);
  return () => window.removeEventListener(CONSENT_EVENT, handler);
}
