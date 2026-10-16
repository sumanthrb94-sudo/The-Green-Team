'use client';

/**
 * Investor slide of SYL and South Hyderabad's growth corridors: Esri imagery
 * stitched onto a 1920×1080 canvas, with the residential projects around SYL,
 * the growth hubs, the planned radial road and metro, and a summary panel.
 *
 * Drawn on a <canvas> so the PNG download is exactly what is on screen. Esri
 * serves its tiles with CORS headers, so the canvas stays exportable.
 */
import { useCallback, useEffect, useRef, useState } from 'react';
import { Download } from 'lucide-react';
import type { LatLng } from '@/lib/data/map';
import {
  SYL_SITE,
  GROWTH_PLACES,
  GROWTH_CORRIDORS,
  ROAD_TAGS,
  distanceKm,
  type GrowthPlace,
} from '@/lib/data/syl-growth-map';

const W = 1920;
const H = 1080;
const PANEL = 620; // width of the summary panel on the left
const TILE = 256;

const BASEMAPS = {
  satellite: {
    label: 'Satellite',
    services: ['World_Imagery', 'Reference/World_Transportation'],
    credit: 'Imagery © Esri, Maxar, Earthstar Geographics · Roads © Esri, HERE, Garmin',
  },
  map: {
    label: 'Road map',
    services: ['World_Street_Map'],
    credit: 'Map © Esri, HERE, Garmin, OpenStreetMap contributors',
  },
} as const;
type Basemap = keyof typeof BASEMAPS;
const tileUrl = (service: string, z: number, x: number, y: number) =>
  `https://server.arcgisonline.com/ArcGIS/rest/services/${service}/MapServer/tile/${z}/${y}/${x}`;

const GOLD = '#c8a951';
const INK = '#0a1208';
const TEAL = '#2dd4bf';
const METRO = '#c4b5fd';

type Pt = { x: number; y: number };
type Rect = { x: number; y: number; w: number; h: number };
const overlaps = (a: Rect, b: Rect) => a.x < b.x + b.w && b.x < a.x + a.w && a.y < b.y + b.h && b.y < a.y + a.h;

/** Web Mercator world pixel at zoom z. */
function project([lat, lng]: LatLng, z: number): Pt {
  const s = TILE * 2 ** z;
  const sin = Math.sin((lat * Math.PI) / 180);
  return { x: ((lng + 180) / 360) * s, y: (0.5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)) * s };
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

function roundRect(ctx: CanvasRenderingContext2D, r: Rect, radius: number) {
  ctx.beginPath();
  ctx.roundRect(r.x, r.y, r.w, r.h, radius);
}

/** Splits text into lines no wider than maxW at the current font. */
function wrap(ctx: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const lines: string[] = [];
  let line = '';
  for (const word of text.split(' ')) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxW) {
      lines.push(line);
      line = word;
    } else line = next;
  }
  if (line) lines.push(line);
  return lines;
}

const fmtKm = (km: number) => (km < 10 ? km.toFixed(1) : Math.round(km).toString());

