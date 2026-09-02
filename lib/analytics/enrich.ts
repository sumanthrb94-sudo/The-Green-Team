import 'server-only';
import { createHash } from 'node:crypto';
import type { DeviceKind } from './types';

/**
 * Server-side enrichment of a beacon: device class, traffic channel, geo and a
 * privacy-preserving visitor hash. Deliberately dependency-free — a UA parser
 * library is a large amount of code and a supply-chain surface for something
 * this shallow.
 */

/** Obvious non-humans. Filtered at read time so the dashboard counts people. */
const BOT_RE =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|whatsapp|telegram|preview|lighthouse|pagespeed|headless|puppeteer|playwright|curl|wget|python-requests|axios|monitor|uptime|gtmetrix|pingdom|semrush|ahrefs|mj12|dotbot|petal|yandex|duckduck/i;

export const isBot = (ua: string) => BOT_RE.test(ua);

export function deviceOf(ua: string, viewportWidth?: number): DeviceKind {
  if (/ipad|tablet|playbook|silk|(android(?!.*mobile))/i.test(ua)) return 'tablet';
  if (/mobi|iphone|ipod|android|blackberry|iemobile|opera mini/i.test(ua)) return 'mobile';
  // A desktop UA with a phone-width viewport is usually a phone in desktop
  // mode or a narrow window; trust the viewport as a tiebreaker.
  if (viewportWidth && viewportWidth < 640) return 'mobile';
  if (viewportWidth && viewportWidth < 1024) return 'tablet';
  return 'desktop';
}

export function browserOf(ua: string): string {
  // Order matters: Edge and Opera both claim Chrome, Chrome claims Safari.
  if (/edg[ea]?\//i.test(ua)) return 'Edge';
  if (/opr\/|opera/i.test(ua)) return 'Opera';
  if (/samsungbrowser/i.test(ua)) return 'Samsung Internet';
  if (/firefox|fxios/i.test(ua)) return 'Firefox';
  if (/chrome|crios/i.test(ua)) return 'Chrome';
  if (/safari/i.test(ua)) return 'Safari';
  return 'Other';
}

export function osOf(ua: string): string {
  if (/windows nt/i.test(ua)) return 'Windows';
  if (/android/i.test(ua)) return 'Android';
  if (/iphone|ipad|ipod|ios/i.test(ua)) return 'iOS';
  if (/mac os x|macintosh/i.test(ua)) return 'macOS';
  if (/linux/i.test(ua)) return 'Linux';
  return 'Other';
}

/**
 * Groups a referrer into a channel a human can act on. For this business the
 * distinction that matters is Instagram (where the reels campaign runs) versus
 * organic search versus direct.
 */
export function channelOf(referrerHost: string, utmSource?: string): string {
  const s = (utmSource ?? '').toLowerCase();
  const h = referrerHost.toLowerCase();
  const test = (re: RegExp) => re.test(s) || re.test(h);

  if (test(/instagram|ig\b/)) return 'Instagram';
  if (test(/facebook|fb\.|meta/)) return 'Facebook';
  if (test(/whatsapp|wa\.me/)) return 'WhatsApp';
  if (test(/youtube|youtu\.be/)) return 'YouTube';
  if (test(/linkedin|lnkd/)) return 'LinkedIn';
  if (test(/google/)) return s.includes('cpc') || s.includes('ads') ? 'Google Ads' : 'Google';
  if (test(/bing|duckduckgo|yahoo|ecosia|brave/)) return 'Search (other)';
  if (test(/x\.com|twitter|t\.co/)) return 'X / Twitter';
  if (test(/telegram|t\.me/)) return 'Telegram';
  if (!h || h === 'direct') return s ? `Campaign: ${s.slice(0, 24)}` : 'Direct';
  return h.replace(/^www\./, '').slice(0, 40);
}

/** Referrer URL → bare host, ignoring our own domain (that's internal navigation). */
export function referrerHost(referrer: string | undefined, selfHost: string): string {
  if (!referrer) return 'direct';
  try {
    const h = new URL(referrer).host.toLowerCase();
    if (!h || h === selfHost.toLowerCase()) return 'direct';
    return h.replace(/^www\./, '').slice(0, 60);
  } catch {
    return 'direct';
  }
}

/**
 * Salted daily hash of the IP. Never store or log a raw IP: it is personal data
 * under the DPDP Act and GDPR, and we have no need for it. Rotating the salt
 * daily means the hash cannot be used to follow someone across days, while
 * still de-duplicating within a day.
 */
export function hashIp(ip: string, day: string): string {
  const salt = process.env.ANALYTICS_SALT ?? 'gt-default-salt-change-me';
  return createHash('sha256').update(`${salt}|${day}|${ip}`).digest('hex').slice(0, 32);
}

/**
 * Geo from the edge. Vercel sets x-vercel-ip-*; Cloudflare sets cf-ipcountry.
 * Absent locally, which is why everything falls back to 'Unknown' rather than
 * guessing. City-level only — we never need finer than that.
 */
export function geoOf(h: Headers): { country: string; region: string; city: string } {
  const dec = (v: string | null) => {
    if (!v) return '';
    try {
      // Vercel percent-encodes city names with non-ASCII characters.
      return decodeURIComponent(v).slice(0, 60);
    } catch {
      return v.slice(0, 60);
    }
  };
  return {
    country: dec(h.get('x-vercel-ip-country') ?? h.get('cf-ipcountry')) || 'Unknown',
    region: dec(h.get('x-vercel-ip-country-region') ?? h.get('cf-region')) || 'Unknown',
    city: dec(h.get('x-vercel-ip-city') ?? h.get('cf-ipcity')) || 'Unknown',
  };
}
