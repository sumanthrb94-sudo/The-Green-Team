'use client';

import dynamic from 'next/dynamic';
import { preconnect } from 'react-dom';

const SanctuaryMap = dynamic(() => import('@/components/map/SanctuaryMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[calc(100dvh-3.5rem)] md:h-[calc(100svh-3.5rem)] bg-[#0a1208] flex items-center justify-center">
      <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-white/40">Loading map…</p>
    </div>
  ),
});

export function MapClient() {
  // The default basemap and its labels come straight from Esri. Opening that
  // connection while the map code is still downloading takes the DNS, TCP and
  // TLS round trips off the first tile.
  preconnect('https://server.arcgisonline.com');
  return <SanctuaryMap />;
}
