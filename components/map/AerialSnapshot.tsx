'use client';

/**
 * Aerial snapshot: Esri World Imagery stitched onto a canvas around a
 * sanctuary, with its plot layout, distance rings and the real places nearby
 * pinned and labelled — then saved as a PNG to share.
 *
 * Drawn straight onto a <canvas> (not Leaflet) so the export is exactly what
 * is on screen, at a fixed share-friendly size. Esri serves its tiles with
 * CORS headers, so the canvas stays exportable.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import type { LatLng } from '@/lib/data/map';
import { distanceKm, type AerialScene } from '@/lib/data/aerial-scenes';
import { SITE_LAYOUTS, geoPlots, PLOT_STATUS_COLOR } from '@/lib/data/site-layouts';

const TILE = 256;
// Both Esri basemaps are keyless and CORS-enabled, so the canvas stays exportable.
const BASEMAPS = {
  satellite: {
    label: 'Satellite',
    service: 'World_Imagery',
    credit: 'Imagery © Esri, Maxar, Earthstar Geographics',
  },
  map: {
    label: 'Map',
    service: 'World_Street_Map',
    credit: 'Map © Esri, HERE, Garmin, OpenStreetMap contributors',
  },
} as const;
type Basemap = keyof typeof BASEMAPS;
const tileUrl = (b: Basemap, z: number, x: number, y: number) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/${BASEMAPS[b].service}/MapServer/tile/${z}/${y}/${x}`;

const FORMATS = {
  landscape: { label: 'Landscape 16:10', w: 1600, h: 1000 },
  portrait: { label: 'Portrait 4:5', w: 1080, h: 1350 },
  square: { label: 'Square', w: 1080, h: 1080 },
} as const;
type Format = keyof typeof FORMATS;

const GOLD = '#c8a951';
const INK = '#0a1208';
const TEAL = '#2dd4bf';

/** Web Mercator world pixel at zoom z. */
function project([lat, lng]: LatLng, z: number) {
  const s = TILE * 2 ** z;
  const sin = Math.sin((lat * Math.PI) / 180);
  return {
    x: ((lng + 180) / 360) * s,
    y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * s,
  };
}

