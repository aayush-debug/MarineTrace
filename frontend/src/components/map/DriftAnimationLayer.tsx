import React, { useMemo } from 'react';
import {
  Polyline,
  Polygon,
  Popup,
} from 'react-leaflet';
import { useInvestigation } from '../../context/InvestigationContext';
import { useDriftAnimation } from '../../context/DriftAnimationContext';
import { getPolygonPositions } from './MaritimeMap';

export const DriftAnimationLayer: React.FC = () => {
  const { investigation } = useInvestigation();
  const {
    hasDriftData,
    originPoint,
  } = useDriftAnimation();

  const backwardTrajectory = investigation?.drift?.backward_trajectory;
  const forwardTrajectory = investigation?.drift?.forward_trajectory;

  // Convert backward & forward points for background tracks (called unconditionally)
  const backwardPolylineCoords: [number, number][] = useMemo(() => {
    if (!backwardTrajectory?.points) return [];
    return backwardTrajectory.points.map((p) => [p[1], p[0]] as [number, number]);
  }, [backwardTrajectory?.points]);

  const forwardPolylineCoords: [number, number][] = useMemo(() => {
    if (!forwardTrajectory?.points) return [];
    return forwardTrajectory.points.map((p) => [p[1], p[0]] as [number, number]);
  }, [forwardTrajectory?.points]);

  const origin = investigation?.drift?.origin;
  const backward_trajectory = investigation?.drift?.backward_trajectory;

  // Memoize polygon positions unconditionally so they aren't recalculated on every animation tick
  const confidenceZonesWithPositions = useMemo(() => {
    if (!origin?.confidence_zones) return [];
    return origin.confidence_zones.map((zone) => ({
      ...zone,
      positions: getPolygonPositions(zone.geometry),
    }));
  }, [origin?.confidence_zones]);

  const originPositions = useMemo(() => {
    if (!origin?.geometry) return [];
    return getPolygonPositions(origin.geometry);
  }, [origin?.geometry]);

  const uncertaintyCorridorPositions = useMemo(() => {
    if (!backward_trajectory?.uncertainty_corridor) return [];
    return getPolygonPositions(backward_trajectory.uncertainty_corridor);
  }, [backward_trajectory?.uncertainty_corridor]);

  // If no drift data or drift layers are turned off, don't render
  if (!hasDriftData || !investigation?.drift) {
    return null;
  }

  const showBackward = Boolean(backwardTrajectory?.points && backwardTrajectory.points.length > 0);
  const showForward = Boolean(forwardTrajectory?.points && forwardTrajectory.points.length > 0);

  return (
    <>
      {/* ── 1. PROBABLE ORIGIN REGION & UNCERTAINTY ── */}
      {originPoint && (
        <>
          {/* Multi-tier Origin Confidence Zones if available */}
          {confidenceZonesWithPositions.length > 0 ? (
            confidenceZonesWithPositions.map((zone, idx) => {
              if (zone.positions.length === 0) return null;
              const opacities = [0.1, 0.2, 0.35];
              const weights = [1, 1.5, 2];
              const dashes = ['4, 6', '4, 4', undefined];

              return (
                <Polygon
                  key={`origin-conf-zone-${idx}`}
                  positions={zone.positions}
                  pathOptions={{
                    color: '#f59e0b',
                    fillColor: '#d97706',
                    fillOpacity: opacities[idx] || 0.15,
                    weight: weights[idx] || 1.5,
                    dashArray: dashes[idx],
                  }}
                >
                  <Popup>
                    <div className="text-xs p-1.5 font-mono space-y-1">
                      <div className="font-bold text-amber-300 border-b border-amber-800/60 pb-1">
                        🎯 {zone.level}
                      </div>
                      <div>Confidence: <strong>{(zone.confidence * 100).toFixed(0)}%</strong></div>
                      <div>Origin Region: OpenDrift Lagrangian Dispersion</div>
                    </div>
                  </Popup>
                </Polygon>
              );
            })
          ) : (
            originPositions.length > 0 && (
              <Polygon
                positions={originPositions}
                pathOptions={{
                  color: '#f59e0b',
                  fillColor: '#f59e0b',
                  fillOpacity: 0.18,
                  weight: 2,
                  dashArray: '6, 4',
                }}
              >
                <Popup>
                  <div className="text-xs p-1.5 font-mono space-y-1">
                    <strong className="text-amber-300">🎯 Probable Origin Uncertainty Region</strong>
                    <div>Model: {origin?.confidence ? `${(origin.confidence * 100).toFixed(0)}% confidence zone` : 'Monte Carlo Cluster'}</div>
                  </div>
                </Popup>
              </Polygon>
            )
          )}

          {/* Uncertainty Corridor along trajectory if present */}
          {uncertaintyCorridorPositions.length > 0 && (
            <Polygon
              positions={uncertaintyCorridorPositions}
              pathOptions={{
                color: '#38bdf8',
                fillColor: '#0284c7',
                fillOpacity: 0.08,
                weight: 1,
                dashArray: '3, 6',
              }}
            />
          )}
        </>
      )}


      {/* ── 4. BACKWARD HINDCAST TRAJECTORY (CLEAN VECTOR) ── */}
      {showBackward && backwardPolylineCoords.length > 0 && (
        <Polyline
          positions={backwardPolylineCoords}
          pathOptions={{
            color: '#0284c7',
            weight: 2.5,
            dashArray: '6, 6',
            opacity: 0.75,
          }}
        />
      )}

      {/* ── 5. FORWARD FORECAST TRAJECTORY (CLEAN VECTOR) ── */}
      {showForward && forwardPolylineCoords.length > 0 && (
        <Polyline
          positions={forwardPolylineCoords}
          pathOptions={{
            color: '#059669',
            weight: 2.5,
            dashArray: '6, 6',
            opacity: 0.75,
          }}
        />
      )}
    </>
  );
};
