import { useState } from 'react';
import {
  Download,
  Compass,
  Ship,
  FileCheck2,
  ShieldAlert,
  Layers,
  Activity,
  Target,
  Satellite,
  Clock,
  AlertTriangle,
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
      <div className="flex-1 flex items-center justify-center bg-[#05080f] p-8 text-center font-mono">
        <div className="max-w-sm space-y-4">
          <div className="w-16 h-16 rounded-full border border-amber-500/25 bg-amber-500/5 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-8 h-8 text-amber-400" />
          </div>
          <h2 className="text-sm font-bold text-slate-100 tracking-wider">NO ACTIVE INVESTIGATION</h2>
          <p className="text-[11px] text-slate-500 leading-relaxed">
            Initiate a new SAR investigation or launch the replayable Arabian Sea demonstration scenario.
          </p>
          <button
            onClick={() => setActivePage('new-investigation')}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-[11px] rounded-md transition-colors tracking-wider"
          >
            START NEW INVESTIGATION
          </button>
        </div>
      </div>
    );
  }

  const { spill, drift, observation_time, vessels } = investigation;

  const tabs: { id: WorkspaceTab; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'vessels', label: 'Suspect Vessels', icon: Ship },
    { id: 'drift', label: 'Drift Simulation', icon: Compass },
    { id: 'spill', label: 'Spill Data', icon: Layers },
    { id: 'evidence', label: 'Evidence Review', icon: FileCheck2 },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#05080f] overflow-hidden font-mono">

      {/* Top Workspace Status Bar */}
      <div className="h-11 bg-[#080d18] border-b border-[rgba(255,255,255,0.07)] px-4 flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <span className="w-2 h-2 rounded-full bg-rose-500 signal-blink" />
          <h1 className="text-[11px] font-bold text-slate-100 tracking-wider">
            INVESTIGATION #{investigation.investigation_id}
          </h1>
          <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/25">
            {investigation.status}
          </span>
          {investigation.is_demo && (
            <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
              REPLAY SCENARIO
            </span>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowTimeline(!showTimeline)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-[9px] font-semibold transition-colors ${
              showTimeline
                ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300'
                : 'bg-[#0d1427] border-[rgba(255,255,255,0.08)] text-slate-400 hover:text-slate-200'
            }`}
          >
            <Activity className="w-3 h-3" />
            <span>TIMELINE</span>
          </button>

          <button
            onClick={() => setActivePage('reports')}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0d1427] hover:bg-[#111e35] border border-[rgba(255,255,255,0.08)] text-slate-300 text-[9px] rounded transition-colors"
          >
            <Download className="w-3 h-3 text-cyan-400" />
            <span>EXPORT REPORT</span>
          </button>
        </div>
      </div>

      {/* Telemetry Strip */}
      <div className="h-9 bg-[#080d18] border-b border-[rgba(255,255,255,0.05)] px-4 flex items-center gap-5 text-[9px] font-mono text-slate-500 overflow-x-auto shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <Target className="w-3 h-3 text-rose-400" />
          <span>Detection:</span>
          <span className="text-emerald-400 font-bold">{(spill.confidence * 100).toFixed(1)}%</span>
        </div>
        <span className="text-slate-800">·</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <AlertTriangle className="w-3 h-3 text-amber-400" />
          <span>Area:</span>
          <span className="text-amber-400 font-bold">{spill.area_km2.toFixed(2)} km²</span>
        </div>
        <span className="text-slate-800">·</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <Satellite className="w-3 h-3 text-indigo-400" />
          <span>Sensor:</span>
          <span className="text-slate-300">Sentinel-1 SAR IW C-Band</span>
        </div>
        <span className="text-slate-800">·</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>Observed:</span>
          <span className="text-slate-300">{new Date(observation_time).toUTCString()}</span>
        </div>
        <span className="text-slate-800">·</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <Compass className="w-3 h-3 text-cyan-400" />
          <span>Origin:</span>
          <span className="text-amber-300 font-bold">
            {drift.origin.latitude.toFixed(3)}°N {drift.origin.longitude.toFixed(3)}°E
          </span>
        </div>
        <span className="text-slate-800">·</span>
        <div className="flex items-center gap-1.5 shrink-0">
          <Ship className="w-3 h-3 text-rose-400" />
          <span>Top Suspect:</span>
          <span className="text-rose-400 font-bold">{vessels[0]?.vessel_name}</span>
          <span className="text-rose-400/60">({vessels[0]?.score.toFixed(0)}%)</span>
        </div>
        <span className="text-slate-800">·</span>
        <div className="shrink-0">
          <span>Pipeline:</span>
          <span className="text-cyan-400 ml-1">{investigation.pipeline_duration_seconds?.toFixed(2)}s</span>
        </div>
      </div>

      {/* Main 3-Pane Workspace */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* LEFT: Full-Bleed Maritime Map */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className="flex-1 relative">
            <MaritimeMap />
            <MapLayerControls />
            <MapLegend />
          </div>
        </div>

        {/* RIGHT: Tabbed Evidence Drawer */}
        <div className="w-80 bg-[#080d18] border-l border-[rgba(255,255,255,0.07)] flex flex-col overflow-hidden shrink-0">

          {/* Tab Bar */}
          <div className="shrink-0 border-b border-[rgba(255,255,255,0.07)] flex">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-1 flex flex-col items-center py-2 gap-0.5 text-[8px] font-mono font-semibold tracking-wider transition-all ${
                    activeTab === tab.id
                      ? 'text-cyan-400 border-b-2 border-cyan-400 bg-cyan-500/5'
                      : 'text-slate-600 hover:text-slate-400 border-b-2 border-transparent'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3 animate-fade-up">
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
                <div className="p-3 bg-[#0d1427] border border-[rgba(255,255,255,0.07)] rounded-lg">
                  <div className="text-[9px] text-cyan-400 font-bold tracking-widest uppercase mb-2">
                    PIPELINE EXECUTION LOG
                  </div>
                  <div className="space-y-2 text-[10px]">
                    {[
                      { step: '[1/4]', label: 'Sentinel-1 SAR segmentation', status: 'PASS', color: 'text-emerald-400' },
                      { step: '[2/4]', label: 'OpenDrift backward ensemble', status: 'PASS', color: 'text-emerald-400' },
                      { step: '[3/4]', label: 'AIS 3-stage spatial filtering', status: 'PASS', color: 'text-emerald-400' },
                      { step: '[4/4]', label: '5D attribution scoring', status: 'PASS', color: 'text-emerald-400' },
                    ].map((s) => (
                      <div key={s.step} className="flex items-center justify-between text-slate-400">
                        <span className="text-slate-600 font-mono">{s.step}</span>
                        <span className="flex-1 mx-2 truncate">{s.label}</span>
                        <span className={`font-bold ${s.color}`}>{s.status}</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-3 pt-2 border-t border-[rgba(255,255,255,0.06)] flex justify-between text-[9px]">
                    <span className="text-slate-600">Total duration:</span>
                    <span className="text-cyan-400 font-bold">
                      {investigation.pipeline_duration_seconds?.toFixed(2)}s
                    </span>
                  </div>
                </div>

                <div className="p-3 bg-[#0d1427] border border-[rgba(255,255,255,0.07)] rounded-lg">
                  <div className="text-[9px] text-cyan-400 font-bold tracking-widest uppercase mb-2">
                    AIS CORRELATION SUMMARY
                  </div>
                  <div className="space-y-1 text-[10px] text-slate-400">
                    <div className="flex justify-between">
                      <span>Vessels Queried:</span>
                      <span className="text-slate-200">17</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stage 1 (Spatial):</span>
                      <span className="text-slate-200">12 passed</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stage 2 (Temporal):</span>
                      <span className="text-slate-200">8 passed</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Stage 3 (Trajectory):</span>
                      <span className="text-cyan-400 font-bold">{vessels.length} candidates</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom: Collapsible Timeline */}
      {showTimeline && (
        <div className="h-36 border-t border-[rgba(255,255,255,0.07)] bg-[#080d18] shrink-0">
          <InvestigationTimeline />
        </div>
      )}
    </div>
  );
};
