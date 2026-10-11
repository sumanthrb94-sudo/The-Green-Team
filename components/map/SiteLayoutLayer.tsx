'use client';

/**
 * Site layout overlay for the Leaflet map: the master-plan line drawing warped
 * onto the satellite basemap through three anchor points, plus one tappable
 * circle per plot coloured by sales status.
 *
 * Leaflet's own ImageOverlay only stretches an image into an axis-aligned
 * box, which can't follow a site drawn a few degrees off north. This layer
 * nests the <img> in a wrapper: the wrapper is positioned and zoom-animated
 * exactly like ImageOverlay (translate + scale), and the image carries the
 * rotation/skew as a fixed CSS matrix inside it. Pinch zoom re-pins it on
 * every step, so the drawing stays glued to the ground.
 */
import { useEffect, useMemo, useRef } from 'react';
import L from 'leaflet';
import { Circle, Marker, Tooltip, useMap } from 'react-leaflet';
import type { LatLng } from '@/lib/data/map';
import {
  geoPlots,
  layoutCenter,
  PLOT_STATUS_COLOR,
  type GeoPlot,
  type LayoutAnchors,
  type SiteLayout,
} from '@/lib/data/site-layouts';

/** Leaflet internal used by its own ImageOverlay to project during zoom animation. */
type AnimMap = L.Map & {
  _latLngToNewLayerPoint(latlng: L.LatLng, zoom: number, center: L.LatLng): L.Point;
};

class AffineImageLayer extends L.Layer {
  /** Wrapper Leaflet moves and scales exactly like its own ImageOverlay. */
  private wrap: HTMLDivElement | null = null;
  /** Holds the fixed rotation / scale / skew, relative to the wrapper. */
  private img: HTMLImageElement | null = null;

  constructor(
    private src: string,
    private anchors: LayoutAnchors,
    private opacity: number,
  ) {
    super();
  }

  onAdd(map: L.Map) {
    const wrap = L.DomUtil.create('div', 'leaflet-zoom-animated') as HTMLDivElement;
    Object.assign(wrap.style, { position: 'absolute', left: '0', top: '0', pointerEvents: 'none' });
    const img = L.DomUtil.create('img', 'leaflet-image-layer', wrap) as HTMLImageElement;
    img.src = this.src;
    img.alt = '';
    img.draggable = false;
    Object.assign(img.style, {
      position: 'absolute',
      left: '0',
      top: '0',
      maxWidth: 'none',
      transformOrigin: '0 0',
      opacity: String(this.opacity),
      filter: 'drop-shadow(0 0 1.5px rgba(0,0,0,0.9))',
    });
    img.onload = () => this.reset();
    this.wrap = wrap;
    this.img = img;
    map.getPanes().overlayPane.appendChild(wrap);
    // `zoom` fires on every pinch step, `zoomanim` once per animated zoom
    map.on('zoom viewreset moveend', this.reset, this);
    map.on('zoomanim', this.animateZoom, this);
    this.reset();
    return this;
  }

  onRemove(map: L.Map) {
    map.off('zoom viewreset moveend', this.reset, this);
    map.off('zoomanim', this.animateZoom, this);
    this.wrap?.remove();
    this.wrap = this.img = null;
    return this;
  }

  setAnchors(anchors: LayoutAnchors) {
    this.anchors = anchors;
    this.reset();
  }

  /**
   * Pin the wrapper to the top-left anchor and give the image its affine
   * shape relative to that point. Only the wrapper is ever animated, with a
   * plain translate + scale, so the drawing can't twist mid-zoom.
   */
  private reset() {
    const map = this._map;
    const { wrap, img } = this;
    if (!map || !wrap || !img || !img.naturalWidth) return;
    const W = img.naturalWidth;
    const H = img.naturalHeight;
    const tl = map.latLngToLayerPoint(L.latLng(this.anchors.tl));
    const tr = map.latLngToLayerPoint(L.latLng(this.anchors.tr)).subtract(tl);
    const bl = map.latLngToLayerPoint(L.latLng(this.anchors.bl)).subtract(tl);
    L.DomUtil.setPosition(wrap, tl);
    img.style.width = `${W}px`;
    img.style.height = `${H}px`;
    img.style.transform = `matrix(${tr.x / W}, ${tr.y / W}, ${bl.x / H}, ${bl.y / H}, 0, 0)`;
  }

