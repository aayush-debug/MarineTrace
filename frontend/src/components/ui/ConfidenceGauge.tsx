import React from 'react';

interface ConfidenceGaugeProps {
  score: number; // 0 to 100 or 0 to 1
  label?: string;
  sublabel?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'cyan' | 'emerald' | 'amber' | 'rose';
  showPercentage?: boolean;
}

export const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({
  score,
  label,
  sublabel,
  size = 'md',
  variant,
  showPercentage = true,
}) => {
  // Normalize score between 0 and 100
  const normalized = score <= 1 ? score * 100 : score;
  const clamped = Math.min(Math.max(normalized, 0), 100);

  // Auto-determine variant if not passed
  const activeVariant =
    variant ||
    (clamped >= 80
      ? 'rose'
      : clamped >= 60
      ? 'amber'
      : clamped >= 40
      ? 'cyan'
      : 'emerald');

  const colorConfig = {
    cyan: {
      text: 'text-cyan-400',
      stroke: '#06b6d4',
      bg: 'rgba(6, 182, 212, 0.12)',
      border: 'border-cyan-500/30',
    },
    emerald: {
      text: 'text-emerald-400',
      stroke: '#10b981',
      bg: 'rgba(16, 185, 129, 0.12)',
      border: 'border-emerald-500/30',
    },
    amber: {
      text: 'text-amber-400',
      stroke: '#f59e0b',
      bg: 'rgba(245, 158, 11, 0.12)',
      border: 'border-amber-500/30',
    },
    rose: {
      text: 'text-rose-400',
      stroke: '#f43f5e',
      bg: 'rgba(244, 63, 94, 0.12)',
      border: 'border-rose-500/30',
    },
  }[activeVariant];

  const dimensions = {
    sm: { radius: 20, strokeWidth: 3, size: 48, fontSize: 'text-xs' },
    md: { radius: 30, strokeWidth: 4, size: 72, fontSize: 'text-sm' },
    lg: { radius: 42, strokeWidth: 5, size: 100, fontSize: 'text-xl' },
  }[size];

  const circumference = 2 * Math.PI * dimensions.radius;
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  return (
    <div className="flex items-center gap-3 font-mono">
      <div className="relative flex items-center justify-center" style={{ width: dimensions.size, height: dimensions.size }}>
        <svg
          className="transform -rotate-90"
          width={dimensions.size}
          height={dimensions.size}
        >
          {/* Background Track */}
          <circle
            cx={dimensions.size / 2}
            cy={dimensions.size / 2}
            r={dimensions.radius}
            stroke="#1c2842"
            strokeWidth={dimensions.strokeWidth}
            fill="transparent"
          />
          {/* Active Meter */}
          <circle
            cx={dimensions.size / 2}
            cy={dimensions.size / 2}
            r={dimensions.radius}
            stroke={colorConfig.stroke}
            strokeWidth={dimensions.strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            className="transition-all duration-700 ease-out"
          />
        </svg>

        {showPercentage && (
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
            <span className={`font-bold tracking-tight ${dimensions.fontSize} ${colorConfig.text}`}>
              {clamped.toFixed(1)}%
            </span>
          </div>
        )}
      </div>

      {(label || sublabel) && (
        <div className="min-w-0">
          {label && <div className="text-[11px] font-semibold text-slate-200 uppercase tracking-wider">{label}</div>}
          {sublabel && <div className="text-[10px] text-slate-400 mt-0.5">{sublabel}</div>}
        </div>
      )}
    </div>
  );
};
