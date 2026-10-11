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
  Plus,
  Minus,
  Check,
  AlertTriangle,
  Compass,
  Navigation,
  SlidersHorizontal,
  Search,
  Map as MapIcon,
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
import { cn, formatRs } from '@/lib/utils';
import { SiteLayoutLayer } from '@/components/map/SiteLayoutLayer';
import {
  SITE_LAYOUTS,
  PLOT_STATUS_COLOR,
  layoutCenter,
  type GeoPlot,
  type LayoutAnchors,
} from '@/lib/data/site-layouts';
import { SITE_PLAN_CONFIG } from '@/lib/data/agartha-layout';
import { WHATSAPP } from '@/lib/data/contact';
import { useAuth } from '@/components/auth/AuthProvider';

/** Zoom at which georeferenced site layouts replace the sanctuary pin. */
const LAYOUT_MIN_ZOOM = 15;

// --- Custom Surgical Leaflet Markers ---

function getSanctuaryAccent(id: string) {
  if (id === 'agartha') return '#a3b18a';
  if (id === 'syl') return '#c8a951';
  if (id === 'dates-county') return '#e2c46e';
  return '#10b981';
}

function createSanctuaryIcon(s: MapLocation, isSelected: boolean) {
  const accent = getSanctuaryAccent(s.id);
  const w = isSelected ? 38 : 30;
  const h = Math.round(w * 1.3);
  const html = `
    <div title="${s.title}" style="width:${w}px;height:${h}px;cursor:pointer;filter:drop-shadow(0 4px 8px rgba(0,0,0,.6));transition:transform .2s ease;">
      <svg viewBox="0 0 30 39" width="${w}" height="${h}" aria-hidden="true">
        <path d="M15 38c-1-3.5-13-15-13-23.5a13 13 0 0 1 26 0C28 23 16 34.5 15 38z"
          fill="${isSelected ? '#c8a951' : '#0a1208'}" stroke="${isSelected ? '#fff' : accent}" stroke-width="2"/>
        <circle cx="15" cy="14.5" r="5" fill="${isSelected ? '#0a1208' : accent}"/>
      </svg>
    </div>`;
  return L.divIcon({
    className: 'minimal-sanctuary-icon',
    html,
    iconSize: [w, h],
    // tip of the pin sits on the coordinate
    iconAnchor: [w / 2, h],
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
  // Minimal by default: sanctuaries, ORR/RRR rings and state borders. The rest lives under Filters.
  const [activeLayers, setActiveLayers] = useState({
    sanctuaries: true,
    borders: true,
    orrExits: false,
    rrrExits: false,
    forests: false,
    infra: true,
    airGlow: false,
    hotspots: false,
  });

  const [selectedLocation, setSelectedLocation] = useState<MapLocation | null>(null);
  const [flyTarget, setFlyTarget] = useState<{ center: LatLng; zoom: number } | null>(null);
  const [currentZoom, setCurrentZoom] = useState(10);
  const [mounted, setMounted] = useState(false);
  const [showLayersSheet, setShowLayersSheet] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [zoomInTick, setZoomInTick] = useState(0);
  const [zoomOutTick, setZoomOutTick] = useState(0);

  // Georeferenced site layouts (lib/data/site-layouts.ts)
  const { user, openAuth } = useAuth();
  const [layoutVisible, setLayoutVisible] = useState(true);
  const [selectedPlot, setSelectedPlot] = useState<(GeoPlot & { sanctuaryId: string }) | null>(null);
  const [anchorsById, setAnchorsById] = useState<Record<string, LayoutAnchors>>(() =>
    Object.fromEntries(Object.values(SITE_LAYOUTS).map(l => [l.sanctuaryId, l.anchors]))
  );
  // /map?calibrate=<id> shows drag handles for lining a layout up with the imagery
  const [calibrateId, setCalibrateId] = useState<string | null>(null);
  const layoutsOn = layoutVisible && currentZoom >= LAYOUT_MIN_ZOOM;

  // Prevent background scroll bounce on mobile browsers
  useEffect(() => {
    setMounted(true);
    const cal = new URLSearchParams(window.location.search).get('calibrate');
    if (cal && SITE_LAYOUTS[cal]) {
      setCalibrateId(cal);
      setFlyTarget({ center: layoutCenter(SITE_LAYOUTS[cal].anchors), zoom: 17 });
    }
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
    setSelectedPlot(null);
    // A sanctuary with a site layout opens straight onto its plots
    const anchors = anchorsById[loc.id];
    if (anchors) {
      setLayoutVisible(true);
      setFlyTarget({ center: layoutCenter(anchors), zoom: 16 });
    } else {
      setFlyTarget({ center: loc.coords, zoom });
    }
  };

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return sanctuaries;
    return sanctuaries.filter(s => `${s.title} ${s.location} ${s.description ?? ''}`.toLowerCase().includes(q));
  }, [query, sanctuaries]);

  // Layers switched on beyond the default (sanctuaries) — shown on the Filters badge
  const activeFilterCount = Object.entries(activeLayers).filter(([k, v]) => !['sanctuaries', 'borders', 'infra'].includes(k) && v).length;

  const toggleLayer = (layer: keyof typeof activeLayers) => {
    setActiveLayers(prev => ({ ...prev, [layer]: !prev[layer] }));
  };

  const resetView = () => {
    setSelectedLocation(null);
    setSelectedPlot(null);
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
      {/* ── PROPERTY SEARCH (top left) ─────────────────────────────────── */}
      <div className="absolute left-3 top-3 md:left-5 md:top-5 z-[1001] w-[calc(100%-5rem)] max-w-xs">
        {searchOpen ? (
          <div className="rounded-2xl bg-[#0a1208]/95 backdrop-blur-xl border border-white/15 shadow-lg overflow-hidden">
            <div className="flex items-center gap-2 px-3 h-10">
              <Search className="w-4 h-4 text-white/60 shrink-0" />
              <input
                autoFocus
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search properties or areas"
                className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/40 outline-none"
              />
              <button
                onClick={() => {
                  setSearchOpen(false);
                  setQuery('');
                }}
                aria-label="Close search"
                className="text-white/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <ul className="border-t border-white/10 max-h-64 overflow-y-auto">
              {searchResults.map(s => (
                <li key={s.id}>
                  <button
                    onClick={() => {
                      selectLocation(s, 14);
                      setSearchOpen(false);
                      setQuery('');
                    }}
                    className="w-full text-left px-3 py-2.5 hover:bg-white/5 flex flex-col"
                  >
                    <span className="text-[13px] font-bold text-white">{s.title}</span>
                    <span className="text-[11px] text-white/50">{s.location}</span>
                  </button>
                </li>
              ))}
              {searchResults.length === 0 && (
                <li className="px-3 py-2.5 text-[12px] text-white/50">No properties match “{query}”</li>
              )}
            </ul>
          </div>
        ) : (
          <button
            onClick={() => setSearchOpen(true)}
            aria-label="Search properties"
            className="w-10 h-10 rounded-full bg-[#0a1208]/90 backdrop-blur-xl border border-white/15 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
          >
            <Search className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* ── FILTERS BUTTON (the only chrome on the map) ─────────────────── */}
      <div className="absolute right-3 top-3 md:right-5 md:top-5 z-[999] flex flex-col items-end gap-1.5">
        <button
          onClick={() => setShowLayersSheet(true)}
          aria-label="Filters"
          className="relative w-10 h-10 rounded-full bg-[#0a1208]/90 backdrop-blur-xl border border-white/15 text-white flex items-center justify-center shadow-lg active:scale-95 transition-transform"
        >
          <SlidersHorizontal className="w-4 h-4" />
          {activeFilterCount > 0 && (
            <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#c8a951] text-[#0a1208] text-[9px] font-black flex items-center justify-center">
              {activeFilterCount}
            </span>
          )}
        </button>
        {/* Zoom buttons only where there's no pinch */}
        <button
          onClick={() => setZoomInTick(t => t + 1)}
          aria-label="Zoom in"
          className="hidden md:flex w-10 h-10 rounded-full bg-[#0a1208]/90 backdrop-blur-xl border border-white/15 text-white/80 hover:text-white items-center justify-center shadow-lg"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={() => setZoomOutTick(t => t + 1)}
          aria-label="Zoom out"
          className="hidden md:flex w-10 h-10 rounded-full bg-[#0a1208]/90 backdrop-blur-xl border border-white/15 text-white/80 hover:text-white items-center justify-center shadow-lg"
        >
          <Minus className="w-4 h-4" />
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
          {/* Borders & place names — the other two basemaps already carry their own */}
          {activeLayers.borders && selectedBasemap === 'satellite' && (
            <TileLayer
              url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
              attribution="Boundaries &copy; Esri"
              maxNativeZoom={19}
              maxZoom={18}
            />
          )}

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
              // the layout itself marks the site once it's drawn
              if ((layoutsOn || calibrateId === s.id) && anchorsById[s.id]) return null;
              return (
                <Marker
                  key={s.id}
                  position={s.coords}
                  icon={createSanctuaryIcon(s, isSelected)}
                  eventHandlers={{
                    click: () => selectLocation(s, 14),
                  }}
                />
              );
            })}
          {/* Georeferenced site layouts — master plan + plots on the imagery */}
          {Object.values(SITE_LAYOUTS).map(layout =>
            layoutsOn || calibrateId === layout.sanctuaryId ? (
              <SiteLayoutLayer
                key={layout.sanctuaryId}
                layout={layout}
                anchors={anchorsById[layout.sanctuaryId]}
                selectedPlotId={selectedPlot?.sanctuaryId === layout.sanctuaryId ? selectedPlot.id : null}
                onPlotClick={p => setSelectedPlot({ ...p, sanctuaryId: layout.sanctuaryId })}
                calibrating={calibrateId === layout.sanctuaryId}
                onAnchorsChange={a => setAnchorsById(prev => ({ ...prev, [layout.sanctuaryId]: a }))}
              />
            ) : null
          )}
        </MapContainer>
      )}

      {/* ── SITE LAYOUT TOGGLE + LEGEND (zoomed in on a venture) ─────────── */}
      {currentZoom >= LAYOUT_MIN_ZOOM && !calibrateId && (
        <div className="absolute top-3 md:top-5 left-1/2 -translate-x-1/2 z-[999] flex flex-col items-center gap-1.5 pointer-events-none">
          <button
            onClick={() => {
              setLayoutVisible(v => !v);
              setSelectedPlot(null);
            }}
            className="pointer-events-auto px-4 py-2 rounded-full bg-[#14532d] text-white text-[11px] font-bold shadow-xl border border-white/15 active:scale-95 transition-transform"
          >
            {layoutVisible ? 'Hide layout' : 'Show layout'}
          </button>
          {layoutVisible && (
            <div className="flex items-center gap-2.5 px-3 py-1 rounded-full bg-[#0a1208]/85 backdrop-blur text-[9px] font-bold text-white/80">
              {(['available', 'reserved', 'sold'] as const).map(st => (
                <span key={st} className="flex items-center gap-1 capitalize">
                  <span className="w-2 h-2 rounded-full border border-white/40" style={{ background: PLOT_STATUS_COLOR[st] }} />
                  {st}
                </span>
              ))}
              {Object.values(SITE_LAYOUTS).some(l => !l.calibrated) && (
                <span className="text-[#facc15]">· position approximate</span>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── PLOT CARD (tapped a plot on a site layout) ───────────────────── */}
      {selectedPlot &&
        (() => {
          const cfg = SITE_PLAN_CONFIG[selectedPlot.sanctuaryId] ?? { noun: 'Plot', areaLabel: 'sq yds', rateNow: 0 };
          const venture = sanctuaries.find(v => v.id === selectedPlot.sanctuaryId);
          const enquireUrl = selectedPlot.sanctuaryId === 'agartha' ? WHATSAPP.agarthaEnquire : WHATSAPP.generic;
          return (
            <aside
              aria-label={`${cfg.noun} ${selectedPlot.id} details`}
              className="absolute bottom-[4.75rem] md:bottom-6 inset-x-3 md:inset-x-auto md:left-6 md:w-[22rem] z-[999] p-4 rounded-2xl bg-[#0a1208]/96 backdrop-blur-2xl border border-white/15 shadow-[0_16px_40px_rgba(0,0,0,0.85)] animate-fade-up text-white"
            >
              <button
                onClick={() => setSelectedPlot(null)}
                aria-label="Close"
                className="absolute top-3 right-3 w-7 h-7 rounded-full bg-white/10 flex items-center justify-center"
              >
                <X className="w-3.5 h-3.5" />
              </button>
              <p className="text-[9px] uppercase tracking-[0.3em] font-bold text-[#c8a951]">
                {venture?.title ?? 'Venture'} · {cfg.noun} {selectedPlot.id}
              </p>
              <p className="mt-1 text-[10px] font-bold capitalize" style={{ color: PLOT_STATUS_COLOR[selectedPlot.status] === '#1f2937' ? '#9ca3af' : PLOT_STATUS_COLOR[selectedPlot.status] }}>
                {selectedPlot.status}
              </p>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <p className="text-[8px] uppercase tracking-widest text-white/50 font-bold">Size</p>
                  <p className="font-bold mt-0.5">{selectedPlot.area.toLocaleString('en-IN')} {cfg.areaLabel}</p>
                </div>
                <div>
                  <p className="text-[8px] uppercase tracking-widest text-white/50 font-bold">Price</p>
                  {user ? (
                    <p className="font-bold mt-0.5">{formatRs(selectedPlot.area * cfg.rateNow)}</p>
                  ) : (
                    <button onClick={openAuth} className="mt-0.5 text-[11px] font-bold text-[#86efac] underline underline-offset-2">
                      Sign in to see
                    </button>
                  )}
                </div>
              </div>
              <a
                href={enquireUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 block text-center px-4 py-2.5 rounded-xl bg-[#14532d] text-[11px] font-bold"
              >
                Enquire about {cfg.noun.toLowerCase()} {selectedPlot.id}
              </a>
            </aside>
          );
        })()}

      {/* ── CALIBRATION PANEL (/map?calibrate=<id>) ─────────────────────── */}
      {calibrateId && anchorsById[calibrateId] && (
        <div className="absolute bottom-[4.75rem] md:bottom-6 left-3 right-3 md:left-auto md:right-6 md:w-96 z-[1000] p-3 rounded-2xl bg-[#0a1208]/95 border border-[#c8a951]/40 text-white text-[11px]">
          <p className="font-bold text-[#c8a951]">Calibrating {calibrateId} layout</p>
          <p className="mt-1 text-white/70">
            Drag ✥ to move, TL / TR / BL to fit the drawn boundary onto the fence line and roads. Then paste
            these anchors into <code>lib/data/site-layouts.ts</code> and set <code>calibrated: true</code>.
          </p>
          <pre className="mt-2 p-2 rounded bg-black/50 text-[10px] font-mono whitespace-pre-wrap select-text">
            {JSON.stringify(anchorsById[calibrateId])}
          </pre>
          <button
            onClick={() => navigator.clipboard?.writeText(JSON.stringify(anchorsById[calibrateId]))}
            className="mt-2 px-3 py-1.5 rounded-full bg-[#c8a951] text-[#0a1208] font-bold"
          >
            Copy anchors
          </button>
        </div>
      )}

      {/* ── DYNAMIC INSPECTION SHEET / CARD (Sanctuaries, ORR & RRR Exits) ─── */}
      {selectedLocation && !selectedPlot && (
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
                    <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0 border border-white/10">
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

      {/* ── FILTERS PANEL (bottom sheet on mobile, side panel on desktop) ── */}
      {showLayersSheet && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Map filters"
          className="fixed inset-0 z-[10000] flex flex-col justify-end md:items-end md:justify-start md:p-5 md:pt-20 bg-black/50 md:bg-black/20 backdrop-blur-sm"
          onClick={() => setShowLayersSheet(false)}
        >
          <div
            className="w-full md:w-[22rem] bg-[#0a1208] border-t md:border border-white/15 rounded-t-3xl md:rounded-3xl p-5 pb-[max(2rem,env(safe-area-inset-bottom))] md:pb-5 shadow-2xl animate-fade-up max-h-[85vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            {/* Drawer Handle */}
            <div className="md:hidden w-10 h-1 rounded-full bg-white/20 mx-auto mb-4" />

            <div className="flex items-center justify-between mb-4">
              <div>
                <h4 className="font-headline font-extrabold text-base text-white">Filters</h4>
                <p className="text-[10px] text-white/50">Map style and layers</p>
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
                Map style
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
                Layers
              </span>

              {/* Borders & place names */}
              <button
                onClick={() => toggleLayer('borders')}
                className={cn(
                  'w-full py-2.5 px-3.5 rounded-xl border flex items-center justify-between text-left transition-all',
                  activeLayers.borders
                    ? 'bg-white/10 border-white/30 text-white'
                    : 'bg-white/5 border-white/10 text-white/50'
                )}
              >
                <div className="flex items-center gap-2.5">
                  <MapIcon className={cn('w-4 h-4', activeLayers.borders ? 'text-white' : 'text-white/40')} />
                  <div>
                    <span className="text-xs font-bold block">State Borders & Place Names</span>
                    <span className="text-[9px] text-white/40 block">State and district lines, towns (satellite view)</span>
                  </div>
                </div>
                <div
                  className={cn(
                    'w-5 h-5 rounded-full flex items-center justify-center',
                    activeLayers.borders ? 'bg-white text-[#0a1208]' : 'bg-white/10'
                  )}
                >
                  {activeLayers.borders && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </button>

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
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
