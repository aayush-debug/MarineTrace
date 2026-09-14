import React, { useEffect, useMemo, useRef, useCallback } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  TileLayer,
  ImageOverlay,
  Pane,
  Polygon,
  Polyline,
  CircleMarker,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useInvestigation } from '../../context/InvestigationContext';
import type { VesselAttribution } from '../../types/investigation';
import { BASEMAP_CONFIGS } from '../../utils/mapTiles';
import { MapZoomControl } from './MapZoomControl';
import { SarMapStudioWidget } from './SarMapStudioWidget';
import { DriftAnimationLayer } from './DriftAnimationLayer';
import { SpillPositionSelector } from '../drift/SpillPositionSelector';
import { useDriftAnimation } from '../../context/DriftAnimationContext';

/**
 * Robustly unwrap GeoJSON polygon coordinate arrays to [lat, lon][] Leaflet positions
 */
export function getPolygonPositions(geom?: any): [number, number][] {
  if (!geom || !geom.coordinates) return [];
  try {
    let ring = geom.coordinates;
    while (Array.isArray(ring) && Array.isArray(ring[0]) && Array.isArray(ring[0][0])) {
      ring = ring[0];
    }
    if (!Array.isArray(ring)) return [];
    return ring
      .filter((pt: any) => Array.isArray(pt) && pt.length >= 2 && !isNaN(Number(pt[0])) && !isNaN(Number(pt[1])))
      .map((pt: any) => {
        const c0 = Number(pt[0]);
        const c1 = Number(pt[1]);
        // GeoJSON is [lon, lat], Leaflet requires [lat, lon]
        return [c1, c0] as [number, number];
      });
  } catch {
    return [];
  }
}

/**
 * Dynamically extract or compute spill centroid
 */
export function getSpillCentroid(spill?: any): [number, number] | null {
  if (!spill) return null;
  if (spill.centroid?.latitude && spill.centroid?.longitude) {
    return [spill.centroid.latitude, spill.centroid.longitude];
  }
  const positions = getPolygonPositions(spill.geometry);
  if (positions.length === 0) return null;
  const avgLat = positions.reduce((sum, p) => sum + p[0], 0) / positions.length;
  const avgLon = positions.reduce((sum, p) => sum + p[1], 0) / positions.length;
  return [avgLat, avgLon];
}

/**
 * Calculate directional heading in degrees from trajectory or explicit heading
 */
export function calculateHeading(
  polyCoords: [number, number][],
  explicitHeading?: number | null,
  explicitCourse?: number | null
): number {
  if (typeof explicitHeading === 'number' && !isNaN(explicitHeading) && explicitHeading >= 0) {
    return explicitHeading;
  }
  if (typeof explicitCourse === 'number' && !isNaN(explicitCourse) && explicitCourse >= 0) {
    return explicitCourse;
  }
  if (polyCoords.length >= 2) {
    const pPrev = polyCoords[polyCoords.length - 2];
    const pLast = polyCoords[polyCoords.length - 1];
    const dLat = pLast[0] - pPrev[0];
    const dLon = pLast[1] - pPrev[1];
    let angle = (Math.atan2(dLon, dLat) * 180) / Math.PI;
    if (angle < 0) angle += 360;
    return Math.round(angle);
  }
  return 0;
}

/**
 * Generate forward heading projection vector (where the vessel is heading)
 */
export function getHeadingVector(
  pos: [number, number],
  headingDeg: number,
  lengthKm = 2.5
): [number, number][] {
  const rad = (headingDeg * Math.PI) / 180;
  const latDelta = (lengthKm * Math.cos(rad)) / 111.0;
  const lonDelta = (lengthKm * Math.sin(rad)) / (111.0 * Math.cos((pos[0] * Math.PI) / 180.0));
  return [pos, [pos[0] + latDelta, pos[1] + lonDelta]];
}

// Memory-efficient icon cache to prevent recreating DOM nodes on every animation tick
const vesselIconCache = new Map<string, L.DivIcon>();

/**
 * Create custom SVG Directional Vessel Icon with Arrow Pointer (Cached by rounded heading & styling)
 */
