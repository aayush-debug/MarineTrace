import { useState, useEffect } from 'react';
import { Radar, Play, Clock, Satellite, Waves, Radio, ShieldCheck, Zap } from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';

export const TopNav: React.FC = () => {
  const { systemHealth, executeDemo, loading, setActivePage, investigationList } = useInvestigation();
  const [utcTime, setUtcTime] = useState<string>('');
  const [sweepAngle, setSweepAngle] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().replace('T', ' ').substring(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const anim = setInterval(() => setSweepAngle((a) => (a + 3) % 360), 50);
    return () => clearInterval(anim);
  }, []);

  const latencyColor =
    systemHealth.latencyMs < 100 ? 'text-emerald-400' :
    systemHealth.latencyMs < 300 ? 'text-amber-400' : 'text-rose-400';

  const activeCount = investigationList.length;

  return (
    <header className="h-[52px] bg-[#080d18] border-b border-[rgba(255,255,255,0.07)] px-4 flex items-center justify-between select-none z-30 sticky top-0 shrink-0">

      {/* LEFT: Brand */}
      <div className="flex items-center gap-3 min-w-0">
        <div
          onClick={() => setActivePage('dashboard')}
          className="flex items-center gap-2.5 cursor-pointer group shrink-0"
        >
          {/* Animated Radar Logo */}
          <div className="relative w-8 h-8 rounded-md bg-cyan-500/10 border border-cyan-500/25 flex items-center justify-center overflow-hidden group-hover:border-cyan-400/50 transition-colors">
            <Radar className="w-4.5 h-4.5 text-cyan-400 relative z-10" />
            {/* Sweep line */}
            <div
              className="absolute inset-0 origin-center pointer-events-none"
              style={{
                background: `conic-gradient(from ${sweepAngle}deg, rgba(6,182,212,0.0) 0deg, rgba(6,182,212,0.35) 30deg, rgba(6,182,212,0.0) 60deg)`,
              }}
            />
          </div>

          <div className="hidden sm:block">
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-[0.12em] text-slate-100 text-sm font-mono">
                MARINETRACE
              </span>
              <span className="text-[9px] uppercase font-mono px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 tracking-widest">
                v2.4
              </span>
              {activeCount > 0 && (
                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-rose-500/15 text-rose-400 border border-rose-500/25 font-bold">
                  {activeCount} ACTIVE
                </span>
              )}
            </div>
            <p className="text-[9px] text-slate-500 font-mono tracking-widest hidden lg:block">
              MARITIME OIL-SPILL INVESTIGATION SYSTEM
            </p>
          </div>
        </div>
      </div>

      {/* CENTER: Subsystem Status Strip */}
      <div className="hidden xl:flex items-center gap-0 px-3 py-1.5 bg-[#0a0f1f] rounded-md border border-[rgba(255,255,255,0.07)] text-[10px] font-mono divide-x divide-[rgba(255,255,255,0.06)]">

        {/* FastAPI */}
        <div className="flex items-center gap-1.5 px-2.5">
          <span className={`status-dot-${systemHealth.api === 'online' ? 'online' : 'degraded'}`} />
          <span className="text-slate-400">FastAPI</span>
          <span className={`font-bold ${latencyColor}`}>{systemHealth.latencyMs}ms</span>
        </div>

        {/* ML Engine */}
        <div className="flex items-center gap-1.5 px-2.5">
          <Zap className="w-3 h-3 text-indigo-400" />
          <span className="text-slate-400">U-Net</span>
          <span className="text-emerald-400 font-bold">READY</span>
        </div>

        {/* Sentinel-1 */}
        <div className="flex items-center gap-1.5 px-2.5">
          <Satellite className="w-3 h-3 text-cyan-400" />
          <span className="text-slate-400">Sentinel-1</span>
          <span className="text-emerald-400 font-bold">LIVE</span>
        </div>

        {/* OpenDrift */}
        <div className="flex items-center gap-1.5 px-2.5">
          <Waves className="w-3 h-3 text-blue-400" />
          <span className="text-slate-400">OpenDrift</span>
          <span className="text-emerald-400 font-bold">SYNCED</span>
        </div>

        {/* AIS */}
        <div className="flex items-center gap-1.5 px-2.5">
          <Radio className="w-3 h-3 text-amber-400" />
          <span className="text-slate-400">AIS Feed</span>
          <span className="text-emerald-400 font-bold">LIVE</span>
        </div>
      </div>

      {/* RIGHT: Clock + Demo + Status */}
      <div className="flex items-center gap-2 shrink-0">
        {/* UTC Clock */}
        <div className="hidden sm:flex items-center gap-1.5 text-slate-400 font-mono text-[10px] px-2 py-1 bg-[#0a0f1f] rounded border border-[rgba(255,255,255,0.07)]">
          <Clock className="w-3 h-3 text-slate-500" />
          <span className="tracking-wider">{utcTime || 'UTC --:--:--'}</span>
        </div>

        {/* Demo Button */}
        <button
          onClick={executeDemo}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-cyan-500/15 to-blue-500/15 hover:from-cyan-500/25 hover:to-blue-500/25 border border-cyan-500/30 hover:border-cyan-400/60 text-cyan-300 rounded-md text-[10px] font-mono font-semibold tracking-widest transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
          style={loading ? {} : { boxShadow: '0 0 12px rgba(6, 182, 212, 0.15)' }}
        >
          <Play className="w-3 h-3 fill-cyan-400 text-cyan-400" />
          <span>{loading ? 'EXECUTING...' : 'DEMO SCENARIO'}</span>
        </button>

        {/* Auth Status */}
        <div className="hidden md:flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 px-2 py-1 bg-emerald-500/8 rounded border border-emerald-500/20">
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span>COAST GUARD</span>
        </div>
      </div>
    </header>
  );
};
