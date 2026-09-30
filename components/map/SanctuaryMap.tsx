'use client';

/**
 * Minimalist Leaflet Eco-Map for The Green Team.
 *
 * Designed with a native APK / mobile GIS UX:
 * - 100% full-bleed map canvas without browser scroll conflicts
 * - Horizontal swipeable sanctuary selector on mobile (36px total height overhead)
 * - Native-feel bottom sheet for cartographic layers & basemap styling
 * - Ultra-compact, non-intrusive mobile sanctuary preview card above bottom tab bar
 * - Floating 1-handed zoom & recenter controls
 * - Contrast layers: pristine forest/air sanctuaries vs. urban industrial pollution hotspots
 */

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  MapContainer,
  TileLayer,
  Circle,
  Polygon,
  Polyline,
  Marker,
  useMap,
  useMapEvents,
} from 'react-leaflet';
import L from 'leaflet';
import {
  Trees,
  Wind,
  Layers,
  ChevronRight,
  X,
  Volume2,
  Sparkles,
  Maximize2,
  Plus,
  Minus,
  Check,
  AlertTriangle,
  Compass,
} from 'lucide-react';
import {
  ORR_PATH,
  RRR_PATH,
  NATURAL_FEATURES,
  MAP_LOCATIONS,
  KEY_ZONES,
  type LatLng,
  type MapLocation,
} from '@/lib/data/map';
import { cn } from '@/lib/utils';

// --- Custom Minimalist Leaflet Markers ---

function createSanctuaryIcon(s: MapLocation, isSelected: boolean) {
  const accentColor = s.id === 'agartha' ? '#a3b18a' : s.id === 'syl' ? '#c8a951' : '#e2c46e';
  const html = `
    <div style="position:relative;display:flex;align-items:center;transform:translate(-50%,-50%);cursor:pointer;">
      <div style="
        display:flex;
        align-items:center;
        gap:6px;
        background:rgba(10,18,8,0.92);
        backdrop-filter:blur(12px);
        border:1.5px solid ${isSelected ? '#c8a951' : accentColor};
        border-radius:999px;
        padding:4px 10px 4px 6px;
        box-shadow:0 6px 20px rgba(0,0,0,0.6)${isSelected ? ', 0 0 16px rgba(200,169,81,0.5)' : ''};
        transition:all 0.3s ease;
      ">
        <span style="
          width:8px;
          height:8px;
          border-radius:50%;
          background:${accentColor};
          box-shadow:0 0 8px ${accentColor};
          animation:${isSelected ? 'none' : 'tgt-pulse 2s infinite'};
        "></span>
        <span style="color:#ffffff;font:700 10.5px/1 var(--font-manrope),sans-serif;letter-spacing:0.04em;white-space:nowrap;">
          ${s.title}
        </span>
        <span style="
          font:800 9px/1 var(--font-mono),monospace;
          color:${accentColor};
          background:rgba(255,255,255,0.08);
          padding:2px 5px;
          border-radius:6px;
        ">
          AQI ${s.aqi}
        </span>
      </div>
    </div>
  `;

  return L.divIcon({
    className: 'minimal-sanctuary-icon',
    html,
    iconSize: undefined,
    iconAnchor: [0, 0],
  });
}

function createExitIcon(title: string, aqi: number, zoom: number) {
  const isDetailed = zoom >= 11;
  const html = isDetailed
    ? `<div style="display:flex;align-items:center;gap:4px;background:rgba(15,22,12,0.85);backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,0.12);border-radius:999px;padding:2px 7px;font:600 8.5px/1 var(--font-inter),sans-serif;color:rgba(255,255,255,0.65);transform:translate(-50%,-50%);white-space:nowrap;">
         <span style="width:4px;height:4px;border-radius:50%;background:#fcd34d;"></span>
         <span>${title}</span>
         <span style="color:#fcd34d;font-size:7.5px;">${aqi}</span>
       </div>`
    : `<div style="width:6px;height:6px;border-radius:50%;background:#fcd34d;border:1px solid rgba(0,0,0,0.5);opacity:0.75;transform:translate(-50%,-50%);"></div>`;

  return L.divIcon({
    className: 'minimal-exit-icon',
    html,
    iconSize: undefined,
    iconAnchor: [0, 0],
  });
}

