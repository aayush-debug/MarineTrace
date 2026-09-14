import React from 'react';
import {
  Clock,
  Compass,
  Target,
  Navigation,
  Play,
  CheckCircle2,
} from 'lucide-react';
import {
  useDriftAnimation,
  formatSimulationTimestamp,
} from '../../context/DriftAnimationContext';

export const DriftTimelineControl: React.FC = () => {
  const {
    spillPosition,
    setSpillPosition,
    currentPosition,
    currentOffsetHours,
    currentTimestampStr,
    hasBackward,
    hasForward,
    hasDriftData,
    originConfidence,
  } = useDriftAnimation();

  if (!hasDriftData) {
    return (
      <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-4 text-xs text-slate-400">
        <div className="flex items-center gap-2 text-slate-300 font-semibold mb-1">
          <Clock className="w-4 h-4 text-slate-500" />
          <span>Spill Position Controls</span>
        </div>
        <p className="text-[11px] text-slate-400">
          No drift trajectory data available for this scene.
        </p>
      </div>
    );
  }

  const formattedTime = formatSimulationTimestamp(currentTimestampStr);

  return (
    <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-4 space-y-4 shadow-sm text-xs select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
          <Compass className="w-4 h-4 text-sky-400" />
          <span>Spill Trajectory Positions</span>
        </div>
        <span className="text-[10px] text-amber-400 font-medium px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20">
          {(originConfidence * 100).toFixed(0)}% Origin Match
        </span>
      </div>

      <p className="text-[11px] text-slate-400 leading-relaxed">
        Select a phase to instantly inspect the oil spill at its estimated original discharge point, its current radar detection location, or its forecasted future position.
      </p>

      {/* 3-Position Option Buttons */}
      <div className="space-y-2">
        {/* Option 1: Original Position */}
        <button
          disabled={!hasBackward}
          onClick={() => setSpillPosition('original')}
          className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
            spillPosition === 'original'
              ? 'bg-amber-950/40 border-amber-500/80 ring-1 ring-amber-500/50 shadow-md'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
          } ${!hasBackward ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                spillPosition === 'original' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-800 text-amber-400'
              }`}>
                <Target className="w-3.5 h-3.5" />
              </div>
              <span className={`font-bold text-xs ${spillPosition === 'original' ? 'text-amber-200' : 'text-slate-200'}`}>
                1. Original Position
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-amber-950 text-amber-300 border border-amber-800/50">
                T-24h Origin
              </span>
            </div>
            <p className="text-[11px] text-slate-400 pl-8">
              Suspected discharge point before 24h of hydrodynamic advection. Suspect vessel crosses origin.
            </p>
          </div>
          {spillPosition === 'original' && (
            <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-1" />
          )}
        </button>

        {/* Option 2: Current Position */}
        <button
          onClick={() => setSpillPosition('current')}
          className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
            spillPosition === 'current'
              ? 'bg-cyan-950/40 border-cyan-500/80 ring-1 ring-cyan-500/50 shadow-md'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
          }`}
        >
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                spillPosition === 'current' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-800 text-cyan-400'
              }`}>
                <Compass className="w-3.5 h-3.5" />
              </div>
              <span className={`font-bold text-xs ${spillPosition === 'current' ? 'text-cyan-200' : 'text-slate-200'}`}>
                2. Current Position
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                T₀ Detected
              </span>
            </div>
            <p className="text-[11px] text-slate-400 pl-8">
              Exact centroid of the oil spill delineated from Sentinel-1 SAR satellite radar imagery.
            </p>
          </div>
          {spillPosition === 'current' && (
            <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-1" />
          )}
        </button>

        {/* Option 3: Future Position */}
        <button
          disabled={!hasForward}
          onClick={() => setSpillPosition('future')}
          className={`w-full text-left p-3 rounded-xl border transition-all flex items-start justify-between gap-3 cursor-pointer ${
            spillPosition === 'future'
              ? 'bg-emerald-950/40 border-emerald-500/80 ring-1 ring-emerald-500/50 shadow-md'
              : 'bg-slate-900/90 border-slate-800 hover:border-slate-700 hover:bg-slate-800/50'
          } ${!hasForward ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <div className="space-y-1 min-w-0">
            <div className="flex items-center gap-2">
              <div className={`w-6 h-6 rounded-lg flex items-center justify-center ${
                spillPosition === 'future' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-800 text-emerald-400'
              }`}>
                <Navigation className="w-3.5 h-3.5" />
              </div>
              <span className={`font-bold text-xs ${spillPosition === 'future' ? 'text-emerald-200' : 'text-slate-200'}`}>
                3. Future Position
              </span>
              <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/50">
                +24h Forecast
              </span>
            </div>
            <p className="text-[11px] text-slate-400 pl-8">
              OpenDrift numerical forecast predicting downstream dispersion under CMEMS current & wind vectors.
            </p>
          </div>
          {spillPosition === 'future' && (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-1" />
          )}
        </button>
      </div>

      {/* Selected Position Telemetry Card */}
      <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Inspected Phase:</span>
          <span className={`font-bold ${
            spillPosition === 'original' ? 'text-amber-300' : spillPosition === 'future' ? 'text-emerald-300' : 'text-cyan-300'
          }`}>
            {spillPosition === 'original' && 'Discharge Origin (T-24h)'}
            {spillPosition === 'current' && 'Detected Spill (T₀)'}
            {spillPosition === 'future' && 'Forecast Spread (+24h)'}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400">Timestamp:</span>
          <span className="text-slate-200 font-medium">
            {formattedTime}
          </span>
        </div>

        {currentPosition && (
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-400">Coordinates:</span>
            <span className="text-slate-200 font-bold">
              {currentPosition[0].toFixed(4)}°N, {currentPosition[1].toFixed(4)}°E
            </span>
          </div>
        )}

        <div className="flex items-center justify-between text-xs font-mono border-t border-slate-800 pt-1.5">
          <span className="text-slate-400">Relative Time Offset:</span>
          <span className="text-sky-300 font-bold">
            {currentOffsetHours < -0.05
              ? `${currentOffsetHours.toFixed(1)} hours (Past)`
              : currentOffsetHours > 0.05
              ? `+${currentOffsetHours.toFixed(1)} hours (Future)`
              : '0.0 hours (Present)'}
          </span>
        </div>
      </div>

      {/* Simulate Flow Button */}
      <div className="pt-1">
        <button
          onClick={() => {
            // Smoothly simulate transition between phases: Original -> Current -> Future
            if (spillPosition === 'original') {
              setSpillPosition('current', true);
            } else if (spillPosition === 'current') {
              setSpillPosition('future', true);
            } else {
              setSpillPosition('original', true);
            }
          }}
          className="w-full py-2 px-3 rounded-lg bg-blue-600/20 hover:bg-blue-600/30 border border-blue-500/50 text-blue-300 hover:text-white font-medium text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer"
          title="Simulate smooth transition to next phase"
        >
          <Play className="w-3.5 h-3.5 fill-blue-400" />
          <span>
            {spillPosition === 'original'
              ? 'Simulate Advection Flow to Current (T₀)'
              : spillPosition === 'current'
              ? 'Simulate Forecast Dispersion to Future (+24h)'
              : 'Simulate Reverse Backtrack to Origin (T-24h)'}
          </span>
        </button>
      </div>
    </div>
  );
};
