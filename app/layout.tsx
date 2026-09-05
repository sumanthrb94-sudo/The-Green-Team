import type { Metadata, Viewport } from 'next';
import { Inter, Manrope, Cormorant_Garamond } from 'next/font/google';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { Analytics } from '@/components/analytics/Analytics';
import { PageTracker } from '@/components/analytics/PageTracker';
import { SITE_URL, BUSINESS } from '@/lib/data/contact';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap' });
const manrope = Manrope({ subsets: ['latin'], variable: '--font-manrope', display: 'swap' });
const cormorant = Cormorant_Garamond({
  subsets: ['latin'],
  weight: ['300', '400', '600'],
  style: ['normal', 'italic'],
  variable: '--font-cormorant',
  display: 'swap',
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: 'Forest-Adjacent Homes and Land Near Hyderabad | The Green Team',
    template: '%s | The Green Team',
  },
  description:
    'Discover verified forest-adjacent plots, homes, and retreats near Hyderabad. Compare air, access, noise, paperwork, and development stage across curated sanctuaries including Agartha, SYL Residences, and Dates County.',
  keywords:
    'forest-adjacent homes Hyderabad, forest plots near Hyderabad, eco-friendly homes Hyderabad, MODCON Agartha, MODCON SYL Residences, Dates County, Kandukur plots, Tukkuguda residences, Narsapur forest property, RRR corridor property, verified land Hyderabad',
  authors: [{ name: BUSINESS.name }],
  robots: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  openGraph: {
    type: 'website',
    siteName: BUSINESS.name,
    locale: 'en_IN',
    url: SITE_URL,
    title: 'Forest-Adjacent Homes and Land Near Hyderabad | The Green Team',
    description:
      'Independent curators of forest-adjacent plots, homes, and retreats near Hyderabad. Compare the setting, access, air, noise, paperwork, and development stage before you visit.',
    images: [
      {
        url: `${SITE_URL}/agartha-render.jpg`,
        width: 1200,
        height: 630,
        alt: 'MODCON Agartha — forest farm estate near Hyderabad, curated by The Green Team',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Forest-Adjacent Homes Near Hyderabad | The Green Team',
    description:
      'Verified forest-adjacent plots, homes, and retreats near Hyderabad — curated by The Green Team.',
    images: [`${SITE_URL}/agartha-render.jpg`],
  },
  icons: { icon: '/favicon.svg' },
  // Set NEXT_PUBLIC_GSC_VERIFICATION to the token Search Console gives you for
  // the HTML-tag method. Omit it entirely if the property is verified by DNS.
  ...(process.env.NEXT_PUBLIC_GSC_VERIFICATION
    ? { verification: { google: process.env.NEXT_PUBLIC_GSC_VERIFICATION } }
    : {}),
  manifest: '/site.webmanifest',
  other: {
    'geo.region': 'IN-TG',
    'geo.placename': 'Hyderabad, Telangana, India',
    'geo.position': '17.3850;78.4867',
    ICBM: '17.3850, 78.4867',
  },
};

export const viewport: Viewport = {
  themeColor: '#2d3a1d',
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

const darkModeScript = `try{if(localStorage.getItem('gt_dark')==='true')document.documentElement.classList.add('dark')}catch(e){}`;

/**
 * Organisation identity for search engines. RealEstateAgent is the schema.org
 * type for a channel partner / brokerage; all values come from the single
 * BUSINESS source of truth so the structured data never drifts from the footer.
 */
const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'RealEstateAgent',
  '@id': `${SITE_URL}/#organization`,
  name: BUSINESS.name,
  description: BUSINESS.legalDescriptor,
  url: SITE_URL,
  telephone: BUSINESS.phone,
  email: BUSINESS.email,
  image: `${SITE_URL}/agartha-render.jpg`,
  logo: `${SITE_URL}/logos/modcon-logo-hires.png`,
  areaServed: `${BUSINESS.city}, ${BUSINESS.region}`,
  address: {
    '@type': 'PostalAddress',
    addressLocality: BUSINESS.city,
    addressRegion: BUSINESS.region,
    postalCode: BUSINESS.postalCode,
    addressCountry: 'IN',
  },
  geo: { '@type': 'GeoCoordinates', latitude: BUSINESS.geo.lat, longitude: BUSINESS.geo.lng },
  sameAs: [BUSINESS.instagram, BUSINESS.linkedin],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-IN"
      suppressHydrationWarning
      className={`${inter.variable} ${manrope.variable} ${cormorant.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: darkModeScript }} />
        <script
          type="application/ld+json"
          // Escape `<` so a value can't close the script tag; identifies the
          // business to search engines (name, Hyderabad NAP, geo, socials).
          dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationLd).replace(/</g, '\\u003c') }}
        />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
        <PageTracker />
      </body>
    </html>
  );
}
