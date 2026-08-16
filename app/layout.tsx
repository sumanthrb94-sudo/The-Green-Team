import type { Metadata, Viewport } from 'next';
import { Inter, Manrope, Cormorant_Garamond } from 'next/font/google';
import { AuthProvider } from '@/components/auth/AuthProvider';
import { Analytics } from '@/components/analytics/Analytics';
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
    default: 'The Green Team | Forest Homes Near Hyderabad | Agartha · SYL · Dates County',
    template: '%s | The Green Team',
  },
  description:
    'We curate forest-adjacent homes near Hyderabad — AQI under 25, 45-min city commute. Channel partners for MODCON Agartha (Narsapur), MODCON SYL Residences (Tukkuguda), and Dates County by Planet Green (Kandukur). Plots from ₹20L. Villas, apartments & plots verified.',
  keywords:
    'forest property Hyderabad, eco friendly homes Hyderabad, MODCON Agartha, MODCON SYL Residences, Dates County Planet Green, Kandukur villa plots, Tukkuguda residences, ORR Exit-14 property, farm plots near Hyderabad, Narsapur forest plots, Srisailam Highway plots, low AQI property Hyderabad, channel partner Agartha, green real estate Hyderabad, RRR corridor property',
  authors: [{ name: BUSINESS.name }],
  robots: { index: true, follow: true, 'max-snippet': -1, 'max-image-preview': 'large' },
  openGraph: {
    type: 'website',
    siteName: BUSINESS.name,
    locale: 'en_IN',
    url: SITE_URL,
    title: 'The Green Team | Forest Homes Near Hyderabad | From ₹20L',
    description:
      'Independent channel partners who curate forest-adjacent homes near Hyderabad. AQI 12, 18 dB noise, under 45-min commute. Three sanctuaries — verified before we show you.',
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
    title: 'The Green Team | Forest Homes Near Hyderabad',
    description:
      'We curate forest-adjacent homes near Hyderabad — AQI 12, 18 dB noise, 45-min commute. Channel partners for MODCON Agartha, SYL Residences, and Dates County.',
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en-IN"
      suppressHydrationWarning
      className={`${inter.variable} ${manrope.variable} ${cormorant.variable}`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: darkModeScript }} />
      </head>
      <body>
        <AuthProvider>{children}</AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
