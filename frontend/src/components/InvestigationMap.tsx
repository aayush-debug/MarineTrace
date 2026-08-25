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
  const defaultCenter: [number, number] = [18.72, 72.91];

  return (
    <div className="map-container">
      <MapContainer
        center={defaultCenter}
        zoom={9}
        style={{ width: '100%', height: '100%' }}
        zoomControl={true}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />
        <FitBounds data={data} />

        {data && (
          <>
            {/* Oil spill polygon */}
            {data.spill.geometry && (
              <Polygon
                positions={(data.spill.geometry.coordinates as number[][][])[0].map(
                  (c) => [c[1], c[0]] as [number, number]
                )}
                pathOptions={{
                  color: '#ef4444',
                  fillColor: '#ef4444',
                  fillOpacity: 0.35,
                  weight: 2,
                  dashArray: '4 4',
                }}
              >
                <Popup>
                  <div style={{ fontFamily: 'Inter, sans-serif' }}>
                    <strong>🛢️ Detected Oil Spill</strong><br />
                    Confidence: {(data.spill.confidence * 100).toFixed(0)}%<br />
                    Area: {data.spill.area_km2.toFixed(1)} km²
                  </div>
                </Popup>
              </Polygon>
            )}

            {/* Origin probability zone */}
            {data.drift.origin.geometry && (
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
              >
                <Popup>
                  <div style={{ fontFamily: 'Inter, sans-serif' }}>
                    <strong>🎯 Estimated Origin Zone</strong><br />
                    Confidence: {(data.drift.origin.confidence * 100).toFixed(0)}%<br />
                    {data.drift.origin.latitude.toFixed(4)}°N, {data.drift.origin.longitude.toFixed(4)}°E
                  </div>
                </Popup>
              </Polygon>
            )}

            {/* Origin point */}
            <CircleMarker
              center={[data.drift.origin.latitude, data.drift.origin.longitude]}
              radius={8}
              pathOptions={{
                color: '#f59e0b',
                fillColor: '#f59e0b',
                fillOpacity: 0.9,
                weight: 2,
              }}
            >
              <Popup>
                <strong>Origin Centre</strong><br />
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
                  color: '#3b82f6',
                  weight: 3,
                  dashArray: '8 6',
                  opacity: 0.8,
                }}
              >
                <Popup>
                  <strong>↩️ Backward Drift Trajectory</strong><br />
                  {data.drift.backward_trajectory.points.length} simulation points
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
                  color: '#22c55e',
                  weight: 3,
                  dashArray: '8 6',
                  opacity: 0.7,
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
