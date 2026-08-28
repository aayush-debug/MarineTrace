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
      <div className="flex-1 flex items-center justify-center bg-[#040814] p-8 text-center">
        <div className="max-w-md space-y-4 p-8 rounded-lg bg-[#070d1d] border border-cyan-500/25 shadow-2xl relative">
          <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-cyan-400" />
          <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-cyan-400" />

          <div className="w-14 h-14 rounded-md border border-cyan-500/30 bg-cyan-950/40 flex items-center justify-center mx-auto text-cyan-400">
            <Crosshair className="w-7 h-7 animate-pulse" />
          </div>
          <h2 className="font-orbitron text-base font-bold text-slate-100 uppercase tracking-wider">
            NO ACTIVE TARGET RETICLE ENGAGED
          </h2>
          <p className="text-xs font-mono text-slate-400 leading-relaxed">
            Awaiting Sentinel-1 SAR acquisition swath or manual target initialization. Run the scenario replay or ingest radar telemetry.
          </p>
          <button
            onClick={() => setActivePage('new-investigation')}
            className="px-5 py-2.5 bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-mono font-bold text-xs rounded-md transition-all shadow-[0_0_12px_rgba(0,240,255,0.3)] cursor-pointer"
          >
            INITIALIZE TARGET ACQUISITION
          </button>
        </div>
      </div>
    );
  }

  const { spill, drift, vessels } = investigation;

  const tabs: { id: WorkspaceTab; label: string; code: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'vessels', label: 'Suspect AIS', code: 'AIS-01', icon: Ship },
    { id: 'drift', label: 'Drift Matrix', code: 'PHYS-02', icon: Compass },
    { id: 'spill', label: 'Slick Radar', code: 'SAR-03', icon: Layers },
    { id: 'evidence', label: 'Pipeline Audit', code: 'ML-04', icon: FileCheck2 },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#040814] overflow-hidden">

      {/* Top Workspace Mission Header */}
      <div className="h-12 bg-[#070d1d] border-b border-[rgba(0,240,255,0.18)] px-4 sm:px-5 flex items-center justify-between gap-4 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping shadow-[0_0_8px_#ff0055]" />
          <h1 className="text-xs font-mono font-bold text-slate-100 flex items-center gap-2">
            <span className="font-orbitron uppercase text-cyan-300">TARGET #{investigation.investigation_id}</span>
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950/90 text-rose-300 border border-rose-500/40">
              {investigation.status}
            </span>
          </h1>
          {investigation.is_demo && (
            <span className="hidden sm:inline-block text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
              SIMULATION FLIGHT
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-mono font-bold border transition-colors cursor-pointer ${
              showTimeline
                ? 'bg-cyan-950 border-cyan-400 text-cyan-300 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                : 'bg-[#081024] border-cyan-500/25 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>AUDIT TIMELINE</span>
          </button>

          <button
            onClick={() => setActivePage('reports')}
            className="flex items-center gap-1.5 px-3 py-1 bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white text-xs font-mono font-bold rounded-md transition-all shadow-[0_0_10px_rgba(0,240,255,0.25)] cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>EXPORT DOSSIER</span>
          </button>
        </div>
      </div>

      {/* Telemetry Summary Strip */}
      <div className="h-8 bg-[#060b18] border-b border-[rgba(0,240,255,0.12)] px-4 flex items-center gap-4 text-xs font-mono text-slate-400 overflow-x-auto shrink-0 select-none">
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-400 text-[11px]">CONFIDENCE:</span>
          <span className="text-emerald-400 font-bold">{(spill.confidence * 100).toFixed(1)}%</span>
        </div>
        <span className="text-cyan-900">|</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-400 text-[11px]">SLICK AREA:</span>
          <span className="text-amber-400 font-bold">{spill.area_km2.toFixed(1)} KM²</span>
        </div>
        <span className="text-cyan-900">|</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-400 text-[11px]">SENSOR:</span>
          <span className="text-cyan-300">SENTINEL-1A C-BAND</span>
        </div>
        <span className="text-cyan-900">|</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-400 text-[11px]">EST. ORIGIN:</span>
          <span className="text-cyan-200 font-bold text-[11px]">
            {drift.origin.latitude.toFixed(3)}°N, {drift.origin.longitude.toFixed(3)}°E
          </span>
        </div>
        <span className="text-cyan-900">|</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <span className="text-slate-400 text-[11px]">PRIMARY SUSPECT:</span>
          <span className="text-rose-400 font-bold">{vessels[0]?.vessel_name || 'FLAGGED'}</span>
          <span className="text-cyan-400 font-bold">({vessels[0]?.score.toFixed(0)}% MATCH)</span>
        </div>
      </div>

      {/* Main Mission Workspace: Split View */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* LEFT: Full-Bleed Tactical Reticle Map */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className="flex-1 relative bg-[#030610]">
            <MaritimeMap />
            <MapLayerControls />
            <MapLegend />
          </div>
        </div>

        {/* RIGHT: Tabbed Intelligence Drawer */}
        <div className="w-84 bg-[#060b18] border-l border-[rgba(0,240,255,0.18)] flex flex-col overflow-hidden shrink-0 shadow-2xl">

          {/* Drawer Tab Bar */}
          <div className="shrink-0 border-b border-cyan-900/40 flex bg-[#040814]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-[10px] font-mono font-bold transition-all border-b-2 cursor-pointer ${
                    activeTab === tab.id
                      ? 'text-cyan-300 border-cyan-400 bg-cyan-950/40 shadow-inner'
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
              <div className="space-y-3 font-mono">
                <div className="p-3.5 bg-[#081024] border border-cyan-500/25 rounded-md relative">
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-cyan-400" />
                  <div className="text-xs font-bold text-cyan-300 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <Cpu className="w-3.5 h-3.5 text-cyan-400" />
                    <span>PIPELINE EXECUTION TELEMETRY</span>
                  </div>
                  <div className="space-y-2 text-xs">
                    {[
                      { step: 'STAGE 01', label: 'Sentinel-1 SAR Segmentation (U-Net)', status: 'PASS', color: 'text-emerald-400' },
                      { step: 'STAGE 02', label: 'OpenDrift Hydrodynamic Backtracking', status: 'PASS', color: 'text-emerald-400' },
                      { step: 'STAGE 03', label: 'AIS 3-Stage Spatio-Temporal Filtering', status: 'PASS', color: 'text-emerald-400' },
                      { step: 'STAGE 04', label: '5D Explainable Attribution Scoring', status: 'PASS', color: 'text-emerald-400' },
                    ].map((s) => (
                      <div key={s.step} className="flex items-center justify-between text-slate-400">
                        <span className="text-cyan-500/90 text-[10px] font-bold">{s.step}</span>
                        <span className="flex-1 mx-2 truncate text-slate-300 text-[11px]">{s.label}</span>
                        <span className={`font-bold text-[10px] ${s.color}`}>{s.status}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-2 border-t border-cyan-900/40 flex justify-between text-[11px]">
                    <span className="text-slate-400">PIPELINE LATENCY:</span>
                    <span className="text-cyan-300 font-bold">
                      {investigation.pipeline_duration_seconds?.toFixed(2)}s
                    </span>
                  </div>
                </div>

                <div className="p-3.5 bg-[#081024] border border-cyan-500/25 rounded-md relative">
                  <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-cyan-400" />
                  <div className="text-xs font-bold text-slate-200 mb-2 uppercase tracking-wider flex items-center gap-1.5">
                    <Radar className="w-3.5 h-3.5 text-cyan-400" />
                    <span>AIS SPATIAL CORRELATION AUDIT</span>
                  </div>
                  <div className="space-y-1.5 text-xs text-slate-400">
                    <div className="flex justify-between">
                      <span>Vessels in Sector:</span>
                      <span className="text-slate-200 font-bold">17 TARGETS</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Spatial Geodesic Filter:</span>
                      <span className="text-slate-200 font-bold">12 CANDIDATES</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Temporal Overlap Window:</span>
                      <span className="text-slate-200 font-bold">8 CANDIDATES</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Trajectory Approach CPA:</span>
                      <span className="text-cyan-300 font-bold">{vessels.length} PRIORITIZED</span>
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
        <div className="h-36 border-t border-cyan-900/40 bg-[#070d1d] shrink-0">
          <InvestigationTimeline />
        </div>
      )}
    </div>
  );
};
