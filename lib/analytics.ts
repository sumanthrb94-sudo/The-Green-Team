/**
 * Client-side analytics: GA4 events, Microsoft Clarity, and the conversion
 * events that make the funnel legible.
 *
 * Everything here is a no-op unless the matching env var is set, so local dev
 * and preview builds stay silent and nothing throws when a key is missing.
 *
 * Note on Firebase: `lib/firebase/client.ts` carries a `measurementId`, which
 * looks like GA4 but never initialised anything — `getAnalytics()` was never
 * called. This module is the actual analytics, deliberately kept separate from
 * Firebase so it works whether or not Firebase Analytics is ever turned on.
 */

import { sendEvent } from '@/lib/analytics/beacon';

export const GA_ID = process.env.NEXT_PUBLIC_GA_ID ?? '';
export const CLARITY_ID = process.env.NEXT_PUBLIC_CLARITY_ID ?? '';

export const analyticsEnabled = () => Boolean(GA_ID);

type Params = Record<string, string | number | boolean | undefined>;

declare global {
  interface Window {
    gtag?: (command: string, ...args: unknown[]) => void;
    dataLayer?: unknown[];
    clarity?: (command: string, ...args: unknown[]) => void;
  }
}

/** Fire-and-forget GA4 event. Safe to call during SSR, on a missing key, or before the script loads. */
export function trackEvent(name: string, params: Params = {}) {
  if (typeof window === 'undefined' || !window.gtag || !GA_ID) return;
  const clean: Params = {};
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== '') clean[k] = v;
  window.gtag('event', name, clean);
}

/**
 * The events that matter commercially. Named to match GA4's recommended events
 * where one exists (`generate_lead`, `sign_up`) so GA's built-in reports and
 * Google Ads conversion imports understand them without custom mapping.
 */
/**
 * Every commercial event goes to two places: GA4 (acquisition and Google Ads
 * attribution) and our own /api/track (Admin → Analytics). The first-party copy
 * is what survives an ad blocker, so the funnel in the admin stays honest even
 * when GA4 under-counts — which on desktop research traffic is routine.
 *
 * WhatsApp taps are deliberately absent here: PageTracker's delegated click
 * handler already catches every wa.me link on the site, and firing both would
 * double-count the strongest intent signal we have.
 */
export const track = {
  /** Adviser-call form submitted — the primary conversion on the site. */
  lead: (source: string, bracket?: string) => {
    trackEvent('generate_lead', { source, budget_bracket: bracket, currency: 'INR' });
    sendEvent('generate_lead', { meta: { source, ...(bracket ? { bracket } : {}) } });
  },

  /** Site-visit request, whether from a form or from Groot's booking tool. */
  siteVisit: (source: string, propertyId?: string) => {
    trackEvent('generate_lead', { source, lead_type: 'site_visit', property_id: propertyId, currency: 'INR' });
    sendEvent('site_visit', { propertyId, meta: { source } });
  },

  /** Newsletter subscription. */
  subscribe: (source: string) => {
    trackEvent('sign_up', { method: 'newsletter', source });
    sendEvent('sign_up', { meta: { source } });
  },

  /** Outbound WhatsApp tap — a real intent signal even though it leaves the site. */
  whatsapp: (source: string) => trackEvent('contact_whatsapp', { source }),

  /** Someone opened the chatbot. */
  chatOpen: () => {
    trackEvent('chat_open');
    sendEvent('chat_open');
  },

  /** A property page was viewed — feeds "which sanctuary gets attention". */
  viewProperty: (propertyId: string, name?: string) =>
    trackEvent('view_item', { item_id: propertyId, item_name: name, item_category: 'sanctuary' }),

  /** Brochure / layout download. */
  brochure: (propertyId: string) => {
    trackEvent('file_download', { property_id: propertyId });
    sendEvent('brochure_download', { propertyId });
  },

  /** A review was submitted (pending moderation). */
  review: (rating: number, propertyId?: string) => {
    trackEvent('submit_review', { rating, property_id: propertyId });
    sendEvent('submit_review', { propertyId, meta: { rating } });
  },

  /** Which A/B variant a visitor saw. Sent once per experiment per page load. */
  experiment: (id: string, variant: string) => {
    trackEvent('experiment_impression', { experiment_id: id, variant_id: variant });
    sendEvent('experiment_impression', { meta: { experiment: id, variant } });
  },
};

/**
 * Tell Clarity about a conversion so sessions can be filtered by it — the
 * point of a heatmap tool is watching the sessions that converted (and the
 * ones that nearly did), not the average of all of them.
 */
export function clarityTag(key: string, value: string) {
  if (typeof window === 'undefined' || !window.clarity) return;
  try {
    window.clarity('set', key, value);
  } catch {
    /* never let session tagging break a form submit */
  }
}

/**
 * Mark the current Clarity session as converted. Call alongside the matching
 * `track.*` event on a form's success path.
 */
export const markConverted = (kind: string) => clarityTag('converted', kind);
