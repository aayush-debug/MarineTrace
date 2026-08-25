import React from 'react';

interface ScoreBreakdownBarProps {
  label: string;
  score: number;
  weightLabel?: string;
  color?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'indigo';
}

export const ScoreBreakdownBar: React.FC<ScoreBreakdownBarProps> = ({
  label,
  score,
  weightLabel,
  color = 'cyan',
}) => {
  const colorMap = {
    cyan: 'bg-cyan-400 text-cyan-300',
    emerald: 'bg-emerald-400 text-emerald-300',
    amber: 'bg-amber-400 text-amber-300',
    rose: 'bg-rose-400 text-rose-300',
    indigo: 'bg-indigo-400 text-indigo-300',
  };

  const clampedScore = Math.min(Math.max(score, 0), 100);

  return (
    <div className="space-y-1 font-mono text-xs">
      <div className="flex items-center justify-between text-[11px]">
        <div className="flex items-center gap-1.5">
          <span className="text-slate-300">{label}</span>
          {weightLabel && (
            <span className="text-[9px] text-slate-400 font-sans">({weightLabel})</span>
          )}
        </div>
        <span className="font-bold text-slate-100">{clampedScore.toFixed(1)}%</span>
      </div>

      <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-700 ease-out ${
            colorMap[color].split(' ')[0]
          }`}
          style={{ width: `${clampedScore}%` }}
        />
      </div>
    </div>
  );
};
