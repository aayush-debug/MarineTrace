import React from 'react';
import {
  Compass,
  Clock,
  Target,
  Navigation,
} from 'lucide-react';
import { useDriftAnimation, formatSimulationTimestamp } from '../../context/DriftAnimationContext';

export const SpillPositionSelector: React.FC = () => {
  const {
    spillPosition,
    setSpillPosition,
    currentPosition,
    currentTimestampStr,
    hasDriftData,
    hasBackward,
    hasForward,
    originConfidence,
  } = useDriftAnimation();

  if (!hasDriftData) {
    return null;
  }

  const formattedDate = formatSimulationTimestamp(currentTimestampStr);

  return (
    <div className="absolute top-3 right-3 z-[1000] w-[430px] max-w-[calc(100%-20px)] select-none font-sans pointer-events-auto">
      <div className="bg-[#0b101b]/95 backdrop-blur-md border border-slate-700/80 rounded-xl shadow-2xl shadow-black/80 overflow-hidden text-xs">
        {/* Phase Selector Tabs */}
        <div className="p-1 bg-[#121927]/95 flex items-center justify-between gap-1">
          {/* 1. Original Position Button */}
          <button
            disabled={!hasBackward}
            onClick={() => setSpillPosition('original')}
            className={`flex-1 py-1.5 px-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1 text-[11px] ${
              spillPosition === 'original'
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 font-bold shadow-md shadow-amber-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            } ${!hasBackward ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            title="View estimated discharge origin position (-24h)"
          >
            <Target className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Original (Origin)</span>
          </button>

          {/* 2. Current Position Button */}
          <button
            onClick={() => setSpillPosition('current')}
            className={`flex-1 py-1.5 px-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1 text-[11px] ${
              spillPosition === 'current'
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50 font-bold shadow-md shadow-cyan-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            } cursor-pointer`}
            title="View current detected spill location (T₀)"
          >
            <Compass className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
            <span className="truncate">Current (Detected)</span>
          </button>

          {/* 3. Future Position Button */}
          <button
            disabled={!hasForward}
            onClick={() => setSpillPosition('future')}
            className={`flex-1 py-1.5 px-1.5 rounded-lg font-medium transition-all flex items-center justify-center gap-1 text-[11px] ${
              spillPosition === 'future'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 font-bold shadow-md shadow-emerald-500/10'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            } ${!hasForward ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
            title="View projected future dispersion (+24h)"
          >
            <Navigation className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span className="truncate">Future (Forecast)</span>
          </button>
        </div>

        {/* Minimalist Telemetry Strip */}
        <div className="px-2.5 py-1 bg-[#090e18] border-t border-slate-800/70 flex items-center justify-between gap-2 text-[10px] font-mono text-slate-400">
          <div className="flex items-center gap-1.5 min-w-0 truncate">
            <span className="flex items-center gap-1 text-slate-300 shrink-0">
              <Clock className="w-3 h-3 text-slate-400" />
              {spillPosition === 'original' && (
                <span className="text-amber-300 font-semibold">T-24h Origin</span>
              )}
              {spillPosition === 'current' && (
                <span className="text-cyan-300 font-semibold">T₀ Observed SAR</span>
              )}
              {spillPosition === 'future' && (
                <span className="text-emerald-300 font-semibold">+24h Forecast</span>
              )}
            </span>
            <span className="text-slate-600 hidden sm:inline">•</span>
            <span className="text-slate-400 text-[10px] hidden sm:inline truncate">
              {formattedDate}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {currentPosition && (
              <span className="text-slate-200 font-medium bg-slate-900 px-1.5 py-0.5 rounded border border-slate-800 text-[10px]">
                {currentPosition[0].toFixed(3)}°N, {currentPosition[1].toFixed(3)}°E
              </span>
            )}
            {spillPosition === 'original' && (
              <span className="text-[9px] text-amber-400 font-semibold hidden md:inline">
                {(originConfidence * 100).toFixed(0)}% Conf
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
