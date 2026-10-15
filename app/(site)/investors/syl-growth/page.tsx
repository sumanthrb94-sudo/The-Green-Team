import type { Metadata } from 'next';
import { GrowthCorridorMap } from '@/components/map/GrowthCorridorMap';

export const metadata: Metadata = {
  title: 'MODCON SYL — Growth Corridors',
  // a slide for investor meetings, not a page for search
  robots: { index: false, follow: false },
};

export default function SylGrowthPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-6">
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-on-surface/60">Investor brief</p>
        <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface">
          MODCON SYL and South Hyderabad&rsquo;s growth corridors
        </h1>
        <p className="text-sm text-on-surface/70 max-w-2xl">
          Satellite view of SYL with the established residential projects around it, the growth hubs, ORR and Srisailam
          Highway, and the planned radial road and metro to Bharat Future City. Switch to the road map if you prefer,
          then download the 1920×1080 PNG for the deck.
        </p>
      </header>
      <GrowthCorridorMap />
    </div>
  );
}