export function createVesselDirectionalIcon(
  headingDeg: number,
  palette: { stroke: string; fill: string },
  isSelected: boolean,
  rank: number
): L.DivIcon {
  // Quantize heading to 2-degree increments to allow aggressive icon caching while preserving visual realism
  const roundedHeading = Math.round(headingDeg / 2) * 2;
  const cacheKey = `${roundedHeading}_${palette.stroke}_${palette.fill}_${isSelected ? 1 : 0}_${rank}`;

  const cached = vesselIconCache.get(cacheKey);
  if (cached) return cached;

  const size = isSelected ? 34 : 26;
  const strokeColor = isSelected ? '#ffffff' : palette.stroke;
  const fillColor = isSelected ? '#f43f5e' : palette.fill;

  const pulseEffect = isSelected
    ? `<div style="position: absolute; inset: -4px; border-radius: 9999px; background: rgba(244,63,94,0.35); animation: ping 1.5s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>`
    : '';

  const rankBadge =
    rank <= 3
      ? `<div style="position: absolute; top: -6px; right: -6px; font-size: 9px; font-weight: 800; font-family: monospace; background: #0f172a; color: ${palette.stroke}; border: 1px solid ${palette.stroke}; border-radius: 9999px; padding: 0 4px; line-height: 12px; box-shadow: 0 1px 3px rgba(0,0,0,0.5);">#${rank}</div>`
      : '';

  const html = `
    <div style="position: relative; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; cursor: pointer;">
      ${pulseEffect}
      <div style="transform: rotate(${roundedHeading}deg); width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));">
        <svg viewBox="0 0 24 24" width="${size}" height="${size}" style="overflow: visible;">
          <!-- Directional Maritime Vessel Hull Arrow -->
          <path
            d="M 12 1 L 20 20 L 12 15 L 4 20 Z"
            fill="${fillColor}"
            stroke="${strokeColor}"
            stroke-width="${isSelected ? 2 : 1.5}"
            stroke-linejoin="round"
          />
          <!-- Center Bridge Dot -->
          <circle cx="12" cy="11" r="2.2" fill="#ffffff" />
        </svg>
      </div>
      ${rankBadge}
    </div>
  `;

  const icon = L.divIcon({
    html,
    className: 'vessel-directional-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });

  if (vesselIconCache.size > 500) {
    vesselIconCache.clear();
  }
  vesselIconCache.set(cacheKey, icon);
  return icon;
}

// Custom Auto Bounds Fitter that triggers once per investigation to prevent interrupting user pan/zoom
const MapBoundsFitter: React.FC<{
  coords: [number, number][];
  investigationId?: string;
}> = ({ coords, investigationId }) => {
  const map = useMap();
  const lastFittedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (!coords || coords.length === 0) return;
    if (investigationId && lastFittedIdRef.current === investigationId) return;

    try {
      const lats = coords.map((c) => c[0]);
      const lons = coords.map((c) => c[1]);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);

      if (investigationId) {
        lastFittedIdRef.current = investigationId;
      }

      map.fitBounds(
        [
          [minLat - 0.08, minLon - 0.08],
          [maxLat + 0.08, maxLon + 0.08],
        ],
        { padding: [50, 50], maxZoom: 12, animate: false }
      );
    } catch {
      // Map may not be ready
    }
  }, [coords, investigationId, map]);

  return null;
};

const RANK_PALETTE: Record<number, { stroke: string; fill: string; name: string }> = {
  1: { stroke: '#f43f5e', fill: '#be123c', name: 'Rank #1 Suspect (High)' },
  2: { stroke: '#f59e0b', fill: '#b45309', name: 'Rank #2 Suspect (Med)' },
  3: { stroke: '#06b6d4', fill: '#0e7490', name: 'Rank #3 Candidate' },
};

