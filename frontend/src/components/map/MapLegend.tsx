import React, { useState } from 'react';
import { Info, ChevronDown, ChevronUp } from 'lucide-react';

export const MapLegend: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  const legendItems = [
    { label: 'Oil Spill Slick (Sentinel-1)', color: '#ef4444', shape: 'rect-dashed' },
    { label: 'Estimated Origin Zone', color: '#f59e0b', shape: 'rect-dashed' },
    { label: 'Reverse Drift Track (OpenDrift)', color: '#38bdf8', shape: 'line-dashed' },
    { label: 'Forward 24h Spread Forecast', color: '#10b981', shape: 'line-dashed' },
    { label: 'Rank #1 Suspect Track', color: '#f43f5e', shape: 'line' },
    { label: 'Rank #2 Suspect Track', color: '#f59e0b', shape: 'line' },
    { label: 'Rank #3 Candidate Track', color: '#06b6d4', shape: 'line' },
    { label: 'Indian EEZ Boundary (200 NM)', color: '#0284c7', shape: 'line-dashed' },
    { label: 'TSS Shipping Corridors', color: '#818cf8', shape: 'line-dashed' },
    { label: 'Offshore Oil Platforms', color: '#f59e0b', shape: 'circle' },
  ];

  return (
    <div className="absolute bottom-10 left-48 z-[1000] font-mono select-none pointer-events-auto">
      {isOpen ? (
        <div className="bg-[#080d1a]/95 backdrop-blur-md border border-[rgba(255,255,255,0.12)] rounded-xl p-3 shadow-2xl text-[10px] w-60 space-y-2 animate-fade-up max-h-72 overflow-y-auto">
          <div className="flex items-center justify-between pb-1.5 border-b border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-1.5 font-bold text-slate-300 uppercase tracking-wider">
              <Info className="w-3.5 h-3.5 text-cyan-400" />
              <span>MAP SYMBOLOGY</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200"
            >
              <ChevronDown className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-1.5">
            {legendItems.map((item, idx) => (
              <div key={idx} className="flex items-center gap-2 text-slate-300">
                {item.shape === 'rect-dashed' && (
                  <span
                    className="w-3.5 h-3.5 rounded-sm border border-dashed shrink-0"
                    style={{ borderColor: item.color, backgroundColor: `${item.color}33` }}
                  />
                )}
                {item.shape === 'line-dashed' && (
                  <span
                    className="w-4 h-0 border-t-2 border-dashed shrink-0"
                    style={{ borderColor: item.color }}
                  />
                )}
                {item.shape === 'line' && (
                  <span
                    className="w-4 h-0.5 rounded-full shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                )}
                {item.shape === 'circle' && (
                  <span
                    className="w-2.5 h-2.5 rounded-full border shrink-0"
                    style={{ borderColor: item.color, backgroundColor: `${item.color}66` }}
                  />
                )}
                <span className="truncate">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-[#080d1a]/95 backdrop-blur-md border border-[rgba(255,255,255,0.12)] text-slate-300 hover:text-cyan-300 shadow-xl hover:border-cyan-500/50 hover:bg-[#0c152a] transition-all text-[9px] font-bold"
        >
          <Info className="w-3 h-3 text-cyan-400" />
          <span>LEGEND</span>
          <ChevronUp className="w-3 h-3 text-slate-400" />
        </button>
      )}
    </div>
  );
};
