import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
  // Force HTTPS for two years incl. subdomains so a first request can't be
  // downgraded to HTTP and MITM'd. `preload` opts into the browser HSTS list.
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  // A full Content-Security-Policy is the remaining hardening step. It is left
  // for a dedicated pass because it must carry nonces/hashes for the inline
  // JSON-LD + theme script and allowlist GA and the map-tile CDNs; a wrong CSP
  // silently breaks the map and analytics, and the app has no known XSS today.
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
