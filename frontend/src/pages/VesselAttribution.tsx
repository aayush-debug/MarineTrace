import { Cpu, ShieldAlert, Target } from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import { VesselRankList } from '../components/vessel/VesselRankList';
import { VesselDetailPanel } from '../components/vessel/VesselDetailPanel';
import { MaritimeMap } from '../components/map/MaritimeMap';
import { MapLayerControls } from '../components/map/MapLayerControls';
import { MapLegend } from '../components/map/MapLegend';

const WEIGHTS = [
  { label: 'Spatial Proximity (CPA)', weight: 30, color: 'bg-rose-500' },
  { label: 'Temporal Window Overlap', weight: 25, color: 'bg-amber-500' },
  { label: 'Trajectory Intercept', weight: 20, color: 'bg-blue-500' },
  { label: 'Speed / Maneuver Anomaly', weight: 15, color: 'bg-indigo-500' },
  { label: 'Vessel Type & Capacity', weight: 10, color: 'bg-emerald-500' },
];

export const VesselAttribution: React.FC = () => {
  const { investigation } = useInvestigation();
  const topSuspect = investigation?.vessels[0];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0c1017] overflow-hidden select-none">

      {/* Header */}
      <div className="px-4 py-2.5 bg-[#111622] border-b border-[#1e293b] flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#161e2e] border border-slate-800 flex items-center justify-center text-blue-400">
            <Target className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-semibold text-slate-100">
                AIS Trajectory Correlation & Vessel Attribution
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60 font-medium">
                Stage 3 & 4
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Multi-Stage Spatio-Temporal Intercept · 5-Factor Explainable Attribution Model
            </p>
          </div>
        </div>
        <span className="text-xs font-mono font-medium px-2.5 py-1 rounded bg-[#161e2e] border border-slate-800 text-slate-300 shrink-0">
          5D Scorer
        </span>
      </div>

      {/* Primary Suspect Hero Banner */}
      {topSuspect && (
        <div className="px-4 py-3 bg-[#151c2b] border-b border-rose-900/50 shrink-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3.5">
              <div className="w-9 h-9 rounded bg-rose-950 border border-rose-800/60 flex items-center justify-center text-rose-300 font-bold text-sm font-mono shrink-0">
                #1
              </div>
              <div>
                <div className="text-[10px] font-semibold text-rose-400 uppercase tracking-wide mb-0.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                  <span>Primary Suspect Flagged</span>
                </div>
                <div className="text-sm sm:text-base font-semibold text-slate-100">
                  {topSuspect.vessel_name}
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-400 mt-0.5">
                  <span className="font-mono text-slate-200">MMSI: {topSuspect.mmsi}</span>
                  <span className="text-slate-700">|</span>
                  <span>{topSuspect.vessel_type}</span>
                  <span className="text-slate-700">|</span>
                  <span className="font-mono">Flag: {topSuspect.flag}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-5 shrink-0">
              {/* Score display */}
              <div className="text-right">
                <div className="text-xl sm:text-2xl font-bold font-mono text-rose-400 tabular-nums">
                  {Math.round(topSuspect.score)}%
                </div>
                <div className="text-[10px] text-slate-400 uppercase font-medium">Attribution Match</div>
              </div>

              {/* Priority badge */}
              <div className={`px-2.5 py-1 rounded text-center font-mono font-semibold text-xs uppercase border ${
                topSuspect.investigative_priority === 'HIGH'
                  ? 'bg-rose-950 text-rose-300 border-rose-800/60'
                  : 'bg-amber-950 text-amber-300 border-amber-800/60'
              }`}>
                {topSuspect.investigative_priority} Priority
              </div>

              {/* Action Note */}
              <div className="hidden lg:flex items-start gap-2 text-xs text-slate-300 bg-[#111622] p-2 rounded border border-slate-800 max-w-xs leading-relaxed">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="text-[11px] text-slate-300">
                  Target priority flagged for Port State Control inspection and transponder log audit.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* LEFT: Ranked Candidates + Scoring Weights */}
        <div className="w-76 bg-[#111622] border-r border-[#1e293b] flex flex-col overflow-hidden shrink-0">
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <VesselRankList />

            {/* Scoring Weight Distribution */}
            <div className="p-3 bg-[#161e2e] border border-slate-800 rounded space-y-2.5">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200 uppercase tracking-wide">
                <Cpu className="w-3.5 h-3.5 text-blue-400" />
                <span>5D Scoring Weights</span>
              </div>
              <div className="space-y-2">
                {WEIGHTS.map((w) => (
                  <div key={w.label}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400 truncate pr-2">{w.label}</span>
                      <span className="text-slate-200 font-mono font-medium shrink-0">{w.weight}%</span>
                    </div>
                    <div className="h-1.5 bg-[#0e131d] rounded-full overflow-hidden border border-slate-800">
                      <div
                        className={`h-full ${w.color} rounded-full`}
                        style={{ width: `${w.weight * (100 / 30)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* CENTER: AIS Track Map */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className="h-7 bg-[#111622] border-b border-[#1e293b] px-3 flex items-center justify-between text-xs text-slate-400 shrink-0">
            <span className="font-medium text-slate-300">
              AIS Spatio-Temporal Trajectory Correlation
            </span>
            <span className="font-mono text-[11px] text-slate-400">{investigation?.vessels.length || 0} Candidate Tracks Plotted</span>
          </div>
          <div className="flex-1 relative bg-[#0b0f17]">
            <MaritimeMap />
            <MapLayerControls />
            <MapLegend />
          </div>
        </div>

        {/* RIGHT: Vessel Evidence Detail */}
        <div className="w-80 bg-[#111622] border-l border-[#1e293b] flex flex-col overflow-hidden shrink-0 shadow-lg">
          <div className="flex-1 overflow-y-auto p-3">
            <VesselDetailPanel />
          </div>
        </div>
      </div>
    </div>
  );
};
