import React, { useEffect, useMemo } from 'react';
import L from 'leaflet';
import {
  MapContainer,
  TileLayer,
  ImageOverlay,
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

/**
 * Create custom SVG Directional Vessel Icon with Arrow Pointer
 */
export function createVesselDirectionalIcon(
  headingDeg: number,
  palette: { stroke: string; fill: string },
  isSelected: boolean,
  rank: number
): L.DivIcon {
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
      <div style="transform: rotate(${headingDeg}deg); width: ${size}px; height: ${size}px; display: flex; align-items: center; justify-content: center; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));">
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

  return L.divIcon({
    html,
    className: 'vessel-directional-marker',
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
    popupAnchor: [0, -size / 2],
  });
}

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

  // Geodetic Bounding Box for SAR Radar Overlay matching the active spill
  const sarBbox = useMemo(() => {
    if (!investigation) return null;
    const positions = getPolygonPositions(investigation.spill.geometry);
    if (positions.length === 0) return null;
    const lats = positions.map((p) => p[0]);
    const lons = positions.map((p) => p[1]);
    const minLat = Math.min(...lats) - 0.045;
    const maxLat = Math.max(...lats) + 0.045;
    const minLon = Math.min(...lons) - 0.045;
    const maxLon = Math.max(...lons) + 0.045;
    return [
      [minLat, minLon],
      [maxLat, maxLon],
    ] as [[number, number], [number, number]];
  }, [investigation]);

  // Dynamic Sentinel-1 SAR Raster URL based on selected channel/band
  const sarRasterUrl = useMemo(() => {
    switch (sarConfig.channel) {
      case 'VV':
        return '/sar/sample_s1_vv.png';
      case 'VH':
        return '/sar/sample_s1_vh.png';
      case 'prob':
        return '/sar/sample_s1_prob.png';
      case 'mask':
        return '/sar/sample_s1_mask.png';
      case 'composite':
      default:
        return '/sar/sample_s1_composite.png';
    }
  }, [sarConfig.channel]);

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
    [investigation?.spill]
  );

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

        {/* 0a. Sentinel-1 Calibrated SAR Radar Raster Overlay */}
        {layers.sar && sarBbox && (
          <ImageOverlay
            url={sarRasterUrl}
            bounds={sarBbox}
            opacity={sarConfig.opacity}
            zIndex={250}
          />
        )}

        {allCoords.length > 0 && <MapBoundsFitter coords={allCoords} />}

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
                {investigation.spill.sheen_geometry?.map((sheen, idx) => {
                  const sheenPositions = getPolygonPositions(sheen);
                  if (sheenPositions.length === 0) return null;
                  return (
                    <Polygon
                      key={`sheen-${idx}`}
                      positions={sheenPositions}
                      pathOptions={{
                        color: '#fb7185',
                        fillColor: '#e11d48',
                        fillOpacity: 0.22,
                        weight: 1,
                        dashArray: '2, 3',
                      }}
                    />
                  );
                })}

                {/* 1b. Main Oil Slick Sheen Layer (Multi-branched organic shape) */}
                {spillPolygonPositions.length > 0 && (
                  <Polygon
                    positions={spillPolygonPositions}
                    pathOptions={{
                      color: '#f43f5e',
                      fillColor: '#be123c',
                      fillOpacity: 0.38,
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
                {corePolygonPositions.length > 0 && (
                  <Polygon
                    positions={corePolygonPositions}
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

                {/* 1d. Dynamic Spill Center Target Tag */}
                {calculatedSpillCentroid && (
                  <CircleMarker
                    center={calculatedSpillCentroid}
                    radius={5}
                    pathOptions={{
                      color: '#f43f5e',
                      fillColor: '#ffffff',
                      fillOpacity: 1,
                      weight: 2,
                    }}
                  >
                    <Popup>
                      <div className="text-xs p-1 font-mono">
                        <strong className="text-rose-400">📍 Oil Spill Centroid</strong>
                        <div>{calculatedSpillCentroid[0].toFixed(4)}°N, {calculatedSpillCentroid[1].toFixed(4)}°E</div>
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
                            <span>⚡ Investigate Slick</span>
                          </button>
                        </div>
                      </Popup>
                    </Polygon>
                  </React.Fragment>
                );
              })}

            {/* 2. MULTI-TIER PROBABILISTIC ORIGIN ZONES */}
            {layers.origin && (
              <>
                {/* 2a. Multi-tier Confidence Envelopes (90%, 70%, 50%) */}
                {investigation.drift.origin.confidence_zones ? (
                  investigation.drift.origin.confidence_zones.map((zone, idx) => {
                    const zonePositions = getPolygonPositions(zone.geometry);
                    if (zonePositions.length === 0) return null;
                    const opacities = [0.08, 0.18, 0.35];
                    const weights = [1, 1.5, 2];
                    const dashes = ['3, 6', '4, 4', undefined];
                    return (
                      <Polygon
                        key={`conf-zone-${idx}`}
                        positions={zonePositions}
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
                      positions={getPolygonPositions(investigation.drift.origin.geometry)}
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
                    positions={getPolygonPositions(investigation.drift.backward_trajectory.uncertainty_corridor)}
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

            {/* 5. AIS CANDIDATE VESSEL TRACKS WITH DIRECTIONAL HEADING ARROWS */}
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

      {/* Floating Sentinel-1 SAR Radar Verification Studio Widget */}
      <SarMapStudioWidget />
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
    fill: '#475569',
    name: `Rank #${vessel.rank}`,
  };

  const polyCoords: [number, number][] = coords.map((c) => [c[1], c[0]]);
  const lastPos = polyCoords[polyCoords.length - 1];

  // Calculate heading & forward heading vector arrow
  const headingDeg = calculateHeading(polyCoords, vessel.heading, vessel.course);
  const headingVector = getHeadingVector(lastPos, headingDeg, isSelected ? 4.0 : 2.5);

  const vesselIcon = useMemo(
    () => createVesselDirectionalIcon(headingDeg, palette, isSelected, vessel.rank),
    [headingDeg, palette, isSelected, vessel.rank]
  );

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
        position={lastPos}
        icon={vesselIcon}
        eventHandlers={{
          click: onSelect,
        }}
      >
        <Popup>
          <div className="text-xs font-mono p-1.5 space-y-1 min-w-[200px]">
            <div className="font-bold text-slate-100 flex items-center justify-between border-b border-slate-700 pb-1">
              <span>🚢 {vessel.vessel_name}</span>
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded" style={{ backgroundColor: `${palette.fill}40`, color: palette.stroke }}>
                Rank #{vessel.rank}
              </span>
            </div>
            <div className="grid grid-cols-2 gap-1 text-[11px] text-slate-300 pt-1">
              <div>MMSI: <strong className="text-slate-100">{vessel.mmsi}</strong></div>
              <div>Heading: <strong className="text-cyan-400">{headingDeg}°</strong></div>
              <div>Speed: <strong className="text-emerald-400">{vessel.speed_knots ?? vessel.cpa?.speed_during_kn ?? 'N/A'} kn</strong></div>
              <div>Priority: <strong className="text-rose-400">{vessel.investigative_priority}</strong></div>
            </div>
            <div className="text-slate-300 text-[11px] border-t border-slate-800 pt-1">
              Attribution Score: <strong className="text-rose-400 text-xs">{vessel.score.toFixed(1)}/100</strong>
            </div>
          </div>
        </Popup>
      </Marker>
    </>
  );
};

