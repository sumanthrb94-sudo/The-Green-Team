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
  return <MapClient />;
}
