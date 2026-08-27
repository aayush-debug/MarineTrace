/* Investigation map — renders oil spill, drift trajectories, origin zone, and vessel tracks */

import { useEffect } from 'react';
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
import type { InvestigationResponse, VesselAttribution } from '../types/investigation';

import { BASEMAP_CONFIGS } from '../utils/mapTiles';

interface MapProps {
  data: InvestigationResponse | null;
  selectedVessel: string | null;
  onSelectVessel: (mmsi: string | null) => void;
}

/* Fly the map to the spill when data loads */
function FitBounds({ data }: { data: InvestigationResponse | null }) {
  const map = useMap();
  useEffect(() => {
    if (!data?.spill?.geometry) return;
    const coords = (data.spill.geometry.coordinates as number[][][])[0];
    if (!coords || coords.length === 0) return;
    const lats = coords.map((c) => c[1]);
    const lons = coords.map((c) => c[0]);
    map.fitBounds(
      [
        [Math.min(...lats) - 0.15, Math.min(...lons) - 0.15],
        [Math.max(...lats) + 0.15, Math.max(...lons) + 0.15],
      ],
      { padding: [40, 40], maxZoom: 11 }
    );
  }, [data, map]);
  return null;
}

const RANK_COLORS: Record<number, string> = {
  1: '#ef4444',
  2: '#f59e0b',
  3: '#06b6d4',
};

