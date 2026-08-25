import React from 'react';
import {
  Ship,
  AlertOctagon,
  CheckCircle2,
  ChevronRight,
  Gauge,
} from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';
import { ScoreBreakdownBar } from './ScoreBreakdownBar';

export const VesselRankList: React.FC = () => {
  const {
    investigation,
    selectedVesselMmsi,
    setSelectedVesselMmsi,
  } = useInvestigation();

  if (!investigation || investigation.vessels.length === 0) {
    return (
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 text-xs font-mono text-center">
        No candidate vessels in active investigation.
      </div>
    );
  }

  return (
    <div className="space-y-3 font-mono">
      <div className="flex items-center justify-between text-xs pb-1 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Ship className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-200 tracking-wider">
            SUSPECT VESSEL RANKING
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-normal">
          {investigation.vessels.length} CANDIDATES EVALUATED
        </span>
      </div>

      <div className="space-y-2.5">
        {investigation.vessels.map((vessel) => {
          const isSelected = selectedVesselMmsi === vessel.mmsi;
          const isRank1 = vessel.rank === 1;

          return (
            <div
              key={vessel.mmsi}
              onClick={() => setSelectedVesselMmsi(vessel.mmsi)}
              className={`p-3.5 rounded-lg border transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-900 border-cyan-500 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/50'
                  : 'bg-[#0d1424] hover:bg-slate-900/80 border-slate-800/90 hover:border-slate-700'
              }`}
            >
              {/* Card Header: Rank, Name, Score Badge */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${
                      isRank1
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                        : vessel.rank === 2
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                        : 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/40'
                    }`}
                  >
                    #{vessel.rank}
                  </div>

                  <div className="truncate">
                    <div className="text-xs font-bold text-slate-100 truncate flex items-center gap-1.5">
                      <span>{vessel.vessel_name}</span>
                      {vessel.flag && (
                        <span className="text-[9px] px-1 rounded bg-slate-800 text-slate-400 font-normal">
                          {vessel.flag}
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400 font-normal">
                      MMSI: {vessel.mmsi} • {vessel.vessel_type}
                    </div>
                  </div>
                </div>

                <div className="text-right flex-shrink-0">
                  <div className="text-[10px] text-slate-400 uppercase tracking-tighter">
                    ATTRIBUTION
                  </div>
                  <div
                    className={`text-lg font-bold ${
                      vessel.score >= 80
                        ? 'text-rose-400'
                        : vessel.score >= 50
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {vessel.score.toFixed(1)}%
                  </div>
                </div>
              </div>

              {/* Priority Tag & Summary Pills */}
              <div className="flex flex-wrap items-center gap-1.5 mb-2.5 text-[10px]">
                <span
                  className={`px-2 py-0.5 rounded font-semibold flex items-center gap-1 ${
                    vessel.investigative_priority === 'HIGH'
                      ? 'bg-rose-500/15 text-rose-300 border border-rose-500/30'
                      : vessel.investigative_priority === 'MEDIUM'
                      ? 'bg-amber-500/15 text-amber-300 border border-amber-500/30'
                      : 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                  }`}
                >
                  <AlertOctagon className="w-3 h-3" />
                  {vessel.investigative_priority} PRIORITY SUSPECT
                </span>

                <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60">
                  Spatial Match: {vessel.feature_scores.spatial.toFixed(0)}%
                </span>

                <span className="px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700/60">
                  Temporal Match: {vessel.feature_scores.temporal.toFixed(0)}%
                </span>

                {vessel.feature_scores.behaviour > 50 && (
                  <span className="px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 flex items-center gap-1">
                    <Gauge className="w-3 h-3" />
                    Anomaly: High
                  </span>
                )}
              </div>

              {/* Score Breakdown Bars */}
              <div className="space-y-1.5 pt-1 border-t border-slate-800/70">
                <ScoreBreakdownBar
                  label="Spatial Proximity"
                  score={vessel.feature_scores.spatial}
                  weightLabel="30%"
                  color="rose"
                />
                <ScoreBreakdownBar
                  label="Temporal Correlation"
                  score={vessel.feature_scores.temporal}
                  weightLabel="25%"
                  color="amber"
                />
                <ScoreBreakdownBar
                  label="Trajectory Proximity"
                  score={vessel.feature_scores.trajectory}
                  weightLabel="20%"
                  color="cyan"
                />
              </div>

              {/* Reasons & Evidence Bullets */}
              {vessel.reasons && vessel.reasons.length > 0 && (
                <div className="mt-2.5 pt-2 border-t border-slate-800/60 space-y-1">
                  <div className="text-[10px] text-slate-400 font-semibold uppercase">
                    Investigative Findings:
                  </div>
                  {vessel.reasons.slice(0, 2).map((reason, idx) => (
                    <div
                      key={idx}
                      className="text-[11px] text-slate-300 flex items-start gap-1.5 leading-tight"
                    >
                      <CheckCircle2 className="w-3 h-3 text-cyan-400 mt-0.5 flex-shrink-0" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="mt-2 text-right">
                <span className="text-[10px] text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 font-semibold">
                  Inspect Detailed Evidence <ChevronRight className="w-3 h-3" />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
