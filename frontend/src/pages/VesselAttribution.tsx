import { Ship, Cpu, ShieldAlert } from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import { VesselRankList } from '../components/vessel/VesselRankList';
import { VesselDetailPanel } from '../components/vessel/VesselDetailPanel';
import { MaritimeMap } from '../components/map/MaritimeMap';
import { MapLayerControls } from '../components/map/MapLayerControls';
import { MapLegend } from '../components/map/MapLegend';

const WEIGHTS = [
  { label: 'Spatial Geodesic Proximity', weight: 30, color: 'bg-rose-500' },
  { label: 'Temporal Window Overlap', weight: 25, color: 'bg-amber-500' },
  { label: 'Trajectory Closest Approach', weight: 20, color: 'bg-sky-500' },
  { label: 'Behavioral / Speed Anomaly', weight: 15, color: 'bg-indigo-500' },
  { label: 'Vessel Type Risk Profile', weight: 10, color: 'bg-emerald-500' },
];

export const VesselAttribution: React.FC = () => {
  const { investigation } = useInvestigation();
  const topSuspect = investigation?.vessels[0];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#090d16] overflow-hidden">

      {/* Page Header */}
      <div className="px-5 py-3 bg-[#0c121e] border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <Ship className="w-5 h-5 text-sky-400" />
          <div>
            <h1 className="text-sm font-semibold text-slate-100">
              Vessel Attribution & Suspect Prioritization
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Historical AIS correlation with estimated spill origin · 5-factor explainable attribution model
            </p>
          </div>
        </div>
        <span className="text-xs px-2.5 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 font-medium shrink-0">
          5-Factor ML Engine
        </span>
      </div>

      {/* PRIMARY SUSPECT HERO BANNER */}
      {topSuspect && (
        <div className="px-5 py-3.5 bg-gradient-to-r from-rose-950/40 via-slate-900/80 to-slate-900/40 border-b border-rose-500/20 shrink-0">
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-lg bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-400 font-bold text-sm font-mono shrink-0">
                #1
              </div>
              <div>
                <div className="text-[10px] text-rose-400 font-semibold uppercase tracking-wider mb-0.5">
                  Primary Suspect Identified
                </div>
                <div className="text-base font-bold text-slate-100 tracking-tight">
                  {topSuspect.vessel_name}
                </div>
                <div className="flex items-center gap-2.5 text-xs text-slate-400 mt-0.5">
                  <span className="font-mono text-slate-300 font-medium">MMSI: {topSuspect.mmsi}</span>
                  <span>·</span>
                  <span>{topSuspect.vessel_type}</span>
                  <span>·</span>
                  <span>Flag: {topSuspect.flag}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-6 shrink-0">
              {/* Score display */}
              <div className="text-right">
                <div className="text-2xl font-bold text-rose-400 kpi-value">
                  {topSuspect.score.toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-400 font-medium">Attribution Match</div>
              </div>

              {/* Priority badge */}
              <div className={`px-3 py-1.5 rounded-lg text-center font-semibold text-xs border ${
                topSuspect.investigative_priority === 'HIGH'
                  ? 'bg-rose-500/15 border-rose-500/30 text-rose-300'
                  : 'bg-amber-500/15 border-amber-500/30 text-amber-300'
              }`}>
                {topSuspect.investigative_priority} Priority
              </div>

              {/* Recommended Action */}
              <div className="hidden lg:flex items-start gap-2 text-xs text-slate-300 bg-slate-900/80 p-2.5 rounded-lg border border-slate-800 max-w-xs leading-relaxed">
                <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span className="text-[11px] text-slate-300">
                  Flagged for Port State inspection and AIS transponder log subpoena.
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* LEFT: Ranked Candidates + Scoring Weights */}
        <div className="w-80 bg-[#0c121e] border-r border-[rgba(255,255,255,0.08)] flex flex-col overflow-hidden shrink-0">
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            <VesselRankList />

            {/* Scoring Weight Distribution */}
            <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>Feature Weight Distribution</span>
              </div>
              <div className="space-y-2.5">
                {WEIGHTS.map((w) => (
                  <div key={w.label}>
                    <div className="flex justify-between text-[11px] mb-1">
                      <span className="text-slate-400 truncate pr-2">{w.label}</span>
                      <span className="text-slate-200 font-semibold font-mono shrink-0">{w.weight}%</span>
                    </div>
                    <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
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
          <div className="h-8 bg-[#0e1422] border-b border-[rgba(255,255,255,0.06)] px-4 flex items-center justify-between text-xs text-slate-400 shrink-0">
            <span className="font-medium text-slate-300">
              AIS Track Spatio-Temporal Correlation Map
            </span>
            <span className="text-sky-400">{investigation?.vessels.length || 0} candidate tracks plotted</span>
          </div>
          <div className="flex-1 relative">
            <MaritimeMap />
            <MapLayerControls />
            <MapLegend />
          </div>
        </div>

        {/* RIGHT: Vessel Evidence Detail Panel */}
        <div className="w-80 bg-[#0c121e] border-l border-[rgba(255,255,255,0.08)] flex flex-col overflow-hidden shrink-0">
          <div className="flex-1 overflow-y-auto p-3">
            <VesselDetailPanel />
          </div>
        </div>
      </div>
    </div>
  );
};