  private animateZoom(e: L.ZoomAnimEvent) {
    const map = this._map as AnimMap | undefined;
    if (!map || !this.wrap) return;
    const offset = map._latLngToNewLayerPoint(L.latLng(this.anchors.tl), e.zoom, e.center);
    L.DomUtil.setTransform(this.wrap, offset, map.getZoomScale(e.zoom));
  }
}

function AffineImage({ src, anchors, opacity }: { src: string; anchors: LayoutAnchors; opacity: number }) {
  const map = useMap();
  const layerRef = useRef<AffineImageLayer | null>(null);

  useEffect(() => {
    const layer = new AffineImageLayer(src, anchors, opacity);
    layer.addTo(map);
    layerRef.current = layer;
    return () => {
      layer.remove();
      layerRef.current = null;
    };
    // anchors are pushed through setAnchors below so dragging doesn't recreate the <img>
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [map, src, opacity]);

  useEffect(() => {
    layerRef.current?.setAnchors(anchors);
  }, [anchors]);

  return null;
}

/** Plot circle radius in metres — the radius of a disc with ~30% of the plot's area. */
const plotRadius = (sqYds: number) => Math.sqrt((sqYds * 0.8361 * 0.3) / Math.PI);

const handleIcon = (label: string) =>
  L.divIcon({
    className: '',
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    html: `<div style="width:28px;height:28px;border-radius:9999px;background:#c8a951;border:2px solid #0a1208;color:#0a1208;font:800 10px/24px system-ui;text-align:center;box-shadow:0 2px 8px rgba(0,0,0,.6)">${label}</div>`,
  });

const CORNERS: { key: keyof LayoutAnchors; label: string }[] = [
  { key: 'tl', label: 'TL' },
  { key: 'tr', label: 'TR' },
  { key: 'bl', label: 'BL' },
];

export function SiteLayoutLayer({
  layout,
  anchors,
  zoom,
  selectedPlotId,
  onPlotClick,
  calibrating = false,
  onAnchorsChange,
}: {
  layout: SiteLayout;
  anchors: LayoutAnchors;
  zoom: number;
  selectedPlotId: number | null;
  onPlotClick: (plot: GeoPlot) => void;
  calibrating?: boolean;
  onAnchorsChange?: (anchors: LayoutAnchors) => void;
}) {
  const plots = useMemo(() => geoPlots({ ...layout, anchors }), [layout, anchors]);
  const showLabels = zoom >= 17;

  return (
    <>
      <AffineImage src={layout.overlaySrc} anchors={anchors} opacity={calibrating ? 0.95 : 0.85} />

      {plots.map(p => {
        const selected = p.id === selectedPlotId;
        const color = PLOT_STATUS_COLOR[p.status];
        return (
          <Circle
            key={`${layout.sanctuaryId}-${p.id}`}
            center={p.position}
            radius={plotRadius(p.area)}
            pathOptions={{
              color: selected ? '#c8a951' : color,
              weight: selected ? 3 : 1.5,
              fillColor: color,
              fillOpacity: p.status === 'sold' ? 0.7 : 0.35,
            }}
            eventHandlers={{ click: () => onPlotClick(p) }}
          >
            {showLabels && (
              <Tooltip permanent direction="center" className="plot-label" interactive={false}>
                {p.id}
              </Tooltip>
            )}
          </Circle>
        );
      })}

      {calibrating &&
        onAnchorsChange &&
        CORNERS.map(c => (
          <Marker
            key={c.key}
            position={anchors[c.key]}
            draggable
            icon={handleIcon(c.label)}
            eventHandlers={{
              drag: e => {
                const ll = (e.target as L.Marker).getLatLng();
                const next: LatLng = [Number(ll.lat.toFixed(6)), Number(ll.lng.toFixed(6))];
                onAnchorsChange({ ...anchors, [c.key]: next });
              },
            }}
          />
        ))}

      {/* Centre handle moves the whole drawing without reshaping it. */}
      {calibrating && onAnchorsChange && (
        <Marker
          position={layoutCenter(anchors)}
          draggable
          icon={handleIcon('✥')}
          eventHandlers={{
            drag: e => {
              const ll = (e.target as L.Marker).getLatLng();
              const [cLat, cLng] = layoutCenter(anchors);
              const dLat = ll.lat - cLat;
              const dLng = ll.lng - cLng;
              const shift = (p: LatLng): LatLng => [
                Number((p[0] + dLat).toFixed(6)),
                Number((p[1] + dLng).toFixed(6)),
              ];
              onAnchorsChange({ tl: shift(anchors.tl), tr: shift(anchors.tr), bl: shift(anchors.bl) });
            },
          }}
        />
      )}
    </>
  );
}
