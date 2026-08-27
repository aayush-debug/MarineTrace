import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  CircleMarker,
  Popup,
  useMap,
  Marker,
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Plus,
  Minus,
  Maximize2,
  Minimize2,
  Compass,
  Crosshair,
  Ruler,
  Navigation,
  Ship,
  Flame,
} from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';
import type { VesselAttribution } from '../../types/investigation';
import { MapBasemapSelector } from './MapBasemapSelector';
import { MapSearchBar } from './MapSearchBar';
import { MapMeasureLayer, MapMeasureHUD } from './MapMeasureTool';
import { MapCoordinateListener, MapCoordinateHUD } from './MapCoordinateHUD';
import { MaritimeOverlays } from './MaritimeOverlays';

// Tile URL providers
const BASEMAP_TILES: Record<string, { url: string; attribution: string }> = {
  dark: {
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO &copy; OpenStreetMap',
  },
  satellite: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye',
  },
  ocean: {
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Ocean/World_Ocean_Base/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles &copy; Esri &mdash; GEBCO, NOAA, National Geographic',
  },
  standard: {
    url: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
    attribution: '&copy; CARTO &copy; OpenStreetMap',
  },
};

// Map FlyTo and Bounds Controller
const MapController: React.FC<{
  target: { lat: number; lng: number; zoom: number } | null;
  fitCoords: [number, number][];
}> = ({ target, fitCoords }) => {
  const map = useMap();

  useEffect(() => {
    if (target) {
      map.flyTo([target.lat, target.lng], target.zoom, {
        duration: 1.2,
        easeLinearity: 0.25,
      });
    }
  }, [target, map]);

  useEffect(() => {
    if (fitCoords && fitCoords.length > 0) {
      try {
        const lats = fitCoords.map((c) => c[0]);
        const lons = fitCoords.map((c) => c[1]);
        const minLat = Math.min(...lats);
        const maxLat = Math.max(...lats);
        const minLon = Math.min(...lons);
        const maxLon = Math.max(...lons);

        map.fitBounds(
          [
            [minLat - 0.08, minLon - 0.08],
            [maxLat + 0.08, maxLon + 0.08],
          ],
          { padding: [60, 60], maxZoom: 13, animate: true }
        );
      } catch {
        // Map may not be ready
      }
    }
  }, [fitCoords, map]);

  return null;
};

