import React, { useState, useEffect } from 'react';
import { Clock, Play, Pause, RotateCcw } from 'lucide-react';

export const DriftTimelineControl: React.FC = () => {
  const [selectedHorizon, setSelectedHorizon] = useState<number>(24);

  const [mode, setMode] = useState<'backward' | 'forward' | 'both'>('both');
  const [scrubberHour, setScrubberHour] = useState<number>(-24);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);

  const horizons = [
    { hours: 12, label: '12h' },
    { hours: 24, label: '24h' },
    { hours: 48, label: '48h' },
    { hours: 72, label: '72h' },
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
      }, 350);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [isPlaying]);

  return (
    <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-4 space-y-4 shadow-sm text-xs">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
          <Clock className="w-4 h-4 text-sky-400" />
          <span>Drift Simulation Controls</span>
        </div>
        <span className="text-[10px] text-sky-400 font-medium px-2 py-0.5 rounded-full bg-sky-500/10 border border-sky-500/20">
          500 Particles
        </span>
      </div>

      {/* Mode Selector */}
      <div className="grid grid-cols-3 gap-1.5">
        <button
          onClick={() => setMode('backward')}
          className={`py-1.5 px-2 rounded-lg text-center text-xs font-medium transition-colors border ${
            mode === 'backward'
              ? 'bg-sky-500/20 border-sky-500/40 text-sky-300 font-semibold'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Reverse
        </button>

        <button
          onClick={() => setMode('forward')}
          className={`py-1.5 px-2 rounded-lg text-center text-xs font-medium transition-colors border ${
            mode === 'forward'
              ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 font-semibold'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Forecast
        </button>

        <button
          onClick={() => setMode('both')}
          className={`py-1.5 px-2 rounded-lg text-center text-xs font-medium transition-colors border ${
            mode === 'both'
              ? 'bg-sky-500/20 border-sky-500/40 text-sky-300 font-semibold'
              : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
          }`}
        >
          Dual View
        </button>
      </div>

      {/* Interactive Time Scrubber */}
      <div className="p-3 bg-slate-900/90 rounded-lg border border-slate-800 space-y-2.5">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400">Timeline Offset:</span>
          <span className="text-sky-300 font-mono font-semibold">
            {scrubberHour < 0
              ? `${scrubberHour}h (Reverse Origin)`
              : scrubberHour === 0
              ? 'T0 (SAR Acquisition)'
              : `+${scrubberHour}h (Spread Forecast)`}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsPlaying(!isPlaying)}
            className="p-1.5 rounded-lg bg-sky-500/20 text-sky-300 hover:bg-sky-500/30 border border-sky-500/40 transition-colors"
            title={isPlaying ? 'Pause' : 'Play Timeline Animation'}
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 fill-sky-400" />}
          </button>

          <button
            onClick={() => {
              setIsPlaying(false);
              setScrubberHour(-24);
            }}
            className="p-1.5 rounded-lg bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
            title="Reset to Origin"
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
            className="flex-1 accent-sky-400 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
        </div>

        <div className="flex justify-between text-[10px] text-slate-400 font-mono">
          <span>-24h Discharge</span>
          <span>T0 Captured</span>
          <span>+24h Spread</span>
        </div>
      </div>

      {/* Horizon Selection */}
      <div>
        <div className="text-[11px] text-slate-400 mb-1.5 flex justify-between">
          <span>Simulation Duration:</span>
          <span className="text-slate-200 font-semibold font-mono">{selectedHorizon} Hours</span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {horizons.map((h) => (
            <button
              key={h.hours}
              onClick={() => setSelectedHorizon(h.hours)}
              className={`py-1 rounded-md text-center text-xs font-medium border transition-colors ${
                selectedHorizon === h.hours
                  ? 'bg-sky-500/20 border-sky-500/40 text-sky-300 font-semibold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:bg-slate-800'
              }`}
            >
              {h.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

