/**
 * Demo stand-in for `firebase/analytics` — no network, no measurement.
 */

export function isSupported(): Promise<boolean> {
  return Promise.resolve(false);
}

export function getAnalytics(): Record<string, never> {
  return {};
}

export function logEvent(): void {
  /* no-op */
}
