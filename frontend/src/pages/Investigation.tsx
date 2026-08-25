import React from 'react';
import {
  ShieldAlert,
  Download,
  Calendar,
  Satellite,
  Target,
  Maximize2,
  Activity,
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import { MaritimeMap } from '../components/map/MaritimeMap';
import { MapLayerControls } from '../components/map/MapLayerControls';
import { MapLegend } from '../components/map/MapLegend';
import { VesselRankList } from '../components/vessel/VesselRankList';
import { VesselDetailPanel } from '../components/vessel/VesselDetailPanel';

export const Investigation: React.FC = () => {
  const { investigation, setActivePage } = useInvestigation();

  if (!investigation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#060a12] p-8 text-center font-mono">
        <div className="max-w-md space-y-3">
          <ShieldAlert className="w-10 h-10 text-amber-400 mx-auto" />
          <h2 className="text-base font-bold text-slate-100">NO ACTIVE INVESTIGATION SELECTED</h2>
          <p className="text-xs text-slate-400">
            Please initiate a new SAR investigation or launch the replayable demonstration scenario.
          </p>
          <button
            onClick={() => setActivePage('new-investigation')}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs rounded transition-colors"
          >
            START NEW INVESTIGATION
          </button>
        </div>
      </div>
    );
  }

  const { spill, observation_time } = investigation;
  const centroidLat =
    spill.geometry?.coordinates?.[0]?.[0]?.[1] || 18.721;
  const centroidLon =
    spill.geometry?.coordinates?.[0]?.[0]?.[0] || 72.914;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#060a12] overflow-hidden font-mono">
      {/* Top Workspace Bar */}
      <div className="h-12 bg-[#090e1c] border-b border-slate-800 px-4 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
            <h1 className="text-sm font-bold text-slate-100 tracking-wider">
              INVESTIGATION #{investigation.investigation_id}
            </h1>
          </div>
          <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
            STATUS: {investigation.status}
          </span>
          {investigation.is_demo && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30">
              REPLAY SCENARIO
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActivePage('reports')}
            className="flex items-center gap-1.5 px-3 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>EXPORT REPORT</span>
          </button>
        </div>
      </div>

      {/* 3-Pane Master Grid: LEFT Metadata | CENTER Map | RIGHT Suspect Vessels */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-0 overflow-hidden">
        {/* LEFT PANEL (Col 1-3): Detection Metadata */}
        <div className="lg:col-span-3 bg-[#080d18] border-r border-slate-800 p-4 space-y-4 overflow-y-auto">
          <div className="text-xs font-bold text-cyan-400 border-b border-slate-800 pb-2 uppercase tracking-wider flex items-center gap-1.5">
            <Activity className="w-4 h-4" />
            <span>INCIDENT TELEMETRY</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 bg-[#0d1424] border border-slate-800 rounded">
              <div className="text-[10px] text-slate-400 uppercase">Detection Confidence</div>
              <div className="text-2xl font-bold text-emerald-400 mt-0.5">
                {(spill.confidence * 100).toFixed(1)}%
              </div>
              <div className="text-[9px] text-slate-500 mt-1">U-Net Segmenter & XGBoost</div>
            </div>

            <div className="p-3 bg-[#0d1424] border border-slate-800 rounded">
              <div className="text-[10px] text-slate-400 uppercase">Extracted Spill Area</div>
              <div className="text-2xl font-bold text-amber-400 mt-0.5">
                {spill.area_km2.toFixed(2)} km²
              </div>
              <div className="text-[9px] text-slate-500 mt-1">Calculated WGS-84 Envelope</div>
            </div>

            <div className="p-3 bg-[#0d1424] border border-slate-800 rounded space-y-2 text-slate-300 text-[11px]">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Target className="w-3 h-3 text-rose-400" />
                  Centroid:
                </span>
                <span className="font-semibold text-slate-100">
                  {centroidLat.toFixed(4)}°N, {centroidLon.toFixed(4)}°E
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3 h-3 text-cyan-400" />
                  Observation:
                </span>
                <span className="font-semibold text-slate-100 text-[10px]">
                  {new Date(observation_time).toUTCString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Satellite className="w-3 h-3 text-indigo-400" />
                  Sensor:
                </span>
                <span className="font-semibold text-slate-100">Sentinel-1 SAR C-Band</span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-slate-400 flex items-center gap-1">
                  <Maximize2 className="w-3 h-3 text-blue-400" />
                  Origin Zone:
                </span>
                <span className="font-semibold text-amber-400">
                  {investigation.drift.origin.latitude.toFixed(3)}°N, {investigation.drift.origin.longitude.toFixed(3)}°E
                </span>
              </div>
            </div>

            <div className="p-3 bg-[#0d1424] border border-slate-800 rounded space-y-1.5 text-[11px]">
              <div className="font-bold text-slate-300 uppercase text-[10px] border-b border-slate-800 pb-1">
                PIPELINE EXECUTION
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Drift Simulation:</span>
                <span className="text-emerald-400 font-bold">OpenDrift Synchronized</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>AIS Correlation:</span>
                <span className="text-emerald-400 font-bold">17 Evaluated $\to$ {investigation.vessels.length} Filtered</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Execution Time:</span>
                <span className="text-cyan-400 font-bold">
                  {investigation.pipeline_duration_seconds ? `${investigation.pipeline_duration_seconds.toFixed(2)}s` : '1.4s'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* CENTER PANEL (Col 4-8): Large Interactive Maritime Map */}
        <div className="lg:col-span-5 relative bg-[#070c16] flex flex-col overflow-hidden">
          <div className="flex-1 relative">
            <MaritimeMap />
            <MapLayerControls />
            <MapLegend />
          </div>
        </div>

        {/* RIGHT PANEL (Col 9-12): Suspect Ranking & Evidence */}
        <div className="lg:col-span-4 bg-[#080d18] border-l border-slate-800 p-4 space-y-4 overflow-y-auto">
          <VesselDetailPanel />
          <VesselRankList />
        </div>
      </div>
    </div>
  );
};
