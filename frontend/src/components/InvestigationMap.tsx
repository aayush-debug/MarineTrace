/* Investigation map — renders oil spill, drift trajectories, origin zone, and vessel tracks */

import { useEffect, useMemo } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  Polyline,
  CircleMarker,
  Marker,
  Popup,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type { InvestigationResponse, VesselAttribution } from '../types/investigation';
import { BASEMAP_CONFIGS } from '../utils/mapTiles';
import {
  getPolygonPositions,
  calculateHeading,
  getHeadingVector,
  createVesselDirectionalIcon,
} from './map/MaritimeMap';

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
    const positions = getPolygonPositions(data.spill.geometry);
    if (!positions || positions.length === 0) return;
    const lats = positions.map((c) => c[0]);
    const lons = positions.map((c) => c[1]);
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

const RANK_COLORS: Record<number, { stroke: string; fill: string }> = {
  1: { stroke: '#f43f5e', fill: '#be123c' },
  2: { stroke: '#f59e0b', fill: '#b45309' },
  3: { stroke: '#06b6d4', fill: '#0e7490' },
};

export default function InvestigationMap({ data, selectedVessel, onSelectVessel }: MapProps) {
  const defaultCenter: [number, number] = [18.95, 72.30];
  const activeBasemap = BASEMAP_CONFIGS['google-hybrid'];

  const spillPolygonPositions = useMemo(
    () => (data?.spill?.geometry ? getPolygonPositions(data.spill.geometry) : []),
    [data?.spill?.geometry]
  );

  const corePolygonPositions = useMemo(
    () => (data?.spill?.core_geometry ? getPolygonPositions(data.spill.core_geometry) : []),
    [data?.spill?.core_geometry]
  );

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
            {spillPolygonPositions.length > 0 && (
              <>
                {/* Sheen Filaments */}
                {data.spill.sheen_geometry?.map((sheen, idx) => {
                  const sheenPositions = getPolygonPositions(sheen);
                  if (sheenPositions.length === 0) return null;
                  return (
                    <Polygon
                      key={`inv-sheen-${idx}`}
                      positions={sheenPositions}
                      pathOptions={{
                        color: '#fb7185',
                        fillColor: '#e11d48',
                        fillOpacity: 0.22,
                        weight: 1,
                        dashArray: '2 3',
                      }}
                    />
                  );
                })}

                {/* Main Slick Sheen */}
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
                    <div style={{ fontFamily: 'Inter, sans-serif' }}>
                      <strong>🛢️ Detected Oil Slick (SAR C-Band)</strong><br />
                      Confidence: {(data.spill.confidence * 100).toFixed(1)}%<br />
                      Area: {data.spill.area_km2.toFixed(2)} km²
                    </div>
                  </Popup>
                </Polygon>

                {/* Dense Emulsion Core */}
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
                  />
                )}
              </>
            )}

            {/* Origin Multi-tier Confidence Zones */}
            {data.drift.origin.confidence_zones ? (
              data.drift.origin.confidence_zones.map((zone, idx) => {
                const zonePositions = getPolygonPositions(zone.geometry);
                if (zonePositions.length === 0) return null;
                const opacities = [0.08, 0.18, 0.35];
                const weights = [1, 1.5, 2];
                const dashes = ['3 6', '4 4', undefined];
                return (
                  <Polygon
                    key={`inv-conf-${idx}`}
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
                  positions={getPolygonPositions(data.drift.origin.geometry)}
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

            {/* Vessel tracks with Directional Arrows */}
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

  const polyCoords: [number, number][] = coords.map((c) => [c[1], c[0]]);
  const lastPos = polyCoords[polyCoords.length - 1];

  const palette = RANK_COLORS[vessel.rank] || { stroke: '#8b97b0', fill: '#475569' };
  const headingDeg = calculateHeading(polyCoords, vessel.heading, vessel.course);
  const headingVector = getHeadingVector(lastPos, headingDeg, isSelected ? 3.5 : 2.0);

  const vesselIcon = useMemo(
    () => createVesselDirectionalIcon(headingDeg, palette, isSelected, vessel.rank),
    [headingDeg, palette, isSelected, vessel.rank]
  );

  return (
    <>
      <Polyline
        positions={polyCoords}
        pathOptions={{
          color: palette.stroke,
          weight: isSelected ? 4 : 2,
          opacity: isSelected ? 1 : 0.6,
        }}
        eventHandlers={{
          click: () => onSelect(vessel.mmsi),
        }}
      >
        <Popup>
          <div style={{ fontFamily: 'Inter, sans-serif', minWidth: 180 }}>
            <strong>🚢 {vessel.vessel_name}</strong><br />
            MMSI: {vessel.mmsi}<br />
            Heading: <strong>{headingDeg}°</strong><br />
            Score: <strong>{vessel.score.toFixed(0)}/100</strong><br />
            Rank: #{vessel.rank} ({vessel.investigative_priority})<br />
            Type: {vessel.vessel_type}
          </div>
        </Popup>
      </Polyline>

      {/* Forward Heading Vector Projection Line */}
      {isSelected && (
        <Polyline
          positions={headingVector}
          pathOptions={{
            color: '#ffffff',
            weight: 2,
            dashArray: '3, 4',
            opacity: 0.9,
          }}
        />
      )}

      {/* Vessel Directional Hull Arrow Marker */}
      <Marker
        position={lastPos}
        icon={vesselIcon}
        eventHandlers={{
          click: () => onSelect(vessel.mmsi),
        }}
      >
        <Popup>
          <div style={{ fontFamily: 'Inter, sans-serif' }}>
            <strong>🚢 {vessel.vessel_name}</strong><br />
            Heading: <strong>{headingDeg}°</strong><br />
            Score: <strong>{vessel.score.toFixed(0)}/100</strong><br />
            MMSI: {vessel.mmsi}
          </div>
        </Popup>
      </Marker>
    </>
  );
}
