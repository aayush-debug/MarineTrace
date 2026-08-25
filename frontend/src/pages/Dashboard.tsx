import React from 'react';
import {
  AlertTriangle,
  Satellite,
  Compass,
  Ship,
  PlusCircle,
  Play,
  Activity,
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import { MaritimeMap } from '../components/map/MaritimeMap';
import { MapLayerControls } from '../components/map/MapLayerControls';
import { MapLegend } from '../components/map/MapLegend';
import { SpillInfoPanel } from '../components/spill/SpillInfoPanel';
import { VesselRankList } from '../components/vessel/VesselRankList';

export const Dashboard: React.FC = () => {
  const {
    investigationList,
    setActivePage,
    executeDemo,
    loading,
  } = useInvestigation();

  // Executive KPI summary stats
  const activeCount = investigationList.length > 0 ? investigationList.length : 1;
  const totalSpills = 37;
  const monitoredArea = '4,280';
  const vesselsAnalyzed = 1284;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#060a12] overflow-y-auto font-mono">
      {/* Executive Header Banner */}
      <div className="p-4 bg-[#0a0f1d] border-b border-slate-800/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
            <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-wider">
              MARINE POLLUTION INTELLIGENCE
            </h1>
            <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/30 font-semibold">
              LIVE SURVEILLANCE
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Detect. Trace. Attribute. — Satellite SAR & Historical AIS Attribution Engine
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setActivePage('new-investigation')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md shadow-cyan-900/40 transition-colors"
          >
            <PlusCircle className="w-4 h-4" />
            <span>NEW INVESTIGATION</span>
          </button>

          <button
            onClick={executeDemo}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
          >
            <Play className="w-3.5 h-3.5 text-cyan-400" />
            <span>LOAD DEMO INCIDENT</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="p-4 grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="p-3 bg-[#0d1424] border border-slate-800/80 rounded-lg shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>ACTIVE INVESTIGATIONS</span>
            <Activity className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-slate-100 mt-1">{activeCount}</div>
          <div className="text-[10px] text-emerald-400 mt-1 flex items-center gap-1">
            <span>● 1 High Priority (Arabian Sea)</span>
          </div>
        </div>

        <div className="p-3 bg-[#0d1424] border border-slate-800/80 rounded-lg shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>SPILLS DETECTED</span>
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          </div>
          <div className="text-2xl font-bold text-rose-400 mt-1">{totalSpills}</div>
          <div className="text-[10px] text-slate-400 mt-1">
            Sentinel-1 SAR C-Band verified
          </div>
        </div>

        <div className="p-3 bg-[#0d1424] border border-slate-800/80 rounded-lg shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>AREA MONITORED</span>
            <Satellite className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold text-amber-300 mt-1">{monitoredArea} km²</div>
          <div className="text-[10px] text-slate-400 mt-1">
            Indian Exclusive Economic Zone (EEZ)
          </div>
        </div>

        <div className="p-3 bg-[#0d1424] border border-slate-800/80 rounded-lg shadow">
          <div className="flex items-center justify-between text-slate-400 text-xs">
            <span>VESSELS ANALYZED</span>
            <Ship className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-indigo-300 mt-1">{vesselsAnalyzed}</div>
          <div className="text-[10px] text-slate-400 mt-1">
            AIS Spatio-Temporal Correlated
          </div>
        </div>
      </div>

      {/* Main Dashboard Workspace: Map + Lateral Panels */}
      <div className="p-4 pt-0 grid grid-cols-1 xl:grid-cols-3 gap-4 flex-1 min-h-[550px]">
        {/* Center/Left: Large Interactive Maritime Map (2 Cols on XL) */}
        <div className="xl:col-span-2 relative rounded-lg overflow-hidden border border-slate-800 shadow-2xl min-h-[480px] flex flex-col">
          <div className="bg-[#0b101f] px-3 py-2 border-b border-slate-800 flex items-center justify-between z-10 text-xs font-mono">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-slate-200">
                MARITIME SITUATION MAP — SECTOR WEST (MUMBAI/GUJARAT EEZ)
              </span>
            </div>
            <div className="flex items-center gap-2 text-[11px] text-slate-400">
              <span>Projection: EPSG:4326</span>
            </div>
          </div>

          <div className="flex-1 relative">
            <MaritimeMap />
            <MapLayerControls />
            <MapLegend />
          </div>
        </div>

        {/* Right Lateral Panel: Spill Info & Suspect Vessels */}
        <div className="space-y-4 flex flex-col">
          <SpillInfoPanel />
          <div className="flex-1 overflow-y-auto">
            <VesselRankList />
          </div>
        </div>
      </div>
    </div>
  );
};
