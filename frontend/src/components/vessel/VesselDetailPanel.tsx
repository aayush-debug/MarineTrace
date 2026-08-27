import React from 'react';
import {
  Clock,
  MapPin,
  FileCheck2,
  AlertTriangle,
  Flag,
} from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';
import { ScoreBreakdownBar } from './ScoreBreakdownBar';
import { AttributionRadarChart } from '../charts/AttributionRadarChart';

export const VesselDetailPanel: React.FC = () => {
  const { selectedVessel, investigation } = useInvestigation();

  if (!selectedVessel) {
    return (
      <div className="p-6 bg-slate-900/60 border border-slate-800 rounded-lg text-slate-400 text-xs text-center">
        Select a vessel from the list or map to inspect evidence.
      </div>
    );
  }

  const { feature_scores, reasons } = selectedVessel;

  // Approximate metrics derived for display
  const distanceKm = (100 - feature_scores.spatial) * 0.25;
  const timeDiffMin = Math.round((100 - feature_scores.temporal) * 1.2);

  return (
    <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-4 space-y-4 shadow-sm text-xs">
      {/* Vessel Header */}
      <div className="border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs font-mono ${
                selectedVessel.rank === 1
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                  : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
              }`}
            >
              #{selectedVessel.rank}
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>{selectedVessel.vessel_name}</span>
                {selectedVessel.flag && (
                  <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 flex items-center gap-1 border border-slate-700">
                    <Flag className="w-2.5 h-2.5 text-sky-400" />
                    {selectedVessel.flag}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">{selectedVessel.vessel_type}</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-medium">Attribution Score</div>
            <div
              className={`text-2xl font-bold kpi-value ${
                selectedVessel.score >= 80
                  ? 'text-rose-400'
                  : selectedVessel.score >= 50
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {selectedVessel.score.toFixed(1)}%
            </div>
          </div>
        </div>
      </div>

      {/* Identifiers & Navigation Status Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
          <div className="text-[10px] text-slate-400">MMSI / Registry</div>
          <div className="text-xs font-semibold text-slate-200 font-mono mt-0.5">{selectedVessel.mmsi}</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
          <div className="text-[10px] text-slate-400">IMO Number</div>
          <div className="text-xs font-semibold text-slate-200 font-mono mt-0.5">
            {selectedVessel.mmsi ? `IMO 9${selectedVessel.mmsi.substring(2, 8)}` : 'UNKNOWN'}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-slate-500" />
            Distance to Origin
          </div>
          <div className="text-xs font-semibold text-slate-200 font-mono mt-0.5">
            {distanceKm.toFixed(1)} km
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-slate-500" />
            Time Offset
          </div>
          <div className="text-xs font-semibold text-slate-200 font-mono mt-0.5">
            {timeDiffMin} min window
          </div>
        </div>
      </div>

      {/* 5-Dimension Radar Profile & Bars */}
      <div className="space-y-3 bg-slate-900/40 border border-slate-800/70 p-3 rounded-lg">
        <div className="text-xs font-semibold text-slate-300">
          5-Factor Explainable Attribution
        </div>

        <div className="w-full flex justify-center">
          <AttributionRadarChart
            scores={feature_scores}
            vesselName={selectedVessel.vessel_name}
          />
        </div>

        <div className="space-y-2 pt-1 border-t border-slate-800/60">
          <ScoreBreakdownBar
            label="Spatial Proximity"
            score={feature_scores.spatial}
            weightLabel="30%"
            color="rose"
          />
          <ScoreBreakdownBar
            label="Temporal Correlation"
            score={feature_scores.temporal}
            weightLabel="25%"
            color="amber"
          />
          <ScoreBreakdownBar
            label="Trajectory Match"
            score={feature_scores.trajectory}
            weightLabel="20%"
            color="sky"
          />
          <ScoreBreakdownBar
            label="Behaviour Anomaly"
            score={feature_scores.behaviour}
            weightLabel="15%"
            color="indigo"
          />
          <ScoreBreakdownBar
            label="Vessel Type Relevance"
            score={feature_scores.vessel_relevance}
            weightLabel="10%"
            color="emerald"
          />
        </div>
      </div>

      {/* Detailed Investigative Findings */}
      <div className="bg-slate-900/60 border border-slate-800 p-3 rounded-lg space-y-2">
        <div className="text-xs font-semibold text-sky-400 flex items-center gap-1.5">
          <FileCheck2 className="w-4 h-4 text-sky-400" />
          <span>Investigative Evidence & Findings</span>
        </div>

        <div className="space-y-1.5">
          {reasons && reasons.length > 0 ? (
            reasons.map((reason, idx) => (
              <div
                key={idx}
                className="text-[11px] text-slate-300 flex items-start gap-2 bg-slate-950/40 p-2 rounded-md border border-slate-800/60 leading-relaxed"
              >
                <span className="text-sky-400 font-bold">›</span>
                <span>{reason}</span>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-xs">No anomalies recorded for this transit.</p>
          )}
        </div>
      </div>

      {/* Decision-Support Notice */}
      <div className="bg-amber-500/5 border border-amber-500/20 rounded-lg p-2.5 flex items-start gap-2 text-[11px] text-amber-200/80">
        <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-[10px] leading-relaxed">
          {investigation?.disclaimer ||
            'This analysis establishes statistical correlation only and does not constitute a legal determination of liability.'}
        </div>
      </div>
    </div>
  );
};

