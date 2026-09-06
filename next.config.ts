import type { NextConfig } from 'next';

/**
 * Content-Security-Policy.
 *
 * script-src carries 'unsafe-inline' deliberately. The strict alternative is a
 * per-request nonce, which in the App Router requires reading the request in
 * middleware and forces every page into dynamic rendering — this site runs on
 * ISR with a deliberately tuned LCP, so that trade costs more than it buys
 * while the app has no known XSS (inputs are React-escaped, the one rich-text
 * renderer escapes before linkifying, and JSON-LD is `<`-escaped). What the
 * policy does buy today is real: script/frame/connect host allowlists stop an
 * injected tag from loading or exfiltrating to an attacker's origin,
 * form-action stops a rewritten form posting credentials off-site, and
 * base-uri/object-src close two classic injection vectors. Nonces are the
 * upgrade path if the app ever takes untrusted HTML.
 *
 * Hosts below are the ones the browser actually contacts: GA4 + Clarity
 * (analytics), Google identity endpoints (sign-in), and the basemap tile CDNs.
 * Server-only hosts (Gemini, Resend) are intentionally absent — CSP governs the
 * browser, not the server. img-src allows any https origin because property
 * imagery is admin-editable and may point at an external CDN; images cannot
 * execute, so that is the cheap end of the trade.
 */
const csp = [
  "default-src 'self'",
  // www.google.com / www.gstatic.com / recaptcha.google.com: the invisible
  // reCAPTCHA Firebase requires for phone (SMS OTP) sign-in.
  "script-src 'self' 'unsafe-inline' https://www.googletagmanager.com https://www.google-analytics.com https://*.clarity.ms https://apis.google.com https://www.google.com https://www.gstatic.com https://recaptcha.google.com",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  "connect-src 'self' https://*.google-analytics.com https://*.analytics.google.com https://*.googletagmanager.com https://*.clarity.ms https://*.bing.com https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://firestore.googleapis.com https://www.googleapis.com https://www.google.com https://recaptcha.google.com",
  "frame-src 'self' https://accounts.google.com https://*.firebaseapp.com https://www.google.com https://recaptcha.google.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
  'upgrade-insecure-requests',
].join('; ');

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
  // Force HTTPS for two years incl. subdomains so a first request can't be
  // downgraded to HTTP and MITM'd. `preload` opts into the browser HSTS list.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'Content-Security-Policy', value: csp },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false, // don't advertise the framework/version
  // The platform image optimizer is unavailable on this plan (it returned 402),
  // but `unoptimized: true` meant no srcset either — a 1600px render was being
  // downloaded into a 224px card on mobile. Instead, responsive sizes are
  // generated at build time by `npm run optimize:images:write` and this loader
  // selects among them, so srcset works with no runtime optimizer at all.
  images: {
    loader: 'custom',
    loaderFile: './lib/image-loader.ts',
    deviceSizes: [400, 800, 1200],
    imageSizes: [400, 800],
  },
  async headers() {
    return [{ source: '/(.*)', headers: securityHeaders }];
  },
};

export default nextConfig;
