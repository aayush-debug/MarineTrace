import React from 'react';
import { Ship, Cpu } from 'lucide-react';
import { VesselRankList } from '../components/vessel/VesselRankList';
import { VesselDetailPanel } from '../components/vessel/VesselDetailPanel';
import { MaritimeMap } from '../components/map/MaritimeMap';
import { MapLayerControls } from '../components/map/MapLayerControls';
import { MapLegend } from '../components/map/MapLegend';

export const VesselAttribution: React.FC = () => {

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#060a12] overflow-y-auto font-mono p-4 sm:p-6 space-y-4">
      {/* Title */}
      <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Ship className="w-5 h-5 text-cyan-400" />
            <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-wide">
              VESSEL ATTRIBUTION & SUSPECT PRIORITIZATION
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Historical AIS correlation with estimated spill origin — Explainable 5-feature investigative scoring model.
          </p>
        </div>
      </div>

      {/* Main Grid: Left Ranked List | Center Map | Right Vessel Detail & Evidence */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1 min-h-[600px]">
        {/* Left Column: Ranked Candidates (4 Cols) */}
        <div className="xl:col-span-4 space-y-4 overflow-y-auto">
          <VesselRankList />

          <div className="p-3.5 bg-[#0d1424] border border-slate-800 rounded-lg text-xs space-y-2 text-slate-300">
            <div className="font-bold text-cyan-400 uppercase text-[10px] flex items-center gap-1.5">
              <Cpu className="w-3.5 h-3.5" />
              <span>SCORING WEIGHT DISTRIBUTION</span>
            </div>
            <div className="space-y-1 text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>Spatial Geodesic Proximity:</span>
                <span className="text-slate-200 font-bold">30%</span>
              </div>
              <div className="flex justify-between">
                <span>Temporal Window Overlap:</span>
                <span className="text-slate-200 font-bold">25%</span>
              </div>
              <div className="flex justify-between">
                <span>Trajectory Closest Approach:</span>
                <span className="text-slate-200 font-bold">20%</span>
              </div>
              <div className="flex justify-between">
                <span>Behavioral / Speed Anomaly:</span>
                <span className="text-slate-200 font-bold">15%</span>
              </div>
              <div className="flex justify-between">
                <span>Vessel Type Risk Profile:</span>
                <span className="text-slate-200 font-bold">10%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Center Column: Map & Track Overlays (4 Cols) */}
        <div className="xl:col-span-4 relative rounded-lg overflow-hidden border border-slate-800 shadow-2xl min-h-[480px] flex flex-col">
          <div className="bg-[#0b101f] px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-slate-200">AIS TRACK CORRELATION VIEW</span>
            <span className="text-cyan-400 text-[11px]">3-Stage Filtered</span>
          </div>

          <div className="flex-1 relative">
            <MaritimeMap />
            <MapLayerControls />
            <MapLegend />
          </div>
        </div>

        {/* Right Column: Detailed Evidence & Radar Profile (4 Cols) */}
        <div className="xl:col-span-4 space-y-4 overflow-y-auto">
          <VesselDetailPanel />
        </div>
      </div>
    </div>
  );
};
