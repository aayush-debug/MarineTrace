import React from 'react';
import { Polyline, CircleMarker, Popup, useMapEvents } from 'react-leaflet';
import { Ruler, Trash2, X } from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';

// Haversine formula for geodesic distance
export function calculateGeodesicDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): { km: number; nm: number; bearing: number } {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const km = R * c;
  const nm = km * 0.539957; // 1 km = 0.539957 Nautical Miles

  // Initial bearing calculation
  const y = Math.sin(dLon) * Math.cos((lat2 * Math.PI) / 180);
  const x =
    Math.cos((lat1 * Math.PI) / 180) * Math.sin((lat2 * Math.PI) / 180) -
    Math.sin((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.cos(dLon);
  const bearing = ((Math.atan2(y, x) * 180) / Math.PI + 360) % 360;

  return { km, nm, bearing };
}

export const MapMeasureLayer: React.FC<{
  points: [number, number][];
  onAddPoint: (pt: [number, number]) => void;
}> = ({ points, onAddPoint }) => {
  useMapEvents({
    click(e) {
      onAddPoint([e.latlng.lat, e.latlng.lng]);
    },
  });

  if (points.length === 0) return null;

  // Calculate cumulative distance
  let totalKm = 0;
  let totalNm = 0;
  const segments: { km: number; nm: number; bearing: number }[] = [];

  for (let i = 1; i < points.length; i++) {
    const dist = calculateGeodesicDistance(
      points[i - 1][0],
      points[i - 1][1],
      points[i][0],
      points[i][1]
    );
    totalKm += dist.km;
    totalNm += dist.nm;
    segments.push(dist);
  }

  return (
    <>
      {/* Connected Measurement Line */}
      <Polyline
        positions={points}
        pathOptions={{
          color: '#38bdf8',
          weight: 3.5,
          dashArray: '8, 6',
          opacity: 0.9,
        }}
      />

      {/* Point Markers */}
      {points.map((pt, idx) => (
        <CircleMarker
          key={idx}
          center={pt}
          radius={idx === points.length - 1 ? 7 : 5}
          pathOptions={{
            color: '#0284c7',
            fillColor: '#38bdf8',
            fillOpacity: 1,
            weight: 2,
          }}
        >
          <Popup>
            <div className="text-xs font-mono p-1">
              <strong className="text-cyan-300">Point #{idx + 1}</strong>
              <div className="text-slate-300">
                {pt[0].toFixed(4)}°N, {pt[1].toFixed(4)}°E
              </div>
              {idx > 0 && segments[idx - 1] && (
                <div className="text-slate-400 text-[10px] mt-1 pt-1 border-t border-slate-700">
                  Leg: {segments[idx - 1].nm.toFixed(2)} NM ({segments[idx - 1].km.toFixed(2)} km)
                  <br />
                  Bearing: {segments[idx - 1].bearing.toFixed(0)}°
                </div>
              )}
              {idx === points.length - 1 && points.length > 1 && (
                <div className="text-amber-400 text-[11px] font-bold mt-1 pt-1 border-t border-slate-700">
                  Total: {totalNm.toFixed(2)} NM ({totalKm.toFixed(2)} km)
                </div>
              )}
            </div>
          </Popup>
        </CircleMarker>
      ))}
    </>
  );
};

export const MapMeasureHUD: React.FC<{
  points: [number, number][];
  onClear: () => void;
  onClose: () => void;
}> = ({ points, onClear, onClose }) => {
  const { measuring } = useInvestigation();
  if (!measuring) return null;

  let totalKm = 0;
  let totalNm = 0;
  for (let i = 1; i < points.length; i++) {
    const dist = calculateGeodesicDistance(
      points[i - 1][0],
      points[i - 1][1],
      points[i][0],
      points[i][1]
    );
    totalKm += dist.km;
    totalNm += dist.nm;
  }

  return (
    <div className="absolute top-16 left-3 z-[1000] bg-[#080d1a]/95 backdrop-blur-md border border-cyan-500/40 rounded-xl p-3 shadow-2xl font-mono text-xs text-slate-100 min-w-[260px] animate-fade-up">
      <div className="flex items-center justify-between pb-1.5 border-b border-[rgba(255,255,255,0.08)] mb-2">
        <div className="flex items-center gap-1.5 font-bold text-cyan-400">
          <Ruler className="w-4 h-4" />
          <span>NAUTICAL RULER</span>
        </div>
        <button
          onClick={onClose}
          className="text-slate-500 hover:text-slate-200 transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="space-y-1 text-[11px] mb-2.5">
        <div className="text-slate-400 text-[10px]">
          {points.length === 0
            ? 'Click anywhere on the map to place point 1'
            : points.length === 1
            ? 'Click to place next vertex'
            : `${points.length} waypoints recorded`}
        </div>

        {points.length > 1 && (
          <div className="p-2 rounded bg-[#0e172e] border border-cyan-500/20 space-y-1">
            <div className="flex justify-between items-baseline">
              <span className="text-slate-400 text-[10px]">Nautical Distance:</span>
              <span className="text-base font-bold text-cyan-300">
                {totalNm.toFixed(2)} <span className="text-xs">NM</span>
              </span>
            </div>
            <div className="flex justify-between items-baseline">
              <span className="text-slate-400 text-[10px]">Metric Distance:</span>
              <span className="text-xs font-bold text-slate-300">
                {totalKm.toFixed(2)} <span className="text-[10px]">km</span>
              </span>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onClear}
          disabled={points.length === 0}
          className="flex-1 flex items-center justify-center gap-1 py-1 rounded bg-[#131d33] hover:bg-[#1a2947] border border-[rgba(255,255,255,0.08)] text-[10px] text-slate-300 font-semibold disabled:opacity-40 transition-colors"
        >
          <Trash2 className="w-3 h-3 text-rose-400" />
          <span>Clear Points</span>
        </button>
      </div>
    </div>
  );
};
