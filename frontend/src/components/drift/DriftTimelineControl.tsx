import React, { useState, useEffect } from 'react';
import { Clock, ArrowLeftRight, Play, Pause, RotateCcw } from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';

export const DriftTimelineControl: React.FC = () => {
  const { investigation } = useInvestigation();
  const [selectedHorizon, setSelectedHorizon] = useState<number>(24);
  const [mode, setMode] = useState<'backward' | 'forward' | 'both'>('both');
  const [scrubberHour, setScrubberHour] = useState<number>(-24);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const horizons = [
    { hours: 12, label: '12 Hours' },
    { hours: 24, label: '24 Hours (Standard)' },
    { hours: 48, label: '48 Hours' },
    { hours: 72, label: '72 Hours' },
  ];

  // Auto-play timer for trajectory animation
  useEffect(() => {
    let timer: any = null;
    if (isPlaying) {
      timer = setInterval(() => {
        setScrubberHour((prev) => {
          if (prev >= 24) {
            setIsPlaying(false);
            return -24;
          }
          return prev + 2;
        });
      }, 400);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying]);

  return (
    <div className="bg-[#0e1626] border border-slate-800 rounded-lg p-4 font-mono space-y-4 shadow-lg text-xs">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-200 tracking-wider">
            DRIFT SIMULATION TIMELINE
          </span>
        </div>
        <span className="text-[10px] text-emerald-400 font-bold px-1.5 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
          OPENDRIFT RUNNER
        </span>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-3 gap-2">
        <button
          onClick={() => setMode('backward')}
          className={`py-1.5 px-2 rounded text-center text-xs font-semibold transition-colors border ${
            mode === 'backward'
              ? 'bg-sky-500/20 border-sky-500 text-sky-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          ↩️ Reverse Drift
        </button>

        <button
          onClick={() => setMode('forward')}
          className={`py-1.5 px-2 rounded text-center text-xs font-semibold transition-colors border ${
            mode === 'forward'
              ? 'bg-emerald-500/20 border-emerald-500 text-emerald-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          ↗️ Forward Spread
        </button>

        <button
          onClick={() => setMode('both')}
          className={`py-1.5 px-2 rounded text-center text-xs font-semibold transition-colors border ${
            mode === 'both'
              ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          <ArrowLeftRight className="w-3 h-3 inline mr-1" /> Dual Ensemble
        </button>
      </div>

      {/* Interactive Time Scrubber Slider */}
      <div className="p-3 bg-slate-900/90 rounded border border-slate-800 space-y-2">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400">TRAJECTORY TIME SCRUBBER:</span>
          <span className="text-cyan-300 font-bold">
            {scrubberHour < 0
              ? `${scrubberHour}h (Reverse-time origin)`
              : scrubberHour === 0
              ? 'T+0h (Observation point)'
              : `+${scrubberHour}h (Predicted spread)`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1 rounded bg-cyan-500/20 text-cyan-300 hover:bg-cyan-500/30 border border-cyan-500/40"
            title={isPlaying ? 'Pause Animation' : 'Play Timeline Animation'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setScrubberHour(-24);
            }}
            className="p-1 rounded bg-slate-800 text-slate-400 hover:bg-slate-700"
            title="Reset Scrubber"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          <input
            type="range"
            min="-24"
            max="24"
            step="2"
            value={scrubberHour}
            onChange={(e) => setScrubberHour(Number(e.target.value))}
            className="flex-1 accent-cyan-400 h-1.5 bg-slate-800 rounded cursor-pointer"
          />
        </div>

        <div className="flex justify-between text-[9px] text-slate-500 font-mono">
          <span>-24h (Discharge)</span>
          <span>T-12h</span>
          <span>T0 (Detected)</span>
          <span>T+12h</span>
          <span>+24h (Forecast)</span>
        </div>
      </div>

      {/* Horizon Slider & Buttons */}
      <div>
        <div className="text-[10px] text-slate-400 uppercase mb-1.5 flex justify-between">
          <span>SIMULATION DURATION HORIZON</span>
          <span className="text-cyan-400 font-bold">{selectedHorizon} HOURS</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {horizons.map((h) => (
            <button
              key={h.hours}
              onClick={() => setSelectedHorizon(h.hours)}
              className={`py-1 rounded text-center text-[10px] font-medium border ${
                selectedHorizon === h.hours
                  ? 'bg-cyan-500/15 border-cyan-500/50 text-cyan-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>

      {/* Trajectory Diagnostics */}
      {investigation && (
        <div className="bg-slate-900/80 border border-slate-800 p-2.5 rounded space-y-1.5 text-[11px] text-slate-300">
          <div className="flex justify-between">
            <span className="text-slate-400">Particle Count:</span>
            <span className="text-slate-100 font-bold">500 Elements</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Integration Timestep:</span>
            <span className="text-slate-100 font-bold">15 Minutes (-Δt for reverse)</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Estimated Origin Zone:</span>
            <span className="text-amber-400 font-bold">
              {investigation.drift.origin.latitude.toFixed(4)}°N,{' '}
              {investigation.drift.origin.longitude.toFixed(4)}°E
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-400">Origin Confidence:</span>
            <span className="text-emerald-400 font-bold">
              {(investigation.drift.origin.confidence * 100).toFixed(0)}% (68% Particle Envelope)
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
