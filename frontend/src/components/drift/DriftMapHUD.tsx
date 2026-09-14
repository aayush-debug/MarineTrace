import React, { useState } from 'react';
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Repeat,
  Compass,
  ChevronDown,
  ChevronUp,
  Clock,
} from 'lucide-react';
import { useDriftAnimation } from '../../context/DriftAnimationContext';

const SPEEDS = [0.5, 1, 2, 4];

export const DriftMapHUD: React.FC = () => {
  const {
    mode,
    setMode,
    isPlaying,
    togglePlay,
    reset,
    progress,
    seek,
    speed,
    setSpeed,
    loop,
    setLoop,
    stepForward,
    stepBackward,
    currentPosition,
    currentOffsetHours,
    currentTimestampStr,
    waypoints,
    hasBackward,
    hasForward,
    hasDriftData,
    originConfidence,
  } = useDriftAnimation();

  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  // If there's no drift data at all, render a minimal subtle notice or null
  if (!hasDriftData) {
    return null;
  }

  // Format current timestamp nicely
  const formattedTime = currentTimestampStr
    ? new Date(currentTimestampStr).toUTCString().replace('GMT', 'UTC')
    : 'Observation T₀';

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[500] w-[92%] max-w-xl select-none font-sans pointer-events-auto">
      <div className="bg-[#0b101b]/92 backdrop-blur-md border border-slate-700/70 rounded-xl shadow-2xl shadow-black/80 overflow-hidden text-xs transition-all">
        {/* Header Bar with Telemetry & Collapse */}
        <div className="px-3 py-1.5 bg-[#121927]/90 border-b border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1.5 font-semibold text-slate-200">
              <Compass className="w-3.5 h-3.5 text-sky-400 animate-spin-slow" />
              <span className="text-[11px] tracking-wide uppercase">Drift Animation</span>
            </div>
            <span className="text-slate-600">|</span>
            {/* Active Telemetry Chip */}
            <div className="flex items-center gap-1.5 font-mono text-[11px]">
              <Clock className="w-3 h-3 text-slate-400" />
              <span className="text-slate-300 font-medium">
                {currentOffsetHours < -0.05
                  ? `${currentOffsetHours.toFixed(1)}h (Hindcast Origin)`
                  : currentOffsetHours > 0.05
                  ? `+${currentOffsetHours.toFixed(1)}h (Dispersion)`
                  : 'T₀ (SAR Acquisition)'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {currentPosition && (
              <span className="hidden sm:inline font-mono text-[10px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800">
                {currentPosition[0].toFixed(3)}°N, {currentPosition[1].toFixed(3)}°E
              </span>
            )}
            <button
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="p-1 rounded text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-colors"
              title={isCollapsed ? 'Expand Controls' : 'Collapse Controls'}
            >
              {isCollapsed ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Collapsible Main Controls Body */}
        {!isCollapsed && (
          <div className="p-3 space-y-2.5">
            {/* Row 1: Mode Switcher & Speed Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              {/* Simulation Mode Tabs */}
              <div className="flex items-center bg-slate-900/90 p-0.5 rounded-lg border border-slate-800 text-[11px]">
                <button
                  disabled={!hasBackward}
                  onClick={() => setMode('backward')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    mode === 'backward'
                      ? 'bg-sky-500/20 text-sky-300 border border-sky-500/40 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  } ${!hasBackward ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  title={hasBackward ? 'Trace backwards towards probable discharge origin' : 'Backward data unavailable'}
                >
                  ⏮ Backward (Origin)
                </button>

                <button
                  disabled={!hasForward}
                  onClick={() => setMode('forward')}
                  className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                    mode === 'forward'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  } ${!hasForward ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}
                  title={hasForward ? 'Forecast future spill movement' : 'Forward forecast unavailable'}
                >
                  Forward (Forecast) ⏭
                </button>

                {hasBackward && hasForward && (
                  <button
                    onClick={() => setMode('both')}
                    className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                      mode === 'both'
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 shadow-sm font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    } cursor-pointer`}
                    title="Full simulation cycle: Origin → Spill → Future Dispersion"
                  >
                    🔄 Dual Replay
                  </button>
                )}
              </div>

              {/* Speed Pills & Loop Switch */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={() => setLoop(!loop)}
                  className={`p-1.5 rounded border text-[10px] flex items-center gap-1 transition-colors ${
                    loop
                      ? 'bg-blue-950/80 text-blue-300 border-blue-800/80 font-semibold'
                      : 'bg-slate-900 border-slate-800 text-slate-500 hover:text-slate-300'
                  }`}
                  title={loop ? 'Loop animation: ON' : 'Loop animation: OFF'}
                >
                  <Repeat className="w-3 h-3" />
                  <span className="hidden sm:inline">Loop</span>
                </button>

                <div className="flex items-center bg-slate-900/90 rounded border border-slate-800 p-0.5 text-[10px] font-mono">
                  {SPEEDS.map((s) => (
                    <button
                      key={s}
                      onClick={() => setSpeed(s)}
                      className={`px-2 py-0.5 rounded transition-all ${
                        speed === s
                          ? 'bg-sky-500/30 text-sky-200 font-bold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {s}x
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Row 2: Timeline Slider with Milestone Markers */}
            <div className="space-y-1 bg-slate-900/70 p-2 rounded-lg border border-slate-800/80">
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                <span className="text-slate-300 truncate max-w-[280px]">
                  {formattedTime}
                </span>
                <span className="text-sky-300 font-semibold">
                  Progress: {(progress * 100).toFixed(0)}%
                </span>
              </div>

              {/* Range Input Slider */}
              <div className="relative flex items-center py-1">
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.005"
                  value={progress}
                  onChange={(e) => seek(parseFloat(e.target.value))}
                  className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400 hover:accent-sky-300"
                />
              </div>

              {/* Waypoint Ticks */}
              {waypoints.length > 1 && (
                <div className="flex justify-between text-[9px] font-mono text-slate-400 px-1 pt-0.5">
                  <span>{waypoints[0]?.label || 'Start'}</span>
                  {waypoints.length > 2 && (
                    <span className="text-slate-400 hidden sm:inline">
                      {waypoints[Math.floor(waypoints.length / 2)]?.label}
                    </span>
                  )}
                  <span>{waypoints[waypoints.length - 1]?.label || 'End'}</span>
                </div>
              )}
            </div>

            {/* Row 3: Playback Action Buttons */}
            <div className="flex items-center justify-between gap-2 pt-0.5">
              <div className="flex items-center gap-1.5">
                <button
                  onClick={reset}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  title="Reset to beginning"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={stepBackward}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  title="Step Backward"
                >
                  <SkipBack className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={togglePlay}
                  className={`px-4 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all shadow-md ${
                    isPlaying
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                      : 'bg-sky-500 text-slate-950 font-bold hover:bg-sky-400 shadow-sky-500/20'
                  }`}
                  title={isPlaying ? 'Pause Simulation' : 'Play Drift Animation'}
                >
                  {isPlaying ? (
                    <>
                      <Pause className="w-3.5 h-3.5 fill-amber-300" />
                      <span>Pause</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-3.5 h-3.5 fill-slate-950" />
                      <span>Play</span>
                    </>
                  )}
                </button>

                <button
                  onClick={stepForward}
                  className="p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
                  title="Step Forward"
                >
                  <SkipForward className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Origin Confidence Pill */}
              <div className="flex items-center gap-1.5 text-[10px] font-mono text-slate-400">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                <span>Origin Confidence:</span>
                <span className="text-amber-300 font-semibold">{(originConfidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
