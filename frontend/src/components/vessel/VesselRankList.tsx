import React from 'react';
import {
  Ship,
  AlertTriangle,
  ChevronRight,
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
      <div className="p-4 bg-[#161e2e] border border-slate-800 rounded text-slate-400 text-xs text-center">
        No candidate vessels in active investigation.
      </div>
    );
  }

  return (
    <div className="space-y-2.5">
      <div className="flex items-center justify-between text-xs pb-1.5 border-b border-slate-800">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
          <Ship className="w-4 h-4 text-blue-400" />
          <span>Suspect Vessel Ranking</span>
        </div>
        <span className="text-[11px] text-slate-500 font-mono">
          {investigation.vessels.length} evaluated
        </span>
      </div>

      <div className="space-y-2">
        {investigation.vessels.map((vessel) => {
          const isSelected = selectedVesselMmsi === vessel.mmsi;
          const isRank1 = vessel.rank === 1;

          return (
            <div
              key={vessel.mmsi}
              onClick={() => setSelectedVesselMmsi(vessel.mmsi)}
              className={`p-3 rounded border transition-colors cursor-pointer ${isSelected
                  ? 'bg-[#161e2e] border-blue-500 shadow-sm'
                  : 'bg-[#111622] hover:bg-[#161e2e]/60 border-[#1e293b]'
                }`}
            >
              {/* Card Header: Rank, Name, Score */}
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs font-mono shrink-0 ${isRank1
                        ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                        : vessel.rank === 2
                          ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                  >
                    #{vessel.rank}
                  </div>

                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-100 truncate flex items-center gap-1.5">
                      <span className="truncate">{vessel.vessel_name}</span>
                      {vessel.flag && (
                        <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#0c1017] text-slate-400 font-mono font-normal shrink-0">
                          {vessel.flag}
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono">
                      MMSI: {vessel.mmsi} · {vessel.vessel_type}
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <div className="text-[10px] text-slate-400 font-medium">Match</div>
                  <div
                    className={`text-base font-bold font-mono tabular-nums ${vessel.score >= 80
                        ? 'text-rose-400'
                        : vessel.score >= 50
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                      }`}
                  >
                    {Math.round(vessel.score)}%
                  </div>
                </div>
              </div>

              {/* Priority & Anomaly Pill */}
              <div className="flex flex-wrap items-center gap-1.5 mb-2 text-[10px]">
                <span
                  className={`px-2 py-0.5 rounded font-medium flex items-center gap-1 ${vessel.investigative_priority === 'HIGH'
                      ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                      : vessel.investigative_priority === 'MEDIUM'
                        ? 'bg-amber-950 text-amber-300 border border-amber-800/60'
                        : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                    }`}
                >
                  <AlertTriangle className="w-3 h-3" />
                  {vessel.investigative_priority} Priority
                </span>

                <span className="px-1.5 py-0.5 rounded bg-[#0c1017] text-slate-300 font-mono">
                  {(() => {
                    let dStr: string | null = null;
                    if (vessel.cpa?.distance_to_origin_km !== undefined) {
                      dStr = `${vessel.cpa.distance_to_origin_km.toFixed(1)} km`;
                    } else if (vessel.reasons) {
                      const match = vessel.reasons.find((r) => r.includes('km of estimated origin') || r.includes('Passed within'));
                      if (match) {
                        const m = match.match(/([\d.]+)\s*km/i);
                        if (m) dStr = `${m[1]} km`;
                      }
                    }
                    if (!dStr && vessel.feature_scores.spatial > 0) {
                      const d = Math.max(0, -10.0 * Math.log(Math.min(vessel.feature_scores.spatial, 99.9) / 100));
                      dStr = `${d.toFixed(1)} km`;
                    }
                    return dStr ? `CPA: ${dStr}` : `Spatial: ${vessel.feature_scores.spatial.toFixed(0)}%`;
                  })()}
                </span>

                <span className="px-1.5 py-0.5 rounded bg-[#0c1017] text-slate-300 font-mono">
                  {vessel.feature_scores.temporal >= 70 ? 'In Window' : `Temporal: ${vessel.feature_scores.temporal.toFixed(0)}%`}
                </span>
              </div>

              {/* Score Breakdown Bar */}
              <div className="space-y-1 pt-1.5 border-t border-slate-800">
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
              </div>

              {/* Action Note */}
              <div className="mt-2 flex items-center justify-between text-[11px] text-blue-400 hover:text-blue-300 pt-1 font-medium">
                <span>View Full Evidence</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
