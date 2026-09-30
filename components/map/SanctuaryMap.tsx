'use client';

/**
 * Minimalist Leaflet Eco-Map for The Green Team.
 *
 * An architectural, serene environmental-intelligence surface:
 * - Ultra-clean dark Carto / Satellite basemap
 * - Luminous, subtle biophilic forest & lake reserves
 * - Hairline ORR & RRR arterial infrastructure
 * - Sleek micro-pins for curated sanctuaries
 * - Interactive floating sanctuary preview card with flyTo navigation
 * - Minimalist floating filter HUD optimized for desktop & APK WebViews
 */

import { useEffect, useMemo, useRef, useState } from 'react';
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
  MapPin,
  ChevronRight,
  X,
  Volume2,
  Clock,
  Sparkles,
  Maximize2,
} from 'lucide-react';
import {
  ORR_PATH,
  RRR_PATH,
  NATURAL_FEATURES,
  MAP_LOCATIONS,
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
        <span style="color:#ffffff;font:700 10px/1 var(--font-manrope),sans-serif;letter-spacing:0.04em;white-space:nowrap;">
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

// Controller for programmatic map animations
function MapController({
  target,
  onZoomChange,
}: {
  target: { center: LatLng; zoom: number } | null;
  onZoomChange: (z: number) => void;
}) {
  const map = useMap();

  useMapEvents({
    zoomend: e => onZoomChange(e.target.getZoom()),
  });

  useEffect(() => {
    if (target) {
      map.flyTo(target.center, target.zoom, { duration: 1.2, easeLinearity: 0.25 });
    }
  }, [target, map]);

  return null;
}

type BasemapStyle = 'dark' | 'satellite' | 'terrain';

const BASEMAPS: Record<BasemapStyle, { name: string; url: string; attr: string; maxZoom: number }> = {
  dark: {
    name: 'Obsidian',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png',
    attr: '&copy; OpenStreetMap contributors &copy; CARTO',
    maxZoom: 20,
  },
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: 'Imagery &copy; Esri, Maxar',
    maxZoom: 19,
  },
  terrain: {
    name: 'Canopy',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attr: '&copy; OpenStreetMap contributors, SRTM',
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
  });

  const [selectedSanctuary, setSelectedSanctuary] = useState<MapLocation | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ center: LatLng; zoom: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState(10);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
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
    <div className="relative w-full h-[calc(100svh-4.2rem)] md:h-[calc(100svh-3.5rem)] overflow-hidden bg-[#0a1208] select-none">
      {/* ── Top Minimalist Control Bar (HUD) ───────────────────────────── */}
      <header className="absolute top-4 inset-x-4 z-[999] pointer-events-none flex flex-col md:flex-row md:items-center justify-between gap-3 max-w-7xl mx-auto">
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

        {/* Layer Toggles & Style Switcher */}
        <div className="pointer-events-auto flex items-center gap-1.5 self-start md:self-auto overflow-x-auto no-scrollbar p-1.5 rounded-full bg-[#0a1208]/90 backdrop-blur-xl border border-white/10 shadow-xl">
          {/* Layer Chips */}
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
            <span>Forests & Lakes</span>
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
          <MapController target={flyTarget} onZoomChange={setCurrentZoom} />

          <TileLayer
            key={selectedBasemap}
            url={BASEMAPS[selectedBasemap].url}
            attribution={BASEMAPS[selectedBasemap].attr}
            maxNativeZoom={BASEMAPS[selectedBasemap].maxZoom}
            maxZoom={18}
          />

          {/* Minimalist Air Quality Purity Halos (Subtle & serene, not noisy dots) */}
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

          {/* Protected Forests & Lakes (Serene translucent jade & slate) */}
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

          {/* Minimalist Arterial Infrastructure */}
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

      {/* ── Minimalist Floating Sanctuary Card (Sheet) ─────────────────── */}
      {selectedSanctuary && (
        <aside
          aria-label="Selected Sanctuary Preview"
          className="absolute bottom-16 md:bottom-6 left-4 right-4 md:right-auto md:w-96 z-[999] p-5 rounded-3xl bg-[#0a1208]/95 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-fade-up"
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
                sizes="(max-width: 768px) 100vw, 400px"
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

      {/* ── Discreet Bottom Environmental Stats Strip ──────────────────── */}
      {!selectedSanctuary && (
        <footer className="absolute bottom-16 md:bottom-4 inset-x-4 z-[998] pointer-events-none flex justify-center">
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
      )}
    </div>
  );
}
