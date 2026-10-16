import { NextResponse } from 'next/server';

/**
 * Same-origin proxy for the Esri basemap tiles the investor slide draws onto a
 * canvas (components/map/GrowthCorridorMap.tsx).
 *
 * Loading the tiles straight from server.arcgisonline.com made the slide depend
 * on the viewer's browser being allowed to fetch them cross-origin and on Esri's
 * CORS headers; when either failed, the canvas showed labels on a blank ground.
 * Served from our own origin they always draw, never taint the canvas, and the
 * CDN caches each tile so the 4K slide's few hundred requests are cheap.
 *
 * Only these three keyless Esri layers are proxied, so this is not an open proxy.
 */
const LAYERS: Record<string, string> = {
  imagery: 'World_Imagery',
  roads: 'Reference/World_Transportation',
  street: 'World_Street_Map',
};

type Params = { layer: string; z: string; x: string; y: string };

export async function GET(_req: Request, ctx: { params: Promise<Params> }) {
  const { layer, z, x, y } = await ctx.params;
  const service = LAYERS[layer];
  const [zi, xi, yi] = [z, x, y].map(Number);
  const valid =
    service &&
    [zi, xi, yi].every(Number.isInteger) &&
    zi >= 0 && zi <= 19 &&
    xi >= 0 && yi >= 0 && xi < 2 ** zi && yi < 2 ** zi;
  if (!valid) return NextResponse.json({ error: 'bad tile' }, { status: 400 });

  const upstream = await fetch(
    `https://server.arcgisonline.com/ArcGIS/rest/services/${service}/MapServer/tile/${zi}/${yi}/${xi}`,
    { signal: AbortSignal.timeout(15000) },
  ).catch(() => null);
  if (!upstream?.ok) return NextResponse.json({ error: 'tile unavailable' }, { status: 502 });

  return new NextResponse(await upstream.arrayBuffer(), {
    headers: {
      'Content-Type': upstream.headers.get('content-type') ?? 'image/jpeg',
      // imagery changes rarely; let the CDN keep each tile for a month
      'Cache-Control': 'public, max-age=86400, s-maxage=2592000, stale-while-revalidate=86400',
    },
  });
}
