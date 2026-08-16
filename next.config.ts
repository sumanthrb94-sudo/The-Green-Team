import type { NextConfig } from 'next';

const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(self)' },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
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
