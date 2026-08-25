import React, { useEffect, useState } from 'react';
import {
  Radar,
  Radio,
  Satellite,
  Waves,
  Play,
  Clock,
  ShieldCheck,
} from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';

export const TopNav: React.FC = () => {
  const { systemHealth, executeDemo, loading, setActivePage } = useInvestigation();
  const [utcTime, setUtcTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(
        now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC'
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="h-14 bg-[#0a0f1d] border-b border-slate-800/80 px-4 flex items-center justify-between select-none z-30 sticky top-0">
      {/* Left: Brand Identity */}
      <div className="flex items-center gap-3">
        <div
          onClick={() => setActivePage('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-colors">
            <Radar className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-wider text-slate-100 text-base">
                MARINETRACE
              </span>
              <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                v2.4 COMMAND
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono hidden md:block">
              INTELLIGENT MARITIME OIL-SPILL INVESTIGATION SYSTEM
            </p>
          </div>
        </div>
      </div>

      {/* Center: Live Subsystem Telemetry Indicators */}
      <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-900/90 rounded-md border border-slate-800 text-[11px] font-mono">
        <div className="flex items-center gap-1.5 px-2 py-0.5">
          <span
            className={`w-2 h-2 rounded-full ${
              systemHealth.api === 'online' ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="text-slate-300">FastAPI</span>
        </div>
        <span className="text-slate-700">|</span>

        <div className="flex items-center gap-1.5 px-2 py-0.5">
          <Satellite className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-300">Sentinel-1</span>
          <span className="text-emerald-400 font-semibold text-[10px]">READY</span>
        </div>
        <span className="text-slate-700">|</span>

        <div className="flex items-center gap-1.5 px-2 py-0.5">
          <Waves className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-slate-300">OpenDrift</span>
          <span className="text-emerald-400 font-semibold text-[10px]">SYNCED</span>
        </div>
        <span className="text-slate-700">|</span>

        <div className="flex items-center gap-1.5 px-2 py-0.5">
          <Radio className="w-3.5 h-3.5 text-amber-400" />
          <span className="text-slate-300">AIS Feed</span>
          <span className="text-emerald-400 font-semibold text-[10px]">LIVE</span>
        </div>
      </div>

      {/* Right: Actions & Clock */}
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-1.5 text-slate-400 font-mono text-xs px-2.5 py-1 bg-slate-900/60 rounded border border-slate-800/80">
          <Clock className="w-3.5 h-3.5 text-slate-400" />
          <span>{utcTime || 'UTC 00:00:00'}</span>
        </div>

        <button
          onClick={executeDemo}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-blue-500/20 hover:from-cyan-500/30 hover:to-blue-500/30 border border-cyan-500/40 hover:border-cyan-400 text-cyan-300 rounded text-xs font-semibold tracking-wide transition-all shadow-sm shadow-cyan-950/50 disabled:opacity-50"
        >
          <Play className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
          <span>{loading ? 'RUNNING PIPELINE...' : 'DEMO SCENARIO'}</span>
        </button>

        <div className="flex items-center gap-1 text-[11px] font-mono text-emerald-400 px-2 py-1 bg-emerald-500/10 rounded border border-emerald-500/20">
          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
          <span className="hidden sm:inline">COAST GUARD READY</span>
        </div>
      </div>
    </header>
  );
};