export const MaritimeMap: React.FC<{
  height?: string;
  showControls?: boolean;
}> = ({ height = '100%' }) => {
  const {
    investigation,
    selectedVesselMmsi,
    setSelectedVesselMmsi,
    layers,
    basemap,
    spcsftLiveDetections,
    launchInvestigationFromSpcsft,
    sarConfig,
  } = useInvestigation();

  const handleSelectVessel = useCallback(
    (mmsi: string) => {
      setSelectedVesselMmsi(mmsi);
    },
    [setSelectedVesselMmsi]
  );

  const { currentPosition, hasDriftData, mode, progress, spillPosition } = useDriftAnimation();

  // Extract all points for bounds fitting
  const allCoords = useMemo(() => {
    const coords: [number, number][] = [];
    if (investigation?.spill?.geometry) {
      coords.push(...getPolygonPositions(investigation.spill.geometry));
    }
    if (investigation?.drift?.origin) {
      coords.push([investigation.drift.origin.latitude, investigation.drift.origin.longitude]);
    }
    return coords;
  }, [investigation]);

  const defaultCenter: [number, number] = [18.95, 72.30];
  const activeBasemap = BASEMAP_CONFIGS[basemap] || BASEMAP_CONFIGS['google-hybrid'];

  // Verified geodetic bounding boxes used to render the exact pixel coordinates of SAR rasters
  const SAR_BBOXES: Record<string, [[number, number], [number, number]]> = {
    'SPCSFT-2026-ARABIAN-01': [[18.7928, 72.29975], [18.9152, 72.49525]],
    'SPCSFT-2026-ARABIAN-02': [[18.616, 72.26645], [18.679, 72.35655]],
    'SPCSFT-2026-HORMUZ-02': [[26.5405, 56.4], [26.6595, 56.57]],
    'SPCSFT-2026-KUTCH-01': [[22.3885, 69.3345], [22.5415, 69.5555]],
    'SPCSFT-2026-MALACCA-01': [[2.408, 101.681], [2.612, 101.919]],
    'SPCSFT-2026-REDSEA-01': [[12.624, 43.2505], [12.896, 43.5395]],
    'SPCSFT-2026-SNGPR-01': [[1.222, 103.9685], [1.358, 104.1215]],
    'SPCSFT-2026-MED-01': [[36.7715, 12.981], [36.9585, 13.219]],
    'SPCSFT-2026-BENGAL-01': [[17.7415, 84.501], [17.9285, 84.739]],
    'SPCSFT-2026-INDOCEAN-01': [[5.8075, 81.1965], [6.0625, 81.5535]],
  };

  // Dynamically resolve target incident detection ID for all 10 spills
  const targetDetId = useMemo(() => {
    if (!investigation) return 'SPCSFT-2026-ARABIAN-01';
    const id = (investigation.investigation_id || '').toUpperCase();
    if (id.includes('BENGAL')) return 'SPCSFT-2026-BENGAL-01';
    if (id.includes('INDOCEAN')) return 'SPCSFT-2026-INDOCEAN-01';
    if (id.includes('HORMUZ')) return 'SPCSFT-2026-HORMUZ-02';
    if (id.includes('KUTCH')) return 'SPCSFT-2026-KUTCH-01';
    if (id.includes('MALACCA')) return 'SPCSFT-2026-MALACCA-01';
    if (id.includes('REDSEA')) return 'SPCSFT-2026-REDSEA-01';
    if (id.includes('SNGPR') || id.includes('SINGAPORE')) return 'SPCSFT-2026-SNGPR-01';
    if (id.includes('MED')) return 'SPCSFT-2026-MED-01';
    if (id.includes('ARABIAN-02') || id.includes('SAURASHTRA')) return 'SPCSFT-2026-ARABIAN-02';
    return 'SPCSFT-2026-ARABIAN-01';
  }, [investigation]);

  // Geodetic Bounding Box for SAR Radar Overlay matching the active spill exactly
  const sarBbox = useMemo(() => {
    if (SAR_BBOXES[targetDetId]) {
      return SAR_BBOXES[targetDetId];
    }
    if (!investigation) return null;
    const positions = getPolygonPositions(investigation.spill.geometry);
    if (positions.length === 0) return null;
    const lats = positions.map((p) => p[0]);
    const lons = positions.map((p) => p[1]);

    if (investigation.spill.sheen_geometry) {
      for (const sheen of investigation.spill.sheen_geometry) {
        for (const pt of getPolygonPositions(sheen)) {
          lats.push(pt[0]);
          lons.push(pt[1]);
        }
      }
    }
    if (investigation.spill.core_geometry) {
      for (const pt of getPolygonPositions(investigation.spill.core_geometry)) {
        lats.push(pt[0]);
        lons.push(pt[1]);
      }
    }

    const minLat = Math.min(...lats);
    const maxLat = Math.max(...lats);
    const minLon = Math.min(...lons);
    const maxLon = Math.max(...lons);

    const dLat = Math.max(maxLat - minLat, 0.04);
    const dLon = Math.max(maxLon - minLon, 0.04);
    const pad = 0.35;

    return [
      [minLat - pad * dLat, minLon - pad * dLon],
      [maxLat + pad * dLat, maxLon + pad * dLon],
    ] as [[number, number], [number, number]];
  }, [investigation, targetDetId]);

  // SAR raster URL resolving dynamically to calibrated Sentinel-1 analysis products
  const sarRasterUrl = useMemo(() => {
    const channelSuffix =
      sarConfig.channel === 'VV'
        ? 'vv'
        : sarConfig.channel === 'VH'
        ? 'vh'
        : sarConfig.channel === 'prob'
        ? 'prob'
        : 'composite';
    return `/sar/sar_${targetDetId}_${channelSuffix}.png`;
  }, [sarConfig.channel, targetDetId]);

  const spillPolygonPositions = useMemo(
    () => (investigation?.spill?.geometry ? getPolygonPositions(investigation.spill.geometry) : []),
    [investigation?.spill?.geometry]
  );

  const corePolygonPositions = useMemo(
    () => (investigation?.spill?.core_geometry ? getPolygonPositions(investigation.spill.core_geometry) : []),
    [investigation?.spill?.core_geometry]
  );

  const calculatedSpillCentroid = useMemo(
    () => (investigation?.spill ? getSpillCentroid(investigation.spill) : null),
    [investigation]
  );

  // Coordinate translation delta for repositioning oil spill to Future Forecast or Origin
  const spillShift = useMemo<[number, number]>(() => {
    if (!hasDriftData || !currentPosition || !calculatedSpillCentroid) {
      return [0, 0];
    }
    if (spillPosition === 'current' || (mode === 'backward' && progress <= 0.001)) {
      return [0, 0];
    }
    return [
      currentPosition[0] - calculatedSpillCentroid[0],
      currentPosition[1] - calculatedSpillCentroid[1],
    ];
  }, [hasDriftData, currentPosition, calculatedSpillCentroid, spillPosition, mode, progress]);

  // Active spill polygon shifted to current simulation phase (Future Forecast / Origin / Detected)
  const activeSpillPositions = useMemo(() => {
    if (spillShift[0] === 0 && spillShift[1] === 0) return spillPolygonPositions;
    return spillPolygonPositions.map(([lat, lon]) => [lat + spillShift[0], lon + spillShift[1]] as [number, number]);
  }, [spillPolygonPositions, spillShift]);

  // Active core mousse polygon shifted to current simulation phase
  const activeCorePositions = useMemo(() => {
    if (spillShift[0] === 0 && spillShift[1] === 0) return corePolygonPositions;
    return corePolygonPositions.map(([lat, lon]) => [lat + spillShift[0], lon + spillShift[1]] as [number, number]);
  }, [corePolygonPositions, spillShift]);

  return (
    <div className="w-full relative overflow-hidden bg-[#070b12]" style={{ height }}>
      <MapContainer
        center={defaultCenter}
        zoom={9}
        minZoom={3}
        maxZoom={18}
        maxBounds={[[-85, -180], [85, 180]]}
        maxBoundsViscosity={1.0}
        worldCopyJump={false}
        scrollWheelZoom={true}
        preferCanvas={true}
        wheelPxPerZoomLevel={90}
        wheelDebounceTime={40}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        {/* Dynamic Basemap (Google Maps Satellite / Hybrid / Terrain / Dark) */}
        <TileLayer
          key={activeBasemap.id}
          attribution={activeBasemap.attribution}
          url={activeBasemap.url}
          subdomains={activeBasemap.subdomains || ['a', 'b', 'c']}
          maxZoom={activeBasemap.maxZoom}
          noWrap={true}
          keepBuffer={6}
          updateWhenIdle={true}
          updateWhenZooming={false}
          bounds={[[-85, -180], [85, 180]]}
        />

        {/* 0a. Sentinel-1 Calibrated SAR Radar Raster Overlay */}
        {sarBbox && (
          <Pane name="sarOverlayPane" style={{ zIndex: 250 }}>
            <ImageOverlay
              url={sarRasterUrl}
              bounds={sarBbox}
              opacity={sarConfig.opacity}
            />
          </Pane>
        )}

        {allCoords.length > 0 && (
          <MapBoundsFitter
            coords={allCoords}
            investigationId={investigation?.investigation_id}
          />
        )}

        {investigation && (
          <>
            {/* 0. Sentinel-1 SAR Satellite Acquisition Swath Footprint */}
            {investigation.spill.sar_swath && (
              <Polygon
                positions={getPolygonPositions(investigation.spill.sar_swath)}
                pathOptions={{
                  color: '#38bdf8',
                  fillColor: '#0284c7',
                  fillOpacity: 0.04,
                  weight: 1,
                  dashArray: '4, 8',
                }}
              >
                <Popup>
                  <div className="text-xs p-1.5 font-mono space-y-1">
                    <div className="font-bold text-sky-300 border-b border-sky-900/60 pb-1">
                      SENTINEL-1A SAR SWATH FOOTPRINT
                    </div>
                    <div className="text-[11px] text-slate-300">
                      <div>Mode: <strong>Interferometric Wide (IW GRD)</strong></div>
                      <div>Polarization: <strong>Dual-Pol (VV + VH)</strong></div>
                      <div>Orbit: <strong>Descending Track #12</strong></div>
                      <div>Processing: <strong>Level-1 Calibrated σ₀</strong></div>
                    </div>
                  </div>
                </Popup>
              </Polygon>
            )}

            {/* 1. REALISTIC OIL SPILL DETECTION & FUTURE FORECAST DISPERSION LAYERS */}
            {(layers.spill ?? true) && (
              <>
                {/* 1a. Secondary Sheen Filaments / Dispersed Droplets */}
                {investigation.spill.sheen_geometry?.map((sheen, idx) => {
                  const baseSheenPositions = getPolygonPositions(sheen);
                  if (baseSheenPositions.length === 0) return null;
                  const sheenPositions =
                    spillShift[0] === 0 && spillShift[1] === 0
                      ? baseSheenPositions
                      : baseSheenPositions.map(([lat, lon]) => [lat + spillShift[0], lon + spillShift[1]] as [number, number]);
                  return (
                    <Polygon
                      key={`sheen-${idx}`}
                      positions={sheenPositions}
                      pathOptions={{
                        color: spillPosition === 'future' ? '#34d399' : '#f43f5e',
                        fillColor: spillPosition === 'future' ? '#059669' : '#e11d48',
                        fillOpacity: 0.30,
                        weight: 1.5,
                        dashArray: '3, 4',
                      }}
                    />
                  );
                })}

                {/* 1b. Main Oil Slick Sheen Layer (Multi-branched organic shape) */}
                {activeSpillPositions.length > 0 && (
                  <Polygon
                    positions={activeSpillPositions}
                    pathOptions={{
                      color: spillPosition === 'future' ? '#10b981' : '#ef4444',
                      fillColor: spillPosition === 'future' ? '#047857' : '#dc2626',
                      fillOpacity: 0.50,
                      weight: 2.5,
                      className: 'slick-sheen-polygon',
                    }}
                  >
                    <Popup>
                      <div className="text-xs p-2 space-y-1.5 font-mono">
                        <div
                          className="font-bold flex items-center justify-between border-b pb-1"
                          style={{
                            color: spillPosition === 'future' ? '#34d399' : '#f87171',
                            borderColor: spillPosition === 'future' ? '#064e3b' : '#881337',
                          }}
                        >
                          <span>
                            {spillPosition === 'future'
                              ? 'PROJECTED OIL SPILL (+24h FORECAST)'
                              : spillPosition === 'original'
                              ? 'ESTIMATED SPILL ORIGIN (-24h)'
                              : 'HYDROCARBON ANOMALY DELINEATION'}
                          </span>
                          <span
                            className="text-[10px] px-1.5 py-0.2 rounded border"
                            style={{
                              backgroundColor: spillPosition === 'future' ? '#064e3b' : '#4c0519',
                              color: spillPosition === 'future' ? '#6ee7b7' : '#fda4af',
                              borderColor: spillPosition === 'future' ? '#059669' : '#9f1239',
                            }}
                          >
                            {spillPosition === 'future' ? 'DRIFT FORECAST' : 'C-BAND SAR'}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[11px]">
                          <div>Confidence: <strong className="text-emerald-400">{(investigation.spill.confidence * 100).toFixed(1)}%</strong></div>
                          <div>
                            Total Area:{' '}
                            <strong className={spillPosition === 'future' ? 'text-emerald-300' : 'text-rose-300'}>
                              {spillPosition === 'future'
                                ? (investigation.spill.area_km2 * 1.35).toFixed(2)
                                : investigation.spill.area_km2.toFixed(2)}{' '}
                              km²
                            </strong>
                          </div>
                          <div>Status: <strong>{spillPosition === 'future' ? 'Weathered / Dispersed' : 'Fresh Hydrocarbon'}</strong></div>
                          <div>
                            Centroid:{' '}
                            <strong className="text-cyan-300">
                              {currentPosition
                                ? `${currentPosition[0].toFixed(3)}°N, ${currentPosition[1].toFixed(3)}°E`
                                : 'N/A'}
                            </strong>
                          </div>
                        </div>
                        <div className="text-slate-400 text-[10px] border-t border-slate-800 pt-1">
                          {spillPosition === 'future'
                            ? 'Forecast Model: Copernicus Marine Physics + OpenDrift'
                            : `Acquisition UTC: ${new Date(investigation.observation_time).toUTCString()}`}
                        </div>
                      </div>
                    </Popup>
                  </Polygon>
                )}

                {/* 1c. Heavy Crude Emulsion Mousse Core */}
                {activeCorePositions.length > 0 && (
                  <Polygon
                    positions={activeCorePositions}
                    pathOptions={{
                      color: spillPosition === 'future' ? '#6ee7b7' : '#fca5a5',
                      fillColor: spillPosition === 'future' ? '#065f46' : '#991b1b',
                      fillOpacity: 0.85,
                      weight: 2,
                      className: 'slick-core-polygon',
                    }}
                  >
                    <Popup>
                      <div className="text-xs p-1 font-mono">
                        <div className="font-bold text-emerald-300">
                          {spillPosition === 'future' ? 'Dispersed Emulsion Core' : 'Dense Emulsion Core'}
                        </div>
                        <div>
                          {spillPosition === 'future'
                            ? 'Weathered core mousse after +24h advection'
                            : 'Peak thickness hydrocarbon mousse'}
                        </div>
                      </div>
                    </Popup>
                  </Polygon>
                )}

                {/* 1d. If spill is shifted to Future Forecast, render faint reference outline of original T0 SAR detection */}
                {(spillShift[0] !== 0 || spillShift[1] !== 0) && spillPolygonPositions.length > 0 && (
                  <Polygon
                    positions={spillPolygonPositions}
                    pathOptions={{
                      color: '#f43f5e',
                      fillColor: '#881337',
                      fillOpacity: 0.12,
                      weight: 1.5,
                      dashArray: '4, 4',
                    }}
                  >
                    <Popup>
                      <div className="text-xs p-1 font-mono text-slate-300">
                        <div className="font-bold text-rose-400">T₀ Initial Observed Detection</div>
                        <div>Original satellite radar detection footprint at observation time</div>
                      </div>
                    </Popup>
                  </Polygon>
                )}

                {/* 1e. Dynamic Active Spill Center Target Tag */}
                {activeSpillPositions.length > 0 && (
                  <CircleMarker
                    center={currentPosition || calculatedSpillCentroid || [18.95, 72.3]}
                    radius={5}
                    pathOptions={{
                      color: spillPosition === 'future' ? '#10b981' : '#f43f5e',
                      fillColor: '#ffffff',
                      fillOpacity: 1,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="text-xs p-1 font-mono">
                        <strong className={spillPosition === 'future' ? 'text-emerald-400' : 'text-rose-400'}>
                          📍 {spillPosition === 'future' ? 'Projected +24h Spill Centroid' : 'Oil Spill Centroid'}
                        </strong>
                        <div>
                          {(currentPosition || calculatedSpillCentroid || [18.95, 72.3])[0].toFixed(4)}°N,{' '}
                          {(currentPosition || calculatedSpillCentroid || [18.95, 72.3])[1].toFixed(4)}°E
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                )}
              </>
            )}

            {/* 1b. Space Shift (SateAIs™) Real-Time API Oil Slicks */}
            {layers.spcsft &&
              spcsftLiveDetections.map((det) => {
                const detPositions = getPolygonPositions(det.geometry);
                if (detPositions.length === 0) return null;
                return (
                  <React.Fragment key={`map-spcsft-${det.detection_id}`}>
                    <Polygon
                      positions={detPositions}
                      pathOptions={{
                        color: det.severity === 'CRITICAL' ? '#f43f5e' : '#38bdf8',
                        fillColor: det.severity === 'CRITICAL' ? '#be123c' : '#0284c7',
                        fillOpacity: 0.35,
                        weight: 2,
                        dashArray: '4 4',
                      }}
                    >
                      <Popup>
                        <div className="p-2 space-y-1.5 font-mono text-xs text-slate-800 min-w-[220px]">
                          <div className="flex items-center justify-between border-b pb-1 font-bold">
                            <span className="text-cyan-700">🛰️ Space Shift SateAIs™</span>
                            <span className="text-rose-600">{(det.confidence * 100).toFixed(0)}% Match</span>
                          </div>
                          <div className="text-[11px] text-slate-600">
                            <div><strong>Location:</strong> {det.zone_name}</div>
                            <div><strong>Area:</strong> {det.area_km2.toFixed(1)} km²</div>
                            <div><strong>Type:</strong> {det.slick_type}</div>
                          </div>
                          <button
                            onClick={() => launchInvestigationFromSpcsft(det.detection_id)}
                            className="w-full mt-1.5 py-1 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded text-[11px] flex items-center justify-center gap-1 transition-colors"
                          >
                            <span>⚡ Investigate Spill</span>
                          </button>
                        </div>
                      </Popup>
                    </Polygon>
                  </React.Fragment>
                );
              })}

            {/* 2, 3, 4. INTERACTIVE DRIFT ANIMATION & FORECAST LAYERS */}
            <DriftAnimationLayer />

            {/* 5. AIS CANDIDATE VESSEL TRACKS WITH DIRECTIONAL HEADING ARROWS */}
            {investigation.vessels.map((vessel) => (
              <VesselTrackLayer
                key={vessel.mmsi}
                vessel={vessel}
                isSelected={selectedVesselMmsi === vessel.mmsi}
                showTrack={true}
                onSelect={handleSelectVessel}
              />
            ))}
          </>
        )}

        {/* Custom Google Maps Style Zoom In / Zoom Out Controls */}
        <MapZoomControl />
      </MapContainer>

      {/* Floating Sentinel-1 SAR Radar Verification Studio Widget */}
      <SarMapStudioWidget />

      {/* Minimalist Tactical Spill Position Phase Selector (Original, Current, Future) */}
      <SpillPositionSelector />
    </div>
  );
};

interface VesselTrackLayerProps {
  vessel: VesselAttribution;
  isSelected: boolean;
  showTrack: boolean;
  onSelect: (mmsi: string) => void;
}

const VesselTrackLayerComponent: React.FC<VesselTrackLayerProps> = ({
  vessel,
  isSelected,
  showTrack,
  onSelect,
}) => {
  const { progress, mode, hasDriftData, currentOffsetHours } = useDriftAnimation();

  const handleSelect = useCallback(() => {
    onSelect(vessel.mmsi);
  }, [onSelect, vessel.mmsi]);

  const coords = vessel.trajectory?.coordinates as number[][] | undefined;
  const valid = Boolean(coords && coords.length >= 2);

  const palette = useMemo(
    () =>
      RANK_PALETTE[vessel.rank] || {
        stroke: '#64748b',
        fill: '#475569',
        name: `Rank #${vessel.rank}`,
      },
    [vessel.rank]
  );

  const polyCoords: [number, number][] = useMemo(
    () => (coords ? coords.map((c) => [c[1], c[0]]) : []),
    [coords]
  );
  const lastPos: [number, number] = useMemo(
    () => (polyCoords.length > 0 ? polyCoords[polyCoords.length - 1] : [0, 0]),
    [polyCoords]
  );

  // Compute future projected route trajectory using explicit route mapping or course extrapolation
  const futureCoords = vessel.future_trajectory?.coordinates as number[][] | undefined;
  const futurePolyCoords: [number, number][] = useMemo(() => {
    if (futureCoords && futureCoords.length >= 2) {
      return futureCoords.map((c) => [c[1], c[0]]);
    }
    if (polyCoords.length >= 2) {
      const lp = polyCoords[polyCoords.length - 1];
      const hdg = calculateHeading(polyCoords, vessel.heading, vessel.course);
      const spd = vessel.speed_knots ?? vessel.cpa?.speed_during_kn ?? 12.5;
      const rad = (hdg * Math.PI) / 180;
      const cosH = Math.cos(rad);
      const sinH = Math.sin(rad);
      const cosLat = Math.cos((lp[0] * Math.PI) / 180) || 1;
      const pts: [number, number][] = [lp];
      for (const h of [6, 12, 18, 24]) {
        const dNm = spd * h;
        const dLat = (dNm / 60) * cosH;
        const dLon = (dNm / (60 * cosLat)) * sinH;
        pts.push([lp[0] + dLat, lp[1] + dLon]);
      }
      return pts;
    }
    return [];
  }, [futureCoords, polyCoords, vessel.heading, vessel.course, vessel.speed_knots, vessel.cpa]);

  // Compute interpolated vessel position along historic or future route mapping according to simulation phase
  const currentVesselPos: [number, number] = useMemo(() => {
    if (!hasDriftData || polyCoords.length < 2) {
      return lastPos;
    }

    if (mode === 'forward') {
      // Forward Forecast: Vessel advances along future voyage route mapping
      if (futurePolyCoords.length >= 2) {
        const clampedProg = Math.max(0, Math.min(1, progress));
        const totalSegs = futurePolyCoords.length - 1;
        const floatIdx = clampedProg * totalSegs;
        const segIdx = Math.min(Math.floor(floatIdx), totalSegs - 1);
        const alpha = floatIdx - segIdx;
        const p0 = futurePolyCoords[segIdx];
        const p1 = futurePolyCoords[segIdx + 1];
        return [
          p0[0] + (p1[0] - p0[0]) * alpha,
          p0[1] + (p1[1] - p0[1]) * alpha,
        ];
      }
      return lastPos;
    }

    if (mode === 'both') {
      if (progress > 0.5 && futurePolyCoords.length >= 2) {
        const fProg = Math.max(0, Math.min(1, (progress - 0.5) * 2));
        const totalSegs = futurePolyCoords.length - 1;
        const floatIdx = fProg * totalSegs;
        const segIdx = Math.min(Math.floor(floatIdx), totalSegs - 1);
        const alpha = floatIdx - segIdx;
        const p0 = futurePolyCoords[segIdx];
        const p1 = futurePolyCoords[segIdx + 1];
        return [
          p0[0] + (p1[0] - p0[0]) * alpha,
          p0[1] + (p1[1] - p0[1]) * alpha,
        ];
      }
      const bProg = Math.max(0, Math.min(1, progress * 2));
      const totalSegs = polyCoords.length - 1;
      const floatIdx = bProg * totalSegs;
      const segIdx = Math.min(Math.floor(floatIdx), totalSegs - 1);
      const alpha = floatIdx - segIdx;
      const p0 = polyCoords[segIdx];
      const p1 = polyCoords[segIdx + 1];
      return [
        p0[0] + (p1[0] - p0[0]) * alpha,
        p0[1] + (p1[1] - p0[1]) * alpha,
      ];
    }

    // Backward Hindcast: Vessel backtracks to historic origin / discharge point
    const timeRatio = Math.max(0, Math.min(1, 1 - progress));
    if (timeRatio >= 0.999) return polyCoords[polyCoords.length - 1];
    if (timeRatio <= 0.001) return polyCoords[0];

    const totalSegs = polyCoords.length - 1;
    const floatIdx = timeRatio * totalSegs;
    const segIdx = Math.min(Math.floor(floatIdx), totalSegs - 1);
    const alpha = floatIdx - segIdx;
    const p0 = polyCoords[segIdx];
    const p1 = polyCoords[segIdx + 1];
    return [
      p0[0] + (p1[0] - p0[0]) * alpha,
      p0[1] + (p1[1] - p0[1]) * alpha,
    ];
  }, [hasDriftData, polyCoords, futurePolyCoords, lastPos, mode, progress]);

  // Dynamic heading based on current vessel position on track or forecast route
  const currentHeadingDeg = useMemo(() => {
    if (mode === 'forward' && futurePolyCoords.length >= 2) {
      const totalSegs = futurePolyCoords.length - 1;
      const segIdx = Math.min(Math.floor(progress * totalSegs), totalSegs - 1);
      const p0 = futurePolyCoords[segIdx];
      const p1 = futurePolyCoords[Math.min(segIdx + 1, totalSegs)];
      return calculateHeading([p0, p1], vessel.heading, vessel.course);
    }
    if (!hasDriftData || polyCoords.length < 2) {
      return calculateHeading(polyCoords, vessel.heading, vessel.course);
    }
    let timeRatio = 1.0;
    if (mode === 'backward') {
      timeRatio = Math.max(0, Math.min(1, 1 - progress));
    } else if (mode === 'both') {
      timeRatio = progress <= 0.5 ? Math.max(0, Math.min(1, progress * 2)) : 1.0;
    }
    const totalSegs = polyCoords.length - 1;
    const segIdx = Math.min(Math.floor(timeRatio * totalSegs), totalSegs - 1);
    const p0 = polyCoords[segIdx];
    const p1 = polyCoords[Math.min(segIdx + 1, totalSegs)];
    return calculateHeading([p0, p1], vessel.heading, vessel.course);
  }, [hasDriftData, polyCoords, futurePolyCoords, mode, progress, vessel.heading, vessel.course]);

  const headingVector = useMemo(
    () => getHeadingVector(currentVesselPos, currentHeadingDeg, isSelected ? 4.0 : 2.5),
    [currentVesselPos, currentHeadingDeg, isSelected]
  );

  const vesselIcon = useMemo(
    () => createVesselDirectionalIcon(currentHeadingDeg, palette, isSelected, vessel.rank),
    [currentHeadingDeg, palette, isSelected, vessel.rank]
  );

  if (!valid) return null;

  return (
    <>
      {/* Vessel Historic AIS Trajectory (Solid Line) */}
      {showTrack && (
        <Polyline
          positions={polyCoords}
          pathOptions={{
            color: palette.stroke,
            weight: isSelected ? 4.5 : 2.5,
            opacity: isSelected ? 1 : 0.7,
          }}
          eventHandlers={{
            click: handleSelect,
          }}
        >
          <Popup>
            <div className="text-xs font-mono p-1.5 space-y-1">
              <div className="font-bold text-slate-100 flex items-center justify-between border-b border-slate-700 pb-1">
                <span>{vessel.vessel_name}</span>
                <span className="text-[10px] text-cyan-400 font-bold">RANK #{vessel.rank}</span>
              </div>
              <div className="text-slate-300">Type: {vessel.vessel_type}</div>
              <div className="text-slate-300">Attribution Score: <strong className="text-rose-400">{vessel.score.toFixed(1)}/100</strong></div>
              <div className="text-slate-400 text-[10px]">Investigative Priority: {vessel.investigative_priority}</div>
            </div>
          </Popup>
        </Polyline>
      )}

      {/* Vessel Future Projected Voyage Route Corridor (Dashed Nautical Line) */}
      {showTrack && futurePolyCoords.length >= 2 && (
        <Polyline
          positions={futurePolyCoords}
          pathOptions={{
            color: isSelected ? '#34d399' : '#059669',
            weight: isSelected ? 3.5 : 2,
            dashArray: '5, 6',
            opacity: isSelected ? 0.95 : 0.75,
          }}
          eventHandlers={{
            click: handleSelect,
          }}
        >
          <Popup>
            <div className="text-xs font-mono p-2 space-y-1.5 bg-[#0b0f17] border border-emerald-800/80 rounded min-w-[210px]">
              <div className="font-bold text-emerald-400 flex items-center justify-between border-b border-emerald-900 pb-1">
                <span>PROJECTED VOYAGE ROUTE</span>
                <span className="text-[10px] bg-emerald-950 text-emerald-300 px-1.5 py-0.2 rounded border border-emerald-800">
                  +24h FORECAST
                </span>
              </div>
              <div className="text-slate-300 text-[11px]">Vessel: <strong>{vessel.vessel_name}</strong></div>
              {vessel.destination && (
                <div className="text-slate-300 text-[11px]">Destination: <strong className="text-emerald-300">{vessel.destination}</strong></div>
              )}
              {vessel.eta && (
                <div className="text-slate-300 text-[11px]">ETA: <strong>{vessel.eta}</strong></div>
              )}
              {vessel.route_corridor && (
                <div className="text-slate-400 text-[10px]">Corridor: {vessel.route_corridor}</div>
              )}
              <div className="text-slate-500 text-[10px] border-t border-slate-800 pt-1">
                Projection derived from AIS route mapping corridor & cruising velocity
              </div>
            </div>
          </Popup>
        </Polyline>
      )}

      {/* Future +24h Terminal Waypoint Marker */}
      {showTrack && futurePolyCoords.length >= 2 && (
        <CircleMarker
          center={futurePolyCoords[futurePolyCoords.length - 1]}
          radius={isSelected ? 5 : 3.5}
          pathOptions={{
            color: '#34d399',
            fillColor: '#065f46',
            fillOpacity: 0.9,
            weight: 1.5,
          }}
        >
          <Popup>
            <div className="text-xs font-mono p-1.5 bg-[#0b0f17] text-slate-200 border border-emerald-900 rounded">
              <div className="font-bold text-emerald-400">{vessel.vessel_name} (+24h Position)</div>
              <div className="text-[11px] text-slate-300">
                Coord: {futurePolyCoords[futurePolyCoords.length - 1][0].toFixed(3)}°N, {futurePolyCoords[futurePolyCoords.length - 1][1].toFixed(3)}°E
              </div>
              {vessel.destination && <div className="text-[10px] text-emerald-300 mt-0.5">Bound for: {vessel.destination}</div>}
            </div>
          </Popup>
        </CircleMarker>
      )}

      {/* AIS Ping Breadcrumb Points - Subsampled for 60 FPS performance */}
      {showTrack &&
        polyCoords
          .filter((_, idx) => {
            if (isSelected) return idx % 2 === 0;
            return vessel.rank <= 3 && idx % 6 === 0;
          })
          .map((pt, idx) => (
            <CircleMarker
              key={`ping-${vessel.mmsi}-${idx}`}
              center={pt}
              radius={isSelected ? 2.5 : 1.8}
              pathOptions={{
                color: palette.stroke,
                fillColor: palette.fill,
                fillOpacity: isSelected ? 0.8 : 0.5,
                weight: 1,
              }}
            />
          ))}

      {/* Closest Point of Approach (CPA) / Discharge Event Alert Marker */}
      {vessel.cpa && (
        <CircleMarker
          center={[vessel.cpa.latitude, vessel.cpa.longitude]}
          radius={isSelected ? 10 : 7}
          pathOptions={{
            color: '#f43f5e',
            fillColor: '#991b1b',
            fillOpacity: 0.9,
            weight: 2,
          }}
        >
          <Popup>
            <div className="text-xs font-mono p-2 space-y-1 border border-rose-900/80 rounded bg-[#0b0f17]">
              <div className="font-bold text-rose-400 flex items-center gap-1 border-b border-rose-950 pb-1">
                <span>ANOMALOUS CPA DISCHARGE EVENT</span>
              </div>
              <div className="text-slate-300 text-[11px]">Vessel: <strong>{vessel.vessel_name}</strong></div>
              <div className="text-slate-300 text-[11px]">CPA Distance: <strong className="text-amber-300">{vessel.cpa.distance_to_origin_km} km to origin</strong></div>
              <div className="text-slate-300 text-[11px]">Speed Anomaly: <strong className="text-rose-400">{vessel.cpa.speed_before_kn} kn → {vessel.cpa.speed_during_kn} kn</strong></div>
              <div className="text-slate-500 text-[10px] pt-0.5">Event Timestamp: {vessel.cpa.timestamp}</div>
            </div>
          </Popup>
        </CircleMarker>
      )}

      {/* Forward Heading Vector Projection Line */}
      {(showTrack || isSelected) && (
        <Polyline
          positions={headingVector}
          pathOptions={{
            color: isSelected ? '#ffffff' : palette.stroke,
            weight: isSelected ? 2.5 : 1.5,
            dashArray: '3, 4',
            opacity: isSelected ? 0.95 : 0.6,
          }}
        />
      )}

      {/* Vessel Directional Hull Arrow Marker */}
      <Marker
        position={currentVesselPos}
        icon={vesselIcon}
        eventHandlers={{
          click: handleSelect,
        }}
      >
        <Popup>
          <div className="text-xs font-mono p-2 space-y-1 min-w-[200px] bg-[#0b0f17] border border-slate-800 rounded">
            <div className="font-bold text-slate-100 flex items-center justify-between border-b border-slate-700 pb-1">
              <span>{vessel.vessel_name}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded" style={{ backgroundColor: `${palette.fill}40`, color: palette.stroke }}>
                RANK #{vessel.rank}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300 pt-1">
              <div>MMSI: <strong className="text-slate-100">{vessel.mmsi}</strong></div>
              <div>Heading: <strong className="text-cyan-400">{currentHeadingDeg}°</strong></div>
              <div>Speed: <strong className="text-emerald-400">{vessel.speed_knots ?? vessel.cpa?.speed_during_kn ?? 'N/A'} kn</strong></div>
              <div>Priority: <strong className="text-rose-400">{vessel.investigative_priority}</strong></div>
            </div>
            {vessel.destination && (
              <div className="text-[11px] text-slate-300 pt-0.5">
                Destination: <strong className="text-emerald-300">{vessel.destination}</strong>
              </div>
            )}
            <div className="text-slate-300 text-[11px] border-t border-slate-800 pt-1">
              Attribution Score: <strong className="text-rose-400 text-xs">{vessel.score.toFixed(1)}/100</strong>
            </div>
            {hasDriftData && (
              <div className="text-[10px] text-amber-300 font-mono font-semibold pt-1 border-t border-slate-800 flex justify-between">
                <span>AIS Position At:</span>
                <span>
                  {mode === 'forward'
                    ? `+${(progress * 24).toFixed(1)}h (Forecast)`
                    : currentOffsetHours < -0.05
                    ? `${currentOffsetHours.toFixed(1)}h`
                    : 'T₀ (Observed)'}
                </span>
              </div>
            )}
          </div>
        </Popup>
      </Marker>
    </>
  );
};

export const VesselTrackLayer = React.memo(VesselTrackLayerComponent);

