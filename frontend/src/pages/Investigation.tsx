import { useState } from 'react';
import {
  Download,
  Compass,
  Ship,
  FileCheck2,
  ShieldAlert,
  Layers,
  Activity,
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import { MaritimeMap } from '../components/map/MaritimeMap';
import { MapLayerControls } from '../components/map/MapLayerControls';
import { MapLegend } from '../components/map/MapLegend';
import { VesselRankList } from '../components/vessel/VesselRankList';
import { VesselDetailPanel } from '../components/vessel/VesselDetailPanel';
import { SpillInfoPanel } from '../components/spill/SpillInfoPanel';
import { DriftTimelineControl } from '../components/drift/DriftTimelineControl';
import { EnvironmentalConditionsCard } from '../components/drift/EnvironmentalConditionsCard';
import { InvestigationTimeline } from '../components/timeline/InvestigationTimeline';

type WorkspaceTab = 'vessels' | 'drift' | 'spill' | 'evidence';

export const Investigation: React.FC = () => {
  const { investigation, setActivePage } = useInvestigation();
  const [activeTab, setActiveTab] = useState<WorkspaceTab>('vessels');
  const [showTimeline, setShowTimeline] = useState(false);

  if (!investigation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#090d16] p-8 text-center">
        <div className="max-w-sm space-y-4">
          <div className="w-14 h-14 rounded-full border border-amber-500/25 bg-amber-500/10 flex items-center justify-center mx-auto text-amber-400">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="text-base font-semibold text-slate-100">No Active Case Loaded</h2>
          <p className="text-xs text-slate-400 leading-relaxed">
            Ingest satellite SAR imagery or launch the replayable Arabian Sea demonstration scenario to start investigation.
          </p>
          <button
            onClick={() => setActivePage('new-investigation')}
            className="px-4 py-2 bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs rounded-lg transition-colors shadow-sm"
          >
            Start New Investigation
          </button>
        </div>
      </div>
    );
  }

  const { spill, drift, vessels } = investigation;

  const tabs: { id: WorkspaceTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'vessels', label: 'Suspect Vessels', icon: Ship },
    { id: 'drift', label: 'Drift Physics', icon: Compass },
    { id: 'spill', label: 'Slick Profile', icon: Layers },
    { id: 'evidence', label: 'Pipeline Audit', icon: FileCheck2 },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#090d16] overflow-hidden">

      {/* Top Workspace Header */}
      <div className="h-12 bg-[#0c121e] border-b border-[rgba(255,255,255,0.08)] px-4 sm:px-5 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-rose-500" />
          <h1 className="text-xs font-semibold text-slate-100 flex items-center gap-2">
            <span>Case #{investigation.investigation_id}</span>
            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
              {investigation.status}
            </span>
          </h1>
          {investigation.is_demo && (
            <span className="hidden sm:inline-block text-[10px] font-medium px-2 py-0.5 rounded-full bg-sky-500/10 text-sky-300 border border-sky-500/20">
              Scenario Replay
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border transition-colors ${
              showTimeline
                ? 'bg-sky-500/15 border-sky-500/30 text-sky-300'
                : 'bg-slate-900 border-slate-700/80 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Audit Timeline</span>
          </button>

          <button
            onClick={() => setActivePage('reports')}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-200 text-xs font-medium rounded-md transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export Dossier</span>
          </button>
        </div>
      </div>

      {/* Telemetry Summary Strip */}
      <div className="h-8 bg-[#0c121e]/60 border-b border-[rgba(255,255,255,0.06)] px-4 flex items-center gap-4 text-xs text-slate-400 overflow-x-auto shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-400">Confidence:</span>
          <span className="text-emerald-400 font-semibold font-mono">{(spill.confidence * 100).toFixed(1)}%</span>
        </div>
        <span className="text-slate-700">·</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-400">Area:</span>
          <span className="text-amber-400 font-semibold font-mono">{spill.area_km2.toFixed(1)} km²</span>
        </div>
        <span className="text-slate-700">·</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-400">Sensor:</span>
          <span className="text-slate-300">Sentinel-1 C-Band</span>
        </div>
        <span className="text-slate-700">·</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-400">Origin:</span>
          <span className="text-slate-200 font-mono text-[11px]">
            {drift.origin.latitude.toFixed(3)}°N, {drift.origin.longitude.toFixed(3)}°E
          </span>
        </div>
        <span className="text-slate-700">·</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-400">Top Suspect:</span>
          <span className="text-rose-400 font-medium">{vessels[0]?.vessel_name || 'Flagged'}</span>
          <span className="text-slate-500 font-mono">({vessels[0]?.score.toFixed(0)}%)</span>
        </div>
      </div>

      {/* Main Workspace: Split View */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* LEFT: Full-Bleed Situation Map */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className="flex-1 relative">
            <MaritimeMap />
            <MapLayerControls />
            <MapLegend />
          </div>
        </div>

        {/* RIGHT: Tabbed Intelligence Drawer */}
        <div className="w-80 bg-[#0c121e] border-l border-[rgba(255,255,255,0.08)] flex flex-col overflow-hidden shrink-0">

          {/* Drawer Tab Bar */}
          <div className="shrink-0 border-b border-slate-800 flex bg-[#0a0f19]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center py-2.5 gap-1 text-[11px] font-medium transition-all border-b-2 ${
                    activeTab === tab.id
                      ? 'text-sky-400 border-sky-500 bg-sky-500/5 font-semibold'
                      : 'text-slate-400 hover:text-slate-200 border-transparent'
                  }`}
                >
                  <Icon className="w-4 h-4" />
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
                <DriftTimelineControl />
                <EnvironmentalConditionsCard />
              </>
            )}

            {activeTab === 'spill' && (
              <SpillInfoPanel />
            )}

            {activeTab === 'evidence' && (
              <div className="space-y-3">
                <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl">
                  <div className="text-xs font-semibold text-sky-400 mb-2">
                    Multi-Stage Pipeline Execution
                  </div>
                  <div className="space-y-2 text-xs">
                    {[
                      { step: 'Stage 1', label: 'Sentinel-1 SAR Segmentation (U-Net)', status: 'PASS', color: 'text-emerald-400' },
                      { step: 'Stage 2', label: 'OpenDrift Hydrodynamic Backtracking', status: 'PASS', color: 'text-emerald-400' },
                      { step: 'Stage 3', label: 'AIS 3-Stage Spatio-Temporal Filtering', status: 'PASS', color: 'text-emerald-400' },
                      { step: 'Stage 4', label: '5D Explainable Attribution Scoring', status: 'PASS', color: 'text-emerald-400' },
                    ].map((s) => (
                      <div key={s.step} className="flex items-center justify-between text-slate-400">
                        <span className="text-slate-400 font-mono text-[11px]">{s.step}</span>
                        <span className="flex-1 mx-2 truncate text-slate-300">{s.label}</span>
                        <span className={`font-semibold ${s.color}`}>{s.status}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-2 border-t border-slate-800 flex justify-between text-[11px]">
                    <span className="text-slate-400">Pipeline Total Latency:</span>
                    <span className="text-sky-400 font-mono font-semibold">
                      {investigation.pipeline_duration_seconds?.toFixed(2)}s
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl">
                  <div className="text-xs font-semibold text-slate-200 mb-2">
                    AIS Correlation Audit
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Vessels in Sector:</span>
                      <span className="text-slate-200 font-mono">17 targets</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Spatial Geodesic Filter:</span>
                      <span className="text-slate-200 font-mono">12 candidates</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Temporal Overlap Window:</span>
                      <span className="text-slate-200 font-mono">8 candidates</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trajectory Approach CPA:</span>
                      <span className="text-sky-400 font-mono font-semibold">{vessels.length} prioritized</span>
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
        <div className="h-36 border-t border-slate-800 bg-[#0c121e] shrink-0">
          <InvestigationTimeline />
        </div>
      )}
    </div>
  );
};

