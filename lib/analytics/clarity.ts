/**
 * Microsoft Clarity — session recordings and mouse heatmaps.
 *
 * Clarity is the complement to our own pipeline, not a replacement. Ours says
 * *what* someone did, in order, with engaged time and scroll depth. Clarity
 * shows *how it looked* — the rage clicks, the dead taps, the form field they
 * started and abandoned. Neither answers the other's question.
 *
 * The reason this file exists rather than a bare `Clarity.init()` call: the
 * recording is only worth anything if it can be joined to everything else we
 * know. So every session is tagged with our own reference code, which means a
 * `GT-XXXXXX` pasted out of a WhatsApp message resolves two ways — to the
 * ordered event trace in Admin → Analytics, and to the actual screen recording
 * in Clarity. That join is the whole point of loading it.
 *
 * Two hard rules enforced here, not left to call sites:
 *
 *   1. Nothing loads before consent. Clarity records the DOM; under the DPDP
 *      Act it may not start and ask afterwards.
 *   2. It never runs inside /admin. Those pages render real customers' names
 *      and phone numbers, and a DOM recorder would ship that personal data to
 *      a third party — a far worse leak than the analytics noise the same
 *      exclusion prevents elsewhere.
 */
import Clarity from '@microsoft/clarity';
import { CLARITY_ID } from '@/lib/analytics';
import { readConsent } from '@/lib/consent';
import { sessionRef } from './ref';

let started = false;

/** Every method below reaches window.clarity, which only exists after init. */
const ready = () => started && typeof window !== 'undefined' && typeof window.clarity === 'function';

const guard = (fn: () => void) => {
  if (!ready()) return;
  try {
    fn();
  } catch {
    /* an analytics tag is never worth breaking a page for */
  }
};

/**
 * Start Clarity, if it is configured and permitted. Idempotent — safe to call
 * on every consent change and every route change.
 */
export function startClarity(): void {
  if (started || typeof window === 'undefined') return;
  if (!CLARITY_ID) return;
  if (readConsent() !== 'granted') return;
  if (window.location.pathname.startsWith('/admin')) return;

  try {
    Clarity.init(CLARITY_ID);
    started = true;
  } catch {
    return;
  }

  // Tell Clarity the answer it was given, rather than relying on the absence
  // of the script to imply it.
  guard(() => Clarity.consentV2({ ad_Storage: 'denied', analytics_Storage: 'granted' }));

  // The join. Without this the recording is an anonymous video; with it, the
  // code in a WhatsApp message finds the exact session.
  const ref = sessionRef();
  if (ref) guard(() => Clarity.setTag('gt_ref', ref));

  // A session that signed in before Clarity started still gets attributed.
  identifyCurrent();
}

/**
 * Withdraw consent mid-session, and the same lever used when a client-side
 * navigation crosses into /admin.
 *
 * Clarity exposes no teardown, so denying consent is the strongest available
 * stop: it halts cookie-based tracking and further upload. The residual risk is
 * that a page already in flight may finish uploading, so this is a backstop and
 * not the primary defence — the primary defence is that startClarity refuses to
 * begin on an admin path at all.
 */
export function stopClarity(): void {
  // Deny first, then clear the flag: guard() checks `started`, so clearing it
  // beforehand would skip the very call that stops the recording.
  guard(() => Clarity.consentV2({ ad_Storage: 'denied', analytics_Storage: 'denied' }));
  started = false;
}

/** Attach a filterable label to the current recording. */
export function clarityTag(key: string, value: string): void {
  guard(() => Clarity.setTag(key, value));
}

/**
 * Name the member behind the recording, so a session can be found by who it
 * was rather than only by what happened in it.
 *
 * Clarity hashes the id it is given, so this is not a plaintext identifier
 * sitting in a third-party dashboard; the friendly name is, which is why only
 * a display name is passed and never an email or a phone number.
 *
 * Microsoft's guidance is to call this on every page rather than once per
 * session, so it is wired to route changes rather than to the sign-in event.
 */
export function clarityIdentify(uid: string, friendlyName?: string): void {
  guard(() => Clarity.identify(uid, undefined, undefined, friendlyName));
}

/**
 * Who is signed in, held in module scope and pushed here by AuthProvider.
 *
 * Deliberately not read with useAuth(): <Analytics /> is mounted as a sibling
 * of <AuthProvider> in app/layout.tsx, not inside it, so a hook call there
 * throws and takes the whole component down — which is exactly how the first
 * version of this failed silently, loading no Clarity at all. The beacon
 * already solves the same problem the same way with setAnalyticsUid.
 */
let identity: { uid: string; name?: string } | null = null;

export function setClarityIdentity(uid?: string | null, name?: string | null): void {
  identity = uid ? { uid, name: name ?? undefined } : null;
  identifyCurrent();
}

/** Re-assert the identity, which Microsoft asks for on every page. */
export function identifyCurrent(): void {
  if (identity) clarityIdentify(identity.uid, identity.name);
}

/**
 * Mark a conversion. The point of a recording tool is watching the sessions
 * that converted — and the ones that nearly did — not the average of all of
 * them, and `event` is what makes those filterable in Clarity's UI.
 */
export function clarityEvent(name: string): void {
  guard(() => Clarity.event(name));
}

/**
 * Ask Clarity to prioritise recording this session.
 *
 * Clarity samples: not every visit is kept. That is a sensible default for a
 * site with real traffic and the wrong one here, where a week produces around
 * a dozen genuine visitors and perhaps two of them matter. So the moment
 * someone shows intent — reaches the price gate, taps WhatsApp, starts the
 * adviser form — the session is upgraded and kept.
 */
export function clarityUpgrade(reason: string): void {
  guard(() => Clarity.upgrade(reason));
}
