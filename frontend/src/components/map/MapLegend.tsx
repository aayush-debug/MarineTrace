import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

export const MapLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  const legendItems = [
    { label: 'Oil Spill Polygon', color: '#e11d48', shape: 'rect' },
    { label: 'Origin Probability Zone', color: '#f59e0b', shape: 'rect' },
    { label: 'Reverse Drift Track', color: '#38bdf8', shape: 'line-dashed' },
    { label: 'Forward Spread Forecast', color: '#10b981', shape: 'line-dashed' },
    { label: 'Rank #1 Suspect Track', color: '#f43f5e', shape: 'line' },
    { label: 'Candidate Track', color: '#6366f1', shape: 'line' },
  ];

  return (
    <div className="absolute bottom-3 left-3 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-xl p-2.5 shadow-xl text-xs select-none pointer-events-auto max-w-xs">
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 text-slate-300 font-semibold cursor-pointer text-[11px]"
      >
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-sky-400" />
          <span>Map Symbology</span>
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
                  style={{ borderColor: item.color, backgroundColor: `${item.color}33` }}
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

