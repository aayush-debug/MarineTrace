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
    <div className={`inline-flex items-center gap-0 rounded-md overflow-hidden border border-[rgba(255,255,255,0.08)] font-mono text-[9px] ${className}`}>
      <div className="px-2 py-1 bg-cyan-500/10 text-cyan-400 border-r border-[rgba(255,255,255,0.06)]">
        <span className="text-[8px] text-slate-500 block">VV</span>
        <span className="font-bold">{vv_db.toFixed(1)} dB</span>
      </div>
      <div className="px-2 py-1 bg-blue-500/10 text-blue-400 border-r border-[rgba(255,255,255,0.06)]">
        <span className="text-[8px] text-slate-500 block">VH</span>
        <span className="font-bold">{vh_db.toFixed(1)} dB</span>
      </div>
      <div className="px-2 py-1 bg-amber-500/10 text-amber-400">
        <span className="text-[8px] text-slate-500 block">CR</span>
        <span className="font-bold">{contrast_ratio.toFixed(1)}</span>
      </div>
    </div>
  );
};
