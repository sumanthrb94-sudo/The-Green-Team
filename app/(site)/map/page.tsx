import type { Metadata } from 'next';
import { MapClient } from './MapClient';
import { SITE_URL } from '@/lib/data/contact';

export const metadata: Metadata = {
  title: 'Sanctuary Map — Live AQI, Forests & the RRR Corridor',
  description:
    'The environmental-intelligence map of Hyderabad: live AQI field, reserve forests and protected lakes, ORR and RRR alignments, hazard zones, and the three curated sanctuaries.',
  alternates: { canonical: `${SITE_URL}/map` },
};

export default function MapPage() {
  return (
    <>
      {/* The map UI is entirely client-rendered with no heading; give the page
          a real, crawlable h1 without changing the visual design. */}
      <h1 className="sr-only">
        Sanctuary Map — Live Air Quality, Forests and the RRR Corridor around Hyderabad
      </h1>
      <MapClient />
    </>
  );
}
