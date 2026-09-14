import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';

export const MapLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const legendItems = [
    { label: 'Hydrocarbon Delineation Contour', color: '#e11d48', shape: 'rect' },
    { label: 'Discharge Origin Envelope (95% CI)', color: '#f59e0b', shape: 'rect' },
    { label: 'Lagrangian Reverse Hindcast Vector', color: '#0284c7', shape: 'line-dashed' },
    { label: 'Forward Weathering Dispersion Vector', color: '#10b981', shape: 'line-dashed' },
    { label: 'Drift Animated Flow & Trail', color: '#06b6d4', shape: 'line' },
    { label: 'Primary Suspect Vessel AIS Track', color: '#e11d48', shape: 'line' },
    { label: 'Candidate Vessel AIS Trajectories', color: '#6366f1', shape: 'line' },
    { label: 'Vessel Future Route Forecast Corridor', color: '#10b981', shape: 'line-dashed' },
  ];

  return (
    <div className="absolute bottom-3 left-3 z-[1000] bg-[#0c1017]/95 text-slate-200 border-[#1e293b] rounded-lg p-2.5 shadow-2xl text-xs select-none pointer-events-auto max-w-xs backdrop-blur-md font-sans border transition-all">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-3 text-slate-200 font-bold cursor-pointer text-[11px] uppercase tracking-wider font-mono"
      >
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Cartographic Symbology</span>
        </div>
        <button className="text-slate-400 hover:text-slate-200 cursor-pointer p-0.5">
          {isOpen ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-800 text-[11px]">
          {legendItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-slate-300 font-medium">
              {item.shape === 'rect' && (
                <span
                  className="w-3 h-3 rounded-sm border flex-shrink-0"
                  style={{ borderColor: item.color, backgroundColor: `${item.color}33`, color: item.color }}
                />
              )}
              {item.shape === 'line-dashed' && (
                <span
                  className="w-4 h-0 border-t-2 border-dashed flex-shrink-0"
                  style={{ borderColor: item.color }}
                />
              )}
              {item.shape === 'line' && (
                <span
                  className="w-4 h-0.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: item.color }}
                />
              )}
              <span className="text-slate-300">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
