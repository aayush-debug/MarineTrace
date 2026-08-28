import { Cpu, ShieldAlert, Target } from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import { VesselRankList } from '../components/vessel/VesselRankList';
import { VesselDetailPanel } from '../components/vessel/VesselDetailPanel';
import { MaritimeMap } from '../components/map/MaritimeMap';
import { MapLayerControls } from '../components/map/MapLayerControls';
import { MapLegend } from '../components/map/MapLegend';

const WEIGHTS = [
  { label: 'Spatial Geodesic Proximity', weight: 30, color: 'bg-rose-500 shadow-[0_0_8px_#ff0055]' },
  { label: 'Temporal Window Overlap', weight: 25, color: 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' },
  { label: 'Trajectory Closest Approach', weight: 20, color: 'bg-cyan-500 shadow-[0_0_8px_#00f0ff]' },
  { label: 'Behavioral / Speed Anomaly', weight: 15, color: 'bg-indigo-500 shadow-[0_0_8px_#818cf8]' },
  { label: 'Vessel Type Risk Profile', weight: 10, color: 'bg-emerald-500 shadow-[0_0_8px_#10b981]' },
];

export const VesselAttribution: React.FC = () => {
  const { investigation } = useInvestigation();
  const topSuspect = investigation?.vessels[0];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#040814] overflow-hidden select-none">

      {/* NASA Mission Header */}
      <div className="px-5 py-2.5 bg-[#070d1d] border-b border-[rgba(0,240,255,0.18)] flex items-center justify-between gap-4 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.25)]">
            <Target className="w-4.5 h-4.5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-orbitron text-xs sm:text-sm font-bold text-slate-100 uppercase tracking-wider">
                AIS Trajectory Correlation & Target Prioritization
              </h1>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                STAGE-03/04
              </span>
            </div>
            <p className="text-[11px] font-mono text-cyan-400/80 mt-0.5">
              Historical AIS Correlation with Reverse Hydrodynamic Origin · 5D Explainable Attribution Scoring
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-bold px-3 py-1 rounded bg-cyan-950/90 border border-cyan-500/40 text-cyan-300 shadow-sm shrink-0">
          5-FACTOR ML SCORER
        </span>
      </div>

      {/* PRIMARY TARGET INTERCEPT HERO BANNER */}
      {topSuspect && (
        <div className="px-5 py-3 bg-gradient-to-r from-rose-950/60 via-[#071126] to-[#040814] border-b border-rose-500/30 shrink-0 relative">
          <div className="absolute top-1 right-2 w-1.5 h-1.5 border-t border-r border-rose-400" />
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-md bg-rose-950 border border-rose-500/50 flex items-center justify-center text-rose-300 font-bold text-sm font-mono shadow-[0_0_12px_rgba(255,0,85,0.3)] shrink-0">
                #01
              </div>
              <div>
                <div className="text-[9px] font-mono font-bold text-rose-400 uppercase tracking-widest mb-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping" />
                  <span>PRIMARY TARGET INTERCEPT FLAGGED</span>
                </div>
                <div className="text-base font-orbitron font-bold text-slate-100 tracking-wide uppercase">
                  {topSuspect.vessel_name}
                </div>
                <div className="flex items-center gap-2.5 text-xs font-mono text-slate-400 mt-0.5">
                  <span className="text-cyan-300 font-bold">MMSI: {topSuspect.mmsi}</span>
                  <span className="text-cyan-900">|</span>
                  <span>{topSuspect.vessel_type}</span>
                  <span className="text-cyan-900">|</span>
                  <span>FLAG: {topSuspect.flag}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 shrink-0 font-mono">
              {/* Score display */}
              <div className="text-right">
                <div className="text-2xl font-bold text-rose-400 kpi-value">
                  {topSuspect.score.toFixed(1)}%
                </div>
                <div className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">ATTRIBUTION PROBABILITY</div>
              </div>

              {/* Priority badge */}
              <div className={`px-3 py-1.5 rounded-md text-center font-mono font-bold text-xs uppercase border ${
                topSuspect.investigative_priority === 'HIGH'
                  ? 'bg-rose-950 text-rose-300 border-rose-500/50 shadow-[0_0_10px_rgba(255,0,85,0.3)]'
                  : 'bg-amber-950 text-amber-300 border-amber-500/50'
              }`}>
                {topSuspect.investigative_priority} PRIORITY
              </div>

              {/* Recommended Action */}
              <div className="hidden lg:flex items-start gap-2 text-xs font-mono text-slate-300 bg-[#081024] p-2.5 rounded-md border border-cyan-500/25 max-w-xs leading-relaxed">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5 animate-pulse" />
                <span className="text-[10px] text-slate-300">
                  Target priority flagged for Port State Control inspection and transponder log subpoena.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* LEFT: Ranked Candidates + Scoring Weights */}
        <div className="w-84 bg-[#060b18] border-r border-[rgba(0,240,255,0.18)] flex flex-col overflow-hidden shrink-0 shadow-xl">
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <VesselRankList />

            {/* Scoring Weight Distribution Module */}
            <div className="p-3.5 bg-[#081024] border border-cyan-500/25 rounded-md space-y-3 font-mono relative">
              <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-cyan-400" />
              <div className="flex items-center gap-1.5 text-xs font-bold text-cyan-300 uppercase tracking-wider">
                <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                <span>5D FEATURE WEIGHT MATRIX</span>
              </div>
              <div className="space-y-2.5">
                {WEIGHTS.map((w) => (
                  <div key={w.label}>
                    <div className="flex justify-between text-[10px] mb-1">
                      <span className="text-slate-400 truncate pr-2">{w.label}</span>
                      <span className="text-cyan-200 font-bold font-mono shrink-0">{w.weight}%</span>
                    </div>
                    <div className="h-1.5 bg-[#040814] rounded-full overflow-hidden border border-cyan-900/40">
                      <div
                        className={`h-full ${w.color} rounded-full animate-bar-fill`}
                        style={{ '--bar-width': `${w.weight * (100 / 30)}%` } as React.CSSProperties}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CENTER: AIS Track Correlation Map */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className="h-8 bg-[#070d1d] border-b border-[rgba(0,240,255,0.15)] px-4 flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
            <span className="font-semibold text-cyan-300">
              AIS SPATIO-TEMPORAL TRAJECTORY CORRELATION MAP
            </span>
            <span className="text-cyan-400">{investigation?.vessels.length || 0} CANDIDATE TRACKS PLOTTED</span>
          </div>
          <div className="flex-1 relative bg-[#030610]">
            <MaritimeMap />
            <MapLayerControls />
            <MapLegend />
          </div>
        </div>

        {/* RIGHT: Vessel Evidence Detail Panel */}
        <div className="w-84 bg-[#060b18] border-l border-[rgba(0,240,255,0.18)] flex flex-col overflow-hidden shrink-0 shadow-2xl">
          <div className="flex-1 overflow-y-auto p-3">
            <VesselDetailPanel />
          </div>
        </div>
      </div>
    </div>
  );
};
