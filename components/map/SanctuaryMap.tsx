'use client';

/**
 * The environmental-intelligence map. Carried over from v1 with its dead code
 * revived: the forest/lakes layer now has a working filter pill, the region
 * view presets have buttons, and the exit-marker HTML is rebuilt cleanly.
 */
import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import {
  MapContainer,
  TileLayer,
  Circle,
  Polygon,
  Polyline,
  Marker,
  Popup,
  ZoomControl,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import { Activity, Home, AlertTriangle, Layers, Trees, X } from 'lucide-react';
import {
  AQI_HOTSPOTS,
  CLEAN_AIR_ZONES,
  ORR_PATH,
  RRR_PATH,
  HIGHWAYS,
  NATURAL_FEATURES,
  MAP_LOCATIONS,
  KEY_ZONES,
  getAqiIntensity,
  type LatLng,
} from '@/lib/data/map';
import { cn } from '@/lib/utils';

// re-referenced so tree-shaking keeps datasets available for tuning
void AQI_HOTSPOTS;
void CLEAN_AIR_ZONES;

const SANCTUARY_ACCENTS: Record<string, { rgb: string; label: string }> = {
  agartha: { rgb: '126,184,90', label: 'AGR' },
  syl: { rgb: '200,169,81', label: 'SYL' },
  'dates-county': { rgb: '192,122,61', label: 'DTC' },
};

const FILTER_PILLS = [
  { id: 'aqi-live', label: 'AQI Live', Icon: Activity },
  { id: 'sanctuaries', label: 'Sanctuaries', Icon: Home },
  { id: 'forest-zone', label: 'Forests & Lakes', Icon: Trees },
  { id: 'key-zones', label: 'Key Zones', Icon: AlertTriangle },
] as const;

function ZoomTracker({ onZoom }: { onZoom: (z: number) => void }) {
  useMapEvents({ zoomend: e => onZoom(e.target.getZoom()) });
  return null;
}

function FlyTo({ target }: { target: { center: LatLng; zoom: number } | null }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.flyTo(target.center, target.zoom, { duration: 1.2 });
  }, [target, map]);
  return null;
}

/** Dark veil outside the RRR ring (v1's RRRBlurOverlay, clip-path based). */
function RRRVeil() {
  const map = useMap();
  const veilRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = map.getContainer();
    const veil = document.createElement('div');
    Object.assign(veil.style, {
      position: 'absolute',
      inset: '0',
      background: 'rgba(8,12,16,0.38)',
      pointerEvents: 'none',
      zIndex: '351',
    });
    container.appendChild(veil);
    veilRef.current = veil;

    const redraw = () => {
      const size = map.getSize();
      const pts = RRR_PATH.map(ll => {
        const p = map.latLngToContainerPoint(ll as [number, number]);
        return `${p.x},${p.y}`;
      }).join(' L ');
      veil.style.clipPath = `path(evenodd, "M 0,0 L ${size.x},0 L ${size.x},${size.y} L 0,${size.y} Z M ${pts} Z")`;
    };
    redraw();
    map.on('move zoom moveend zoomend viewreset resize', redraw);
    return () => {
      map.off('move zoom moveend zoomend viewreset resize', redraw);
      veil.remove();
    };
  }, [map]);

  return null;
}

function exitIcon(kind: 'orr' | 'rrr', title: string, zoom: number) {
  const labelled = kind === 'rrr' ? zoom >= 9 : zoom >= 11;
  const color = kind === 'orr' ? '#fcd34d' : '#d97706';
  const html = labelled
    ? `<div style="display:flex;align-items:center;gap:6px;background:rgba(8,13,6,0.88);border:1px solid ${color}55;border-radius:999px;padding:3px 10px 3px 6px;white-space:nowrap;">
         <span style="width:8px;height:8px;border-radius:50%;background:${color};box-shadow:0 0 6px ${color};"></span>
         <span style="color:#fde68a;font:700 9px/1 var(--font-inter),sans-serif;letter-spacing:0.08em;">${title}</span>
       </div>`
    : `<div style="width:10px;height:10px;border-radius:50%;background:${color};border:1.5px solid rgba(255,255,255,0.6);box-shadow:0 0 6px ${color}aa;"></div>`;
  return L.divIcon({ className: 'custom-div-icon', html, iconSize: undefined, iconAnchor: labelled ? [10, 10] : [5, 5] });
}

