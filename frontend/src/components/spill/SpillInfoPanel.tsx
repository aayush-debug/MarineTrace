import React from 'react';
import {
  Satellite,
  Compass,
  Ship,
  ExternalLink,
  Target,
  Maximize2,
  Calendar,
} from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';

export const SpillInfoPanel: React.FC = () => {
  const { investigation, setActivePage } = useInvestigation();

  if (!investigation) {
    return (
      <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-slate-400 text-xs font-mono text-center">
        No active spill detection selected.
      </div>
    );
  }

  const { spill, observation_time } = investigation;
  const centroidLat =
    spill.geometry?.coordinates?.[0]?.[0]?.[1] || 18.721;
  const centroidLon =
    spill.geometry?.coordinates?.[0]?.[0]?.[0] || 72.914;

  return (
    <div className="bg-[#0e1626] border border-slate-800 rounded-lg p-4 font-mono space-y-4 shadow-lg text-xs">
      {/* Header Badge */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse" />
          <span className="font-bold text-slate-100 text-sm tracking-wide">
            POTENTIAL OIL SPILL
          </span>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
          STATUS: UNDER INVESTIGATION
        </span>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-slate-900/90 border border-slate-800/80 p-2.5 rounded">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">
            Detection Confidence
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-0.5">
            {(spill.confidence * 100).toFixed(1)}%
          </div>
          <div className="text-[9px] text-slate-400 mt-1">U-Net + XGBoost Verification</div>
        </div>

        <div className="bg-slate-900/90 border border-slate-800/80 p-2.5 rounded">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider">
            Estimated Slick Area
          </div>
          <div className="text-xl font-bold text-amber-400 mt-0.5">
            {spill.area_km2.toFixed(2)} km²
          </div>
          <div className="text-[9px] text-slate-400 mt-1">Extracted Polygon Envelope</div>
        </div>
      </div>

      {/* Telemetry Breakdown */}
      <div className="bg-slate-900/60 border border-slate-800/70 p-3 rounded space-y-2 text-slate-300">
        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-cyan-400" />
            Detection Time:
          </span>
          <span className="text-slate-100 font-semibold">
            {new Date(observation_time).toUTCString()}
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-rose-400" />
            Centroid Coordinates:
          </span>
          <span className="text-slate-100 font-semibold">
            {centroidLat.toFixed(4)}° N, {centroidLon.toFixed(4)}° E
          </span>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Satellite className="w-3.5 h-3.5 text-indigo-400" />
            Satellite Sensor:
          </span>
          <span className="text-slate-100 font-semibold">Sentinel-1 SAR (C-Band)</span>
        </div>

        <div className="flex items-center justify-between text-[11px]">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-blue-400" />
            Polarization / Mode:
          </span>
          <span className="text-slate-100 font-semibold">VV + VH / Interferometric Wide (IW)</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        <button
          onClick={() => setActivePage('drift')}
          className="flex flex-col items-center justify-center gap-1 p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-cyan-300 hover:text-cyan-200 transition-colors text-[10px] text-center font-medium"
        >
          <Compass className="w-4 h-4 text-cyan-400" />
          <span>Run Drift Analysis</span>
        </button>

        <button
          onClick={() => setActivePage('attribution')}
          className="flex flex-col items-center justify-center gap-1 p-2 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-amber-300 hover:text-amber-200 transition-colors text-[10px] text-center font-medium"
        >
          <Ship className="w-4 h-4 text-amber-400" />
          <span>Vessel Attribution</span>
        </button>

        <button
          onClick={() => setActivePage('investigation')}
          className="flex flex-col items-center justify-center gap-1 p-2 rounded bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 text-cyan-300 transition-colors text-[10px] text-center font-medium"
        >
          <ExternalLink className="w-4 h-4 text-cyan-400" />
          <span>Full Workspace</span>
        </button>
      </div>
    </div>
  );
};
