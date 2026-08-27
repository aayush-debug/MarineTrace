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
import { BASEMAP_CONFIGS } from '../../utils/mapTiles';
import { MapZoomControl } from './MapZoomControl';

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
    basemap,
    spcsftLiveDetections,
    launchInvestigationFromSpcsft,
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

  const defaultCenter: [number, number] = [18.95, 72.30];
  const activeBasemap = BASEMAP_CONFIGS[basemap] || BASEMAP_CONFIGS['google-hybrid'];

  return (
    <div className="w-full relative overflow-hidden bg-[#070b12]" style={{ height }}>
      <MapContainer
        center={defaultCenter}
        zoom={9}
        scrollWheelZoom={true}
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
        />

        {allCoords.length > 0 && <MapBoundsFitter coords={allCoords} />}

        {investigation && (
          <>
            {/* 0. Sentinel-1 SAR Satellite Acquisition Swath Footprint */}
            {investigation.spill.sar_swath && (
              <Polygon
                positions={investigation.spill.sar_swath.coordinates[0].map(
                  (c: number[]) => [c[1], c[0]] as [number, number]
                )}
                pathOptions={{
                  color: '#38bdf8',
                  fillColor: '#0284c7',
                  fillOpacity: 0.04,
                  weight: 1,
                  dashArray: '4, 8',
                }}
              >
                <Popup>
                  <div className="text-xs p-1 font-mono space-y-1">
                    <div className="font-bold text-sky-300">🛰️ SENTINEL-1 SAR PASS</div>
                    <div>Mode: <strong>IW (Interferometric Wide)</strong></div>
                    <div>Polarization: <strong>VV + VH</strong></div>
                    <div>Orbit: <strong>Descending (Track 12)</strong></div>
                  </div>
                </Popup>
              </Polygon>
            )}

            {/* 1. REALISTIC OIL SPILL DETECTION LAYERS */}
            {layers.spill && (
              <>
                {/* 1a. Secondary Sheen Filaments / Dispersed Droplets */}
                {investigation.spill.sheen_geometry?.map((sheen, idx) => (
                  <Polygon
                    key={`sheen-${idx}`}
                    positions={sheen.coordinates[0].map(
                      (c: number[]) => [c[1], c[0]] as [number, number]
                    )}
                    pathOptions={{
                      color: '#fb7185',
                      fillColor: '#e11d48',
                      fillOpacity: 0.22,
                      weight: 1,
                      dashArray: '2, 3',
                    }}
                  />
                ))}

                {/* 1b. Main Oil Slick Sheen Layer (Multi-branched organic shape) */}
                {investigation.spill.geometry && (
                  <Polygon
                    positions={investigation.spill.geometry.coordinates[0].map(
                      (c: number[]) => [c[1], c[0]] as [number, number]
                    )}
                    pathOptions={{
                      color: '#f43f5e',
                      fillColor: '#be123c',
                      fillOpacity: 0.35,
                      weight: 2,
                      className: 'slick-sheen-polygon',
                    }}
                  >
                    <Popup>
                      <div className="text-xs p-1.5 space-y-1.5 font-mono">
                        <div className="font-bold text-rose-400 flex items-center justify-between border-b border-rose-900/50 pb-1">
                          <span>🛢️ DETECTED OIL SLICK</span>
                          <span className="text-[10px] bg-rose-950 text-rose-300 px-1 py-0.5 rounded">SAR C-BAND</span>
                        </div>
                        <div className="grid grid-cols-2 gap-1 text-[11px]">
                          <div>Confidence: <strong className="text-emerald-400">{(investigation.spill.confidence * 100).toFixed(1)}%</strong></div>
                          <div>Total Area: <strong className="text-rose-300">{investigation.spill.area_km2.toFixed(2)} km²</strong></div>
                          <div>Slick Type: <strong>Heavy Hydrocarbon</strong></div>
                          <div>Thickness: <strong>0.1 – 1.8 mm (Emulsion)</strong></div>
                        </div>
                        <div className="text-slate-400 text-[10px] border-t border-slate-800 pt-1">
                          Observation: {new Date(investigation.observation_time).toUTCString()}
                        </div>
                      </div>
                    </Popup>
                  </Polygon>
                )}

                {/* 1c. Heavy Crude Emulsion Mousse Core */}
                {investigation.spill.core_geometry && (
                  <Polygon
                    positions={investigation.spill.core_geometry.coordinates[0].map(
                      (c: number[]) => [c[1], c[0]] as [number, number]
                    )}
                    pathOptions={{
                      color: '#fda4af',
                      fillColor: '#881337',
                      fillOpacity: 0.75,
                      weight: 1.5,
                      className: 'slick-core-polygon',
                    }}
                  >
                    <Popup>
                      <div className="text-xs p-1 font-mono">
                        <div className="font-bold text-rose-300">Dense Emulsion Core</div>
                        <div>Peak thickness hydrocarbon mousse</div>
                      </div>
                    </Popup>
                  </Polygon>
                )}

                {/* 1d. Spill Center Target Tag */}
                <CircleMarker
                  center={[18.822, 72.418]}
                  radius={4}
                  pathOptions={{
                    color: '#f43f5e',
                    fillColor: '#ffffff',
                    fillOpacity: 1,
                    weight: 2,
                  }}
                />
              </>
            )}

            {/* 1b. Space Shift (SateAIs™) Real-Time API Oil Slicks */}
            {layers.spcsft && spcsftLiveDetections.map((det) => (
              <React.Fragment key={`map-spcsft-${det.detection_id}`}>
                {det.geometry?.coordinates?.[0] && (
                  <Polygon
                    positions={(det.geometry.coordinates as number[][][])[0].map(
                      (c) => [c[1], c[0]] as [number, number]
                    )}
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
                          <span>⚡ Investigate Slick</span>
                        </button>
                      </div>
                    </Popup>
                  </Polygon>
                )}
              </React.Fragment>
            ))}

            {/* 2. MULTI-TIER PROBABILISTIC ORIGIN ZONES */}
            {layers.origin && (
              <>
                {/* 2a. Multi-tier Confidence Envelopes (90%, 70%, 50%) */}
                {investigation.drift.origin.confidence_zones ? (
                  investigation.drift.origin.confidence_zones.map((zone, idx) => {
                    const opacities = [0.08, 0.18, 0.35];
                    const weights = [1, 1.5, 2];
                    const dashes = ['3, 6', '4, 4', undefined];
                    return (
                      <Polygon
                        key={`conf-zone-${idx}`}
                        positions={zone.geometry.coordinates[0].map(
                          (c: number[]) => [c[1], c[0]] as [number, number]
                        )}
                        pathOptions={{
                          color: '#f59e0b',
                          fillColor: '#d97706',
                          fillOpacity: opacities[idx] || 0.15,
                          weight: weights[idx] || 1.5,
                          dashArray: dashes[idx],
                        }}
                      >
                        <Popup>
                          <div className="text-xs p-1 font-mono">
                            <div className="font-bold text-amber-400">🎯 {zone.level}</div>
                            <div>Bayesian Probability: <strong>{(zone.confidence * 100).toFixed(0)}%</strong></div>
                          </div>
                        </Popup>
                      </Polygon>
                    );
                  })
                ) : (
                  investigation.drift.origin.geometry && (
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
                    />
                  )
                )}

                {/* 2b. Pulsing Tactical Origin Target Beacon */}
                <CircleMarker
                  center={[investigation.drift.origin.latitude, investigation.drift.origin.longitude]}
                  radius={16}
                  pathOptions={{
                    color: '#f59e0b',
                    fillColor: '#f59e0b',
                    fillOpacity: 0.12,
                    weight: 1,
                  }}
                />
                <CircleMarker
                  center={[investigation.drift.origin.latitude, investigation.drift.origin.longitude]}
                  radius={8}
                  pathOptions={{
                    color: '#fbbf24',
                    fillColor: '#d97706',
                    fillOpacity: 0.85,
                    weight: 2,
                  }}
                >
                  <Popup>
                    <div className="text-xs p-1.5 font-mono space-y-1">
                      <div className="font-bold text-amber-300 flex items-center justify-between border-b border-amber-800/50 pb-1">
                        <span>🎯 ESTIMATED DISCHARGE POINT</span>
                        <span className="text-[10px] bg-amber-950 text-amber-300 px-1 py-0.5 rounded">OPENDRIFT</span>
                      </div>
                      <div>Origin Coordinates: <strong>{investigation.drift.origin.latitude.toFixed(4)}°N, {investigation.drift.origin.longitude.toFixed(4)}°E</strong></div>
                      <div>Confidence Score: <strong className="text-emerald-400">{(investigation.drift.origin.confidence * 100).toFixed(1)}%</strong></div>
                      <div>Discharge Window: <strong>{new Date(investigation.drift.origin_time_window.start).toLocaleTimeString()} – {new Date(investigation.drift.origin_time_window.end).toLocaleTimeString()} UTC</strong></div>
                    </div>
                  </Popup>
                </CircleMarker>
              </>
            )}

            {/* 3. LAGRANGIAN DRIFT DISPERSION & TRAJECTORIES */}
            {layers.drift && (
              <>
                {/* 3a. Drift Uncertainty Dispersion Corridor */}
                {investigation.drift.backward_trajectory.uncertainty_corridor && (
                  <Polygon
                    positions={investigation.drift.backward_trajectory.uncertainty_corridor.coordinates[0].map(
                      (c: number[]) => [c[1], c[0]] as [number, number]
                    )}
                    pathOptions={{
                      color: '#38bdf8',
                      fillColor: '#0284c7',
                      fillOpacity: 0.07,
                      weight: 1,
                      dashArray: '3, 6',
                    }}
                  />
                )}

                {/* 3b. OpenDrift Simulated Lagrangian Particles */}
                {investigation.drift.backward_trajectory.particles?.map((particle, idx) => (
                  <CircleMarker
                    key={`particle-${idx}`}
                    center={[particle.lat, particle.lon]}
                    radius={Math.max(2, Math.min(6, particle.dispersion_radius / 160))}
                    pathOptions={{
                      color: '#38bdf8',
                      fillColor: '#06b6d4',
                      fillOpacity: Math.max(0.2, 0.85 - particle.age_hours * 0.025),
                      weight: 0.5,
                    }}
                  />
                ))}

                {/* 3c. Flowing Reverse Drift Trajectory Path */}
                {investigation.drift.backward_trajectory?.points && (
                  <Polyline
                    positions={investigation.drift.backward_trajectory.points.map(
                      (p) => [p[1], p[0]] as [number, number]
                    )}
                    pathOptions={{
                      color: '#06b6d4',
                      weight: 3.5,
                      dashArray: '8, 6',
                      opacity: 0.95,
                      className: 'path-drift-backward',
                    }}
                  >
                    <Popup>
                      <div className="text-xs p-1.5 font-mono space-y-1">
                        <strong className="text-cyan-300">↩️ Reverse Hydrodynamic Drift</strong>
                        <div>Model: <strong>OpenDrift / ECMWF Currents</strong></div>
                        <div>Duration: <strong>24.0 Hours Backtrack</strong></div>
                        <div className="text-slate-400 text-[10px]">Traces spill backward against 0.85 kn SW current</div>
                      </div>
                    </Popup>
                  </Polyline>
                )}

                {/* 3d. Milestone Waypoint Beads along Trajectory */}
                {investigation.drift.backward_trajectory?.points.map((p, idx) => {
                  if (idx === 0 || idx === investigation.drift.backward_trajectory.points.length - 1) return null;
                  return (
                    <CircleMarker
                      key={`waypoint-${idx}`}
                      center={[p[1], p[0]]}
                      radius={3}
                      pathOptions={{
                        color: '#0891b2',
                        fillColor: '#22d3ee',
                        fillOpacity: 1,
                        weight: 1.5,
                      }}
                    >
                      <Popup>
                        <div className="text-xs p-1 font-mono">
                          <strong className="text-cyan-300">Drift Step {idx}</strong>
                          <div>{investigation.drift.backward_trajectory.timestamps?.[idx] || `Step ${idx}`}</div>
                        </div>
                      </Popup>
                    </CircleMarker>
                  );
                })}
              </>
            )}

            {/* 4. FORWARD SPREAD FORECAST */}
            {layers.forecast && investigation.drift.forward_trajectory?.points && (
              <Polyline
                positions={investigation.drift.forward_trajectory.points.map(
                  (p) => [p[1], p[0]] as [number, number]
                )}
                pathOptions={{
                  color: '#10b981',
                  weight: 3,
                  dashArray: '6, 6',
                  opacity: 0.9,
                  className: 'path-drift-forward',
                }}
              >
                <Popup>
                  <div className="text-xs p-1 font-mono">
                    <strong className="text-emerald-400">↗️ 24h Forward Spread Forecast</strong>
                    <div>Simulates slick weathering & southward spread</div>
                  </div>
                </Popup>
              </Polyline>
            )}

            {/* 5. AIS CANDIDATE VESSEL TRACKS */}
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

        {/* Custom Google Maps Style Zoom In / Zoom Out Controls */}
        <MapZoomControl />
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
              <div className="text-slate-300">Attribution Score: <strong className="text-rose-400">{vessel.score.toFixed(1)}/100</strong></div>
              <div className="text-slate-400 text-[10px]">Priority: {vessel.investigative_priority}</div>
            </div>
          </Popup>
        </Polyline>
      )}

      {/* AIS Ping Breadcrumb Points */}
      {showTrack &&
        polyCoords.map((pt, idx) => (
          <CircleMarker
            key={`ping-${vessel.mmsi}-${idx}`}
            center={pt}
            radius={2}
            pathOptions={{
              color: palette.stroke,
              fillColor: palette.fill,
              fillOpacity: 0.6,
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
            <div className="text-xs font-mono p-1.5 space-y-1 border border-rose-900 rounded bg-slate-950">
              <div className="font-bold text-rose-400 flex items-center gap-1">
                <span>⚠️ ANOMALOUS CPA EVENT</span>
              </div>
              <div>Vessel: <strong>{vessel.vessel_name}</strong></div>
              <div>CPA Distance: <strong className="text-amber-300">{vessel.cpa.distance_to_origin_km} km to origin</strong></div>
              <div>Speed Deceleration: <strong className="text-rose-400">{vessel.cpa.speed_before_kn} kn → {vessel.cpa.speed_during_kn} kn</strong></div>
              <div className="text-slate-400 text-[10px]">Event Time: {vessel.cpa.timestamp}</div>
            </div>
          </Popup>
        </CircleMarker>
      )}

      {/* Vessel Current/Last Position Marker */}
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
            <div>Heading: {vessel.heading ? `${vessel.heading}°` : 'N/A'}</div>
            <div>Attribution Score: <strong className="text-rose-400">{vessel.score.toFixed(1)}/100</strong></div>
          </div>
        </Popup>
      </CircleMarker>
    </>
  );
};

