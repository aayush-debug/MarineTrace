import { Ship, Cpu, TrendingUp, AlertTriangle } from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import { VesselRankList } from '../components/vessel/VesselRankList';
import { VesselDetailPanel } from '../components/vessel/VesselDetailPanel';
import { MaritimeMap } from '../components/map/MaritimeMap';
import { MapLayerControls } from '../components/map/MapLayerControls';
import { MapLegend } from '../components/map/MapLegend';

const WEIGHTS = [
  { label: 'Spatial Geodesic Proximity', weight: 30, color: 'bg-cyan-400' },
  { label: 'Temporal Window Overlap', weight: 25, color: 'bg-blue-400' },
  { label: 'Trajectory Closest Approach', weight: 20, color: 'bg-indigo-400' },
  { label: 'Behavioral / Speed Anomaly', weight: 15, color: 'bg-violet-400' },
  { label: 'Vessel Type Risk Profile', weight: 10, color: 'bg-purple-400' },
];

export const VesselAttribution: React.FC = () => {
  const { investigation } = useInvestigation();
  const topSuspect = investigation?.vessels[0];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#05080f] overflow-hidden font-mono">

      {/* Page Header */}
      <div className="px-5 py-3 bg-[#080d18] border-b border-[rgba(255,255,255,0.07)] flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <Ship className="w-4 h-4 text-cyan-400" />
          <div>
            <h1 className="text-[12px] font-bold text-slate-100 tracking-wider">
              VESSEL ATTRIBUTION & SUSPECT PRIORITIZATION
            </h1>
            <p className="text-[9px] text-slate-600 mt-0.5">
              Historical AIS correlation with estimated spill origin · 5-feature explainable attribution scoring
            </p>
          </div>
        </div>
        <span className="text-[9px] px-2.5 py-1 rounded bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 font-bold tracking-widest shrink-0">
          ML ATTRIBUTION
        </span>
      </div>

      {/* PRIMARY SUSPECT HERO BANNER */}
      {topSuspect && (
        <div className="px-5 py-3 bg-[#0d1020] border-b border-rose-500/15 shrink-0 glow-pulse-red">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rose-500/10 border border-rose-500/25 flex items-center justify-center text-rose-400 font-bold text-xs font-mono shrink-0">
                #1
              </div>
              <div>
                <div className="text-[9px] text-rose-400/70 font-mono tracking-widest uppercase mb-0.5">Primary Suspect</div>
                <div className="text-base font-bold text-slate-100 tracking-wide">{topSuspect.vessel_name}</div>
                <div className="flex items-center gap-3 text-[9px] text-slate-500 font-mono mt-0.5">
                  <span>MMSI: {topSuspect.mmsi}</span>
                  <span>·</span>
                  <span>{topSuspect.vessel_type}</span>
                  <span>·</span>
                  <span>Flag: {topSuspect.flag}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 shrink-0">
              {/* Score display */}
              <div className="text-center">
                <div className="text-3xl font-bold text-rose-400 kpi-value">{topSuspect.score.toFixed(1)}</div>
                <div className="text-[8px] text-slate-600 tracking-widest">ATTRIBUTION SCORE /100</div>
              </div>

              {/* Priority badge */}
              <div className={`px-4 py-2 rounded-lg text-center font-bold tracking-widest ${
                topSuspect.investigative_priority === 'HIGH'
                  ? 'bg-rose-500/15 border border-rose-500/30 text-rose-400'
                  : 'bg-amber-500/15 border border-amber-500/30 text-amber-400'
              }`}>
                <div className="text-xs">{topSuspect.investigative_priority}</div>
                <div className="text-[8px] text-opacity-70">PRIORITY</div>
              </div>

              {/* Alert */}
              <div className="flex items-start gap-1.5 text-[9px] text-amber-300/70 font-mono max-w-48 leading-relaxed">
                <AlertTriangle className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                <span>Recommend immediate port state inspection and AIS track subpoena.</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* LEFT: Ranked Candidates + Scoring Weights */}
        <div className="w-72 bg-[#080d18] border-r border-[rgba(255,255,255,0.07)] flex flex-col overflow-hidden shrink-0">
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <VesselRankList />

            {/* Scoring Weight Distribution */}
            <div className="p-3 bg-[#0d1427] border border-[rgba(255,255,255,0.07)] rounded-lg">
              <div className="flex items-center gap-1.5 mb-3">
                <Cpu className="w-3 h-3 text-indigo-400" />
                <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">Scoring Weights</span>
              </div>
              <div className="space-y-2.5">
                {WEIGHTS.map((w) => (
                  <div key={w.label}>
                    <div className="flex justify-between text-[9px] font-mono mb-1">
                      <span className="text-slate-500 truncate pr-2">{w.label}</span>
                      <span className="text-slate-300 font-bold shrink-0">{w.weight}%</span>
                    </div>
                    <div className="h-1.5 bg-[#111827] rounded-full overflow-hidden">
                      <div
                        className={`h-full ${w.color} rounded-full animate-bar-fill`}
                        style={{ '--bar-width': `${w.weight * (100 / 30)}%` } as React.CSSProperties}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* ML Disclaimer */}
            <div className="p-2.5 bg-amber-500/5 border border-amber-500/15 rounded-lg">
              <div className="flex items-start gap-1.5 text-[9px] text-amber-400/70 font-mono leading-relaxed">
                <TrendingUp className="w-3 h-3 text-amber-500 shrink-0 mt-0.5" />
                <span>
                  Attribution scores represent statistical evidence ranking only. Final enforcement action requires
                  independent legal verification.
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER: AIS Track Correlation Map */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className="h-9 bg-[#0a0f1d] border-b border-[rgba(255,255,255,0.06)] px-3 flex items-center justify-between text-[10px] font-mono shrink-0">
            <span className="font-bold text-slate-300 tracking-widest">AIS TRACK CORRELATION MAP — 3-STAGE FILTERED CANDIDATES</span>
            <span className="text-cyan-400">{investigation?.vessels.length || 0} vessels plotted</span>
          </div>
          <div className="flex-1 relative">
            <MaritimeMap />
            <MapLayerControls />
            <MapLegend />
          </div>
        </div>

        {/* RIGHT: Vessel Evidence Panel */}
        <div className="w-80 bg-[#080d18] border-l border-[rgba(255,255,255,0.07)] flex flex-col overflow-hidden shrink-0">
          <div className="flex-1 overflow-y-auto p-3">
            <VesselDetailPanel />
          </div>
        </div>
      </div>
    </div>
  );
};
