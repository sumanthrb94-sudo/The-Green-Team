/**
 * Referrer → channel classification, shared by the ingest route and the browser.
 *
 * This lives outside `enrich.ts` (which is `server-only`) because first-touch
 * attribution has to be worked out in the browser, at the moment of the landing
 * page, and then carried until the visitor eventually submits a form. Two
 * copies of this logic would drift, and the drift would show up as a channel
 * that exists in the analytics tab but not on the lead — so there is one copy.
 */

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
