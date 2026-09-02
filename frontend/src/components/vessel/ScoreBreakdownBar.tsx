import React from 'react';

interface ScoreBreakdownBarProps {
  label: string;
  score: number;
  weightLabel?: string;
  color?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'indigo' | 'sky';
}

export const ScoreBreakdownBar: React.FC<ScoreBreakdownBarProps> = ({
  label,
  score,
  weightLabel,
  color = 'sky',
}) => {
  const colorMap = {
    cyan: 'bg-cyan-500',
    sky: 'bg-sky-500',
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    rose: 'bg-rose-500',
    indigo: 'bg-indigo-500',
  };

  const clampedScore = Math.min(Math.max(score, 0), 100);

  return (
    <div className="space-y-1 text-xs">
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5 text-slate-300">
          <span>{label}</span>
          {weightLabel && (
            <span className="text-[10px] text-slate-400">({weightLabel})</span>
          )}
        </div>
        <span className="font-semibold text-slate-200 font-mono">{clampedScore.toFixed(0)}%</span>
      </div>

      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ease-out ${colorMap[color] || 'bg-sky-500'
            }`}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
    </div>
  );
};

