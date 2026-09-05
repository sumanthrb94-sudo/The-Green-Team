/** Shared shapes for the first-party analytics pipeline. */

export type DeviceKind = 'mobile' | 'tablet' | 'desktop';

/** What the browser beacon sends. Everything here is client-supplied and must
 *  be treated as untrusted — the ingest route validates and caps every field. */
export interface TrackPayload {
  /** 'pageview' closes out a page visit; 'event' is a discrete interaction. */
  type: 'pageview' | 'event';
  /** Event name for type='event' (e.g. 'whatsapp_click', 'generate_lead'). */
  name?: string;
  path: string;
  title?: string;
  /** Full referrer URL as the browser reports it; reduced to a host server-side. */
  referrer?: string;
  /** Milliseconds the tab was visible AND the visitor was active. Not wall time. */
  engagedMs?: number;
  /** Deepest scroll reached, 0-100. */
  scrollPct?: number;
  /** Session id (sessionStorage, 30-min inactivity rollover). */
  sid: string;
  /** Visitor id (localStorage, first-party, random — not a fingerprint). */
  vid: string;
  /** True only on the pageview that created the visitor id. */
  newVisitor?: boolean;
  /** Viewport width, used to sanity-check the UA device class. */
  vw?: number;
  propertyId?: string;
  /** Small bag of extra context per event. Values are capped server-side. */
  meta?: Record<string, string | number>;
}

/** What actually lands in Firestore `analytics_events`. */
export interface AnalyticsEvent {
  type: 'pageview' | 'event';
  name: string;
  path: string;
  title?: string;
  /** Referrer host only ('instagram.com'), or 'direct'. Never the full URL. */
  referrer: string;
  /** Grouped traffic source: 'Direct', 'Instagram', 'Google', 'WhatsApp', … */
  channel: string;
  utmSource?: string;
  utmMedium?: string;
  utmCampaign?: string;
  engagedMs: number;
  scrollPct: number;
  sid: string;
  vid: string;
  newVisitor: boolean;
  device: DeviceKind;
  browser: string;
  os: string;
  country: string;
  region: string;
  city: string;
  propertyId?: string;
  meta?: Record<string, string | number>;
  /** Salted hash. The raw IP is never stored. */
  ipHash: string;
  bot: boolean;
  at: FirebaseFirestore.Timestamp | Date;
}

/** Events the dashboard treats as conversions, in funnel order. */
export const CONVERSION_EVENTS = [
  'whatsapp_click',
  'chat_open',
  'generate_lead',
  'site_visit',
  'sign_up',
] as const;
