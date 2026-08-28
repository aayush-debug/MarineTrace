import React from 'react';

interface SARMetricsBadgeProps {
  vv_db?: number;
  vh_db?: number;
  contrast_ratio?: number;
  className?: string;
}

export const SARMetricsBadge: React.FC<SARMetricsBadgeProps> = ({
  vv_db = -18.5,
  vh_db = -25.3,
  contrast_ratio = 3.2,
  className = '',
}) => {
  return (
    <div className={`grid grid-cols-3 rounded overflow-hidden border border-[#1e293b] font-mono text-[10px] text-center ${className}`}>
      <div className="px-1.5 py-1 bg-blue-950/60 text-blue-300 border-r border-[#1e293b]">
        <span className="text-[8px] text-slate-400 block font-sans uppercase">VV dB</span>
        <span className="font-semibold">{vv_db.toFixed(1)}</span>
      </div>
      <div className="px-1.5 py-1 bg-blue-950/40 text-blue-300 border-r border-[#1e293b]">
        <span className="text-[8px] text-slate-400 block font-sans uppercase">VH dB</span>
        <span className="font-semibold">{vh_db.toFixed(1)}</span>
      </div>
      <div className="px-1.5 py-1 bg-amber-950/60 text-amber-300">
        <span className="text-[8px] text-slate-400 block font-sans uppercase">Contrast</span>
        <span className="font-semibold">{contrast_ratio.toFixed(1)}</span>
      </div>
    </div>
  );
};
