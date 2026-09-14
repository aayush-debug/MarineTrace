import React from 'react';

interface ScoreBreakdownBarProps {
  label: string;
  score: number;
  weightLabel?: string;
  color?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'sky' | 'purple' | 'violet';
}

export const ScoreBreakdownBar: React.FC<ScoreBreakdownBarProps> = ({
  label,
  score,
  weightLabel,
  color = 'sky',
}) => {
  const colorMap: Record<string, string> = {
    cyan: 'bg-cyan-400',
    sky: 'bg-sky-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-500',
    indigo: 'bg-indigo-400',
    purple: 'bg-purple-400',
    violet: 'bg-violet-400',
  };

  const activeColor = colorMap[color] || 'bg-purple-400';
  const clampedScore = Math.min(Math.max(score, 0), 100);

  return (
    <div className="space-y-1 text-xs">
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-300">
          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${activeColor}`} />
          <span>{label}</span>
          {weightLabel && (
            <span className="text-[10px] text-slate-400">({weightLabel})</span>
          )}
        </div>
        <span className="font-semibold text-slate-200 font-mono">{clampedScore.toFixed(0)}%</span>
      </div>

      <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden relative">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${activeColor}`}
          style={{
            width: clampedScore > 0 ? `${clampedScore}%` : '6px',
            opacity: clampedScore > 0 ? 1 : 0.65,
          }}
        />
      </div>
    </div>
  );
};

