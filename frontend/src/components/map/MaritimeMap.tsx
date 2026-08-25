import React, { useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  CircleMarker,
  Popup,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useInvestigation } from '../../context/InvestigationContext';
import type { VesselAttribution } from '../../types/investigation';

// Custom Auto Bounds Fitter
const MapBoundsFitter: React.FC<{
  coords: [number, number][];
}> = ({ coords }) => {
  const map = useMap();

  useEffect(() => {
    if (!coords || coords.length === 0) return;
    try {
      const lats = coords.map((c) => c[0]);
      const lons = coords.map((c) => c[1]);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);

      map.fitBounds(
        [
          [minLat - 0.08, minLon - 0.08],
          [maxLat + 0.08, maxLon + 0.08],
        ],
        { padding: [50, 50], maxZoom: 12, animate: true }
      );
    } catch {
      // Map may not be ready
    }
  }, [coords, map]);

  return null;
};

const RANK_PALETTE: Record<number, { stroke: string; fill: string; name: string }> = {
  1: { stroke: '#f43f5e', fill: '#f43f5e', name: 'Rank #1 Suspect (High)' },
  2: { stroke: '#f59e0b', fill: '#f59e0b', name: 'Rank #2 Suspect (Med)' },
  3: { stroke: '#06b6d4', fill: '#06b6d4', name: 'Rank #3 Candidate' },
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
  } = useInvestigation();

  // Extract all points for bounds fitting
  const allCoords: [number, number][] = [];
  if (investigation?.spill?.geometry?.coordinates?.[0]) {
    investigation.spill.geometry.coordinates[0].forEach((c: number[]) => {
      allCoords.push([c[1], c[0]]);
    });
  }
  if (investigation?.drift?.origin) {
    allCoords.push([investigation.drift.origin.latitude, investigation.drift.origin.longitude]);
  }

  const defaultCenter: [number, number] = [18.82, 73.05];

  return (
    <div className="w-full relative overflow-hidden bg-[#070b12]" style={{ height }}>
      <MapContainer
        center={defaultCenter}
        zoom={9}
        scrollWheelZoom={true}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        {/* Dark Maritime Basemap */}
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a> dark tiles | MaritimeTrace'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {allCoords.length > 0 && <MapBoundsFitter coords={allCoords} />}

        {investigation && (
          <>
            {/* 1. Oil Spill Detected Polygon */}
            {layers.spill && investigation.spill.geometry && (
              <Polygon
                positions={investigation.spill.geometry.coordinates[0].map(
                  (c: number[]) => [c[1], c[0]] as [number, number]
                )}
                pathOptions={{
                  color: '#ef4444',
                  fillColor: '#ef4444',
                  fillOpacity: 0.35,
                  weight: 2.5,
                  dashArray: '5, 5',
                }}
              >
                <Popup>
                  <div className="text-xs p-1 space-y-1 font-mono">
                    <div className="font-bold text-rose-400 flex items-center gap-1">
                      <span>🛢️ DETECTED OIL SLICK</span>
                    </div>
                    <div>Confidence: <strong>{(investigation.spill.confidence * 100).toFixed(1)}%</strong></div>
                    <div>Estimated Area: <strong>{investigation.spill.area_km2.toFixed(2)} km²</strong></div>
                    <div className="text-slate-400 text-[10px]">
                      Observation: {new Date(investigation.observation_time).toUTCString()}
                    </div>
                  </div>
                </Popup>
              </Polygon>
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
                  fillOpacity: 0.22,
                  weight: 2,
                  dashArray: '6, 4',
                }}
              >
                <Popup>
                  <div className="text-xs p-1 space-y-1 font-mono">
                    <div className="font-bold text-amber-400">🎯 ESTIMATED ORIGIN ZONE</div>
                    <div>Confidence: <strong>{(investigation.drift.origin.confidence * 100).toFixed(1)}%</strong></div>
                    <div>Window: {new Date(investigation.drift.origin_time_window.start).toLocaleTimeString()} – {new Date(investigation.drift.origin_time_window.end).toLocaleTimeString()} UTC</div>
                  </div>
                </Popup>
              </Polygon>
            )}

            {/* 3. Origin Point Pulsing Marker */}
            {layers.origin && (
              <>
                <CircleMarker
                  center={[investigation.drift.origin.latitude, investigation.drift.origin.longitude]}
                  radius={12}
                  pathOptions={{
                    color: '#f59e0b',
                    fillColor: '#f59e0b',
                    fillOpacity: 0.2,
                    weight: 1,
                  }}
                />
                <CircleMarker
                  center={[investigation.drift.origin.latitude, investigation.drift.origin.longitude]}
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
                      <strong className="text-amber-300">Spill Origin Center</strong>
                      <div>{investigation.drift.origin.latitude.toFixed(4)}°N, {investigation.drift.origin.longitude.toFixed(4)}°E</div>
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

            {/* 6. Candidate Vessel Tracks */}
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

  const palette = RANK_PALETTE[vessel.rank] || {
    stroke: '#64748b',
    fill: '#64748b',
    name: `Rank #${vessel.rank}`,
  };

  const polyCoords: [number, number][] = coords.map((c) => [c[1], c[0]]);
  const lastPos = polyCoords[polyCoords.length - 1];

  return (
    <>
      {/* Vessel Historic AIS Trajectory */}
      {showTrack && (
        <Polyline
          positions={polyCoords}
          pathOptions={{
            color: palette.stroke,
            weight: isSelected ? 4.5 : 2.2,
            opacity: isSelected ? 1 : 0.65,
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
              <div className="text-slate-300">Attribution Score: <strong className="text-rose-400">{vessel.score.toFixed(1)}/100</strong></div>
              <div className="text-slate-400 text-[10px]">Priority: {vessel.investigative_priority}</div>
            </div>
          </Popup>
        </Polyline>
      )}

      {/* Vessel Position Marker */}
      <CircleMarker
        center={lastPos}
        radius={isSelected ? 8 : 5}
        pathOptions={{
          color: isSelected ? '#ffffff' : palette.stroke,
          fillColor: palette.fill,
          fillOpacity: 0.95,
          weight: isSelected ? 2.5 : 1.5,
        }}
        eventHandlers={{
          click: onSelect,
        }}
      >
        <Popup>
          <div className="text-xs font-mono p-1 space-y-1">
            <strong className="text-slate-100">🚢 {vessel.vessel_name}</strong>
            <div>MMSI: {vessel.mmsi}</div>
            <div>Attribution Score: <strong className="text-rose-400">{vessel.score.toFixed(1)}/100</strong></div>
          </div>
        </Popup>
      </CircleMarker>
    </>
  );
};