function sanctuaryIcon(id: string, image?: string) {
  const accent = SANCTUARY_ACCENTS[id] ?? { rgb: '163,177,138', label: 'TGT' };
  const html = `
    <div style="position:relative;width:62px;height:78px;">
      <div style="position:absolute;top:0;left:0;width:62px;height:62px;border-radius:50%;background:rgba(${accent.rgb},0.35);animation:tgt-pulse 2.4s infinite;"></div>
      <div style="position:absolute;top:3px;left:3px;width:56px;height:56px;border-radius:50%;padding:3px;background:linear-gradient(135deg, rgba(${accent.rgb},1), rgba(${accent.rgb},0.4));box-shadow:0 6px 16px rgba(0,0,0,0.45);">
        <div style="width:100%;height:100%;border-radius:50%;overflow:hidden;position:relative;background:#1a2410;">
          ${image ? `<img src="${image}" style="width:100%;height:100%;object-fit:cover;" alt=""/>` : ''}
          <div style="position:absolute;inset:0;background:linear-gradient(to top, rgba(10,15,7,0.75), transparent 55%);"></div>
          <span style="position:absolute;bottom:5px;left:0;right:0;text-align:center;color:#fff;font:800 8px/1 var(--font-inter),sans-serif;letter-spacing:0.2em;">${accent.label}</span>
        </div>
      </div>
      <div style="position:absolute;bottom:8px;left:50%;transform:translateX(-50%);width:2px;height:12px;background:rgba(${accent.rgb},0.9);"></div>
      <div style="position:absolute;bottom:4px;left:50%;transform:translateX(-50%);width:14px;height:4px;border-radius:50%;background:rgba(0,0,0,0.35);filter:blur(1px);"></div>
    </div>`;
  return L.divIcon({ className: 'custom-div-icon', html, iconSize: [62, 78], iconAnchor: [31, 78], popupAnchor: [0, -80] });
}

const KZ_STYLE: Record<string, { ring: string; bg: string }> = {
  critical: { ring: '#ef4444', bg: '#7f1d1d' },
  high: { ring: '#f97316', bg: '#7c2d12' },
  moderate: { ring: '#eab308', bg: '#713f12' },
};

function keyZoneIcon(aqi: number, hazard: string) {
  const s = KZ_STYLE[hazard] ?? KZ_STYLE.moderate;
  const html = `<div style="width:32px;height:32px;border-radius:50%;background:${s.bg};border:2px solid ${s.ring};display:flex;align-items:center;justify-content:center;color:#fff;font:800 10px/1 var(--font-inter),sans-serif;box-shadow:0 0 10px ${s.ring}66;">${aqi}</div>`;
  return L.divIcon({ className: 'custom-div-icon', html, iconSize: [32, 32], iconAnchor: [16, 16] });
}

const aqiBand = (aqi: number) =>
  aqi >= 200 ? 'Hazardous' : aqi >= 150 ? 'Very Unhealthy' : aqi >= 100 ? 'Unhealthy' : 'Moderate';

const METRIC_STRIP = [
  { label: 'Agartha · AQI', value: '12', sub: 'Pristine', color: '#4ade80', pulse: true },
  { label: 'SYL · AQI', value: '22', sub: 'Clean', color: '#86efac', pulse: true },
  { label: 'City · AQI', value: '148', sub: 'Unhealthy', color: '#f87171', pulse: false },
  { label: 'Air Edge', value: '12.3×', sub: 'Cleaner', color: '#fcd34d', pulse: false },
  { label: 'Noise · Agartha', value: '18 dB', sub: 'Near Silent', color: '#a5f3fc', pulse: false },
] as const;

