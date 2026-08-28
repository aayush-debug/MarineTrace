import React from 'react';
import {
  Satellite,
  Compass,
  Ship,
  Target,
  Maximize2,
  Calendar,
} from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';

export const SpillInfoPanel: React.FC = () => {
  const { investigation, setActivePage } = useInvestigation();

  if (!investigation) {
    return (
      <div className="p-4 bg-[#161e2e] border border-[#1e293b] rounded text-slate-400 text-xs text-center">
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
    <div className="bg-[#111622] border border-[#1e293b] rounded p-3.5 space-y-3.5 shadow-sm text-xs">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-rose-500 shrink-0" />
          <span className="font-semibold text-slate-100 text-sm">
            Oil Slick Detection
          </span>
        </div>
        <span className="text-[10px] font-medium font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/60">
          Under Review
        </span>
      </div>

      {/* Primary Metrics Grid */}
      <div className="grid grid-cols-2 gap-2">
        <div className="bg-[#161e2e] border border-[#1e293b] p-2.5 rounded">
          <div className="text-[11px] text-slate-400 font-medium">
            Detection Confidence
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400 mt-1 tabular-nums">
            {(spill.confidence * 100).toFixed(1)}%
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">U-Net ResNet-34 Pass</div>
        </div>

        <div className="bg-[#161e2e] border border-[#1e293b] p-2.5 rounded">
          <div className="text-[11px] text-slate-400 font-medium">
            Estimated Slick Area
          </div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1 tabular-nums">
            {spill.area_km2.toFixed(2)} <span className="text-xs font-normal text-slate-400">km²</span>
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Segmented Envelope</div>
        </div>
      </div>

      {/* Telemetry Breakdown */}
      <div className="bg-[#161e2e] border border-[#1e293b] p-2.5 rounded space-y-2 text-slate-300">
        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-slate-400" />
            Detection Time:
          </span>
          <span className="text-slate-200 font-mono text-[11px]">
            {new Date(observation_time).toUTCString()}
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5 text-slate-400" />
            Centroid:
          </span>
          <span className="text-slate-200 font-mono text-[11px]">
            {centroidLat.toFixed(4)}° N, {centroidLon.toFixed(4)}° E
          </span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Satellite className="w-3.5 h-3.5 text-slate-400" />
            SAR Sensor:
          </span>
          <span className="text-slate-200 font-medium">Sentinel-1 (C-Band)</span>
        </div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-400 flex items-center gap-1.5">
            <Maximize2 className="w-3.5 h-3.5 text-slate-400" />
            Polarization:
          </span>
          <span className="text-slate-200 font-mono">VV + VH / IW Mode</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={() => setActivePage('drift')}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-[#161e2e] hover:bg-[#1c2638] border border-[#1e293b] text-blue-400 hover:text-blue-300 transition-colors text-xs font-medium cursor-pointer"
        >
          <Compass className="w-3.5 h-3.5" />
          <span>Simulate Drift</span>
        </button>

        <button
          onClick={() => setActivePage('attribution')}
          className="flex items-center justify-center gap-1.5 py-2 px-3 rounded bg-[#161e2e] hover:bg-[#1c2638] border border-[#1e293b] text-amber-400 hover:text-amber-300 transition-colors text-xs font-medium cursor-pointer"
        >
          <Ship className="w-3.5 h-3.5" />
          <span>Attribution</span>
        </button>
      </div>
    </div>
  );
};
