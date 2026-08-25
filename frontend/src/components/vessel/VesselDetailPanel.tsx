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
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 text-xs font-mono text-center">
        Select a vessel from the list or map to inspect evidence.
      </div>
    );
  }

  const { feature_scores, reasons } = selectedVessel;

  // Approximate metrics derived for display
  const distanceKm = (100 - feature_scores.spatial) * 0.25;
  const timeDiffMin = Math.round((100 - feature_scores.temporal) * 1.2);

  return (
    <div className="bg-[#0e1626] border border-slate-800 rounded-lg p-4 font-mono space-y-4 shadow-xl text-xs">
      {/* Vessel Header */}
      <div className="border-b border-slate-800 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span
              className={`w-6 h-6 rounded flex items-center justify-center font-bold text-xs ${
                selectedVessel.rank === 1
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              #{selectedVessel.rank}
            </span>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                <span>{selectedVessel.vessel_name}</span>
                {selectedVessel.flag && (
                  <span className="text-[10px] font-normal px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 flex items-center gap-1 border border-slate-700">
                    <Flag className="w-3 h-3 text-cyan-400" />
                    {selectedVessel.flag}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">{selectedVessel.vessel_type}</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-400 uppercase">ATTRIBUTION SCORE</div>
            <div
              className={`text-2xl font-bold ${
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        <div className="bg-slate-900/90 border border-slate-800/80 p-2 rounded">
          <div className="text-[10px] text-slate-400">MMSI</div>
          <div className="text-xs font-bold text-slate-200 mt-0.5">{selectedVessel.mmsi}</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 p-2 rounded">
          <div className="text-[10px] text-slate-400">IMO NUMBER</div>
          <div className="text-xs font-bold text-slate-200 mt-0.5">
            {selectedVessel.mmsi ? `IMO 9${selectedVessel.mmsi.substring(2, 8)}` : 'UNKNOWN'}
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 p-2 rounded">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-rose-400" />
            DISTANCE
          </div>
          <div className="text-xs font-bold text-slate-200 mt-0.5">
            {distanceKm.toFixed(1)} km to origin
          </div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 p-2 rounded">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-cyan-400" />
            TIME OFFSET
          </div>
          <div className="text-xs font-bold text-slate-200 mt-0.5">
            {timeDiffMin} min from window
          </div>
        </div>
      </div>

      {/* 5-Dimension Radar Profile & Bars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center bg-slate-900/50 border border-slate-800/70 p-3 rounded-lg">
        <div>
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-2">
            CORRELATION PROFILE
          </div>
          <AttributionRadarChart
            scores={feature_scores}
            vesselName={selectedVessel.vessel_name}
          />
        </div>

        <div className="space-y-2.5">
          <div className="text-[11px] font-bold text-slate-300 uppercase tracking-wider mb-1">
            FEATURE WEIGHT BREAKDOWN
          </div>
          <ScoreBreakdownBar
            label="Spatial Proximity"
            score={feature_scores.spatial}
            weightLabel="Weight: 30%"
            color="rose"
          />
          <ScoreBreakdownBar
            label="Temporal Correlation"
            score={feature_scores.temporal}
            weightLabel="Weight: 25%"
            color="amber"
          />
          <ScoreBreakdownBar
            label="Trajectory Match"
            score={feature_scores.trajectory}
            weightLabel="Weight: 20%"
            color="cyan"
          />
          <ScoreBreakdownBar
            label="Behaviour Anomaly"
            score={feature_scores.behaviour}
            weightLabel="Weight: 15%"
            color="indigo"
          />
          <ScoreBreakdownBar
            label="Vessel Type Relevance"
            score={feature_scores.vessel_relevance}
            weightLabel="Weight: 10%"
            color="emerald"
          />
        </div>
      </div>

      {/* Detailed Investigative Findings */}
      <div className="bg-slate-900/80 border border-slate-800 p-3.5 rounded-lg space-y-2">
        <div className="text-[11px] font-bold text-cyan-400 flex items-center gap-1.5 uppercase tracking-wider">
          <FileCheck2 className="w-4 h-4 text-cyan-400" />
          INVESTIGATIVE EVIDENCE & OBSERVATIONS
        </div>

        <div className="space-y-1.5">
          {reasons && reasons.length > 0 ? (
            reasons.map((reason, idx) => (
              <div
                key={idx}
                className="text-[11px] text-slate-200 flex items-start gap-2 bg-slate-950/40 p-2 rounded border border-slate-800/60 leading-relaxed"
              >
                <span className="text-cyan-400 font-bold">›</span>
                <span>{reason}</span>
              </div>
            ))
          ) : (
            <p className="text-slate-400 text-xs">No anomalies recorded for this transit.</p>
          )}
        </div>
      </div>

      {/* Mandatory Scientific/Investigative Language Disclaimer */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded p-3 flex items-start gap-2.5 text-[11px] text-amber-200">
        <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0 mt-0.5" />
        <div>
          <strong className="text-amber-300 font-bold block mb-0.5">
            DECISION-SUPPORT NOTICE
          </strong>
          {investigation?.disclaimer ||
            'This analysis establishes potential vessel attribution and investigative priority only. It does not constitute a legal determination of responsibility.'}
        </div>
      </div>
    </div>
  );
};