function createHazardIcon(name: string, aqi: number) {
  const html = `
    <div style="display:flex;align-items:center;gap:3px;background:rgba(30,10,10,0.9);backdrop-filter:blur(6px);border:1px solid rgba(239,68,68,0.4);border-radius:999px;padding:2px 6px;font:700 8px/1 var(--font-inter),sans-serif;color:#fca5a5;transform:translate(-50%,-50%);white-space:nowrap;">
      <span style="width:5px;height:5px;border-radius:50%;background:#ef4444;"></span>
      <span>${name}</span>
      <span style="color:#ef4444;font-family:monospace;font-weight:900;">${aqi}</span>
    </div>
  `;
  return L.divIcon({
    className: 'minimal-hazard-icon',
    html,
    iconSize: undefined,
    iconAnchor: [0, 0],
  });
}

// Controller for programmatic map animations & touch zoom triggers
function MapController({
  target,
  onZoomChange,
  zoomInTick,
  zoomOutTick,
}: {
  target: { center: LatLng; zoom: number } | null;
  onZoomChange: (z: number) => void;
  zoomInTick: number;
  zoomOutTick: number;
}) {
  const map = useMap();

  useMapEvents({
    zoomend: e => onZoomChange(e.target.getZoom()),
  });

  useEffect(() => {
    if (target) {
      map.flyTo(target.center, target.zoom, { duration: 1.1, easeLinearity: 0.25 });
    }
  }, [target, map]);

  useEffect(() => {
    if (zoomInTick > 0) map.zoomIn();
  }, [zoomInTick, map]);

  useEffect(() => {
    if (zoomOutTick > 0) map.zoomOut();
  }, [zoomOutTick, map]);

  return null;
}

type BasemapStyle = 'dark' | 'satellite' | 'terrain';

const BASEMAPS: Record<BasemapStyle, { name: string; url: string; attr: string; maxZoom: number }> = {
  dark: {
    name: 'Obsidian',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
    attr: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 20,
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: '&copy; Esri, Maxar',
    maxZoom: 19,
  },
  terrain: {
    name: 'Canopy',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attr: '&copy; OpenStreetMap, SRTM',
    maxZoom: 17,
  },
};

