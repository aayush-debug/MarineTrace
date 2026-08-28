import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Crosshair } from 'lucide-react';

export const MapLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(true);

  const legendItems = [
    { label: 'Oil Slick Radar Feature', color: '#ff0055', shape: 'rect' },
    { label: 'Origin Probability Envelope', color: '#f59e0b', shape: 'rect' },
    { label: 'Lagrangian Reverse Track', color: '#00f0ff', shape: 'line-dashed' },
    { label: 'Forward Spread Vector', color: '#10b981', shape: 'line-dashed' },
    { label: 'Primary Suspect Intercept', color: '#ff0055', shape: 'line' },
    { label: 'Candidate Track Vector', color: '#818cf8', shape: 'line' },
  ];

  return (
    <div className="absolute bottom-3 left-3 z-[1000] bg-[#070d1d]/95 backdrop-blur-xl border border-cyan-500/35 rounded-md p-2.5 shadow-2xl text-xs font-mono select-none pointer-events-auto max-w-xs relative">
      <div className="absolute top-1 left-1 w-1.5 h-1.5 border-t border-l border-cyan-400" />
      <div className="absolute bottom-1 right-1 w-1.5 h-1.5 border-b border-r border-cyan-400" />

      <div
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between gap-2 text-cyan-300 font-bold cursor-pointer text-[10px] uppercase tracking-wider"
      >
        <div className="flex items-center gap-1.5">
          <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
          <span>TACTICAL SYMBOLOGY</span>
        </div>
        <button className="text-cyan-500 hover:text-cyan-300">
          {isOpen ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronUp className="w-3.5 h-3.5" />}
        </button>
      </div>

      {isOpen && (
        <div className="space-y-1.5 mt-2 pt-2 border-t border-cyan-900/40 text-[10px]">
          {legendItems.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2 text-slate-300">
              {item.shape === 'rect' && (
                <span
                  className="w-3 h-3 rounded-sm border flex-shrink-0 shadow-[0_0_6px_currentColor]"
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
                  className="w-4 h-0.5 rounded-full flex-shrink-0 shadow-[0_0_6px_currentColor]"
                  style={{ backgroundColor: item.color, color: item.color }}
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