function loadImage(src: string): Promise<HTMLImageElement | null> {
  return new Promise(resolve => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

type Rect = { x: number; y: number; w: number; h: number };
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Draws the whole snapshot into a fresh off-screen canvas. */
async function render(scene: AerialScene, format: Format, basemap: Basemap): Promise<{ canvas: HTMLCanvasElement; missing: number }> {
  const { w: W, h: H } = FORMATS[format];
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const css = getComputedStyle(document.body);
  const display = `${css.getPropertyValue('--font-manrope').trim() || 'Manrope'}, system-ui, sans-serif`;
  const body = `${css.getPropertyValue('--font-inter').trim() || 'Inter'}, system-ui, sans-serif`;

  // Frame: the site plus every place, with room for labels, header and footer.
  // keep the inner ring whole: add its north/south/east/west points to the frame
  const r0 = Math.min(...scene.ringsKm) * 1.08;
  const dLat = r0 / 110.95;
  const dLng = r0 / (111.32 * Math.cos((scene.site[0] * Math.PI) / 180));
  const ringPts: LatLng[] = [
    [scene.site[0] + dLat, scene.site[1]], [scene.site[0] - dLat, scene.site[1]],
    [scene.site[0], scene.site[1] + dLng], [scene.site[0], scene.site[1] - dLng],
  ];
  const pts = [scene.site, ...scene.places.map(p => p.at), ...ringPts];
  const ref = pts.map(p => project(p, 0));
  const minX = Math.min(...ref.map(p => p.x)), maxX = Math.max(...ref.map(p => p.x));
  const minY = Math.min(...ref.map(p => p.y)), maxY = Math.max(...ref.map(p => p.y));
  const padX = W * 0.16, padTop = H * 0.2, padBottom = H * 0.14;
  const fitZ = Math.min(
    Math.log2((W - 2 * padX) / Math.max(maxX - minX, 1e-9)),
    Math.log2((H - padTop - padBottom) / Math.max(maxY - minY, 1e-9)),
    17,
  );
  const tz = Math.min(18, Math.ceil(fitZ));
  const k = 2 ** (fitZ - tz); // tile-pixel → canvas-pixel
  const mid = project([(Math.max(...pts.map(p => p[0])) + Math.min(...pts.map(p => p[0]))) / 2,
                       (Math.max(...pts.map(p => p[1])) + Math.min(...pts.map(p => p[1]))) / 2], tz);
  // shift the frame down a little so the header card doesn't sit on pins
  const cy = H / 2 + (padTop - padBottom) / 2;
  const toCanvas = (ll: LatLng) => {
    const p = project(ll, tz);
    return { x: W / 2 + (p.x - mid.x) * k, y: cy + (p.y - mid.y) * k };
  };

  // Imagery
  const light = basemap === 'map';
  // text and strokes that sit straight on the basemap
  const onMap = light ? INK : '#fff';
  const onMapSoft = light ? 'rgba(10,18,8,0.7)' : 'rgba(255,255,255,0.8)';
  ctx.fillStyle = light ? '#f2efe9' : '#1b2414';
  ctx.fillRect(0, 0, W, H);
  const x0 = Math.floor((mid.x - (W / 2) / k) / TILE), x1 = Math.floor((mid.x + (W / 2) / k) / TILE);
  const y0 = Math.floor((mid.y - cy / k) / TILE), y1 = Math.floor((mid.y + (H - cy) / k) / TILE);
  const jobs: Promise<void>[] = [];
  let missing = 0;
  for (let tx = x0; tx <= x1; tx++) {
    for (let ty = y0; ty <= y1; ty++) {
      jobs.push(
        loadImage(tileUrl(basemap, tz, tx, ty)).then(img => {
          if (!img) { missing++; return; }
          const dx = W / 2 + (tx * TILE - mid.x) * k;
          const dy = cy + (ty * TILE - mid.y) * k;
          // +0.6 px overlap hides seams between tiles
          ctx.drawImage(img, dx, dy, TILE * k + 0.6, TILE * k + 0.6);
        }),
      );
    }
  }
  await Promise.all(jobs);

  // Soft grade so pins and labels read; the header and footer sit on its ends
  const shade = light ? '255,255,255' : '6,12,4';
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, `rgba(${shade},${light ? 0.92 : 0.55})`);
  g.addColorStop(0.25, `rgba(${shade},0.08)`);
  g.addColorStop(0.8, `rgba(${shade},0.08)`);
  g.addColorStop(1, `rgba(${shade},${light ? 0.92 : 0.6})`);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);

  const site = toCanvas(scene.site);
  const pxPerKm = (() => {
    const east: LatLng = [scene.site[0], scene.site[1] + 1 / (111.32 * Math.cos((scene.site[0] * Math.PI) / 180))];
    return toCanvas(east).x - site.x;
  })();
  const u = Math.min(W, H) / 1000; // type/stroke unit, so every format reads the same

  // Distance rings
  ctx.save();
  ctx.setLineDash([10 * u, 8 * u]);
  for (const km of scene.ringsKm) {
    const r = km * pxPerKm;
    ctx.strokeStyle = light ? 'rgba(10,18,8,0.5)' : 'rgba(255,255,255,0.55)';
    ctx.lineWidth = 2 * u;
    ctx.beginPath();
    ctx.arc(site.x, site.y, r, 0, Math.PI * 2);
    ctx.stroke();
    ctx.font = `700 ${15 * u}px ${body}`;
    ctx.fillStyle = onMapSoft;
    ctx.textAlign = 'center';
    // below the ring: above it is where the site's name card sits
    ctx.fillText(`${km} km`, site.x, site.y + r + 20 * u);
  }
  ctx.restore();

  // Site plot layout, when the venture has one
  const layout = scene.layoutId ? SITE_LAYOUTS[scene.layoutId] : undefined;
  if (layout) {
    for (const p of geoPlots(layout)) {
      ctx.beginPath();
      p.corners.forEach((c, i) => {
        const q = toCanvas(c);
        if (i) ctx.lineTo(q.x, q.y); else ctx.moveTo(q.x, q.y);
      });
      ctx.closePath();
      ctx.fillStyle = p.status === 'sold' ? 'rgba(31,41,55,0.75)' : `${PLOT_STATUS_COLOR.available}99`;
      ctx.fill();
      ctx.strokeStyle = '#000';
      ctx.lineWidth = Math.max(1, 1.2 * u);
      ctx.stroke();
    }
  }

  // Nearby places, nearest first so the closest get the best label spots
  const taken: Rect[] = [];
  const places = [...scene.places]
    .map(p => ({ ...p, km: distanceKm(scene.site, p.at), pt: toCanvas(p.at) }))
    .sort((a, b) => a.km - b.km);

  // reserve the site's own card first
  const siteCardW = 300 * u, siteCardH = 64 * u;
  const siteCard: Rect = { x: site.x - siteCardW / 2, y: site.y - 70 * u - siteCardH, w: siteCardW, h: siteCardH };
  taken.push(siteCard, { x: site.x - 24 * u, y: site.y - 70 * u, w: 48 * u, h: 76 * u });

  for (const p of places) {
    const r = 7 * u;
    const residential = p.group === 'residential';
    ctx.beginPath();
    if (residential) ctx.arc(p.pt.x, p.pt.y, r * 1.15, 0, Math.PI * 2);
    else ctx.rect(p.pt.x - r, p.pt.y - r, 2 * r, 2 * r);
    ctx.fillStyle = residential ? TEAL : '#fff';
    ctx.fill();
    ctx.lineWidth = 3 * u;
    ctx.strokeStyle = INK;
    ctx.stroke();

    const kmText = p.km < 1 ? `${Math.round(p.km * 1000)} m` : `${p.km.toFixed(1)} km`;
    ctx.font = `700 ${17 * u}px ${display}`;
    const nameW = ctx.measureText(p.name).width;
    ctx.font = `500 ${13 * u}px ${body}`;
    const subW = ctx.measureText(`${p.kind} · ${kmText}`).width;
    const bw = Math.max(nameW, subW) + 24 * u, bh = 50 * u;
    const gap = 14 * u;
    const candidates: Rect[] = [];
    // nearest spots first, then further out (those get a leader line)
    for (const d of [gap, gap + 60 * u, gap + 130 * u]) {
      candidates.push(
        { x: p.pt.x + d, y: p.pt.y - bh / 2, w: bw, h: bh },
        { x: p.pt.x - d - bw, y: p.pt.y - bh / 2, w: bw, h: bh },
        { x: p.pt.x - bw / 2, y: p.pt.y + d, w: bw, h: bh },
        { x: p.pt.x - bw / 2, y: p.pt.y - d - bh, w: bw, h: bh },
        { x: p.pt.x + d * 0.7, y: p.pt.y + d * 0.7, w: bw, h: bh },
        { x: p.pt.x - d * 0.7 - bw, y: p.pt.y + d * 0.7, w: bw, h: bh },
      );
    }
    const inside = (b: Rect) => b.x > 8 && b.y > H * 0.16 && b.x + b.w < W - 8 && b.y + b.h < H - 70 * u;
    // a leader line must not run through someone else's label
    const leaderClear = (b: Rect) => {
      const ex = Math.max(b.x, Math.min(p.pt.x, b.x + b.w));
      const ey = Math.max(b.y, Math.min(p.pt.y, b.y + b.h));
      for (let t = 0.05; t < 1; t += 0.05) {
        const q = { x: p.pt.x + (ex - p.pt.x) * t, y: p.pt.y + (ey - p.pt.y) * t, w: 1, h: 1 };
        if (taken.some(r => overlaps(r, q))) return false;
      }
      return true;
    };
    const box =
      candidates.find(b => inside(b) && !taken.some(t => overlaps(t, b)) && leaderClear(b)) ??
      candidates.find(b => inside(b) && !taken.some(t => overlaps(t, b))) ??
      candidates[0];
    taken.push(box);

    // leader line when the label sits away from its dot
    const nx = Math.max(box.x, Math.min(p.pt.x, box.x + box.w));
    const ny = Math.max(box.y, Math.min(p.pt.y, box.y + box.h));
    if (Math.hypot(nx - p.pt.x, ny - p.pt.y) > gap + 4 * u) {
      ctx.beginPath();
      ctx.moveTo(p.pt.x, p.pt.y);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = light ? 'rgba(10,18,8,0.75)' : 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 2 * u;
      ctx.stroke();
    }

    roundRect(ctx, box.x, box.y, box.w, box.h, 10 * u);
    ctx.fillStyle = 'rgba(10,18,8,0.86)';
    ctx.fill();
    if (residential) {
      ctx.strokeStyle = TEAL;
      ctx.lineWidth = 1.5 * u;
      ctx.stroke();
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = `700 ${17 * u}px ${display}`;
    ctx.fillText(p.name, box.x + 12 * u, box.y + 21 * u);
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.font = `500 ${13 * u}px ${body}`;
    ctx.fillText(`${p.kind} · `, box.x + 12 * u, box.y + 40 * u);
    const kindW = ctx.measureText(`${p.kind} · `).width;
    ctx.fillStyle = GOLD;
    ctx.font = `700 ${13 * u}px ${body}`;
    ctx.fillText(kmText, box.x + 12 * u + kindW, box.y + 40 * u);
  }

  // The site: gold pin + name card
  ctx.save();
  ctx.translate(site.x, site.y);
  ctx.scale(u * 1.6, u * 1.6);
  ctx.shadowColor = 'rgba(0,0,0,0.55)';
  ctx.shadowBlur = 10;
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.bezierCurveTo(-4, -10, -16, -20, -16, -31);
  ctx.arc(0, -31, 16, Math.PI, 0);
  ctx.bezierCurveTo(16, -20, 4, -10, 0, 0);
  ctx.closePath();
  ctx.fillStyle = GOLD;
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.lineWidth = 2.5;
  ctx.strokeStyle = '#fff';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(0, -31, 6, 0, Math.PI * 2);
  ctx.fillStyle = INK;
  ctx.fill();
  ctx.restore();

  roundRect(ctx, siteCard.x, siteCard.y, siteCard.w, siteCard.h, 12 * u);
  ctx.fillStyle = GOLD;
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.font = `800 ${24 * u}px ${display}`;
  ctx.fillText(scene.title, site.x, siteCard.y + 30 * u);
  ctx.font = `600 ${13 * u}px ${body}`;
  ctx.fillText(scene.siteTag ?? 'YOUR SANCTUARY', site.x, siteCard.y + 50 * u);

  // Header
  ctx.textAlign = 'left';
  ctx.fillStyle = onMap;
  ctx.font = `800 ${40 * u}px ${display}`;
  ctx.fillText(`What's around ${scene.title.replace('MODCON ', '')}`, 40 * u, 66 * u);
  ctx.fillStyle = onMapSoft;
  ctx.font = `500 ${18 * u}px ${body}`;
  ctx.fillText(scene.subtitle, 40 * u, 98 * u);

  // Legend, only when the scene mixes residential projects with landmarks
  const nRes = scene.places.filter(p => p.group === 'residential').length;
  if (nRes) {
    let lx = 40 * u;
    const ly = 126 * u;
    ctx.font = `600 ${14 * u}px ${body}`;
    for (const [res, text] of [[true, `Residential projects (${nRes})`], [false, 'Landmarks']] as const) {
      ctx.beginPath();
      if (res) ctx.arc(lx + 7 * u, ly - 5 * u, 7 * u, 0, Math.PI * 2);
      else ctx.rect(lx + 1 * u, ly - 11 * u, 12 * u, 12 * u);
      ctx.fillStyle = res ? TEAL : '#fff';
      ctx.fill();
      ctx.lineWidth = 2 * u;
      ctx.strokeStyle = INK;
      ctx.stroke();
      ctx.fillStyle = onMap;
      ctx.fillText(text, lx + 22 * u, ly);
      lx += 22 * u + ctx.measureText(text).width + 28 * u;
    }
  }

  // Footer: brand, scale bar, north, attribution
  ctx.fillStyle = onMap;
  ctx.font = `800 ${18 * u}px ${display}`;
  ctx.fillText('THE GREEN TEAM', 40 * u, H - 38 * u);
  ctx.fillStyle = onMapSoft;
  ctx.font = `500 ${11 * u}px ${body}`;
  ctx.fillText(`${BASEMAPS[basemap].credit} · straight-line distances`, 40 * u, H - 18 * u);

  const barKm = pxPerKm > 120 * u ? 1 : 2;
  const barPx = barKm * pxPerKm;
  const bx = W - 40 * u - barPx, by = H - 34 * u;
  ctx.fillStyle = onMap;
  ctx.fillRect(bx, by, barPx, 4 * u);
  ctx.fillRect(bx, by - 6 * u, 2 * u, 10 * u);
  ctx.fillRect(bx + barPx - 2 * u, by - 6 * u, 2 * u, 10 * u);
  ctx.textAlign = 'right';
  ctx.font = `700 ${13 * u}px ${body}`;
  ctx.fillText(`${barKm} km`, W - 40 * u, by - 10 * u);

  const nx = W - 50 * u, ny = 60 * u;
  ctx.beginPath();
  ctx.moveTo(nx, ny - 22 * u);
  ctx.lineTo(nx + 10 * u, ny + 8 * u);
  ctx.lineTo(nx, ny + 2 * u);
  ctx.lineTo(nx - 10 * u, ny + 8 * u);
  ctx.closePath();
  ctx.fillStyle = onMap;
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.font = `800 ${14 * u}px ${display}`;
  ctx.fillText('N', nx, ny + 28 * u);

  return { canvas, missing };
}

export function AerialSnapshot({ scene }: { scene: AerialScene }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [format, setFormat] = useState<Format>('landscape');
  const [basemap, setBasemap] = useState<Basemap>('satellite');
  const [state, setState] = useState<'drawing' | 'ready' | 'no-imagery'>('drawing');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setState('drawing');
    setSaveError('');
    document.fonts.ready
      .then(() => render(scene, format, basemap))
      .then(({ canvas, missing }) => {
        // only the latest render reaches the screen
        const shown = canvasRef.current;
        if (cancelled || !shown) return;
        shown.width = canvas.width;
        shown.height = canvas.height;
        shown.getContext('2d')!.drawImage(canvas, 0, 0);
        setState(missing > 0 ? 'no-imagery' : 'ready');
      });
    return () => {
      cancelled = true;
    };
  }, [scene, format, basemap]);

  const download = useCallback(() => {
    setSaveError('');
    try {
      canvasRef.current!.toBlob(blob => {
        if (!blob) return setSaveError('Could not create the image. Reload the page and try again.');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `${scene.id}-${basemap}-${format}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      }, 'image/png');
    } catch {
      setSaveError('The satellite imagery blocked saving. Take a screenshot of the image instead.');
    }
  }, [scene.id, format, basemap]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(Object.keys(BASEMAPS) as Basemap[]).map(b => (
          <button
            key={b}
            onClick={() => setBasemap(b)}
            className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
              basemap === b ? 'bg-[#c8a951] text-[#0a1208] border-[#c8a951]' : 'border-outline/30 text-on-surface/70'
            }`}
          >
            {BASEMAPS[b].label}
          </button>
        ))}
        <span className="w-px h-6 bg-outline/20 mx-1" />
        {(Object.keys(FORMATS) as Format[]).map(f => (
          <button
            key={f}
            onClick={() => setFormat(f)}
            className={`px-4 py-2 rounded-full text-xs font-bold border transition-colors ${
              format === f ? 'bg-primary text-on-primary border-primary' : 'border-outline/30 text-on-surface/70'
            }`}
          >
            {FORMATS[f].label}
          </button>
        ))}
        <button
          onClick={download}
          disabled={state === 'drawing'}
          className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#c8a951] text-[#0a1208] text-xs font-extrabold disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {state === 'drawing' ? 'Loading map…' : 'Download PNG'}
        </button>
      </div>
      {state === 'no-imagery' && (
        <p className="text-sm text-tertiary">Some map tiles did not load. Check your connection and reload.</p>
      )}
      {saveError && <p className="text-sm text-tertiary">{saveError}</p>}
      <canvas
        ref={canvasRef}
        className="w-full h-auto rounded-2xl border border-outline/20 bg-[#1b2414]"
        aria-label={`Aerial view of ${scene.title} with nearby places`}
      />
    </div>
  );
}