async function render(basemap: Basemap): Promise<{ canvas: HTMLCanvasElement; missing: number }> {
  const canvas = document.createElement('canvas');
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext('2d')!;
  const css = getComputedStyle(document.documentElement);
  const display = `${css.getPropertyValue('--font-manrope').trim() || 'Manrope'}, system-ui, sans-serif`;
  const body = `${css.getPropertyValue('--font-inter').trim() || 'Inter'}, system-ui, sans-serif`;

  // ── Frame: everything that fits, centred in the area right of the panel ──
  const framed = [SYL_SITE, ...GROWTH_PLACES.filter(p => p.inFrame !== false).map(p => p.at)];
  const ref = framed.map(p => project(p, 0));
  const minX = Math.min(...ref.map(p => p.x)), maxX = Math.max(...ref.map(p => p.x));
  const minY = Math.min(...ref.map(p => p.y)), maxY = Math.max(...ref.map(p => p.y));
  const area = { x0: PANEL + 150, x1: W - 170, y0: 110, y1: H - 120 };
  const fitZ = Math.min(
    Math.log2((area.x1 - area.x0) / (maxX - minX)),
    Math.log2((area.y1 - area.y0) / (maxY - minY)),
    15,
  );
  const tz = Math.min(17, Math.ceil(fitZ));
  const k = 2 ** (fitZ - tz); // tile pixel → canvas pixel
  const mid = { x: ((minX + maxX) / 2) * 2 ** tz, y: ((minY + maxY) / 2) * 2 ** tz };
  const cx = (area.x0 + area.x1) / 2, cy = (area.y0 + area.y1) / 2;
  const toCanvas = (ll: LatLng): Pt => {
    const p = project(ll, tz);
    return { x: cx + (p.x - mid.x) * k, y: cy + (p.y - mid.y) * k };
  };

  // ── Imagery ──
  const light = basemap === 'map';
  ctx.fillStyle = light ? '#f2efe9' : '#1b2414';
  ctx.fillRect(0, 0, W, H);
  const x0 = Math.floor((mid.x - cx / k) / TILE), x1 = Math.floor((mid.x + (W - cx) / k) / TILE);
  const y0 = Math.floor((mid.y - cy / k) / TILE), y1 = Math.floor((mid.y + (H - cy) / k) / TILE);
  let missing = 0;
  for (const service of BASEMAPS[basemap].services) {
    const jobs: Promise<void>[] = [];
    for (let tx = x0; tx <= x1; tx++) {
      for (let ty = y0; ty <= y1; ty++) {
        jobs.push(
          loadImage(tileUrl(service, tz, tx, ty)).then(img => {
            if (!img) { missing++; return; }
            // +0.6 px overlap hides seams between tiles
            ctx.drawImage(img, cx + (tx * TILE - mid.x) * k, cy + (ty * TILE - mid.y) * k, TILE * k + 0.6, TILE * k + 0.6);
          }),
        );
      }
    }
    // layers stack in order: imagery first, road overlay on top
    await Promise.all(jobs);
  }

  // Grade the imagery so labels read
  ctx.fillStyle = light ? 'rgba(255,255,255,0.12)' : 'rgba(6,12,4,0.28)';
  ctx.fillRect(0, 0, W, H);

  const site = toCanvas(SYL_SITE);
  const pxPerKm = toCanvas([SYL_SITE[0], SYL_SITE[1] + 1 / (111.32 * Math.cos((SYL_SITE[0] * Math.PI) / 180))]).x - site.x;
  const onMap = light ? INK : '#fff';
  const onMapSoft = light ? 'rgba(10,18,8,0.7)' : 'rgba(255,255,255,0.78)';

  // ── Distance rings ──
  ctx.save();
  ctx.setLineDash([10, 9]);
  ctx.lineWidth = 2;
  ctx.strokeStyle = light ? 'rgba(10,18,8,0.45)' : 'rgba(255,255,255,0.5)';
  ctx.font = `700 15px ${body}`;
  ctx.fillStyle = onMapSoft;
  ctx.textAlign = 'center';
  for (const km of [5, 10, 15]) {
    const r = km * pxPerKm;
    ctx.beginPath();
    ctx.arc(site.x, site.y, r, 0, Math.PI * 2);
    ctx.stroke();
    // label on the lower-left of the ring, clear of the corridors to the east
    const a = (Math.PI * 3) / 4;
    ctx.fillText(`${km} km`, site.x + Math.cos(a) * r, site.y + Math.sin(a) * r + 5);
  }
  ctx.restore();

  // ── Corridors ──
  const taken: Rect[] = [];
  const corridorLabels: { text: string; detail: string; color: string; dashed: number[]; at: Pt }[] = [];
  for (const c of GROWTH_CORRIDORS) {
    const pts = c.path.map(toCanvas);
    const metro = c.style === 'metro';
    // the metro runs in the radial road's median: offset it so both lines show
    const off = metro ? 9 : 0;
    const segs = pts.slice(1).map((b, i) => {
      const a = pts[i];
      const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
      const nx = (-(b.y - a.y) / len) * off, ny = ((b.x - a.x) / len) * off;
      return [{ x: a.x + nx, y: a.y + ny }, { x: b.x + nx, y: b.y + ny }] as const;
    });
    const color = metro ? METRO : GOLD;
    const dashed = metro ? [3, 9] : [22, 12];
    for (const pass of ['halo', 'line'] as const) {
      ctx.beginPath();
      segs.forEach(([a, b], i) => {
        if (i === 0) ctx.moveTo(a.x, a.y);
        else ctx.lineTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
      });
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      if (pass === 'halo') {
        ctx.setLineDash([]);
        ctx.strokeStyle = 'rgba(10,18,8,0.55)';
        ctx.lineWidth = metro ? 9 : 13;
      } else {
        ctx.setLineDash(dashed);
        ctx.strokeStyle = color;
        ctx.lineWidth = metro ? 5 : 7;
      }
      ctx.stroke();
    }
    ctx.setLineDash([]);
    const [a, b] = segs[c.labelSegment];
    corridorLabels.push({ text: c.name, detail: c.detail, color, dashed, at: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } });
  }

  // ── Places ──
  const all = GROWTH_PLACES.map(p => ({ ...p, km: distanceKm(SYL_SITE, p.at), pt: toCanvas(p.at) }));
  const mapRect: Rect = { x: PANEL + 110, y: 20, w: W - PANEL - 130, h: H - 40 };
  const inside = (r: Rect) => r.x > mapRect.x && r.y > mapRect.y && r.x + r.w < mapRect.x + mapRect.w && r.y + r.h < mapRect.y + mapRect.h - 40;

  // SYL's own card and pin take their space first
  const siteCard: Rect = { x: site.x - 150, y: site.y - 132, w: 300, h: 64 };
  taken.push(siteCard, { x: site.x - 26, y: site.y - 70, w: 52, h: 76 });

  const marker = (p: GrowthPlace & { pt: Pt }) => {
    const { x, y } = p.pt;
    ctx.beginPath();
    if (p.kind === 'residential') ctx.arc(x, y, 7.5, 0, Math.PI * 2);
    else if (p.kind === 'hub') {
      ctx.moveTo(x, y - 11);
      ctx.lineTo(x + 11, y);
      ctx.lineTo(x, y + 11);
      ctx.lineTo(x - 11, y);
      ctx.closePath();
    } else ctx.rect(x - 7, y - 7, 14, 14);
    ctx.fillStyle = p.kind === 'residential' ? TEAL : p.kind === 'hub' ? GOLD : '#fff';
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = INK;
    ctx.stroke();
    taken.push({ x: x - 11, y: y - 11, w: 22, h: 22 });
  };

  const inFrame = all.filter(p => p.inFrame !== false);
  inFrame.forEach(marker);

  const leaders: [Pt, Pt][] = [];
  const crosses = (a: Pt, b: Pt, c: Pt, d: Pt) => {
    const o = (p: Pt, q: Pt, r: Pt) => Math.sign((q.x - p.x) * (r.y - p.y) - (q.y - p.y) * (r.x - p.x));
    return o(a, b, c) * o(a, b, d) < 0 && o(c, d, a) * o(c, d, b) < 0;
  };
  const segHitsRect = (a: Pt, b: Pt, r: Rect) => {
    for (let t = 0; t <= 1; t += 0.05) {
      const x = a.x + (b.x - a.x) * t, y = a.y + (b.y - a.y) * t;
      if (x > r.x && x < r.x + r.w && y > r.y && y < r.y + r.h) return true;
    }
    return false;
  };

  /** Places a two-line label near a point, avoiding everything already placed. */
  const placeLabel = (pt: Pt, w: number, h: number, spread = [16, 70, 140]): Rect => {
    const candidates: Rect[] = [];
    for (const d of spread) {
      candidates.push(
        { x: pt.x + d, y: pt.y - h / 2, w, h },
        { x: pt.x - d - w, y: pt.y - h / 2, w, h },
        { x: pt.x - w / 2, y: pt.y + d, w, h },
        { x: pt.x - w / 2, y: pt.y - d - h, w, h },
        { x: pt.x + d * 0.7, y: pt.y + d * 0.7, w, h },
        { x: pt.x - d * 0.7 - w, y: pt.y + d * 0.7, w, h },
        { x: pt.x + d * 0.7, y: pt.y - d * 0.7 - h, w, h },
        { x: pt.x - d * 0.7 - w, y: pt.y - d * 0.7 - h, w, h },
      );
    }
    const end = (b: Rect): Pt => ({
      x: Math.max(b.x, Math.min(pt.x, b.x + b.w)),
      y: Math.max(b.y, Math.min(pt.y, b.y + b.h)),
    });
    // a leader line must not run through another label, a marker or another leader
    const leaderClear = (b: Rect) => {
      const e = end(b);
      for (let t = 0.08; t < 0.95; t += 0.04) {
        const q = { x: pt.x + (e.x - pt.x) * t - 1, y: pt.y + (e.y - pt.y) * t - 1, w: 2, h: 2 };
        if (taken.some(r => overlaps(r, q))) return false;
      }
      return !leaders.some(([a, c]) => crosses(a, c, pt, e));
    };
    // ...and a label must not sit on an existing leader
    const offLeaders = (b: Rect) => !leaders.some(([a, c]) => segHitsRect(a, c, b));
    const free = (b: Rect) => inside(b) && !taken.some(t => overlaps(t, b));
    const box =
      candidates.find(b => free(b) && offLeaders(b) && leaderClear(b)) ??
      candidates.find(b => free(b) && leaderClear(b)) ??
      candidates.find(b => free(b)) ??
      candidates.find(b => !taken.some(t => overlaps(t, b))) ??
      candidates[0];
    taken.push(box);
    // leader line when the label sits away from its point
    const nx = Math.max(box.x, Math.min(pt.x, box.x + box.w));
    const ny = Math.max(box.y, Math.min(pt.y, box.y + box.h));
    if (Math.hypot(nx - pt.x, ny - pt.y) > 22) {
      leaders.push([pt, { x: nx, y: ny }]);
      ctx.beginPath();
      ctx.moveTo(pt.x, pt.y);
      ctx.lineTo(nx, ny);
      ctx.strokeStyle = light ? 'rgba(10,18,8,0.75)' : 'rgba(255,255,255,0.85)';
      ctx.lineWidth = 2;
      ctx.stroke();
    }
    return box;
  };

  const card = (box: Rect, title: string, sub: string, km: string | null, edge?: string) => {
    roundRect(ctx, box, 10);
    ctx.fillStyle = 'rgba(10,18,8,0.88)';
    ctx.fill();
    if (edge) {
      ctx.strokeStyle = edge;
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = `700 19px ${display}`;
    ctx.fillText(title, box.x + 13, box.y + 24);
    ctx.font = `500 14px ${body}`;
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    const subText = km ? `${sub} · ` : sub;
    ctx.fillText(subText, box.x + 13, box.y + 45);
    if (km) {
      const sw = ctx.measureText(subText).width;
      ctx.font = `700 14px ${body}`;
      ctx.fillStyle = GOLD;
      ctx.fillText(km, box.x + 13 + sw, box.y + 45);
    }
  };

  const measure = (title: string, sub: string) => {
    ctx.font = `700 19px ${display}`;
    const a = ctx.measureText(title).width;
    ctx.font = `700 14px ${body}`;
    const b = ctx.measureText(sub).width;
    return Math.max(a, b) + 28;
  };

  // Hubs and landmarks get their own cards, nearest first
  for (const p of inFrame.filter(p => p.kind !== 'residential').sort((a, b) => a.km - b.km)) {
    const km = `${fmtKm(p.km)} km`;
    const w = measure(p.name, `${p.note} · ${km}`);
    const box = placeLabel(p.pt, w, 56);
    card(box, p.name, p.note, km, p.kind === 'hub' ? GOLD : undefined);
  }

  // Road and corridor tags
  for (const t of ROAD_TAGS) {
    const pt = toCanvas(t.at);
    ctx.font = `700 14px ${body}`;
    const w = ctx.measureText(t.text).width + 22;
    const box = placeLabel(pt, w, 28, [10, 40, 80]);
    roundRect(ctx, box, 14);
    ctx.fillStyle = 'rgba(255,255,255,0.92)';
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.textAlign = 'left';
    ctx.fillText(t.text, box.x + 11, box.y + 19);
  }
  for (const c of corridorLabels) {
    const w = measure(c.text, c.detail) + 44;
    const box = placeLabel(c.at, w, 56, [24, 80, 160]);
    roundRect(ctx, box, 10);
    ctx.fillStyle = 'rgba(10,18,8,0.88)';
    ctx.fill();
    ctx.strokeStyle = c.color;
    ctx.lineWidth = 1.5;
    ctx.stroke();
    // line swatch
    ctx.beginPath();
    ctx.moveTo(box.x + 13, box.y + 28);
    ctx.lineTo(box.x + 43, box.y + 28);
    ctx.setLineDash(c.dashed.map(d => d * 0.6));
    ctx.strokeStyle = c.color;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = `700 19px ${display}`;
    ctx.fillText(c.text, box.x + 55, box.y + 24);
    ctx.font = `500 14px ${body}`;
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    ctx.fillText(c.detail, box.x + 55, box.y + 45);
  }

  // Residential projects: every one named, nearest first, in a compact two-line label
  const res = inFrame.filter(p => p.kind === 'residential').sort((a, b) => a.km - b.km);
  const near = res.filter(p => p.km <= 10).length;
  for (const p of res) {
    const km = `${fmtKm(p.km)} km`;
    ctx.font = `700 16px ${display}`;
    const a = ctx.measureText(p.name).width;
    ctx.font = `700 12.5px ${body}`;
    const b = ctx.measureText(`${p.note} · ${km}`).width;
    const box = placeLabel(p.pt, Math.max(a, b) + 22, 42, [12, 45, 90, 140, 200, 270]);
    roundRect(ctx, box, 8);
    ctx.fillStyle = 'rgba(10,18,8,0.88)';
    ctx.fill();
    ctx.strokeStyle = TEAL;
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.textAlign = 'left';
    ctx.fillStyle = '#fff';
    ctx.font = `700 16px ${display}`;
    ctx.fillText(p.name, box.x + 11, box.y + 19);
    ctx.font = `500 12.5px ${body}`;
    ctx.fillStyle = 'rgba(255,255,255,0.72)';
    const sub = `${p.note} · `;
    ctx.fillText(sub, box.x + 11, box.y + 35);
    const sw = ctx.measureText(sub).width;
    ctx.font = `700 12.5px ${body}`;
    ctx.fillStyle = GOLD;
    ctx.fillText(km, box.x + 11 + sw, box.y + 35);
  }

  // Places beyond the frame: chips at the bottom edge, where the corridor leading there leaves the slide
  const edgeY = mapRect.y + mapRect.h - 52;
  let stack = 0;
  for (const p of all.filter(p => p.inFrame === false).sort((a, b) => a.km - b.km)) {
    let ex = toCanvas(p.at).x;
    const via = GROWTH_CORRIDORS.find(c => c.style === 'expressway' && c.path.includes(p.at));
    if (via) {
      const pts = via.path.map(toCanvas);
      for (let i = 1; i < pts.length; i++) {
        const a = pts[i - 1], b = pts[i];
        if ((a.y - edgeY) * (b.y - edgeY) <= 0 && a.y !== b.y) {
          ex = a.x + ((edgeY - a.y) / (b.y - a.y)) * (b.x - a.x);
          break;
        }
      }
    }
    const label = `${p.name} · ${fmtKm(p.km)} km`;
    ctx.font = `700 15px ${body}`;
    const w = ctx.measureText(label).width + 48;
    // chips sit to the left of the road so the dashed line stays visible
    const box: Rect = { x: Math.min(ex - w - 16, W - 40 - w), y: edgeY - stack * 40, w, h: 32 };
    stack++;
    roundRect(ctx, box, 16);
    ctx.fillStyle = 'rgba(255,255,255,0.94)';
    ctx.fill();
    ctx.fillStyle = INK;
    ctx.textAlign = 'left';
    ctx.fillText(label, box.x + 36, box.y + 21);
    ctx.beginPath();
    ctx.moveTo(box.x + 22, box.y + 24);
    ctx.lineTo(box.x + 15, box.y + 14);
    ctx.lineTo(box.x + 29, box.y + 14);
    ctx.closePath();
    ctx.fill();
  }

  // ── SYL pin and card ──
  ctx.save();
  ctx.translate(site.x, site.y);
  ctx.scale(1.7, 1.7);
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
  roundRect(ctx, siteCard, 12);
  ctx.fillStyle = GOLD;
  ctx.fill();
  ctx.fillStyle = INK;
  ctx.textAlign = 'center';
  ctx.font = `800 27px ${display}`;
  ctx.fillText('MODCON SYL', site.x, siteCard.y + 32);
  ctx.font = `700 13px ${body}`;
  ctx.fillText('OUR PROJECT', site.x, siteCard.y + 53);

  // ── North arrow and scale bar ──
  const nx = W - 64, ny = 70;
  ctx.beginPath();
  ctx.moveTo(nx, ny - 26);
  ctx.lineTo(nx + 12, ny + 10);
  ctx.lineTo(nx, ny + 3);
  ctx.lineTo(nx - 12, ny + 10);
  ctx.closePath();
  ctx.fillStyle = onMap;
  ctx.fill();
  ctx.textAlign = 'center';
  ctx.font = `800 16px ${display}`;
  ctx.fillText('N', nx, ny + 34);
  const barKm = 5;
  const barPx = barKm * pxPerKm;
  const bx = W - 60 - barPx, by = H - 46;
  ctx.fillRect(bx, by, barPx, 4);
  ctx.fillRect(bx, by - 7, 2, 11);
  ctx.fillRect(bx + barPx - 2, by - 7, 2, 11);
  ctx.textAlign = 'right';
  ctx.font = `700 15px ${body}`;
  ctx.fillText(`${barKm} km`, W - 60, by - 12);

  // ── Summary panel ──
  const g = ctx.createLinearGradient(0, 0, PANEL + 140, 0);
  g.addColorStop(0, 'rgba(18,26,16,0.97)');
  g.addColorStop(PANEL / (PANEL + 140), 'rgba(18,26,16,0.92)');
  g.addColorStop(1, 'rgba(18,26,16,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, PANEL + 140, H);

  const px = 70;
  let y = 96;
  ctx.textAlign = 'left';
  ctx.fillStyle = GOLD;
  ctx.font = `800 17px ${display}`;
  ctx.fillText('SOUTH HYDERABAD  ·  GROWTH CORRIDOR', px, y);
  y += 70;
  ctx.fillStyle = '#fff';
  ctx.font = `800 56px ${display}`;
  for (const line of wrap(ctx, 'SYL sits on the road to Bharat Future City', PANEL - px - 30)) {
    ctx.fillText(line, px, y);
    y += 64;
  }
  ctx.font = `500 20px ${body}`;
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  ctx.fillText('MODCON SYL · Near Maheshwaram, South Hyderabad', px, y + 4);
  y += 70;

  const dist = (name: string) => distanceKm(SYL_SITE, GROWTH_PLACES.find(p => p.name === name)!.at);
  const stats: [string, string][] = [
    [`${fmtKm(dist('ORR Exit 14'))} km`, 'to ORR Exit 14, straight up Srisailam Highway'],
    [`${fmtKm(dist('RGI Airport'))} km`, 'to RGI Airport'],
    [`${fmtKm(dist('Bharat Future City'))} km`, 'to Bharat Future City and the Skills University'],
    [`${near}`, 'established residential projects within 10 km'],
  ];
  for (const [big, small] of stats) {
    ctx.fillStyle = GOLD;
    ctx.font = `800 44px ${display}`;
    ctx.fillText(big, px, y);
    ctx.fillStyle = 'rgba(255,255,255,0.85)';
    ctx.font = `500 19px ${body}`;
    ctx.fillText(small, px, y + 30);
    y += 92;
  }

  // Legend
  y = H - 262;
  const legend: [string, (x: number, y: number) => void][] = [
    ['Residential project', (x, yy) => { ctx.beginPath(); ctx.arc(x + 9, yy, 7.5, 0, Math.PI * 2); ctx.fillStyle = TEAL; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke(); }],
    ['Growth hub', (x, yy) => { ctx.beginPath(); ctx.moveTo(x + 9, yy - 10); ctx.lineTo(x + 19, yy); ctx.lineTo(x + 9, yy + 10); ctx.lineTo(x - 1, yy); ctx.closePath(); ctx.fillStyle = GOLD; ctx.fill(); ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.stroke(); }],
    ['Landmark', (x, yy) => { ctx.fillStyle = '#fff'; ctx.strokeStyle = INK; ctx.lineWidth = 3; ctx.beginPath(); ctx.rect(x + 2, yy - 7, 14, 14); ctx.fill(); ctx.stroke(); }],
  ];
  const lines: [string, string, number[]][] = [
    ['Greenfield radial road', GOLD, [16, 9]],
    ['Proposed metro', METRO, [3, 8]],
  ];
  ctx.font = `600 18px ${body}`;
  legend.forEach(([text, draw], i) => {
    const ly = y + i * 36;
    draw(px, ly);
    ctx.fillStyle = '#fff';
    ctx.fillText(text, px + 34, ly + 6);
  });
  lines.forEach(([text, color, dash], i) => {
    const lx = px + 280, ly = y + i * 36;
    ctx.beginPath();
    ctx.moveTo(lx, ly);
    ctx.lineTo(lx + 34, ly);
    ctx.setLineDash(dash);
    ctx.lineCap = 'round';
    ctx.strokeStyle = color;
    ctx.lineWidth = 5;
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#fff';
    ctx.fillText(text, lx + 46, ly + 6);
  });

  ctx.font = `500 14px ${body}`;
  ctx.fillStyle = 'rgba(255,255,255,0.62)';
  let fy = H - 112;
  for (const line of wrap(
    ctx,
    'Distances are straight-line from SYL. Planned road and metro are drawn between published waypoints and are indicative, not surveyed. Hub positions marked by village centre where no site pin is published.',
    PANEL - px - 20,
  )) {
    ctx.fillText(line, px, fy);
    fy += 20;
  }
  ctx.fillText(BASEMAPS[basemap].credit, px, fy + 6);

  return { canvas, missing };
}

export function GrowthCorridorMap() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [basemap, setBasemap] = useState<Basemap>('satellite');
  const [state, setState] = useState<'drawing' | 'ready' | 'no-imagery'>('drawing');
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setState('drawing');
    setSaveError('');
    document.fonts.ready
      .then(() => render(basemap))
      .then(({ canvas, missing }) => {
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
  }, [basemap]);

  const download = useCallback(() => {
    setSaveError('');
    try {
      canvasRef.current!.toBlob(blob => {
        if (!blob) return setSaveError('Could not create the image. Reload the page and try again.');
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `syl-growth-corridors-${basemap}.png`;
        a.click();
        setTimeout(() => URL.revokeObjectURL(a.href), 5000);
      }, 'image/png');
    } catch {
      setSaveError('The map imagery blocked saving. Take a screenshot of the slide instead.');
    }
  }, [basemap]);

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
        <button
          onClick={download}
          disabled={state === 'drawing'}
          className="ml-auto inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#c8a951] text-[#0a1208] text-xs font-extrabold disabled:opacity-50"
        >
          <Download className="w-4 h-4" />
          {state === 'drawing' ? 'Loading map…' : 'Download PNG (1920×1080)'}
        </button>
      </div>
      {state === 'no-imagery' && (
        <p className="text-sm text-tertiary">Some map tiles did not load. Check your connection and reload.</p>
      )}
      {saveError && <p className="text-sm text-tertiary">{saveError}</p>}
      <canvas
        ref={canvasRef}
        width={W}
        height={H}
        className="w-full h-auto rounded-2xl border border-outline/20 bg-[#1b2414]"
        aria-label="Satellite map of MODCON SYL with nearby residential projects, growth hubs and planned corridors"
      />
    </div>
  );
}
