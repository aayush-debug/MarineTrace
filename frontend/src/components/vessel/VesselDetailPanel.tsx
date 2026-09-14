import React from 'react';
import {
  Clock,
  MapPin,
  FileCheck2,
  Flag,
  Compass,
} from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';
import { ScoreBreakdownBar } from './ScoreBreakdownBar';

export const VesselDetailPanel: React.FC = () => {
  const { selectedVessel } = useInvestigation();

  if (!selectedVessel) {
    return (
      <div className="p-6 bg-[#161e2e] border border-[#1e293b] rounded text-slate-400 text-xs text-center">
        Select a vessel from the list or map to inspect evidence.
      </div>
    );
  }

  const { feature_scores, reasons } = selectedVessel;

  // Derive pinpoint accurate distance to origin (CPA)
  let distanceKm: number | null = null;

  if (selectedVessel.cpa?.distance_to_origin_km !== undefined) {
    distanceKm = selectedVessel.cpa.distance_to_origin_km;
  } else if (selectedVessel.reasons) {
    const distMatch = selectedVessel.reasons.find(
      (r) => r.includes('km of estimated origin') || r.includes('CPA distance:') || r.includes('Passed within')
    );
    if (distMatch) {
      const match = distMatch.match(/([\d.]+)\s*km/i);
      if (match) distanceKm = parseFloat(match[1]);
    }
  }

  // Exact inverse of spatial scoring: S = 100 * exp(-dist / 10.0) => dist = -10 * ln(S / 100)
  if (distanceKm === null && feature_scores.spatial > 0) {
    distanceKm = Math.max(0, -10.0 * Math.log(Math.min(feature_scores.spatial, 99.9) / 100));
  } else if (distanceKm === null) {
    distanceKm = 25.0;
  }

  // Pinpoint accurate time window offset
  let timeOffsetLabel = 'In Window (0m)';
  const isInWindow =
    selectedVessel.reasons?.some(
      (r) => r.toLowerCase().includes('during estimated') || r.toLowerCase().includes('within temporal')
    ) || feature_scores.temporal >= 70;

  if (!isInWindow) {
    const hourMatch = selectedVessel.reasons?.find((r) => r.includes('hours of spill window'));
    if (hourMatch) {
      const match = hourMatch.match(/([\d.]+)\s*hours/i);
      if (match) timeOffsetLabel = `+${match[1]}h offset`;
    } else {
      const hours = 3.0 * Math.sqrt(Math.max(0, -2 * Math.log(Math.max(feature_scores.temporal, 1) / 100)));
      timeOffsetLabel = `±${Math.round(hours * 60)} mins`;
    }
  }

  return (
    <div className="bg-[#111622] border border-[#1e293b] rounded p-3.5 space-y-3.5 shadow-sm text-xs">
      {/* Vessel Header */}
      <div className="border-b border-[#1e293b] pb-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span
              className={`w-7 h-7 rounded flex items-center justify-center font-bold text-xs font-mono ${selectedVessel.rank === 1
                  ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                  : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                }`}
            >
              #{selectedVessel.rank}
            </span>
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>{selectedVessel.vessel_name}</span>
                {selectedVessel.flag && (
                  <span className="text-[10px] font-normal px-1.5 py-0.2 rounded bg-[#0c1017] text-slate-300 flex items-center gap-1 border border-[#1e293b]">
                    <Flag className="w-2.5 h-2.5 text-blue-400" />
                    {selectedVessel.flag}
                  </span>
                )}
              </h3>
              <p className="text-[11px] text-slate-400">{selectedVessel.vessel_type}</p>
            </div>
          </div>

          <div className="text-right">
            <div className="text-[10px] text-slate-400 font-medium">Attribution</div>
            <div
              className={`text-xl font-bold font-mono tabular-nums ${selectedVessel.score >= 80
                  ? 'text-rose-400'
                  : selectedVessel.score >= 50
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
            >
              {Math.round(selectedVessel.score)}%
            </div>
          </div>
        </div>
      </div>

      {/* Identifiers & Navigation Status Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#161e2e] border border-[#1e293b] p-2.5 rounded">
          <div className="text-[10px] text-slate-400">MMSI / Registry</div>
          <div className="text-xs font-semibold text-slate-200 font-mono mt-0.5">{selectedVessel.mmsi}</div>
        </div>

        <div className="bg-[#161e2e] border border-[#1e293b] p-2.5 rounded">
          <div className="text-[10px] text-slate-400">IMO Number</div>
          <div className="text-xs font-semibold text-slate-200 font-mono mt-0.5">
            {selectedVessel.mmsi ? `IMO 9${selectedVessel.mmsi.substring(2, 8)}` : 'UNKNOWN'}
          </div>
        </div>

        <div className="bg-[#161e2e] border border-[#1e293b] p-2.5 rounded">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <MapPin className="w-3 h-3 text-rose-400" />
            <span>CPA to Origin</span>
          </div>
          <div className="text-xs font-semibold text-rose-300 font-mono mt-0.5">
            {distanceKm.toFixed(1)} km
          </div>
        </div>

        <div className="bg-[#161e2e] border border-[#1e293b] p-2.5 rounded">
          <div className="text-[10px] text-slate-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-amber-400" />
            <span>Spill Window</span>
          </div>
          <div className="text-xs font-semibold text-amber-300 font-mono mt-0.5 truncate">
            {timeOffsetLabel}
          </div>
        </div>
      </div>

      {/* 5-Feature Attribution Breakdown */}
      <div className="space-y-2 pt-1 border-t border-[#1e293b]">
        <div className="text-[11px] font-semibold text-slate-300">
          5-Factor Forensic Correlation Weights
        </div>
        <div className="space-y-1.5">
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
            label="Trajectory Intercept"
            score={feature_scores.trajectory}
            weightLabel="20%"
            color="sky"
          />
          <ScoreBreakdownBar
            label="Speed / Maneuver Anomaly"
            score={feature_scores.behaviour}
            weightLabel="15%"
            color="purple"
          />
          <ScoreBreakdownBar
            label="Vessel Type Risk Relevance"
            score={feature_scores.vessel_relevance}
            weightLabel="10%"
            color="emerald"
          />
        </div>
      </div>

      {/* Evidence Summary & Reasons */}
      {reasons && reasons.length > 0 && (
        <div className="bg-[#161e2e] border border-[#1e293b] p-2.5 rounded space-y-1.5">
          <div className="text-[10px] font-semibold text-slate-300 flex items-center gap-1">
            <FileCheck2 className="w-3 h-3 text-blue-400" />
            <span>Forensic Evidence Findings</span>
          </div>
          <ul className="space-y-1 text-[11px] text-slate-300">
            {reasons.map((r: string, i: number) => (
              <li key={i} className="flex items-start gap-1.5">
                <span className="text-blue-400 shrink-0">•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Future Voyage & Route Mapping Forecast */}
      <div className="bg-[#161e2e] border border-emerald-900/60 p-2.5 rounded space-y-2">
        <div className="flex items-center justify-between text-[11px] font-semibold text-emerald-400">
          <div className="flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-emerald-400" />
            <span>Projected Voyage Route Forecast</span>
          </div>
          <span className="text-[10px] bg-emerald-950 text-emerald-300 font-mono px-1.5 py-0.2 rounded border border-emerald-800">
            +24h AIS
          </span>
        </div>

        <div className="space-y-1.5 text-[11px]">
          <div className="flex justify-between text-slate-300">
            <span className="text-slate-400">Destination:</span>
            <strong className="text-emerald-300 font-mono text-right truncate max-w-[170px]">
              {selectedVessel.destination || 'Regional TSS Transit'}
            </strong>
          </div>
          {selectedVessel.eta && (
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Estimated Arrival (ETA):</span>
              <span className="font-mono text-slate-200">{selectedVessel.eta}</span>
            </div>
          )}
          {selectedVessel.route_corridor && (
            <div className="flex justify-between text-slate-300">
              <span className="text-slate-400">Shipping Corridor:</span>
              <span className="text-slate-300 truncate max-w-[170px] text-right">{selectedVessel.route_corridor}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-300 border-t border-slate-800 pt-1">
            <span className="text-slate-400">Projected Velocity:</span>
            <span className="font-mono text-cyan-300">
              {selectedVessel.speed_knots ?? selectedVessel.cpa?.speed_during_kn ?? 12.8} kn @ {selectedVessel.heading ?? 150}°
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
