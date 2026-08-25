import React from 'react';

export const MapLegend: React.FC = () => {
  const legendItems = [
    { label: 'Oil Spill Polygon', color: '#ef4444', shape: 'rect-dashed' },
    { label: 'Origin Probability Zone', color: '#f59e0b', shape: 'rect-dashed' },
    { label: 'Backward Drift Track', color: '#38bdf8', shape: 'line-dashed' },
    { label: 'Forward Drift Spread', color: '#10b981', shape: 'line-dashed' },
    { label: 'Rank #1 Suspect Track', color: '#f43f5e', shape: 'line' },
    { label: 'Rank #2 Suspect Track', color: '#f59e0b', shape: 'line' },
    { label: 'Rank #3 Suspect Track', color: '#06b6d4', shape: 'line' },
  ];

  return (
    <div className="absolute bottom-4 left-4 z-[1000] bg-slate-900/90 backdrop-blur border border-slate-800 rounded-md p-2.5 shadow-xl text-[11px] font-mono select-none pointer-events-auto">
      <div className="text-[10px] uppercase font-bold text-slate-400 mb-1.5 tracking-wider border-b border-slate-800 pb-1">
        LAYER IDENTIFIERS
      </div>

      <div className="space-y-1.5">
        {legendItems.map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 text-slate-300">
            {item.shape === 'rect-dashed' && (
              <span
                className="w-3.5 h-3.5 rounded-sm border border-dashed flex-shrink-0"
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
            <span>{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
