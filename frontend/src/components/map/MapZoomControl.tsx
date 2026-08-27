import React from 'react';
import { useMap } from 'react-leaflet';
import { Plus, Minus } from 'lucide-react';

interface MapZoomControlProps {
  className?: string;
}

export const MapZoomControl: React.FC<MapZoomControlProps> = ({ className = '' }) => {
  const map = useMap();

  const handleZoomIn = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    map.zoomIn();
  };

  const handleZoomOut = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    map.zoomOut();
  };

  return (
    <div
      className={`leaflet-bottom leaflet-right !pointer-events-auto !mb-8 !mr-3.5 z-[1000] ${className}`}
      onClick={(e) => e.stopPropagation()}
    >
      <div className="w-8 bg-white text-slate-800 rounded-md shadow-lg border border-slate-300/80 flex flex-col overflow-hidden select-none">
        {/* Zoom In Button */}
        <button
          type="button"
          onClick={handleZoomIn}
          aria-label="Zoom in"
          title="Zoom in"
          className="w-8 h-8 flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-100 active:bg-slate-200 transition-colors focus:outline-none cursor-pointer"
        >
          <Plus className="w-4 h-4 stroke-[2.5]" />
        </button>

        {/* Divider */}
        <div className="h-[1px] w-6 mx-auto bg-slate-200" />

        {/* Zoom Out Button */}
        <button
          type="button"
          onClick={handleZoomOut}
          aria-label="Zoom out"
          title="Zoom out"
          className="w-8 h-8 flex items-center justify-center text-slate-700 hover:text-slate-950 hover:bg-slate-100 active:bg-slate-200 transition-colors focus:outline-none cursor-pointer"
        >
          <Minus className="w-4 h-4 stroke-[2.5]" />
        </button>
      </div>
    </div>
  );
};

