import { useState } from 'react';
import {
  Download,
  Compass,
  Ship,
  FileCheck2,
  Layers,
  Activity,
  Crosshair,
  Cpu,
  Radar,
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import { MaritimeMap } from '../components/map/MaritimeMap';
import { MapLayerControls } from '../components/map/MapLayerControls';
import { MapLegend } from '../components/map/MapLegend';
import { VesselRankList } from '../components/vessel/VesselRankList';
import { VesselDetailPanel } from '../components/vessel/VesselDetailPanel';
import { SpillInfoPanel } from '../components/spill/SpillInfoPanel';
import { DriftPhysicsCard } from '../components/drift/DriftPhysicsCard';
import { EnvironmentalConditionsCard } from '../components/drift/EnvironmentalConditionsCard';
import { InvestigationTimeline } from '../components/timeline/InvestigationTimeline';

type WorkspaceTab = 'vessels' | 'drift' | 'spill' | 'evidence';

export const Investigation: React.FC = () => {
  const { investigation, setActivePage } = useInvestigation();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('vessels');
  const [showTimeline, setShowTimeline] = useState(false);

  if (!investigation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0c1017] p-8 text-center">
        <div className="max-w-md space-y-4 p-8 rounded bg-[#111622] border border-[#1e293b] shadow-xl">
          <div className="w-12 h-12 rounded bg-[#161e2e] border border-slate-800 flex items-center justify-center mx-auto text-blue-400">
            <Crosshair className="w-6 h-6" />
          </div>
          <h2 className="text-base font-semibold text-slate-100">
            No Active Investigation Loaded
          </h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Please initialize a target by running the demo scenario or ingesting a new Sentinel-1 SAR acquisition.
          </p>
          <button
            onClick={() => setActivePage('new-investigation')}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs rounded transition-colors shadow-sm cursor-pointer"
          >
            Launch Investigation
          </button>
        </div>
      </div>
    );
  }

  const { spill, drift, vessels } = investigation;

  const tabs: { id: WorkspaceTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'vessels', label: 'Suspect AIS', icon: Ship },
    { id: 'drift', label: 'Drift Matrix', icon: Compass },
    { id: 'spill', label: 'Slick Radar', icon: Layers },
    { id: 'evidence', label: 'Audit Log', icon: FileCheck2 },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0c1017] overflow-hidden">

      {/* Top Workspace Header */}
      <div className="h-12 bg-[#111622] border-b border-[#1e293b] px-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-rose-500" />
          <h1 className="text-xs font-semibold text-slate-100 flex items-center gap-2">
            <span>Case #{investigation.investigation_id}</span>
            <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/60">
              {investigation.status}
            </span>
          </h1>
          {investigation.is_demo && (
            <span className="hidden sm:inline-block text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60">
              Simulation Preset
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium border transition-colors cursor-pointer ${showTimeline
                ? 'bg-blue-950 border-blue-800 text-blue-300'
                : 'bg-[#161e2e] border-[#1e293b] text-slate-400 hover:text-slate-200'
              }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Audit Timeline</span>
          </button>

          <button
            onClick={() => setActivePage('reports')}
            className="flex items-center gap-1.5 px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded transition-colors shadow-sm cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Incident Dossier</span>
          </button>
        </div>
      </div>

      {/* Telemetry Summary Strip */}
      <div className="h-8 bg-[#0e131d] border-b border-[#1e293b] px-4 flex items-center gap-4 text-xs font-mono text-slate-400 overflow-x-auto shrink-0 select-none">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-500 text-[11px]">CONFIDENCE:</span>
          <span className="text-emerald-400 font-semibold tabular-nums">{(spill.confidence * 100).toFixed(1)}%</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-500 text-[11px]">SLICK AREA:</span>
          <span className="text-slate-200 font-semibold tabular-nums">{spill.area_km2.toFixed(1)} km²</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-500 text-[11px]">SENSOR:</span>
          <span className="text-slate-300">Sentinel-1A C-Band</span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-500 text-[11px]">EST. ORIGIN:</span>
          <span className="text-slate-200 font-semibold tabular-nums">
            {drift.origin.latitude.toFixed(3)}°N, {drift.origin.longitude.toFixed(3)}°E
          </span>
        </div>
        <span className="text-slate-700">|</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-500 text-[11px]">PRIMARY SUSPECT:</span>
          <span className="text-rose-400 font-semibold">{vessels[0]?.vessel_name || 'Flagged'}</span>
          <span className="text-slate-400 font-medium">({vessels[0]?.score.toFixed(0)}% Score)</span>
        </div>
      </div>

      {/* Main Mission Workspace: Split View */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* LEFT: GIS Map */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className="flex-1 relative bg-[#0b0f17]">
            <MaritimeMap />
            <MapLayerControls />
            <MapLegend />
          </div>
        </div>

        {/* RIGHT: Analytical Forensics Drawer */}
        <div className="w-80 bg-[#111622] border-l border-[#1e293b] flex flex-col overflow-hidden shrink-0 shadow-lg">

          {/* Drawer Tab Bar */}
          <div className="shrink-0 border-b border-[#1e293b] flex bg-[#0c1017]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center py-2 gap-1 text-[11px] font-medium transition-colors border-b-2 cursor-pointer ${activeTab === tab.id
                      ? 'text-slate-100 font-semibold border-blue-500 bg-[#111622]'
                      : 'text-slate-400 hover:text-slate-200 border-transparent'
                    }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span className="truncate">{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Drawer Tab Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {activeTab === 'vessels' && (
              <>
                <VesselDetailPanel />
                <VesselRankList />
              </>
            )}

            {activeTab === 'drift' && (
              <>
                <DriftPhysicsCard />
                <EnvironmentalConditionsCard />
              </>
            )}

            {activeTab === 'spill' && (
              <SpillInfoPanel />
            )}

            {activeTab === 'evidence' && (
              <div className="space-y-3 font-sans">
                <div className="p-3.5 bg-[#161e2e] border border-slate-800 rounded">
                  <div className="text-xs font-semibold text-slate-200 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-blue-400" />
                    <span>Pipeline Execution Telemetry</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {[
                      { step: 'Stage 1', label: 'Sentinel-1 SAR U-Net Segmentation', status: 'Passed', color: 'text-emerald-400' },
                      { step: 'Stage 2', label: 'OpenDrift Hydrodynamic Hindcast', status: 'Passed', color: 'text-emerald-400' },
                      { step: 'Stage 3', label: 'AIS Spatio-Temporal Filtering', status: 'Passed', color: 'text-emerald-400' },
                      { step: 'Stage 4', label: '5D Explainable Attribution', status: 'Passed', color: 'text-emerald-400' },
                    ].map((s) => (
                      <div key={s.step} className="flex items-center justify-between text-slate-400">
                        <span className="text-slate-500 font-mono text-[10px]">{s.step}</span>
                        <span className="flex-1 mx-2 truncate text-slate-300 text-[11px]">{s.label}</span>
                        <span className={`font-medium text-[11px] ${s.color}`}>{s.status}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between text-[11px] font-mono">
                    <span className="text-slate-500">Pipeline Latency:</span>
                    <span className="text-slate-200 font-medium">
                      {investigation.pipeline_duration_seconds?.toFixed(2)}s
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#161e2e] border border-slate-800 rounded">
                  <div className="text-xs font-semibold text-slate-200 mb-2 uppercase tracking-wide flex items-center gap-1.5">
                    <Radar className="w-3.5 h-3.5 text-blue-400" />
                    <span>AIS Correlation Summary</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-400 font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Total Tracked:</span>
                      <span className="text-slate-200 font-medium">17 Vessels</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Spatial Filter:</span>
                      <span className="text-slate-200 font-medium">12 Candidates</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">Temporal Window:</span>
                      <span className="text-slate-200 font-medium">8 Candidates</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">CPA Prioritized:</span>
                      <span className="text-blue-400 font-semibold">{vessels.length} Ranked</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Collapsible Audit Timeline */}
      {showTimeline && (
        <div className="h-36 border-t border-[#1e293b] bg-[#111622] shrink-0">
          <InvestigationTimeline />
        </div>
      )}
    </div>
  );
};