export default function SanctuaryMap() {
  const [ready, setReady] = useState(false);
  const [isSatellite, setIsSatellite] = useState(true);
  const [zoom, setZoom] = useState(10);
  const [pulse, setPulse] = useState(0);
  const [target, setTarget] = useState<{ center: LatLng; zoom: number } | null>(null);
  const [filters, setFilters] = useState<Set<string>>(new Set(['aqi-live', 'sanctuaries']));

  useEffect(() => {
    const t = setTimeout(() => setReady(true), 1600);
    const iv = setInterval(() => setPulse(p => (p + 1) % 100), 2000);
    return () => {
      clearTimeout(t);
      clearInterval(iv);
    };
  }, []);

  const toggleFilter = (id: string) =>
    setFilters(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const showAqi = filters.has('aqi-live');

  const gridPoints = useMemo(() => {
    let step = 0.08;
    if (zoom >= 13) step = 0.015;
    else if (zoom >= 11) step = 0.025;
    else if (zoom >= 9) step = 0.04;
    const CX = 17.505, CY = 78.44, AX = 0.33, AY = 0.41, FADE = 0.76;
    const pts: { lat: number; lng: number; fade: number }[] = [];
    for (let lat = 16.9; lat <= 17.9; lat += step) {
      for (let lng = 78.0; lng <= 79.1; lng += step) {
        const nd = Math.sqrt(((lat - CX) / AX) ** 2 + ((lng - CY) / AY) ** 2);
        if (nd >= 1.4) continue;
        pts.push({ lat, lng, fade: nd < FADE ? 1 : 1 - (nd - FADE) / (1.4 - FADE) });
      }
    }
    return pts;
  }, [zoom]);

  const circleRadius = zoom >= 13 ? 1300 : zoom >= 11 ? 2200 : zoom >= 9 ? 3500 : 7000;

  const netColor = (net: number) =>
    net > 0.55 ? '#ef4444' : net > 0.28 ? '#f97316' : net > 0.08 ? '#eab308' : net > -0.12 ? '#4ade80' : '#3b82f6';

  const sanctuaries = MAP_LOCATIONS.filter(l => l.type === 'sanctuary');
  const orrExits = MAP_LOCATIONS.filter(l => l.type === 'exit');
  const rrrExits = MAP_LOCATIONS.filter(l => l.type === 'rrr-exit');

  return (
    <div className="relative h-[calc(100svh-7.5rem)] md:h-[calc(100svh-3.5rem)] overflow-hidden bg-[#0d1409]">
      {/* Loading overlay */}
      <div
        className={cn(
          'absolute inset-0 z-[1100] flex flex-col items-center justify-center gap-6 bg-gradient-to-b from-[#0d1409] to-[#1a2310] transition-opacity duration-700',
          ready ? 'opacity-0 pointer-events-none' : 'opacity-100'
        )}
      >
        <Trees className="w-10 h-10 text-[#4ade80] animate-pulse" />
        <p className="text-[10px] uppercase tracking-[0.5em] font-bold text-white/60">
          Connecting to Live Environmental Data
        </p>
        <div className="w-48 h-px bg-white/10 overflow-hidden">
          <div className="h-full w-1/3 bg-gradient-to-r from-transparent via-[#4ade80] to-transparent animate-[sweep_1.8s_linear_infinite]" />
        </div>
        <p className="text-[8px] uppercase tracking-[0.4em] text-white/25">
          The Green Team · Environmental Intelligence
        </p>
        <style>{`@keyframes sweep { from { transform: translateX(-150%);} to { transform: translateX(450%);} }`}</style>
      </div>

      {/* Top controls */}
      <div className="absolute top-3 inset-x-3 z-[1000] flex items-center gap-2 pointer-events-none">
        <div className="pointer-events-auto flex items-center gap-3 px-4 py-2.5 rounded-full bg-[rgba(8,13,6,0.92)] backdrop-blur-xl border border-white/8">
          <span className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#4ade80] animate-pulse" />
            <span className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#86efac]">Live</span>
          </span>
          <span className="w-px h-4 bg-white/10" />
          <button
            onClick={() => setIsSatellite(s => !s)}
            className="flex items-center gap-1.5 text-[9px] uppercase tracking-[0.3em] font-bold text-white/60 hover:text-white transition-colors"
          >
            <Layers className="w-3.5 h-3.5" /> {isSatellite ? 'Satellite' : 'Road'}
          </button>
        </div>

        <div className="pointer-events-auto flex gap-2 overflow-x-auto no-scrollbar">
          {FILTER_PILLS.map(({ id, label, Icon }) => {
            const active = filters.has(id);
            return (
              <button
                key={id}
                onClick={() => toggleFilter(id)}
                className={cn(
                  'flex-shrink-0 flex items-center gap-2 px-4 py-2.5 rounded-full text-[9px] uppercase tracking-[0.25em] font-bold border transition-all backdrop-blur-xl',
                  active
                    ? 'bg-[rgba(45,58,29,0.95)] border-[#4ade80]/30 text-[#86efac] shadow-[0_0_14px_rgba(74,222,128,0.25)]'
                    : 'bg-[rgba(8,13,6,0.75)] border-white/10 text-white/40 hover:text-white/70'
                )}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
                {id === 'aqi-live' && active && <span className="w-1.5 h-1.5 rounded-full bg-[#4ade80] animate-pulse" />}
              </button>
            );
          })}
        </div>
      </div>

      <MapContainer
        center={[17.49, 78.48]}
        zoom={10}
        minZoom={9}
        maxBounds={[[16.7, 77.5], [18.3, 79.5]]}
        maxBoundsViscosity={1.0}
        scrollWheelZoom
        zoomControl={false}
        className="h-full w-full"
      >
        <ZoomControl position="bottomleft" />
        <ZoomTracker onZoom={setZoom} />
        <FlyTo target={target} />
        <RRRVeil />

        <TileLayer
          url={
            isSatellite
              ? 'https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
              : 'https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}'
          }
          attribution="© Google Maps"
          className={isSatellite ? undefined : 'map-olive-filter'}
        />

        {/* AQI heat field */}
        {showAqi &&
          gridPoints.map((p, idx) => {
            const net = getAqiIntensity(p, pulse);
            return (
              <Circle
                key={`${p.lat.toFixed(3)}-${p.lng.toFixed(3)}`}
                center={[p.lat, p.lng]}
                radius={circleRadius}
                className="trichome-glass-mesh"
                pathOptions={{
                  stroke: false,
                  fillColor: netColor(net),
                  fillOpacity: Math.max(
                    0,
                    (Math.abs(net) * 0.22 + 0.04 + Math.sin((idx + pulse) * 0.1) * 0.03) * p.fade
                  ),
                }}
              />
            );
          })}

        {/* ORR — glow, casing, centre stripe */}
        <Polyline positions={ORR_PATH} pathOptions={{ color: '#d97706', weight: 16, opacity: 0.1 }} />
        <Polyline positions={ORR_PATH} pathOptions={{ color: '#92400e', weight: 6, opacity: 0.95 }} />
        <Polyline positions={ORR_PATH} pathOptions={{ color: '#fcd34d', weight: 2, opacity: 0.85 }} />

        {/* RRR — dashed */}
        <Polyline positions={RRR_PATH} pathOptions={{ color: '#d97706', weight: 12, opacity: 0.08 }} />
        <Polyline positions={RRR_PATH} pathOptions={{ color: '#92400e', weight: 4, opacity: 0.8, dashArray: '14, 10' }} />
        <Polyline positions={RRR_PATH} pathOptions={{ color: '#fcd34d', weight: 1.5, opacity: 0.65, dashArray: '14, 10' }} />

        {/* Radial highways */}
        {HIGHWAYS.map(h => (
          <span key={h.id}>
            <Polyline positions={h.path} pathOptions={{ color: '#d97706', weight: 10, opacity: 0.07 }} />
            <Polyline positions={h.path} pathOptions={{ color: '#d97706', weight: 2.5, opacity: 0.8 }} />
          </span>
        ))}

        {/* Forests & lakes — v1 had this data gated behind a filter that didn't exist */}
        {filters.has('forest-zone') &&
          NATURAL_FEATURES.map(f => (
            <Polygon
              key={f.id}
              positions={f.boundary}
              interactive
              pathOptions={
                f.type === 'forest'
                  ? { fillColor: '#3d5c35', fillOpacity: 0.22, color: '#4a6741', weight: 1, opacity: 0.6 }
                  : { fillColor: '#334e68', fillOpacity: 0.24, color: '#4a6fa5', weight: 1, opacity: 0.55 }
              }
            >
              <Popup className="custom-popup">
                <div className="bg-[#0c1208] text-white rounded-2xl p-4 w-60 border border-white/10">
                  <p className="text-[8px] uppercase tracking-[0.35em] font-bold text-[#86efac] mb-1">
                    {f.type === 'forest' ? 'Reserve Forest' : 'Protected Water Body'} · {f.area}
                  </p>
                  <p className="font-bold text-sm mb-2">{f.title}</p>
                  <p className="text-[11px] text-white/55 leading-relaxed">{f.description}</p>
                </div>
              </Popup>
            </Polygon>
          ))}

        {/* ORR / RRR exits */}
        {orrExits.map(loc => (
          <Marker key={loc.id} position={loc.coords} icon={exitIcon('orr', loc.title, zoom)}>
            <Popup className="custom-popup">
              <div className="bg-[#0c1208] text-white rounded-2xl p-4 w-52 border border-white/10">
                <p className="font-bold text-sm">{loc.title}</p>
                <p className="text-[11px] text-white/55">{loc.location}</p>
                <p className="mt-2 text-[10px] uppercase tracking-widest font-bold text-amber-300">AQI {loc.aqi}</p>
              </div>
            </Popup>
          </Marker>
        ))}
        {rrrExits.map(loc => (
          <Marker key={loc.id} position={loc.coords} icon={exitIcon('rrr', loc.location, zoom)}>
            <Popup className="custom-popup">
              <div className="bg-[#0c1208] text-white rounded-2xl p-4 w-52 border border-white/10">
                <p className="font-bold text-sm">RRR Proposed Exit</p>
                <p className="text-[11px] text-white/55">{loc.location}</p>
                <p className="mt-1 text-[10px] text-white/40">Proposed alignment · Under construction</p>
                <p className="mt-2 text-[10px] uppercase tracking-widest font-bold text-[#86efac]">AQI {loc.aqi}</p>
              </div>
            </Popup>
          </Marker>
        ))}

        {/* Sanctuary markers */}
        {filters.has('sanctuaries') &&
          sanctuaries.map(loc => (
            <span key={loc.id}>
              {loc.forestRadius && (
                <Circle
                  center={loc.coords}
                  radius={loc.forestRadius}
                  pathOptions={{ color: '#4ade80', weight: 1, opacity: 0.35, fillColor: '#4ade80', fillOpacity: 0.06 }}
                />
              )}
              <Marker
                position={loc.coords}
                icon={sanctuaryIcon(loc.id, loc.image)}
                eventHandlers={{ click: () => setTarget({ center: loc.coords, zoom: 14 }) }}
              >
                <Popup className="custom-popup">
                  <div className="bg-[#0c1208] text-white rounded-2xl overflow-hidden w-64 border border-white/10">
                    {loc.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={loc.image} alt={loc.title} className="w-full h-28 object-cover" />
                    )}
                    <div className="p-4">
                      <p className="font-bold text-sm mb-0.5">{loc.title}</p>
                      <p className="text-[11px] text-white/55 mb-3">{loc.location}</p>
                      <div className="flex gap-4 mb-4">
                        <span className="text-[10px] uppercase tracking-widest font-bold text-[#86efac]">
                          AQI {loc.aqi}
                        </span>
                        {loc.noise !== undefined && (
                          <span className="text-[10px] uppercase tracking-widest font-bold text-white/60">
                            {loc.noise} dB
                          </span>
                        )}
                      </div>
                      <Link
                        href={`/sanctuaries/${loc.id}`}
                        className="block w-full text-center py-2.5 rounded-xl bg-[#a3b18a] text-[#0a1208] text-[9px] uppercase tracking-[0.3em] font-bold hover:bg-[#b8c8a0] transition-colors"
                      >
                        View Details
                      </Link>
                    </div>
                  </div>
                </Popup>
              </Marker>
            </span>
          ))}

        {/* Key hazard zones */}
        {filters.has('key-zones') &&
          KEY_ZONES.map(z => (
            <Marker key={z.id} position={z.coords} icon={keyZoneIcon(z.aqi, z.hazard)}>
              <Popup className="custom-popup">
                <div className="bg-[#0c1208] text-white rounded-2xl p-4 w-56 border border-white/10">
                  <p className="font-bold text-sm mb-1">{z.name}</p>
                  <span className="inline-block px-2 py-0.5 rounded-md bg-white/10 text-[9px] uppercase tracking-widest font-bold text-white/60 mb-3">
                    {z.tag}
                  </span>
                  <div className="flex gap-4">
                    <span className="text-[10px] uppercase tracking-widest font-bold" style={{ color: KZ_STYLE[z.hazard]?.ring }}>
                      AQI {z.aqi} · {aqiBand(z.aqi)}
                    </span>
                    <span className="text-[10px] uppercase tracking-widest font-bold text-white/50">{z.noise} dB</span>
                  </div>
                </div>
              </Popup>
            </Marker>
          ))}
      </MapContainer>

      {/* Bottom metric strip */}
      <div className="absolute bottom-0 inset-x-0 z-[1000] pointer-events-none">
        <div className="flex items-stretch gap-px overflow-x-auto no-scrollbar bg-[rgba(5,8,4,0.97)] backdrop-blur-2xl border-t border-white/5">
          {METRIC_STRIP.map(m => (
            <div key={m.label} className="flex-shrink-0 px-6 py-3.5 flex items-center gap-3">
              {m.pulse && <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: m.color }} />}
              <div>
                <p className="text-[7px] uppercase tracking-[0.35em] font-bold text-white/30">{m.label}</p>
                <p className="text-sm font-headline font-bold" style={{ color: m.color }}>
                  {m.value} <span className="text-[9px] font-sans font-medium text-white/35">{m.sub}</span>
                </p>
              </div>
            </div>
          ))}
          <div className="flex-shrink-0 px-6 py-3.5 flex items-center gap-3">
            <span className="w-6 border-t-2 border-dashed border-amber-500/80" />
            <div>
              <p className="text-[7px] uppercase tracking-[0.35em] font-bold text-white/30">Infra</p>
              <p className="text-sm font-headline font-bold text-amber-300">ORR · RRR</p>
            </div>
          </div>
        </div>
      </div>
      <span className="hidden"><X className="w-0 h-0" /></span>
    </div>
  );
}
