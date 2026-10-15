import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { AERIAL_SCENES } from '@/lib/data/aerial-scenes';
import { AerialSnapshot } from '@/components/map/AerialSnapshot';

type Props = { params: Promise<{ id: string }> };

export function generateStaticParams() {
  return Object.keys(AERIAL_SCENES).map(id => ({ id }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const scene = AERIAL_SCENES[id];
  return {
    title: scene ? `${scene.title} — Aerial View` : 'Aerial View',
    // a sales tool for the team, not a page for search
    robots: { index: false, follow: false },
  };
}

export default async function AerialPage({ params }: Props) {
  const { id } = await params;
  const scene = AERIAL_SCENES[id];
  if (!scene) notFound();
  return (
    <main className="max-w-6xl mx-auto px-4 md:px-8 py-8 md:py-12 space-y-6">
      <header className="space-y-2">
        <p className="text-[10px] uppercase tracking-[0.4em] font-bold text-on-surface/60">Aerial view</p>
        <h1 className="font-headline text-3xl md:text-4xl font-extrabold text-on-surface">{scene.title}</h1>
        <p className="text-sm text-on-surface/70 max-w-2xl">
          Satellite view of {scene.subtitle} with the places around it and straight-line distances. Pick a size and
          download the PNG to share.
        </p>
      </header>
      <AerialSnapshot scene={scene} />
    </main>
  );
}