// Create SVG Vessel Marker with Heading Rotation
function createVesselIcon(
  rank: number,
  heading: number,
  isSelected: boolean
): L.DivIcon {
  const color = rank === 1 ? '#f43f5e' : rank === 2 ? '#f59e0b' : '#06b6d4';
  const size = isSelected ? 32 : 24;

  const html = `
    <div style="transform: rotate(${heading}deg); transform-origin: center center; width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; position: relative;">
      ${
        isSelected
          ? `<div style="position: absolute; inset: -4px; border-radius: 50%; border: 2px solid ${color}; animation: pulse-ring 2s infinite;"></div>`
          : ''
      }
      <svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="${color}" stroke="#ffffff" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="filter: drop-shadow(0 2px 4px rgba(0,0,0,0.8));">
        <path d="M12 2L4 20L12 16L20 20L12 2Z"/>
      </svg>
    </div>
  `;

  return L.divIcon({
    html,
    className: 'vessel-marker-icon',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

// Custom Floating Controls Bar
const GoogleMapControls: React.FC<{
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetNorth: () => void;
  onFitBounds: () => void;
  onToggleMeasure: () => void;
  onToggleFullscreen: () => void;
  isFullscreen: boolean;
  measuring: boolean;
}> = ({
  onZoomIn,
  onZoomOut,
  onResetNorth,
  onFitBounds,
  onToggleMeasure,
  onToggleFullscreen,
  isFullscreen,
  measuring,
}) => {
  return (
    <div className="absolute top-3 right-3 z-[1000] font-mono select-none flex flex-col gap-2">
      {/* Zoom Control Pill */}
      <div className="flex flex-col bg-[#080d1a]/95 backdrop-blur-md border border-[rgba(255,255,255,0.12)] rounded-xl shadow-2xl overflow-hidden divide-y divide-[rgba(255,255,255,0.08)]">
        <button
          onClick={onZoomIn}
          className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-[#111c33] transition-colors"
          title="Zoom In"
        >
          <Plus className="w-4 h-4" />
        </button>
        <button
          onClick={onZoomOut}
          className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-[#111c33] transition-colors"
          title="Zoom Out"
        >
          <Minus className="w-4 h-4" />
        </button>
      </div>

      {/* Action Tools Pill */}
      <div className="flex flex-col bg-[#080d1a]/95 backdrop-blur-md border border-[rgba(255,255,255,0.12)] rounded-xl shadow-2xl overflow-hidden divide-y divide-[rgba(255,255,255,0.08)]">
        <button
          onClick={onFitBounds}
          className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-[#111c33] transition-colors"
          title="Recenter & Fit Spill Extents"
        >
          <Crosshair className="w-4 h-4 text-cyan-400" />
        </button>

        <button
          onClick={onResetNorth}
          className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-[#111c33] transition-colors"
          title="Reset North Orientation"
        >
          <Compass className="w-4 h-4 text-slate-400 hover:text-slate-100" />
        </button>

        <button
          onClick={onToggleMeasure}
          className={`p-2 transition-colors ${
            measuring
              ? 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400'
              : 'text-slate-300 hover:text-cyan-300 hover:bg-[#111c33]'
          }`}
          title="Nautical Distance Measurement Ruler"
        >
          <Ruler className="w-4 h-4" />
        </button>

        <button
          onClick={onToggleFullscreen}
          className="p-2 text-slate-300 hover:text-cyan-300 hover:bg-[#111c33] transition-colors"
          title={isFullscreen ? 'Exit Fullscreen' : 'Fullscreen Map'}
        >
          {isFullscreen ? (
            <Minimize2 className="w-4 h-4 text-amber-400" />
          ) : (
            <Maximize2 className="w-4 h-4 text-slate-400" />
          )}
        </button>
      </div>
    </div>
  );
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
    measuring,
    setMeasuring,
  } = useInvestigation();

  const containerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  const [flyTarget, setFlyTarget] = useState<{ lat: number; lng: number; zoom: number } | null>(null);
  const [measurePoints, setMeasurePoints] = useState<[number, number][]>([]);
  const [coords, setCoords] = useState<{ lat: number; lng: number; zoom: number }>({
    lat: 18.82,
    lng: 73.05,
    zoom: 9,
  });
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Extract all points for bounds fitting
  const allCoords: [number, number][] = React.useMemo(() => {
    const coordsList: [number, number][] = [];
    if (investigation?.spill?.geometry?.coordinates?.[0]) {
      investigation.spill.geometry.coordinates[0].forEach((c: number[]) => {
        coordsList.push([c[1], c[0]]);
      });
    }
    if (investigation?.drift?.origin) {
      coordsList.push([investigation.drift.origin.latitude, investigation.drift.origin.longitude]);
    }
    return coordsList;
  }, [investigation]);

  const defaultCenter: [number, number] = [18.82, 73.05];

  const handleFlyTo = (lat: number, lng: number, zoom: number) => {
    setFlyTarget({ lat, lng, zoom });
  };

  const handleFitBounds = useCallback(() => {
    if (allCoords.length > 0 && mapInstanceRef.current) {
      const lats = allCoords.map((c) => c[0]);
      const lons = allCoords.map((c) => c[1]);
      mapInstanceRef.current.fitBounds(
        [
          [Math.min(...lats) - 0.08, Math.min(...lons) - 0.08],
          [Math.max(...lats) + 0.08, Math.max(...lons) + 0.08],
        ],
        { padding: [50, 50], maxZoom: 13, animate: true }
      );
    }
  }, [allCoords]);

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const currentBasemap = BASEMAP_TILES[basemap] || BASEMAP_TILES.dark;

  return (
    <div
      ref={containerRef}
      className={`w-full relative overflow-hidden font-mono select-none ${
        isFullscreen ? 'fixed inset-0 z-[9999] h-screen w-screen bg-[#05080f]' : 'bg-[#070b12]'
      }`}
      style={{ height: isFullscreen ? '100vh' : height }}
    >
      {/* 1. Google Maps-Style Floating Search & Quick-Jump Bar */}
      <MapSearchBar onFlyTo={handleFlyTo} />

      {/* 2. Google Maps-Style Basemap Switcher (Bottom-Left) */}
      <MapBasemapSelector />

      {/* 3. Distance Measure HUD */}
      <MapMeasureHUD
        points={measurePoints}
        onClear={() => setMeasurePoints([])}
        onClose={() => {
          setMeasuring(false);
          setMeasurePoints([]);
        }}
      />

      {/* 4. Live Coordinates & Dynamic Scale HUD (Bottom-Right) */}
      <MapCoordinateHUD coords={coords} />

      {/* 5. Custom Floating Controls */}
      <GoogleMapControls
        onZoomIn={() => mapInstanceRef.current?.zoomIn()}
        onZoomOut={() => mapInstanceRef.current?.zoomOut()}
        onResetNorth={() => handleFlyTo(coords.lat, coords.lng, coords.zoom)}
        onFitBounds={handleFitBounds}
        onToggleMeasure={() => {
          setMeasuring(!measuring);
          if (measuring) setMeasurePoints([]);
        }}
        onToggleFullscreen={handleToggleFullscreen}
        isFullscreen={isFullscreen}
        measuring={measuring}
      />

      {/* Leaflet Core Map Container */}
      <MapContainer
        center={defaultCenter}
        zoom={9}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
        attributionControl={false}
        ref={(m) => {
          if (m) mapInstanceRef.current = m;
        }}
      >
        {/* Base TileLayer */}
        <TileLayer key={basemap} url={currentBasemap.url} attribution={currentBasemap.attribution} />

        {/* Satellite Labels Overlay */}
        {basemap === 'satellite' && (
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/dark_only_labels/{z}/{x}/{y}{r}.png"
            opacity={0.8}
          />
        )}

        {/* OpenSeaMap Nautical Seamarks Overlay */}
        {layers.seamarks && (
          <TileLayer
            url="https://tiles.openseamap.org/seamark/{z}/{x}/{y}.png"
            opacity={0.9}
          />
        )}

        {/* Coordinate & Zoom Listener */}
        <MapCoordinateListener onCoordsChange={setCoords} />

        {/* FlyTo & Bounds Handler */}
        <MapController target={flyTarget} fitCoords={allCoords} />

        {/* Distance Measure Interaction Layer */}
        {measuring && (
          <MapMeasureLayer
            points={measurePoints}
            onAddPoint={(pt) => setMeasurePoints((prev) => [...prev, pt])}
          />
        )}

        {/* Nautical Overlays (EEZ, TSS Shipping Corridors, Mumbai High Rigs, Ports) */}
        <MaritimeOverlays />

        {/* ─── Active Incident Intelligence Layers ─── */}
        {investigation && (
          <>
            {/* 1. Multi-Tier Oil Spill Slick */}
            {layers.spill && investigation.spill.geometry && (
              <>
                {/* Outer Sheen Boundary */}
                <Polygon
                  positions={investigation.spill.geometry.coordinates[0].map(
                    (c: number[]) => [c[1], c[0]] as [number, number]
                  )}
                  pathOptions={{
                    color: '#f43f5e',
                    fillColor: '#ef4444',
                    fillOpacity: 0.35,
                    weight: 2.5,
                    dashArray: '6, 6',
                  }}
                >
                  <Popup>
                    <div className="text-xs p-1 space-y-1 font-mono">
                      <div className="font-bold text-rose-400 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5" />
                        <span>DETECTED OIL SLICK</span>
                      </div>
                      <div>
                        Confidence:{' '}
                        <strong className="text-emerald-400">
                          {(investigation.spill.confidence * 100).toFixed(1)}%
                        </strong>
                      </div>
                      <div>
                        Estimated Area:{' '}
                        <strong className="text-amber-300">
                          {investigation.spill.area_km2.toFixed(2)} km²
                        </strong>
                      </div>
                      <div className="text-slate-400 text-[10px]">
                        Sensor: Sentinel-1 SAR IW (C-Band)
                      </div>
                      <div className="text-slate-400 text-[10px]">
                        Observed: {new Date(investigation.observation_time).toUTCString()}
                      </div>
                    </div>
                  </Popup>
                </Polygon>

                {/* Inner Heavy Emulsion Core */}
                <CircleMarker
                  center={[
                    investigation.spill.geometry.coordinates[0][0][1],
                    investigation.spill.geometry.coordinates[0][0][0],
                  ]}
                  radius={10}
                  pathOptions={{
                    color: '#e11d48',
                    fillColor: '#881337',
                    fillOpacity: 0.8,
                    weight: 2,
                  }}
                />
              </>
            )}

            {/* 2. Estimated Origin Probability Zone Polygon */}
            {layers.origin && investigation.drift.origin.geometry && (
              <Polygon
                positions={investigation.drift.origin.geometry.coordinates[0].map(
                  (c: number[]) => [c[1], c[0]] as [number, number]
                )}
                pathOptions={{
                  color: '#f59e0b',
                  fillColor: '#f59e0b',
                  fillOpacity: 0.2,
                  weight: 2,
                  dashArray: '8, 4',
                }}
              >
                <Popup>
                  <div className="text-xs p-1 space-y-1 font-mono">
                    <div className="font-bold text-amber-400 flex items-center gap-1">
                      <Crosshair className="w-3.5 h-3.5" />
                      <span>ESTIMATED ORIGIN ZONE</span>
                    </div>
                    <div>
                      Confidence:{' '}
                      <strong className="text-emerald-400">
                        {(investigation.drift.origin.confidence * 100).toFixed(0)}%
                      </strong>
                    </div>
                    <div>
                      Window:{' '}
                      {new Date(investigation.drift.origin_time_window.start).toLocaleTimeString()} –{' '}
                      {new Date(investigation.drift.origin_time_window.end).toLocaleTimeString()} UTC
                    </div>
                  </div>
                </Popup>
              </Polygon>
            )}

            {/* 3. Origin Point Center Beacon */}
            {layers.origin && (
              <>
                <CircleMarker
                  center={[
                    investigation.drift.origin.latitude,
                    investigation.drift.origin.longitude,
                  ]}
                  radius={14}
                  pathOptions={{
                    color: '#f59e0b',
                    fillColor: '#f59e0b',
                    fillOpacity: 0.15,
                    weight: 1,
                  }}
                />
                <CircleMarker
                  center={[
                    investigation.drift.origin.latitude,
                    investigation.drift.origin.longitude,
                  ]}
                  radius={6}
                  pathOptions={{
                    color: '#fbbf24',
                    fillColor: '#f59e0b',
                    fillOpacity: 0.95,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="text-xs p-1 font-mono">
                      <strong className="text-amber-300">🎯 Spill Origin Center</strong>
                      <div>
                        {investigation.drift.origin.latitude.toFixed(4)}°N,{' '}
                        {investigation.drift.origin.longitude.toFixed(4)}°E
                      </div>
                    </div>
                  </Popup>
                </CircleMarker>
              </>
            )}

            {/* 4. Backward Drift Trajectory */}
            {layers.drift && investigation.drift.backward_trajectory?.points && (
              <Polyline
                positions={investigation.drift.backward_trajectory.points.map(
                  (p) => [p[1], p[0]] as [number, number]
                )}
                pathOptions={{
                  color: '#38bdf8',
                  weight: 3.5,
                  dashArray: '8, 6',
                  opacity: 0.9,
                }}
              >
                <Popup>
                  <div className="text-xs p-1 font-mono">
                    <strong className="text-cyan-300">↩️ Reverse Drift Simulation (OpenDrift)</strong>
                    <div>Total Simulation Steps: {investigation.drift.backward_trajectory.points.length}</div>
                    <div className="text-slate-400 text-[10px]">Traces spill backward to origin point</div>
                  </div>
                </Popup>
              </Polyline>
            )}

            {/* 5. Forward Drift Prediction */}
            {layers.forecast && investigation.drift.forward_trajectory?.points && (
              <Polyline
                positions={investigation.drift.forward_trajectory.points.map(
                  (p) => [p[1], p[0]] as [number, number]
                )}
                pathOptions={{
                  color: '#10b981',
                  weight: 3,
                  dashArray: '6, 6',
                  opacity: 0.85,
                }}
              >
                <Popup>
                  <div className="text-xs p-1 font-mono">
                    <strong className="text-emerald-400">↗️ 24h Forward Spread Forecast</strong>
                    <div>Predicts future slick drift vector</div>
                  </div>
                </Popup>
              </Polyline>
            )}

            {/* 6. Candidate Vessel Tracks with Heading Icons */}
            {layers.vessels &&
              investigation.vessels.map((vessel) => (
                <VesselTrackLayer
                  key={vessel.mmsi}
                  vessel={vessel}
                  isSelected={selectedVesselMmsi === vessel.mmsi}
                  showTrack={layers.tracks}
                  onSelect={() => setSelectedVesselMmsi(vessel.mmsi)}
                />
              ))}
          </>
        )}
      </MapContainer>
    </div>
  );
};

const VesselTrackLayer: React.FC<{
  vessel: VesselAttribution;
  isSelected: boolean;
  showTrack: boolean;
  onSelect: () => void;
}> = ({ vessel, isSelected, showTrack, onSelect }) => {
  if (!vessel.trajectory?.coordinates) return null;
  const coords = vessel.trajectory.coordinates as number[][];
  if (coords.length < 2) return null;

  const polyCoords: [number, number][] = coords.map((c) => [c[1], c[0]]);
  const lastPos = polyCoords[polyCoords.length - 1];
  const prevPos = polyCoords[polyCoords.length - 2];

  // Calculate heading angle from last 2 trajectory points
  const dLon = ((lastPos[1] - prevPos[1]) * Math.PI) / 180;
  const lat1 = (prevPos[0] * Math.PI) / 180;
  const lat2 = (lastPos[0] * Math.PI) / 180;
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLon);
  const heading = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;

  const trackColor =
    vessel.rank === 1 ? '#f43f5e' : vessel.rank === 2 ? '#f59e0b' : '#06b6d4';

  const vesselIcon = createVesselIcon(vessel.rank, heading, isSelected);

  return (
    <>
      {/* Historic AIS Trajectory */}
      {showTrack && (
        <Polyline
          positions={polyCoords}
          pathOptions={{
            color: trackColor,
            weight: isSelected ? 4.5 : 2.5,
            opacity: isSelected ? 1 : 0.7,
          }}
          eventHandlers={{
            click: onSelect,
          }}
        >
          <Popup>
            <div className="text-xs font-mono p-1 space-y-1">
              <div className="font-bold text-slate-100 flex items-center justify-between">
                <span>🚢 {vessel.vessel_name}</span>
                <span className="text-[10px] text-cyan-400 font-bold">#{vessel.rank}</span>
              </div>
              <div className="text-slate-300">Type: {vessel.vessel_type}</div>
              <div className="text-slate-300">
                Attribution Score:{' '}
                <strong className="text-rose-400">{vessel.score.toFixed(1)}/100</strong>
              </div>
              <div className="text-slate-400 text-[10px]">
                Priority: {vessel.investigative_priority}
              </div>
            </div>
          </Popup>
        </Polyline>
      )}

      {/* Oriented Vessel Ship Marker */}
      <Marker
        position={lastPos}
        icon={vesselIcon}
        eventHandlers={{
          click: onSelect,
        }}
      >
        <Popup>
          <div className="text-xs font-mono p-1 space-y-1.5 min-w-[200px]">
            <div className="flex items-center justify-between border-b border-slate-700 pb-1">
              <span className="font-bold text-slate-100 flex items-center gap-1">
                <Ship className="w-3.5 h-3.5 text-cyan-400" />
                {vessel.vessel_name}
              </span>
              <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-400 border border-rose-500/30">
                RANK #{vessel.rank}
              </span>
            </div>

            <div className="space-y-0.5 text-[11px] text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-500">MMSI:</span>
                <span className="font-bold">{vessel.mmsi}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Vessel Type:</span>
                <span>{vessel.vessel_type}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Flag:</span>
                <span>{vessel.flag}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Course / Heading:</span>
                <span>{heading.toFixed(0)}° True</span>
              </div>
              <div className="flex justify-between items-baseline pt-1 border-t border-slate-800">
                <span className="text-slate-500">Attribution Score:</span>
                <span className="font-bold text-sm text-rose-400">{vessel.score.toFixed(1)}%</span>
              </div>
            </div>

            <button
              onClick={onSelect}
              className="w-full py-1 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-[10px] mt-1 transition-colors flex items-center justify-center gap-1"
            >
              <Navigation className="w-3 h-3" />
              <span>ISOLATE & FOCUS TRACK</span>
            </button>
          </div>
        </Popup>
      </Marker>
    </>
  );
};