export default function SanctuaryMap() {
  const [selectedBasemap, setSelectedBasemap] = useState<BasemapStyle>('dark');
  const [activeLayers, setActiveLayers] = useState({
    sanctuaries: true,
    forests: true,
    infra: true,
    airGlow: true,
    hotspots: false,
  });

  const [selectedSanctuary, setSelectedSanctuary] = useState<MapLocation | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ center: LatLng; zoom: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState(10);
  const [mounted, setMounted] = useState(false);
  const [showLayersSheet, setShowLayersSheet] = useState(false);
  const [zoomInTick, setZoomInTick] = useState(0);
  const [zoomOutTick, setZoomOutTick] = useState(0);

  // Prevent background scroll bounce on mobile browsers
  useEffect(() => {
    setMounted(true);
    document.body.classList.add('map-fullscreen-active');
    return () => {
      document.body.classList.remove('map-fullscreen-active');
    };
  }, []);

  const sanctuaries = useMemo(
    () => MAP_LOCATIONS.filter(l => l.type === 'sanctuary'),
    []
  );

  const orrExits = useMemo(
    () => MAP_LOCATIONS.filter(l => l.type === 'exit'),
    []
  );

  const selectSanctuary = (s: MapLocation) => {
    setSelectedSanctuary(s);
    setFlyTarget({ center: s.coords, zoom: 13 });
  };

  const toggleLayer = (layer: keyof typeof activeLayers) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const resetView = () => {
    setSelectedSanctuary(null);
    setFlyTarget({ center: [17.49, 78.48], zoom: 10 });
  };

  return (
    <div
      data-fullscreen-map="true"
      className="relative w-full h-[calc(100dvh-3.5rem)] md:h-[calc(100svh-3.5rem)] overflow-hidden bg-[#0a1208] select-none touch-none"
    >
      {/* ── MOBILE TOP HUD (Single Sleek Row, < 40px) ──────────────────── */}
      <header className="md:hidden absolute top-2 inset-x-2.5 z-[999] pointer-events-none flex items-center justify-between gap-1.5">
        {/* Horizontal Sanctuary Selector Bar */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1 pr-1">
          {/* All Sanctuaries Pill */}
          <button
            onClick={resetView}
            className={cn(
              'px-3 py-1.5 rounded-full text-[9.5px] font-extrabold uppercase tracking-wider backdrop-blur-xl border transition-all shrink-0 active:scale-95',
              !selectedSanctuary
                ? 'bg-[#c8a951] text-[#0a1208] border-[#c8a951] shadow-lg font-black'
                : 'bg-[#0a1208]/90 text-white/80 border-white/10 hover:bg-white/10'
            )}
          >
            All (3)
          </button>

          {/* Individual Sanctuaries */}
          {sanctuaries.map(s => {
            const active = selectedSanctuary?.id === s.id;
            const dotColor = s.id === 'agartha' ? '#4ade80' : s.id === 'syl' ? '#facc15' : '#fb923c';
            return (
              <button
                key={s.id}
                onClick={() => selectSanctuary(s)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9.5px] font-bold tracking-wide backdrop-blur-xl border transition-all shrink-0 active:scale-95',
                  active
                    ? 'bg-[#c8a951] text-[#0a1208] border-[#c8a951] shadow-lg'
                    : 'bg-[#0a1208]/90 text-white/80 border-white/10 hover:bg-white/10'
                )}
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: dotColor }} />
                <span>{s.title.replace('MODCON ', '')}</span>
                <span
                  className={cn(
                    'px-1.5 py-0.2 rounded text-[8px] font-mono font-bold',
                    active ? 'bg-black/20 text-[#0a1208]' : 'bg-white/10 text-[#86efac]'
                  )}
                >
                  AQI {s.aqi}
                </span>
              </button>
            );
          })}
        </div>

        {/* Mobile Layers & Cartography Trigger */}
        <div className="pointer-events-auto flex items-center gap-1 shrink-0">
          <button
            onClick={() => setShowLayersSheet(true)}
            aria-label="Map layers and basemap theme"
            className="w-9 h-9 rounded-full bg-[#0a1208]/92 backdrop-blur-xl border border-white/15 text-white/90 hover:text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
          >
            <Layers className="w-4 h-4 text-[#c8a951]" />
          </button>
        </div>
      </header>

      {/* ── DESKTOP TOP HUD (Widescreen Architectural) ─────────────────── */}
      <header className="hidden md:flex absolute top-4 inset-x-6 z-[999] pointer-events-none items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Brand / Status Pill */}
        <div className="pointer-events-auto flex items-center gap-2 self-start p-1.5 pl-3.5 pr-2 rounded-full bg-[#0a1208]/90 backdrop-blur-xl border border-white/10 shadow-xl">
          <span className="w-2 h-2 rounded-full bg-[#a3b18a] animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.25em] font-extrabold text-white">
            Eco Intelligence
          </span>
          <span className="text-[9px] font-mono text-white/40">· HYD</span>

          <span className="w-px h-3.5 bg-white/15 mx-1" />

          {/* Sanctuary Quick Jump Chips */}
          <div className="flex items-center gap-1">
            {sanctuaries.map(s => {
              const active = selectedSanctuary?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => selectSanctuary(s)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider transition-all',
                    active
                      ? 'bg-[#c8a951] text-[#0a1208] shadow-sm'
                      : 'text-white/60 hover:text-white hover:bg-white/5'
                  )}
                >
                  {s.title.replace('MODCON ', '')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop Layer Toggles & Style Switcher */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-full bg-[#0a1208]/90 backdrop-blur-xl border border-white/10 shadow-xl">
          <button
            onClick={() => toggleLayer('forests')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] uppercase tracking-wider font-bold transition-all',
              activeLayers.forests
                ? 'bg-[#2d3a1d] text-[#a3b18a] border border-[#a3b18a]/30'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            <Trees className="w-3 h-3" />
            <span>Reserves</span>
          </button>

          <button
            onClick={() => toggleLayer('airGlow')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] uppercase tracking-wider font-bold transition-all',
              activeLayers.airGlow
                ? 'bg-[#2d3a1d] text-[#86efac] border border-[#86efac]/30'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            <Wind className="w-3 h-3" />
            <span>Air Purity</span>
          </button>

          <button
            onClick={() => toggleLayer('hotspots')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] uppercase tracking-wider font-bold transition-all',
              activeLayers.hotspots
                ? 'bg-red-950/80 text-red-400 border border-red-500/40'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            <AlertTriangle className="w-3 h-3" />
            <span>City Hazards</span>
          </button>

          <span className="w-px h-3.5 bg-white/15 mx-0.5" />

          {/* Basemap Switcher */}
          <button
            onClick={() =>
              setSelectedBasemap(prev =>
                prev === 'dark' ? 'satellite' : prev === 'satellite' ? 'terrain' : 'dark'
              )
            }
            title="Switch map theme"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] uppercase tracking-wider font-bold text-white/60 hover:text-white transition-colors"
          >
            <Layers className="w-3 h-3" />
            <span>{BASEMAPS[selectedBasemap].name}</span>
          </button>

          {/* Reset View */}
          <button
            onClick={resetView}
            title="Reset overview"
            className="w-7 h-7 rounded-full flex items-center justify-center text-white/50 hover:text-white hover:bg-white/10 transition-colors"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>
      </header>

      {/* ── FLOATING 1-HANDED CONTROLS (Right Edge) ────────────────────── */}
      <div className="absolute right-3 top-14 md:top-24 z-[998] flex flex-col gap-1.5 pointer-events-auto">
        <button
          onClick={() => setZoomInTick(t => t + 1)}
          aria-label="Zoom in"
          className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#0a1208]/90 backdrop-blur-xl border border-white/15 text-white/80 hover:text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoomOutTick(t => t + 1)}
          aria-label="Zoom out"
          className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#0a1208]/90 backdrop-blur-xl border border-white/15 text-white/80 hover:text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={resetView}
          aria-label="Reset overview"
          title="Reset to Hyderabad Corridor"
          className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#0a1208]/90 backdrop-blur-xl border border-white/15 text-[#c8a951] hover:text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          <Compass className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Leaflet Canvas ─────────────────────────────────────────────── */}
      {mounted && (
        <MapContainer
          center={[17.49, 78.48]}
          zoom={10}
          minZoom={9}
          maxZoom={18}
          zoomControl={false}
          scrollWheelZoom={true}
          maxBounds={[
            [16.8, 77.6],
            [18.2, 79.4],
          ]}
          maxBoundsViscosity={0.9}
          className="w-full h-full"
        >
          <MapController
            target={flyTarget}
            onZoomChange={setCurrentZoom}
            zoomInTick={zoomInTick}
            zoomOutTick={zoomOutTick}
          />

          <TileLayer
            key={selectedBasemap}
            url={BASEMAPS[selectedBasemap].url}
            attribution={BASEMAPS[selectedBasemap].attr}
            maxNativeZoom={BASEMAPS[selectedBasemap].maxZoom}
            maxZoom={18}
          />

          {/* Minimalist Air Quality Purity Halos */}
          {activeLayers.airGlow && (
            <>
              {/* Narsapur Pure Air Belt */}
              <Circle
                center={[17.75, 78.28]}
                radius={8500}
                pathOptions={{
                  fillColor: '#86efac',
                  fillOpacity: 0.12,
                  color: '#4ade80',
                  weight: 1,
                  opacity: 0.35,
                }}
              />
              {/* Kandukur Forest Canopy */}
              <Circle
                center={[17.118, 78.588]}
                radius={7000}
                pathOptions={{
                  fillColor: '#86efac',
                  fillOpacity: 0.1,
                  color: '#4ade80',
                  weight: 1,
                  opacity: 0.3,
                }}
              />
              {/* Gandipet Reservoir Catchment */}
              <Circle
                center={[17.37, 78.29]}
                radius={6000}
                pathOptions={{
                  fillColor: '#6ee7b7',
                  fillOpacity: 0.08,
                  color: '#34d399',
                  weight: 1,
                  opacity: 0.25,
                }}
              />
              {/* Urban Industrial Heat Island (Subtle muted amber) */}
              <Circle
                center={[17.44, 78.44]}
                radius={10000}
                pathOptions={{
                  fillColor: '#f87171',
                  fillOpacity: 0.06,
                  color: '#ef4444',
                  weight: 1,
                  opacity: 0.2,
                }}
              />
            </>
          )}

          {/* Protected Forests & Lakes */}
          {activeLayers.forests &&
            NATURAL_FEATURES.map(f => (
              <Polygon
                key={f.id}
                positions={f.boundary}
                pathOptions={
                  f.type === 'forest'
                    ? {
                        fillColor: '#34d399',
                        fillOpacity: 0.16,
                        color: '#10b981',
                        weight: 1,
                        opacity: 0.5,
                      }
                    : {
                        fillColor: '#38bdf8',
                        fillOpacity: 0.18,
                        color: '#0ea5e9',
                        weight: 1,
                        opacity: 0.55,
                      }
                }
              />
            ))}

          {/* Arterial Infrastructure */}
          {activeLayers.infra && (
            <>
              {/* ORR — Luminous fine gold ring */}
              <Polyline
                positions={ORR_PATH}
                pathOptions={{
                  color: '#c8a951',
                  weight: 2,
                  opacity: 0.85,
                }}
              />
              {/* RRR — Refined dashed golden corridor */}
              <Polyline
                positions={RRR_PATH}
                pathOptions={{
                  color: '#e2c46e',
                  weight: 1.5,
                  opacity: 0.6,
                  dashArray: '8, 8',
                }}
              />

              {/* Minimalist Exit Markers */}
              {orrExits.map(loc => (
                <Marker
                  key={loc.id}
                  position={loc.coords}
                  icon={createExitIcon(loc.title, loc.aqi, currentZoom)}
                />
              ))}
            </>
          )}

          {/* City Hazard / Pollution Hotspots (Contrasts heavily with sanctuaries) */}
          {activeLayers.hotspots &&
            KEY_ZONES.map(z => (
              <Marker
                key={z.id}
                position={z.coords}
                icon={createHazardIcon(z.name, z.aqi)}
              />
            ))}

          {/* Curated Sanctuary Luxury Micro-Pins */}
          {activeLayers.sanctuaries &&
            sanctuaries.map(s => {
              const isSelected = selectedSanctuary?.id === s.id;
              return (
                <Marker
                  key={s.id}
                  position={s.coords}
                  icon={createSanctuaryIcon(s, isSelected)}
                  eventHandlers={{
                    click: () => selectSanctuary(s),
                  }}
                />
              );
            })}
        </MapContainer>
      )}

      {/* ── MOBILE SANCTUARY PREVIEW CARD (Above Tab Bar) ───────────────── */}
      {selectedSanctuary && (
        <aside
          aria-label="Selected Sanctuary Preview"
          className="md:hidden absolute bottom-[4.75rem] inset-x-3 z-[999] p-3.5 rounded-2xl bg-[#0a1208]/96 backdrop-blur-2xl border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.85)] animate-fade-up"
        >
          {/* Top Row: Thumbnail + Details + Close */}
          <div className="flex items-center gap-3 relative">
            {selectedSanctuary.image && (
              <div className="relative w-18 h-18 rounded-xl overflow-hidden shrink-0 border border-white/10">
                <Image
                  src={selectedSanctuary.image}
                  alt={selectedSanctuary.title}
                  fill
                  sizes="80px"
                  className="object-cover"
                />
                <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/80 text-[7.5px] font-mono font-black text-[#86efac]">
                  AQI {selectedSanctuary.aqi}
                </span>
              </div>
            )}

            <div className="flex-1 min-w-0 pr-6">
              <span className="text-[7.5px] uppercase tracking-[0.25em] font-extrabold text-[#c8a951] block leading-none mb-1">
                Curated Sanctuary
              </span>
              <h3 className="font-headline font-extrabold text-base text-white truncate leading-snug">
                {selectedSanctuary.title}
              </h3>
              <p className="text-[11px] text-white/55 truncate">{selectedSanctuary.location}</p>

              <div className="flex items-center gap-1.5 mt-1.5">
                <span className="px-2 py-0.5 rounded-full bg-white/5 text-[#86efac] text-[8.5px] font-bold border border-white/10 flex items-center gap-1">
                  <Wind className="w-2.5 h-2.5 text-[#4ade80]" />
                  AQI {selectedSanctuary.aqi}
                </span>
                {selectedSanctuary.noise && (
                  <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/70 text-[8.5px] font-bold border border-white/10 flex items-center gap-1">
                    <Volume2 className="w-2.5 h-2.5 text-white/40" />
                    {selectedSanctuary.noise} dB
                  </span>
                )}
              </div>
            </div>

            <button
              onClick={() => setSelectedSanctuary(null)}
              aria-label="Close details"
              className="absolute top-0 right-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </div>

          {/* Action Row */}
          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/10">
            <Link
              href={`/sanctuaries/${selectedSanctuary.id}`}
              className="flex-1 py-2 rounded-xl bg-[#c8a951] text-[#0a1208] text-[9.5px] uppercase tracking-[0.2em] font-black text-center flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all"
            >
              <span>Explore Sanctuary</span>
              <ChevronRight className="w-3 h-3" />
            </Link>
            <button
              onClick={() => setFlyTarget({ center: selectedSanctuary.coords, zoom: 15 })}
              className="px-3.5 py-2 rounded-xl border border-white/20 text-white text-[9px] uppercase tracking-wider font-bold hover:bg-white/10 active:scale-95 transition-all"
            >
              Zoom
            </button>
          </div>
        </aside>
      )}

      {/* ── DESKTOP SANCTUARY PREVIEW CARD ─────────────────────────────── */}
      {selectedSanctuary && (
        <aside
          aria-label="Selected Sanctuary Preview"
          className="hidden md:block absolute bottom-6 left-6 w-[23rem] z-[999] p-5 rounded-3xl bg-[#0a1208]/95 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-fade-up"
        >
          <div className="flex items-start justify-between gap-3 mb-3">
            <div>
              <span className="text-[9px] uppercase tracking-[0.25em] font-extrabold text-[#c8a951] block mb-0.5">
                Curated Sanctuary
              </span>
              <h3 className="font-headline font-extrabold text-xl text-white">
                {selectedSanctuary.title}
              </h3>
              <p className="text-xs text-white/50 mt-0.5">{selectedSanctuary.location}</p>
            </div>
            <button
              onClick={() => setSelectedSanctuary(null)}
              aria-label="Close details"
              className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          {selectedSanctuary.image && (
            <div className="relative w-full h-32 rounded-2xl overflow-hidden mb-3.5 border border-white/10">
              <Image
                src={selectedSanctuary.image}
                alt={selectedSanctuary.title}
                fill
                sizes="400px"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
              <div className="absolute bottom-2.5 left-3 flex items-center gap-2">
                <span className="px-2 py-0.5 rounded-full bg-[#0a1208]/90 text-[#86efac] text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border border-white/10">
                  <Wind className="w-3 h-3 text-[#4ade80]" /> AQI {selectedSanctuary.aqi}
                </span>
                {selectedSanctuary.noise && (
                  <span className="px-2 py-0.5 rounded-full bg-[#0a1208]/90 text-white/70 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border border-white/10">
                    <Volume2 className="w-3 h-3 text-white/40" /> {selectedSanctuary.noise} dB
                  </span>
                )}
              </div>
            </div>
          )}

          <p className="text-xs text-white/70 leading-relaxed mb-4 line-clamp-2">
            {selectedSanctuary.description}
          </p>

          <div className="flex items-center gap-2">
            <Link
              href={`/sanctuaries/${selectedSanctuary.id}`}
              className="flex-1 py-3 rounded-full bg-[#c8a951] text-[#0a1208] text-[9.5px] uppercase tracking-[0.25em] font-extrabold text-center hover:bg-[#d4a72c] transition-all flex items-center justify-center gap-1.5 shadow-md"
            >
              <span>Explore Sanctuary</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
            <button
              onClick={() => setFlyTarget({ center: selectedSanctuary.coords, zoom: 15 })}
              title="Zoom to location"
              className="px-4 py-3 rounded-full border border-white/20 text-white text-[9.5px] uppercase tracking-wider font-bold hover:bg-white/10 transition-colors"
            >
              Zoom
            </button>
          </div>
        </aside>
      )}

      {/* ── ENVIRONMENTAL BENCHMARK PILL (When No Sanctuary Selected) ───── */}
      {!selectedSanctuary && (
        <>
          {/* Mobile Discrete Pill */}
          <div className="md:hidden absolute bottom-[4.75rem] left-1/2 -translate-x-1/2 z-[998] pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0a1208]/92 backdrop-blur-xl border border-white/10 shadow-lg text-[8.5px] text-white/80 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[#86efac] animate-pulse" />
              <span className="text-[#86efac] font-bold">Sanctuary: 12–22 AQI</span>
              <span className="text-white/30">|</span>
              <span className="text-white/50">City: 148+</span>
              <span className="text-white/30">|</span>
              <span className="text-[#c8a951] font-bold">10× Cleaner</span>
            </div>
          </div>

          {/* Desktop Footer Strip */}
          <footer className="hidden md:flex absolute bottom-4 inset-x-4 z-[998] pointer-events-none justify-center">
            <div className="pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-full bg-[#0a1208]/85 backdrop-blur-xl border border-white/10 shadow-lg text-[9px] text-white/70">
              <span className="flex items-center gap-1.5 text-[#86efac] font-bold">
                <Sparkles className="w-3 h-3 text-[#4ade80]" />
                <span>Sanctuary AQI: 12–22</span>
              </span>
              <span className="text-white/20">|</span>
              <span className="text-white/50">City Center AQI: 148+</span>
              <span className="text-white/20">|</span>
              <span className="text-[#c8a951] font-bold">10× Cleaner Air</span>
            </div>
          </footer>
        </>
      )}

      {/* ── MOBILE CARTOGRAPHY & LAYERS BOTTOM DRAWER ──────────────────── */}
      {showLayersSheet && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Map layers and basemap theme"
          className="fixed inset-0 z-[10000] flex flex-col justify-end bg-black/60 backdrop-blur-sm"
          onClick={() => setShowLayersSheet(false)}
        >
          <div
            className="w-full bg-[#0a1208] border-t border-white/15 rounded-t-3xl p-5 pb-8 shadow-2xl animate-fade-up"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Handle */}
            <div className="w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />

            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-headline font-extrabold text-base text-white">
                  Environmental Cartography
                </h4>
                <p className="text-[10px] text-white/50">
                  Configure layers, reserves, and satellite imagery
                </p>
              </div>
              <button
                onClick={() => setShowLayersSheet(false)}
                className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/70"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Basemap Styles */}
            <div className="mb-4">
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-[#c8a951] block mb-2">
                Basemap Theme
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['dark', 'satellite', 'terrain'] as BasemapStyle[]).map(style => {
                  const active = selectedBasemap === style;
                  return (
                    <button
                      key={style}
                      onClick={() => setSelectedBasemap(style)}
                      className={cn(
                        'py-2.5 px-2 rounded-xl text-[10px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 border transition-all',
                        active
                          ? 'bg-[#c8a951] text-[#0a1208] border-[#c8a951] shadow-md font-black'
                          : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                      )}
                    >
                      {active && <Check className="w-3 h-3 stroke-[3]" />}
                      <span>{BASEMAPS[style].name}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Layer Toggles */}
            <div className="mb-5 space-y-2">
              <span className="text-[9px] uppercase tracking-widest font-extrabold text-[#c8a951] block mb-1">
                Active Intelligence Layers
              </span>

              {/* Forests */}
              <button
                onClick={() => toggleLayer('forests')}
                className={cn(
                  'w-full py-2.5 px-3.5 rounded-xl border flex items-center justify-between text-left transition-all',
                  activeLayers.forests
                    ? 'bg-[#2d3a1d]/60 border-[#a3b18a]/40 text-white'
                    : 'bg-white/5 border-white/10 text-white/50'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Trees className={cn('w-4 h-4', activeLayers.forests ? 'text-[#a3b18a]' : 'text-white/40')} />
                  <div>
                    <span className="text-xs font-bold block">Forests & Protected Lakes</span>
                    <span className="text-[9px] text-white/40 block">Narsapur, Ananthagiri, Osman Sagar</span>
                  </div>
                </div>
                <div
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center',
                    activeLayers.forests ? 'bg-[#a3b18a] text-[#0a1208]' : 'bg-white/10'
                  )}
                >
                  {activeLayers.forests && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>

              {/* Air Purity */}
              <button
                onClick={() => toggleLayer('airGlow')}
                className={cn(
                  'w-full py-2.5 px-3.5 rounded-xl border flex items-center justify-between text-left transition-all',
                  activeLayers.airGlow
                    ? 'bg-[#2d3a1d]/60 border-[#86efac]/40 text-white'
                    : 'bg-white/5 border-white/10 text-white/50'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Wind className={cn('w-4 h-4', activeLayers.airGlow ? 'text-[#86efac]' : 'text-white/40')} />
                  <div>
                    <span className="text-xs font-bold block">Air Purity Halos</span>
                    <span className="text-[9px] text-white/40 block">Real-time green canopy oxygenation</span>
                  </div>
                </div>
                <div
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center',
                    activeLayers.airGlow ? 'bg-[#86efac] text-[#0a1208]' : 'bg-white/10'
                  )}
                >
                  {activeLayers.airGlow && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>

              {/* Highways */}
              <button
                onClick={() => toggleLayer('infra')}
                className={cn(
                  'w-full py-2.5 px-3.5 rounded-xl border flex items-center justify-between text-left transition-all',
                  activeLayers.infra
                    ? 'bg-white/10 border-[#c8a951]/40 text-white'
                    : 'bg-white/5 border-white/10 text-white/50'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Compass className={cn('w-4 h-4', activeLayers.infra ? 'text-[#c8a951]' : 'text-white/40')} />
                  <div>
                    <span className="text-xs font-bold block">ORR & RRR Expressways</span>
                    <span className="text-[9px] text-white/40 block">Outer & Regional Ring Road alignment</span>
                  </div>
                </div>
                <div
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center',
                    activeLayers.infra ? 'bg-[#c8a951] text-[#0a1208]' : 'bg-white/10'
                  )}
                >
                  {activeLayers.infra && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>

              {/* Urban Pollution Hotspots */}
              <button
                onClick={() => toggleLayer('hotspots')}
                className={cn(
                  'w-full py-2.5 px-3.5 rounded-xl border flex items-center justify-between text-left transition-all',
                  activeLayers.hotspots
                    ? 'bg-red-950/60 border-red-500/40 text-white'
                    : 'bg-white/5 border-white/10 text-white/50'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className={cn('w-4 h-4', activeLayers.hotspots ? 'text-red-400' : 'text-white/40')} />
                  <div>
                    <span className="text-xs font-bold block">City Pollution Hotspots</span>
                    <span className="text-[9px] text-white/40 block">Sanath Nagar, Charminar, Patancheru</span>
                  </div>
                </div>
                <div
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center',
                    activeLayers.hotspots ? 'bg-red-500 text-white' : 'bg-white/10'
                  )}
                >
                  {activeLayers.hotspots && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowLayersSheet(false)}
              className="w-full py-3 rounded-xl bg-[#c8a951] text-[#0a1208] text-xs font-extrabold uppercase tracking-widest text-center shadow-lg active:scale-95 transition-all"
            >
              Apply Cartography
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
