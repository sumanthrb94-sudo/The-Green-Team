'use client';

import dynamic from 'next/dynamic';

const SanctuaryMap = dynamic(() => import('@/components/map/SanctuaryMap'), {
  ssr: false,
  loading: () => (
    <div className="h-[calc(100dvh-3.5rem)] md:h-[calc(100svh-3.5rem)] bg-[#0a1208] flex items-center justify-center">
      <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-white/40">Loading map…</p>
    </div>
  ),
});

export function MapClient() {
  return <SanctuaryMap />;
}
