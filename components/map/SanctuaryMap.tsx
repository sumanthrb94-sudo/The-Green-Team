'use client';

/**
 * Minimalist Leaflet Eco-Map for The Green Team.
 *
 * Surgical GIS Implementation:
 * - 100% full-bleed map canvas without browser scroll conflicts
 * - Default basemap: Satellite (Esri World Imagery) with zero API keys required
 * - Alternative basemaps: Canopy Topo (Esri World Topo) and Clean Vector (Carto Voyager)
 * - ALL 23 official HMDA Outer Ring Road (ORR) exits mapped with meter precision
 * - ALL 19 upcoming NHAI Regional Ring Road (RRR) interchanges mapped with surgical precision
 * - Interactive inspector card for Sanctuaries, ORR Exits, and RRR Interchanges
 * - 1-handed zoom & recenter floating controls for mobile
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
  ArrowUpRight,
  Navigation,
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

// --- Custom Surgical Leaflet Markers ---

function getSanctuaryAccent(id: string) {
  if (id === 'agartha') return '#a3b18a';
  if (id === 'syl') return '#c8a951';
  if (id === 'dates-county') return '#e2c46e';
  if (id === 'ananthagiri-reserve') return '#34d399';
  if (id === 'kollur-canopy') return '#2dd4bf';
  if (id === 'shamirpet-lakeview') return '#38bdf8';
  if (id === 'mucherla-future-city') return '#f59e0b';
  return '#10b981';
}

function createSanctuaryIcon(s: MapLocation, isSelected: boolean) {
  const accentColor = getSanctuaryAccent(s.id);
  const html = `
    <div style="position:relative;display:flex;align-items:center;transform:translate(-50%,-50%);cursor:pointer;z-index:${isSelected ? 1000 : 500};">
      <div style="
        display:flex;
        align-items:center;
        gap:6px;
        background:rgba(10,18,8,0.94);
        backdrop-filter:blur(14px);
        border:1.5px solid ${isSelected ? '#c8a951' : accentColor};
        border-radius:999px;
        padding:4px 10px 4px 6px;
        box-shadow:0 6px 22px rgba(0,0,0,0.7)${isSelected ? ', 0 0 18px rgba(200,169,81,0.6)' : ''};
        transition:all 0.3s cubic-bezier(0.16,1,0.3,1);
      ">
        <span style="
          width:8px;
          height:8px;
          border-radius:50%;
          background:${accentColor};
          box-shadow:0 0 8px ${accentColor};
          animation:${isSelected ? 'none' : 'tgt-pulse 2s infinite'};
        "></span>
        <span style="color:#ffffff;font:700 11px/1 var(--font-manrope),sans-serif;letter-spacing:0.04em;white-space:nowrap;">
          ${s.title}
        </span>
        <span style="
          font:800 9px/1 var(--font-mono),monospace;
          color:${accentColor};
          background:rgba(255,255,255,0.1);
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

function createOrrExitIcon(e: MapLocation, isSelected: boolean, zoom: number) {
  const isDetailed = zoom >= 12 || isSelected;
  const exitNum = e.exitNumber || e.title.replace('ORR ', '');
  const locName = e.location.split('/')[0].trim();

  const html = isDetailed
    ? `
      <div style="position:relative;display:flex;align-items:center;transform:translate(-50%,-50%);cursor:pointer;z-index:${isSelected ? 900 : 300};">
        <div style="
          display:flex;
          align-items:center;
          gap:5px;
          background:rgba(12,18,10,0.92);
          backdrop-filter:blur(10px);
          border:1.5px solid ${isSelected ? '#facc15' : '#c8a951'};
          border-radius:999px;
          padding:3px 8px 3px 6px;
          box-shadow:0 4px 14px rgba(0,0,0,0.6)${isSelected ? ', 0 0 12px rgba(250,204,21,0.5)' : ''};
          transition:all 0.2s ease;
        ">
          <span style="
            background:#c8a951;
            color:#0a1208;
            font:900 8.5px/1 var(--font-mono),monospace;
            padding:2px 4px;
            border-radius:4px;
            letter-spacing:-0.02em;
          ">${exitNum}</span>
          <span style="color:#ffffff;font:700 9.5px/1 var(--font-inter),sans-serif;white-space:nowrap;">${locName}</span>
          <span style="color:#fde047;font:700 8px/1 var(--font-mono),monospace;">${e.aqi}</span>
        </div>
      </div>
    `
    : `
      <div style="position:relative;display:flex;align-items:center;transform:translate(-50%,-50%);cursor:pointer;z-index:200;">
        <div style="
          display:flex;
          align-items:center;
          gap:3px;
          background:rgba(10,18,8,0.9);
          border:1px solid #c8a951;
          border-radius:999px;
          padding:2px 5px;
          box-shadow:0 2px 8px rgba(0,0,0,0.5);
        ">
          <span style="width:4.5px;height:4.5px;border-radius:50%;background:#c8a951;"></span>
          <span style="color:#fef08a;font:800 8px/1 var(--font-mono),monospace;">${exitNum.replace('Exit ', 'E')}</span>
        </div>
      </div>
    `;

  return L.divIcon({
    className: 'minimal-orr-icon',
    html,
    iconSize: undefined,
    iconAnchor: [0, 0],
  });
}

function createRrrExitIcon(e: MapLocation, isSelected: boolean, zoom: number) {
  const isDetailed = zoom >= 12 || isSelected;
  const exitNum = e.exitNumber || 'RRR';
  const locName = e.location.split('/')[0].split('·')[0].trim();

  const html = isDetailed
    ? `
      <div style="position:relative;display:flex;align-items:center;transform:translate(-50%,-50%);cursor:pointer;z-index:${isSelected ? 900 : 300};">
        <div style="
          display:flex;
          align-items:center;
          gap:5px;
          background:rgba(8,20,18,0.92);
          backdrop-filter:blur(10px);
          border:1.5px solid ${isSelected ? '#38bdf8' : '#2dd4bf'};
          border-radius:999px;
          padding:3px 8px 3px 6px;
          box-shadow:0 4px 14px rgba(0,0,0,0.6)${isSelected ? ', 0 0 12px rgba(56,189,248,0.5)' : ''};
          transition:all 0.2s ease;
        ">
          <span style="
            background:#0d9488;
            color:#ffffff;
            font:900 8.5px/1 var(--font-mono),monospace;
            padding:2px 4px;
            border-radius:4px;
            letter-spacing:-0.02em;
          ">${exitNum}</span>
          <span style="color:#ffffff;font:700 9.5px/1 var(--font-inter),sans-serif;white-space:nowrap;">${locName}</span>
          <span style="color:#5eead4;font:700 8px/1 var(--font-mono),monospace;">AQI ${e.aqi}</span>
        </div>
      </div>
    `
    : `
      <div style="position:relative;display:flex;align-items:center;transform:translate(-50%,-50%);cursor:pointer;z-index:200;">
        <div style="
          display:flex;
          align-items:center;
          gap:3px;
          background:rgba(6,20,18,0.9);
          border:1px solid #2dd4bf;
          border-radius:999px;
          padding:2px 5px;
          box-shadow:0 2px 8px rgba(0,0,0,0.5);
        ">
          <span style="width:4.5px;height:4.5px;border-radius:50%;background:#2dd4bf;"></span>
          <span style="color:#a7f3d0;font:800 8px/1 var(--font-mono),monospace;">${exitNum.replace('RRR-', '')}</span>
        </div>
      </div>
    `;

  return L.divIcon({
    className: 'minimal-rrr-icon',
    html,
    iconSize: undefined,
    iconAnchor: [0, 0],
  });
}

function createHazardIcon(name: string, aqi: number) {
  const html = `
    <div style="display:flex;align-items:center;gap:3px;background:rgba(30,10,10,0.92);backdrop-filter:blur(6px);border:1px solid rgba(239,68,68,0.5);border-radius:999px;padding:2px 6px;font:700 8px/1 var(--font-inter),sans-serif;color:#fca5a5;transform:translate(-50%,-50%);white-space:nowrap;">
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

type BasemapStyle = 'satellite' | 'canopy' | 'streets';

// 100% Free tile providers with ZERO API keys required
const BASEMAPS: Record<BasemapStyle, { name: string; url: string; attr: string; maxZoom: number }> = {
  satellite: {
    name: 'Satellite',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attr: 'Imagery &copy; Esri, Maxar, Earthstar Geographics',
    maxZoom: 19,
  },
  canopy: {
    name: 'Canopy Topo',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attr: '&copy; Esri, USGS, NOAA',
    maxZoom: 19,
  },
  streets: {
    name: 'Clean Vector',
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}@2x.png',
    attr: '&copy; OpenStreetMap &copy; CARTO',
    maxZoom: 20,
  },
};

export default function SanctuaryMap() {
  // Default to Satellite (as explicitly requested: no Obsidian / no API key requirements)
  const [selectedBasemap, setSelectedBasemap] = useState<BasemapStyle>('satellite');
  const [activeLayers, setActiveLayers] = useState({
    sanctuaries: true,
    orrExits: true,
    rrrExits: true,
    forests: true,
    infra: true,
    airGlow: true,
    hotspots: false,
  });

  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
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

  const rrrExits = useMemo(
    () => MAP_LOCATIONS.filter(l => l.type === 'rrr-exit'),
    []
  );

  const selectLocation = (loc: MapLocation, zoom = 14) => {
    setSelectedLocation(loc);
    setFlyTarget({ center: loc.coords, zoom });
  };

  const toggleLayer = (layer: keyof typeof activeLayers) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const resetView = () => {
    setSelectedLocation(null);
    setFlyTarget({ center: [17.49, 78.48], zoom: 10 });
  };

  const focusOrr = () => {
    setSelectedLocation(null);
    setFlyTarget({ center: [17.41, 78.48], zoom: 10 });
  };

  const focusRrr = () => {
    setSelectedLocation(null);
    setFlyTarget({ center: [17.48, 78.48], zoom: 9 });
  };

  return (
    <div
      data-fullscreen-map="true"
      className="relative w-full h-[calc(100dvh-3.5rem)] md:h-[calc(100svh-3.5rem)] overflow-hidden bg-[#0a1208] select-none touch-none"
    >
      {/* ── MOBILE TOP HUD (Single Sleek Row, < 40px) ──────────────────── */}
      <header className="md:hidden absolute top-2 inset-x-2 z-[999] pointer-events-none flex items-center justify-between gap-1.5">
        {/* Horizontal Navigation & Filter Carousel */}
        <div className="pointer-events-auto flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 flex-1 pr-1">
          {/* All Overview Pill */}
          <button
            onClick={resetView}
            className={cn(
              'px-3 py-1.5 rounded-full text-[9.5px] font-extrabold uppercase tracking-wider backdrop-blur-xl border transition-all shrink-0 active:scale-95',
              !selectedLocation
                ? 'bg-[#c8a951] text-[#0a1208] border-[#c8a951] shadow-lg font-black'
                : 'bg-[#0a1208]/92 text-white/80 border-white/10 hover:bg-white/10'
            )}
          >
            Overview
          </button>

          {/* Quick-Jump to ORR Ring */}
          <button
            onClick={focusOrr}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[9.5px] font-bold tracking-wide backdrop-blur-xl border border-[#c8a951]/40 bg-[#0a1208]/92 text-[#facc15] shrink-0 active:scale-95 shadow-md"
          >
            <span>🛣️ ORR (23 Exits)</span>
          </button>

          {/* Quick-Jump to RRR Orbital */}
          <button
            onClick={focusRrr}
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[9.5px] font-bold tracking-wide backdrop-blur-xl border border-[#2dd4bf]/40 bg-[#0a1208]/92 text-[#2dd4bf] shrink-0 active:scale-95 shadow-md"
          >
            <span>🌐 RRR (19 Exits)</span>
          </button>

          <span className="w-px h-3.5 bg-white/15 mx-0.5 shrink-0" />

          {/* Individual Sanctuaries */}
          {sanctuaries.map(s => {
            const active = selectedLocation?.id === s.id;
            const dotColor = getSanctuaryAccent(s.id);
            return (
              <button
                key={s.id}
                onClick={() => selectLocation(s, 13)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9.5px] font-bold tracking-wide backdrop-blur-xl border transition-all shrink-0 active:scale-95',
                  active
                    ? 'bg-[#c8a951] text-[#0a1208] border-[#c8a951] shadow-lg'
                    : 'bg-[#0a1208]/92 text-white/80 border-white/10 hover:bg-white/10'
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
            className="w-9 h-9 rounded-full bg-[#0a1208]/94 backdrop-blur-xl border border-white/15 text-white/90 hover:text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
          >
            <Layers className="w-4 h-4 text-[#c8a951]" />
          </button>
        </div>
      </header>

      {/* ── DESKTOP TOP HUD (Widescreen Architectural) ─────────────────── */}
      <header className="hidden md:flex absolute top-4 inset-x-6 z-[999] pointer-events-none items-center justify-between gap-3 max-w-7xl mx-auto">
        {/* Brand / Status Pill */}
        <div className="pointer-events-auto flex items-center gap-2 self-start p-1.5 pl-3.5 pr-2 rounded-full bg-[#0a1208]/92 backdrop-blur-xl border border-white/10 shadow-xl">
          <span className="w-2 h-2 rounded-full bg-[#a3b18a] animate-pulse" />
          <span className="text-[10px] uppercase tracking-[0.25em] font-extrabold text-white">
            Eco Intelligence
          </span>
          <span className="text-[9px] font-mono text-white/40">· HYD</span>

          <span className="w-px h-3.5 bg-white/15 mx-1" />

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1">
            <button
              onClick={focusOrr}
              className="px-2.5 py-1 rounded-full text-[9px] font-bold text-[#facc15] hover:bg-white/5 transition-all"
            >
              ORR (23 Exits)
            </button>
            <button
              onClick={focusRrr}
              className="px-2.5 py-1 rounded-full text-[9px] font-bold text-[#2dd4bf] hover:bg-white/5 transition-all"
            >
              RRR (19 Exits)
            </button>
            <span className="w-px h-3 bg-white/10 mx-0.5" />
            {sanctuaries.map(s => {
              const active = selectedLocation?.id === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => selectLocation(s, 13)}
                  className={cn(
                    'px-2.5 py-1 rounded-full text-[9px] font-bold tracking-wider transition-all',
                    active
                      ? 'bg-[#c8a951] text-[#0a1208] shadow-sm'
                      : 'text-white/70 hover:text-white hover:bg-white/5'
                  )}
                >
                  {s.title.replace('MODCON ', '')}
                </button>
              );
            })}
          </div>
        </div>

        {/* Desktop Layer Toggles & Style Switcher */}
        <div className="pointer-events-auto flex items-center gap-1.5 p-1.5 rounded-full bg-[#0a1208]/92 backdrop-blur-xl border border-white/10 shadow-xl">
          <button
            onClick={() => toggleLayer('orrExits')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] uppercase tracking-wider font-bold transition-all',
              activeLayers.orrExits
                ? 'bg-[#c8a951]/20 text-[#fde047] border border-[#c8a951]/40'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            <span>ORR Exits</span>
          </button>

          <button
            onClick={() => toggleLayer('rrrExits')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] uppercase tracking-wider font-bold transition-all',
              activeLayers.rrrExits
                ? 'bg-[#0d9488]/25 text-[#2dd4bf] border border-[#2dd4bf]/40'
                : 'text-white/40 hover:text-white/70'
            )}
          >
            <span>RRR Project</span>
          </button>

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

          <span className="w-px h-3.5 bg-white/15 mx-0.5" />

          {/* Basemap Switcher */}
          <button
            onClick={() =>
              setSelectedBasemap(prev =>
                prev === 'satellite' ? 'canopy' : prev === 'canopy' ? 'streets' : 'satellite'
              )
            }
            title="Switch map theme (Satellite / Canopy / Vector)"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[9px] uppercase tracking-wider font-bold text-white/70 hover:text-white transition-colors"
          >
            <Layers className="w-3 h-3 text-[#c8a951]" />
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
          className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#0a1208]/92 backdrop-blur-xl border border-white/15 text-white/80 hover:text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => setZoomOutTick(t => t + 1)}
          aria-label="Zoom out"
          className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#0a1208]/92 backdrop-blur-xl border border-white/15 text-white/80 hover:text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={resetView}
          aria-label="Reset overview"
          title="Reset to Hyderabad Corridor"
          className="w-8 h-8 md:w-9 md:h-9 rounded-full bg-[#0a1208]/92 backdrop-blur-xl border border-white/15 text-[#c8a951] hover:text-white flex items-center justify-center shadow-lg active:scale-90 transition-transform"
        >
          <Compass className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ── Leaflet Canvas ─────────────────────────────────────────────── */}
      {mounted && (
        <MapContainer
          center={[17.49, 78.48]}
          zoom={10}
          minZoom={8}
          maxZoom={18}
          zoomControl={false}
          scrollWheelZoom={true}
          maxBounds={[
            [16.7, 77.4],
            [18.3, 79.6],
          ]}
          maxBoundsViscosity={0.85}
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
              {/* Narsapur Pure Air Belt (Agartha) */}
              <Circle
                center={[17.75, 78.28]}
                radius={9000}
                pathOptions={{
                  fillColor: '#86efac',
                  fillOpacity: 0.15,
                  color: '#4ade80',
                  weight: 1.5,
                  opacity: 0.45,
                }}
              />
              {/* Kandukur Forest Canopy (Dates County & Future City) */}
              <Circle
                center={[17.118, 78.588]}
                radius={7500}
                pathOptions={{
                  fillColor: '#86efac',
                  fillOpacity: 0.12,
                  color: '#4ade80',
                  weight: 1.5,
                  opacity: 0.4,
                }}
              />
              {/* Gandipet Reservoir Catchment */}
              <Circle
                center={[17.37, 78.29]}
                radius={6500}
                pathOptions={{
                  fillColor: '#6ee7b7',
                  fillOpacity: 0.1,
                  color: '#34d399',
                  weight: 1,
                  opacity: 0.3,
                }}
              />
              {/* Urban Industrial Heat Island */}
              <Circle
                center={[17.44, 78.44]}
                radius={11000}
                pathOptions={{
                  fillColor: '#f87171',
                  fillOpacity: 0.07,
                  color: '#ef4444',
                  weight: 1,
                  opacity: 0.25,
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
                        fillOpacity: 0.18,
                        color: '#10b981',
                        weight: 1.5,
                        opacity: 0.55,
                      }
                    : {
                        fillColor: '#38bdf8',
                        fillOpacity: 0.2,
                        color: '#0ea5e9',
                        weight: 1.5,
                        opacity: 0.6,
                      }
                }
              />
            ))}

          {/* Arterial Infrastructure Polylines */}
          {activeLayers.infra && (
            <>
              {/* ORR — Luminous fine gold ring (158 km) */}
              <Polyline
                positions={ORR_PATH}
                pathOptions={{
                  color: '#c8a951',
                  weight: 2.5,
                  opacity: 0.9,
                }}
              />
              {/* RRR — Refined dashed teal corridor (340 km NHAI orbital) */}
              <Polyline
                positions={RRR_PATH}
                pathOptions={{
                  color: '#2dd4bf',
                  weight: 2,
                  opacity: 0.75,
                  dashArray: '8, 8',
                }}
              />
            </>
          )}

          {/* City Hazard / Pollution Hotspots */}
          {activeLayers.hotspots &&
            KEY_ZONES.map(z => (
              <Marker
                key={z.id}
                position={z.coords}
                icon={createHazardIcon(z.name, z.aqi)}
              />
            ))}

          {/* HMDA 8-Lane ORR 23 Official Interchanges */}
          {activeLayers.orrExits &&
            orrExits.map(loc => {
              const isSelected = selectedLocation?.id === loc.id;
              return (
                <Marker
                  key={loc.id}
                  position={loc.coords}
                  icon={createOrrExitIcon(loc, isSelected, currentZoom)}
                  eventHandlers={{
                    click: () => selectLocation(loc, 14),
                  }}
                />
              );
            })}

          {/* NHAI 340-km RRR 19 Surgical Interchanges */}
          {activeLayers.rrrExits &&
            rrrExits.map(loc => {
              const isSelected = selectedLocation?.id === loc.id;
              return (
                <Marker
                  key={loc.id}
                  position={loc.coords}
                  icon={createRrrExitIcon(loc, isSelected, currentZoom)}
                  eventHandlers={{
                    click: () => selectLocation(loc, 13),
                  }}
                />
              );
            })}

          {/* Curated Sanctuary Luxury Micro-Pins */}
          {activeLayers.sanctuaries &&
            sanctuaries.map(s => {
              const isSelected = selectedLocation?.id === s.id;
              return (
                <Marker
                  key={s.id}
                  position={s.coords}
                  icon={createSanctuaryIcon(s, isSelected)}
                  eventHandlers={{
                    click: () => selectLocation(s, 13),
                  }}
                />
              );
            })}
        </MapContainer>
      )}

      {/* ── DYNAMIC INSPECTION SHEET / CARD (Sanctuaries, ORR & RRR Exits) ─── */}
      {selectedLocation && (
        <>
          {/* Mobile Sheet Layout */}
          <aside
            aria-label="Selected Location Details"
            className="md:hidden absolute bottom-[4.75rem] inset-x-3 z-[999] p-3.5 rounded-2xl bg-[#0a1208]/96 backdrop-blur-2xl border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.85)] animate-fade-up"
          >
            {/* Sanctuary Variant */}
            {selectedLocation.type === 'sanctuary' && (
              <>
                <div className="flex items-center gap-3 relative">
                  {selectedLocation.image && (
                    <div className="relative w-18 h-18 rounded-xl overflow-hidden shrink-0 border border-white/10">
                      <Image
                        src={selectedLocation.image}
                        alt={selectedLocation.title}
                        fill
                        sizes="80px"
                        className="object-cover"
                      />
                      <span className="absolute bottom-1 left-1 px-1.5 py-0.2 rounded bg-black/80 text-[7.5px] font-mono font-black text-[#86efac]">
                        AQI {selectedLocation.aqi}
                      </span>
                    </div>
                  )}

                  <div className="flex-1 min-w-0 pr-6">
                    <span className="text-[7.5px] uppercase tracking-[0.25em] font-extrabold text-[#c8a951] block leading-none mb-1">
                      Curated Sanctuary
                    </span>
                    <h3 className="font-headline font-extrabold text-base text-white truncate leading-snug">
                      {selectedLocation.title}
                    </h3>
                    <p className="text-[11px] text-white/55 truncate">{selectedLocation.location}</p>

                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="px-2 py-0.5 rounded-full bg-white/5 text-[#86efac] text-[8.5px] font-bold border border-white/10 flex items-center gap-1">
                        <Wind className="w-2.5 h-2.5 text-[#4ade80]" />
                        AQI {selectedLocation.aqi}
                      </span>
                      {selectedLocation.noise && (
                        <span className="px-2 py-0.5 rounded-full bg-white/5 text-white/70 text-[8.5px] font-bold border border-white/10 flex items-center gap-1">
                          <Volume2 className="w-2.5 h-2.5 text-white/40" />
                          {selectedLocation.noise} dB
                        </span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={() => setSelectedLocation(null)}
                    aria-label="Close details"
                    className="absolute top-0 right-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>

                <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/10">
                  <Link
                    href={`/sanctuaries/${selectedLocation.id}`}
                    className="flex-1 py-2 rounded-xl bg-[#c8a951] text-[#0a1208] text-[9.5px] uppercase tracking-[0.2em] font-black text-center flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all"
                  >
                    <span>Explore Sanctuary</span>
                    <ChevronRight className="w-3 h-3" />
                  </Link>
                  <button
                    onClick={() => setFlyTarget({ center: selectedLocation.coords, zoom: 15 })}
                    className="px-3.5 py-2 rounded-xl border border-white/20 text-white text-[9px] uppercase tracking-wider font-bold hover:bg-white/10 active:scale-95 transition-all"
                  >
                    Zoom
                  </button>
                </div>
              </>
            )}

            {/* ORR Exit Variant */}
            {selectedLocation.type === 'exit' && (
              <div className="relative pr-6">
                <button
                  onClick={() => setSelectedLocation(null)}
                  aria-label="Close details"
                  className="absolute top-0 right-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>

                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-[#c8a951]/20 text-[#fde047] text-[8px] font-black uppercase tracking-wider border border-[#c8a951]/30">
                    {selectedLocation.exitNumber || 'ORR Exit'}
                  </span>
                  <span className="text-[8.5px] text-[#86efac] font-mono font-bold">
                    Local AQI {selectedLocation.aqi}
                  </span>
                </div>

                <h3 className="font-headline font-black text-base text-white leading-tight">
                  {selectedLocation.title} · {selectedLocation.location}
                </h3>

                <p className="text-[11px] text-white/60 mt-1 leading-snug">
                  {selectedLocation.highway}
                </p>

                {selectedLocation.gatewayTo && (
                  <p className="text-[10px] text-[#c8a951] mt-1.5 font-medium leading-relaxed">
                    ✨ {selectedLocation.gatewayTo}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/10">
                  <button
                    onClick={() => setFlyTarget({ center: selectedLocation.coords, zoom: 15 })}
                    className="flex-1 py-2 rounded-xl bg-[#c8a951] text-[#0a1208] text-[9.5px] uppercase tracking-[0.2em] font-black text-center flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Fly To Interchange</span>
                  </button>
                </div>
              </div>
            )}

            {/* RRR Exit Variant */}
            {selectedLocation.type === 'rrr-exit' && (
              <div className="relative pr-6">
                <button
                  onClick={() => setSelectedLocation(null)}
                  aria-label="Close details"
                  className="absolute top-0 right-0 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center text-white/70 hover:text-white transition-colors"
                >
                  <X className="w-3 h-3" />
                </button>

                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2 py-0.5 rounded-full bg-[#0d9488]/30 text-[#2dd4bf] text-[8px] font-black uppercase tracking-wider border border-[#2dd4bf]/40">
                    NHAI RRR 340-KM PROJECT
                  </span>
                  <span className="text-[8.5px] text-[#5eead4] font-mono font-bold">
                    Canopy AQI {selectedLocation.aqi}
                  </span>
                </div>

                <h3 className="font-headline font-black text-base text-white leading-tight">
                  {selectedLocation.title}
                </h3>

                <p className="text-[11px] text-white/60 mt-1 leading-snug">
                  {selectedLocation.highway}
                </p>

                {selectedLocation.gatewayTo && (
                  <p className="text-[10px] text-[#a7f3d0] mt-1.5 font-medium leading-relaxed">
                    🌿 {selectedLocation.gatewayTo}
                  </p>
                )}

                <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-white/10">
                  <button
                    onClick={() => setFlyTarget({ center: selectedLocation.coords, zoom: 14 })}
                    className="flex-1 py-2 rounded-xl bg-[#0d9488] text-white text-[9.5px] uppercase tracking-[0.2em] font-black text-center flex items-center justify-center gap-1 shadow-md active:scale-95 transition-all"
                  >
                    <Navigation className="w-3 h-3" />
                    <span>Explore RRR Alignment</span>
                  </button>
                </div>
              </div>
            )}
          </aside>

          {/* Desktop Floating Card Layout */}
          <aside
            aria-label="Selected Location Details"
            className="hidden md:block absolute bottom-6 left-6 w-[24rem] z-[999] p-5 rounded-3xl bg-[#0a1208]/96 backdrop-blur-2xl border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.85)] animate-fade-up"
          >
            {/* Sanctuary Variant */}
            {selectedLocation.type === 'sanctuary' && (
              <>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div>
                    <span className="text-[9px] uppercase tracking-[0.25em] font-extrabold text-[#c8a951] block mb-0.5">
                      Curated Sanctuary
                    </span>
                    <h3 className="font-headline font-extrabold text-xl text-white">
                      {selectedLocation.title}
                    </h3>
                    <p className="text-xs text-white/50 mt-0.5">{selectedLocation.location}</p>
                  </div>
                  <button
                    onClick={() => setSelectedLocation(null)}
                    aria-label="Close details"
                    className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                {selectedLocation.image && (
                  <div className="relative w-full h-32 rounded-2xl overflow-hidden mb-3.5 border border-white/10">
                    <Image
                      src={selectedLocation.image}
                      alt={selectedLocation.title}
                      fill
                      sizes="400px"
                      className="object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                    <div className="absolute bottom-2.5 left-3 flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded-full bg-[#0a1208]/90 text-[#86efac] text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border border-white/10">
                        <Wind className="w-3 h-3 text-[#4ade80]" /> AQI {selectedLocation.aqi}
                      </span>
                      {selectedLocation.noise && (
                        <span className="px-2 py-0.5 rounded-full bg-[#0a1208]/90 text-white/70 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1 border border-white/10">
                          <Volume2 className="w-3 h-3 text-white/40" /> {selectedLocation.noise} dB
                        </span>
                      )}
                    </div>
                  </div>
                )}

                <p className="text-xs text-white/70 leading-relaxed mb-4 line-clamp-2">
                  {selectedLocation.description}
                </p>

                <div className="flex items-center gap-2">
                  <Link
                    href={`/sanctuaries/${selectedLocation.id}`}
                    className="flex-1 py-3 rounded-full bg-[#c8a951] text-[#0a1208] text-[9.5px] uppercase tracking-[0.25em] font-extrabold text-center hover:bg-[#d4a72c] transition-all flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <span>Explore Sanctuary</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </Link>
                  <button
                    onClick={() => setFlyTarget({ center: selectedLocation.coords, zoom: 15 })}
                    title="Zoom to location"
                    className="px-4 py-3 rounded-full border border-white/20 text-white text-[9.5px] uppercase tracking-wider font-bold hover:bg-white/10 transition-colors"
                  >
                    Zoom
                  </button>
                </div>
              </>
            )}

            {/* ORR Exit Variant */}
            {selectedLocation.type === 'exit' && (
              <>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#c8a951]/20 text-[#fde047] text-[8.5px] font-black uppercase tracking-wider border border-[#c8a951]/30 inline-block mb-1.5">
                      HMDA 8-Lane ORR Interchange
                    </span>
                    <h3 className="font-headline font-black text-xl text-white">
                      {selectedLocation.title} · {selectedLocation.location}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedLocation(null)}
                    aria-label="Close details"
                    className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 mb-3 space-y-1.5 text-xs text-white/80">
                  <p>
                    <strong className="text-[#fde047]">Connecting Arterial:</strong> {selectedLocation.highway}
                  </p>
                  <p>
                    <strong className="text-white/50">Strategic Corridor:</strong> {selectedLocation.corridor}
                  </p>
                  {selectedLocation.gatewayTo && (
                    <p className="text-[#c8a951] font-semibold pt-1 border-t border-white/10">
                      ✨ {selectedLocation.gatewayTo}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs mb-4 px-1">
                  <span className="text-white/50">Localized Air Index:</span>
                  <span className="px-2.5 py-1 rounded-full bg-[#c8a951]/15 text-[#fde047] font-mono font-bold text-xs">
                    AQI {selectedLocation.aqi}
                  </span>
                </div>

                <button
                  onClick={() => setFlyTarget({ center: selectedLocation.coords, zoom: 15 })}
                  className="w-full py-3 rounded-full bg-[#c8a951] text-[#0a1208] text-[9.5px] uppercase tracking-[0.25em] font-extrabold text-center hover:bg-[#d4a72c] transition-all flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Zoom to Interchange (10m Precision)</span>
                </button>
              </>
            )}

            {/* RRR Exit Variant */}
            {selectedLocation.type === 'rrr-exit' && (
              <>
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <span className="px-2.5 py-0.5 rounded-full bg-[#0d9488]/30 text-[#2dd4bf] text-[8.5px] font-black uppercase tracking-wider border border-[#2dd4bf]/40 inline-block mb-1.5">
                      NHAI 340-km RRR Project Interchange
                    </span>
                    <h3 className="font-headline font-black text-xl text-white">
                      {selectedLocation.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedLocation(null)}
                    aria-label="Close details"
                    className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="p-3 rounded-2xl bg-white/5 border border-white/10 mb-3 space-y-1.5 text-xs text-white/80">
                  <p>
                    <strong className="text-[#2dd4bf]">Interchange Highway:</strong> {selectedLocation.highway}
                  </p>
                  <p>
                    <strong className="text-white/50">Corridor / Scope:</strong> {selectedLocation.corridor}
                  </p>
                  {selectedLocation.status && (
                    <p className="text-white/60 text-[11px]">
                      <strong className="text-white/40">Status:</strong> {selectedLocation.status}
                    </p>
                  )}
                  {selectedLocation.gatewayTo && (
                    <p className="text-[#5eead4] font-semibold pt-1 border-t border-white/10">
                      🌿 {selectedLocation.gatewayTo}
                    </p>
                  )}
                </div>

                <div className="flex items-center justify-between text-xs mb-4 px-1">
                  <span className="text-white/50">Canopy Air Index:</span>
                  <span className="px-2.5 py-1 rounded-full bg-[#0d9488]/20 text-[#5eead4] font-mono font-bold text-xs">
                    AQI {selectedLocation.aqi} (Pristine)
                  </span>
                </div>

                <button
                  onClick={() => setFlyTarget({ center: selectedLocation.coords, zoom: 14 })}
                  className="w-full py-3 rounded-full bg-[#0d9488] text-white text-[9.5px] uppercase tracking-[0.25em] font-extrabold text-center hover:bg-[#0f766e] transition-all flex items-center justify-center gap-1.5 shadow-md"
                >
                  <Navigation className="w-3.5 h-3.5" />
                  <span>Inspect RRR Node Alignment</span>
                </button>
              </>
            )}
          </aside>
        </>
      )}

      {/* ── ENVIRONMENTAL BENCHMARK PILL (When No Location Selected) ───── */}
      {!selectedLocation && (
        <>
          {/* Mobile Discrete Pill */}
          <div className="md:hidden absolute bottom-[4.75rem] left-1/2 -translate-x-1/2 z-[998] pointer-events-none">
            <div className="pointer-events-auto flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#0a1208]/92 backdrop-blur-xl border border-white/10 shadow-lg text-[8.5px] text-white/80 whitespace-nowrap">
              <span className="w-1.5 h-1.5 rounded-full bg-[#86efac] animate-pulse" />
              <span className="text-[#86efac] font-bold">Sanctuaries: 12–22 AQI</span>
              <span className="text-white/30">|</span>
              <span className="text-[#facc15] font-bold">ORR: 23 Exits</span>
              <span className="text-white/30">|</span>
              <span className="text-[#2dd4bf] font-bold">RRR: 19 Exits</span>
            </div>
          </div>

          {/* Desktop Footer Strip */}
          <footer className="hidden md:flex absolute bottom-4 inset-x-4 z-[998] pointer-events-none justify-center">
            <div className="pointer-events-auto flex items-center gap-3 px-4 py-2 rounded-full bg-[#0a1208]/90 backdrop-blur-xl border border-white/10 shadow-lg text-[9px] text-white/70">
              <span className="flex items-center gap-1.5 text-[#86efac] font-bold">
                <Sparkles className="w-3 h-3 text-[#4ade80]" />
                <span>Sanctuaries: 12–22 AQI</span>
              </span>
              <span className="text-white/20">|</span>
              <span className="text-[#facc15] font-bold">158 km ORR (23 Exits Mapped)</span>
              <span className="text-white/20">|</span>
              <span className="text-[#2dd4bf] font-bold">340 km RRR (19 Interchanges Mapped)</span>
              <span className="text-white/20">|</span>
              <span className="text-white/50">City Center: 148+ AQI</span>
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
            className="w-full bg-[#0a1208] border-t border-white/15 rounded-t-3xl p-5 pb-8 shadow-2xl animate-fade-up max-h-[85vh] overflow-y-auto"
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
                  Select key-free satellite basemaps & expressway layers
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
                Basemap Theme (100% Key-Free)
              </span>
              <div className="grid grid-cols-3 gap-2">
                {(['satellite', 'canopy', 'streets'] as BasemapStyle[]).map(style => {
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
                Active GIS Layers
              </span>

              {/* ORR Exits */}
              <button
                onClick={() => toggleLayer('orrExits')}
                className={cn(
                  'w-full py-2.5 px-3.5 rounded-xl border flex items-center justify-between text-left transition-all',
                  activeLayers.orrExits
                    ? 'bg-[#c8a951]/20 border-[#c8a951]/40 text-white'
                    : 'bg-white/5 border-white/10 text-white/50'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Navigation className={cn('w-4 h-4', activeLayers.orrExits ? 'text-[#fde047]' : 'text-white/40')} />
                  <div>
                    <span className="text-xs font-bold block">ORR 23 Official Interchanges</span>
                    <span className="text-[9px] text-white/40 block">Exit 1 to Exit 19 with 10-meter precision</span>
                  </div>
                </div>
                <div
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center',
                    activeLayers.orrExits ? 'bg-[#c8a951] text-[#0a1208]' : 'bg-white/10'
                  )}
                >
                  {activeLayers.orrExits && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>

              {/* RRR Exits */}
              <button
                onClick={() => toggleLayer('rrrExits')}
                className={cn(
                  'w-full py-2.5 px-3.5 rounded-xl border flex items-center justify-between text-left transition-all',
                  activeLayers.rrrExits
                    ? 'bg-[#0d9488]/30 border-[#2dd4bf]/40 text-white'
                    : 'bg-white/5 border-white/10 text-white/50'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <Compass className={cn('w-4 h-4', activeLayers.rrrExits ? 'text-[#2dd4bf]' : 'text-white/40')} />
                  <div>
                    <span className="text-xs font-bold block">RRR 19 Planned Interchanges</span>
                    <span className="text-[9px] text-white/40 block">340 km NHAI Northern & Southern arcs</span>
                  </div>
                </div>
                <div
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center',
                    activeLayers.rrrExits ? 'bg-[#0d9488] text-white' : 'bg-white/10'
                  )}
                >
                  {activeLayers.rrrExits && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>

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
                    <span className="text-[9px] text-white/40 block">Green canopy oxygenation halos</span>
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

              {/* Expressway Alignments */}
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
                    <span className="text-xs font-bold block">Expressway Polylines</span>
                    <span className="text-[9px] text-white/40 block">158 km ORR & 340 km RRR alignments</span>
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