export default function InvestigationMap({ data, selectedVessel, onSelectVessel }: MapProps) {
  const defaultCenter: [number, number] = [18.95, 72.30];
  const activeBasemap = BASEMAP_CONFIGS['google-hybrid'];

  return (
    <div className="map-container">
      <MapContainer
        center={defaultCenter}
        zoom={9}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution={activeBasemap.attribution}
          url={activeBasemap.url}
          subdomains={activeBasemap.subdomains || ['a', 'b', 'c']}
          maxZoom={activeBasemap.maxZoom}
        />
        <FitBounds data={data} />

        {data && (
          <>
            {/* Oil spill multi-layer detection */}
            {data.spill.geometry && (
              <>
                {/* Sheen Filaments */}
                {data.spill.sheen_geometry?.map((sheen, idx) => (
                  <Polygon
                    key={`inv-sheen-${idx}`}
                    positions={(sheen.coordinates as number[][][])[0].map(
                      (c) => [c[1], c[0]] as [number, number]
                    )}
                    pathOptions={{
                      color: '#fb7185',
                      fillColor: '#e11d48',
                      fillOpacity: 0.22,
                      weight: 1,
                      dashArray: '2 3',
                    }}
                  />
                ))}

                {/* Main Slick Sheen */}
                <Polygon
                  positions={(data.spill.geometry.coordinates as number[][][])[0].map(
                    (c) => [c[1], c[0]] as [number, number]
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
                    <div style={{ fontFamily: 'Inter, sans-serif' }}>
                      <strong>🛢️ Detected Oil Slick (SAR C-Band)</strong><br />
                      Confidence: {(data.spill.confidence * 100).toFixed(1)}%<br />
                      Area: {data.spill.area_km2.toFixed(2)} km²
                    </div>
                  </Popup>
                </Polygon>

                {/* Dense Emulsion Core */}
                {data.spill.core_geometry && (
                  <Polygon
                    positions={(data.spill.core_geometry.coordinates as number[][][])[0].map(
                      (c) => [c[1], c[0]] as [number, number]
                    )}
                    pathOptions={{
                      color: '#fda4af',
                      fillColor: '#881337',
                      fillOpacity: 0.75,
                      weight: 1.5,
                      className: 'slick-core-polygon',
                    }}
                  />
                )}
              </>
            )}

            {/* Origin Multi-tier Confidence Zones */}
            {data.drift.origin.confidence_zones ? (
              data.drift.origin.confidence_zones.map((zone, idx) => {
                const opacities = [0.08, 0.18, 0.35];
                const weights = [1, 1.5, 2];
                const dashes = ['3 6', '4 4', undefined];
                return (
                  <Polygon
                    key={`inv-conf-${idx}`}
                    positions={(zone.geometry.coordinates as number[][][])[0].map(
                      (c) => [c[1], c[0]] as [number, number]
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
                      <div style={{ fontFamily: 'Inter, sans-serif' }}>
                        <strong>🎯 {zone.level}</strong><br />
                        Confidence: {(zone.confidence * 100).toFixed(0)}%
                      </div>
                    </Popup>
                  </Polygon>
                );
              })
            ) : (
              data.drift.origin.geometry && (
                <Polygon
                  positions={(data.drift.origin.geometry.coordinates as number[][][])[0].map(
                    (c) => [c[1], c[0]] as [number, number]
                  )}
                  pathOptions={{
                    color: '#f59e0b',
                    fillColor: '#f59e0b',
                    fillOpacity: 0.2,
                    weight: 2,
                    dashArray: '6 4',
                  }}
                />
              )
            )}

            {/* Origin point */}
            <CircleMarker
              center={[data.drift.origin.latitude, data.drift.origin.longitude]}
              radius={8}
              pathOptions={{
                color: '#fbbf24',
                fillColor: '#d97706',
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Popup>
                <strong>🎯 Origin Centre</strong><br />
                {data.drift.origin.latitude.toFixed(4)}°N, {data.drift.origin.longitude.toFixed(4)}°E
              </Popup>
            </CircleMarker>

            {/* Backward drift trajectory */}
            {data.drift.backward_trajectory.points.length > 0 && (
              <Polyline
                positions={data.drift.backward_trajectory.points.map(
                  (p) => [p[1], p[0]] as [number, number]
                )}
                pathOptions={{
                  color: '#06b6d4',
                  weight: 3.5,
                  dashArray: '8 6',
                  opacity: 0.95,
                  className: 'path-drift-backward',
                }}
              >
                <Popup>
                  <strong>↩️ Backward Drift Trajectory</strong><br />
                  {data.drift.backward_trajectory.points.length} simulation steps
                </Popup>
              </Polyline>
            )}

            {/* Forward drift trajectory */}
            {data.drift.forward_trajectory?.points && data.drift.forward_trajectory.points.length > 0 && (
              <Polyline
                positions={data.drift.forward_trajectory.points.map(
                  (p) => [p[1], p[0]] as [number, number]
                )}
                pathOptions={{
                  color: '#10b981',
                  weight: 3,
                  dashArray: '6 6',
                  opacity: 0.9,
                  className: 'path-drift-forward',
                }}
              >
                <Popup>
                  <strong>↗️ Forward Drift Prediction</strong><br />
                  {data.drift.forward_trajectory.points.length} predicted points
                </Popup>
              </Polyline>
            )}

            {/* Vessel tracks */}
            {data.vessels.map((vessel) => (
              <VesselLayer
                key={vessel.mmsi}
                vessel={vessel}
                isSelected={selectedVessel === vessel.mmsi}
                onSelect={onSelectVessel}
              />
            ))}
          </>
        )}
      </MapContainer>
    </div>
  );
}

function VesselLayer({
  vessel,
  isSelected,
  onSelect,
}: {
  vessel: VesselAttribution;
  isSelected: boolean;
  onSelect: (mmsi: string | null) => void;
}) {
  if (!vessel.trajectory) return null;
  const coords = vessel.trajectory.coordinates as number[][];
  if (!coords || coords.length < 2) return null;

  const color = RANK_COLORS[vessel.rank] || '#8b97b0';
  const weight = isSelected ? 4 : 2;
  const opacity = isSelected ? 1 : 0.6;

  return (
    <>
      <Polyline
        positions={coords.map((c) => [c[1], c[0]] as [number, number])}
        pathOptions={{ color, weight, opacity }}
        eventHandlers={{
          click: () => onSelect(vessel.mmsi),
        }}
      >
        <Popup>
          <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 180 }}>
            <strong>🚢 {vessel.vessel_name}</strong><br />
            MMSI: {vessel.mmsi}<br />
            Score: <strong>{vessel.score.toFixed(0)}/100</strong><br />
            Rank: #{vessel.rank} ({vessel.investigative_priority})<br />
            Type: {vessel.vessel_type}
          </div>
        </Popup>
      </Polyline>

      {/* Vessel marker at last known position */}
      <CircleMarker
        center={[coords[coords.length - 1][1], coords[coords.length - 1][0]]}
        radius={isSelected ? 7 : 5}
        pathOptions={{
          color,
          fillColor: color,
          fillOpacity: 0.9,
          weight: isSelected ? 3 : 2,
        }}
        eventHandlers={{
          click: () => onSelect(vessel.mmsi),
        }}
      >
        <Popup>
          <strong>{vessel.vessel_name}</strong><br />
          Score: {vessel.score.toFixed(0)}/100
        </Popup>
      </CircleMarker>
    </>
  );
}
