import React, { useState } from 'react';
import { useMapEvents } from 'react-leaflet';
import { Compass, Eye } from 'lucide-react';

function toDMS(deg: number, isLat: boolean): string {
  const absolute = Math.abs(deg);
  const degrees = Math.floor(absolute);
  const minutesNotTruncated = (absolute - degrees) * 60;
  const minutes = Math.floor(minutesNotTruncated);
  const seconds = Math.floor((minutesNotTruncated - minutes) * 60);
  const cardinal = isLat ? (deg >= 0 ? 'N' : 'S') : deg >= 0 ? 'E' : 'W';
  return `${degrees}° ${minutes}' ${seconds}" ${cardinal}`;
}

export const MapCoordinateListener: React.FC<{
  onCoordsChange: (coords: { lat: number; lng: number; zoom: number }) => void;
}> = ({ onCoordsChange }) => {
  useMapEvents({
    mousemove(e) {
      onCoordsChange({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
        zoom: e.target.getZoom(),
      });
    },
    zoomend(e) {
      onCoordsChange({
        lat: e.target.getCenter().lat,
        lng: e.target.getCenter().lng,
        zoom: e.target.getZoom(),
      });
    },
  });
  return null;
};

export const MapCoordinateHUD: React.FC<{
  coords: { lat: number; lng: number; zoom: number };
}> = ({ coords }) => {
  const [format, setFormat] = useState<'decimal' | 'dms'>('decimal');

  // Estimate approximate scale width at latitude for current zoom
  const metersPerPixel =
    (156543.03392 * Math.cos((coords.lat * Math.PI) / 180)) / Math.pow(2, coords.zoom);
  const scaleMeters = Math.round(metersPerPixel * 100);
  const scaleKm = (scaleMeters / 1000).toFixed(scaleMeters < 1000 ? 2 : 1);
  const scaleNm = (scaleMeters * 0.000539957).toFixed(1);

  return (
    <div className="absolute bottom-2 right-3 z-[1000] font-mono select-none flex items-center gap-2">
      {/* Dynamic Visual Scale Bar */}
      <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#080d1a]/90 backdrop-blur-md border border-[rgba(255,255,255,0.08)] text-[9px] text-slate-400 shadow-lg">
        <div className="flex flex-col items-center">
          <div className="w-16 h-1 border-b-2 border-l-2 border-r-2 border-cyan-400/80" />
          <span className="text-[8px] text-slate-300 font-bold mt-0.5">
            {scaleNm} NM ({scaleKm} km)
          </span>
        </div>
      </div>

      {/* Live Coordinate Pill */}
      <button
        onClick={() => setFormat(format === 'decimal' ? 'dms' : 'decimal')}
        className="flex items-center gap-2 px-2.5 py-1 rounded-md bg-[#080d1a]/90 backdrop-blur-md border border-[rgba(255,255,255,0.08)] hover:border-cyan-500/40 text-[9px] text-slate-300 shadow-lg transition-colors group"
        title="Click to toggle Decimal / DMS (Degrees Minutes Seconds)"
      >
        <Compass className="w-3 h-3 text-cyan-400 group-hover:rotate-45 transition-transform" />
        {format === 'decimal' ? (
          <span>
            {coords.lat.toFixed(4)}°N, {coords.lng.toFixed(4)}°E
          </span>
        ) : (
          <span>
            {toDMS(coords.lat, true)} {toDMS(coords.lng, false)}
          </span>
        )}
        <span className="text-slate-600">|</span>
        <span className="text-cyan-400 font-bold flex items-center gap-1">
          <Eye className="w-2.5 h-2.5" />
          z{coords.zoom}
        </span>
      </button>
    </div>
  );
};
