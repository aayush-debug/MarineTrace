import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Layers } from 'lucide-react';

export const MapLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  const legendItems = [
    { label: 'Oil Slick Radar Geometry', color: '#e11d48', shape: 'rect' },
    { label: 'Origin Probability Envelope', color: '#f59e0b', shape: 'rect' },
    { label: 'Lagrangian Reverse Track', color: '#0284c7', shape: 'line-dashed' },
    { label: 'Forward Dispersion Vector', color: '#10b981', shape: 'line-dashed' },
    { label: 'Primary Suspect Track', color: '#e11d48', shape: 'line' },
    { label: 'Candidate AIS Vector', color: '#6366f1', shape: 'line' },
  ];

  return (
    <div className="absolute bottom-3 left-3 z-[1000] bg-[#111622] border border-[#1e293b] rounded p-2.5 shadow-xl text-xs select-none pointer-events-auto max-w-xs">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 text-slate-200 font-semibold cursor-pointer text-[11px] uppercase tracking-wide"
      >
        <div className="flex items-center gap-1.5">
          <Layers className="w-3.5 h-3.5 text-blue-400" />
          <span>Symbology Legend</span>
        </div>
        <button className="text-slate-500 hover:text-slate-300">
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-1.5 mt-2 pt-2 border-t border-slate-800 text-[11px]">
          {legendItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-slate-300">
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
