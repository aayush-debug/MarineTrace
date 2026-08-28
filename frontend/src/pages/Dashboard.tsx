import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Satellite,
  Ship,
  Plus,
  Play,
  Activity,
  ChevronRight,
  Clock,
  Radio,
  Crosshair,
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import { MaritimeMap } from '../components/map/MaritimeMap';
import { MapLayerControls } from '../components/map/MapLayerControls';
import { MapLegend } from '../components/map/MapLegend';
import { SpillInfoPanel } from '../components/spill/SpillInfoPanel';
import { VesselRankList } from '../components/vessel/VesselRankList';

const AnimatedCounter: React.FC<{ value: number | string; duration?: number }> = ({
  value,
  duration = 700,
}) => {
  const [display, setDisplay] = useState('0');

  useEffect(() => {
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/,/g, '')) : value;
    if (isNaN(numValue)) {
      setDisplay(String(value));
      return;
    }
    const start = Date.now();
    const tick = () => {
      const elapsed = Date.now() - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = Math.floor(eased * numValue);
      setDisplay(current.toLocaleString());
      if (progress < 1) requestAnimationFrame(tick);
      else setDisplay(typeof value === 'string' ? value : value.toLocaleString());
    };
    requestAnimationFrame(tick);
  }, [value, duration]);

  return <span>{display}</span>;
};

export const Dashboard: React.FC = () => {
  const {
    investigationList,
    setActivePage,
    executeDemo,
    loading,
    investigation,
    spcsftLiveDetections,
    spcsftSyncEnabled,
  } = useInvestigation();

  const activeCount = investigationList.length > 0 ? investigationList.length : 1;
  const totalSpills = 37;
  const monitoredArea = 4280;
  const vesselsAnalyzed = 1284;

  const [activeRightTab, setActiveRightTab] = useState<'spill' | 'vessels'>('spill');

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0c1017] overflow-hidden">

      {/* Operational Header Bar */}
      <div className="px-4 py-2.5 bg-[#111622] border-b border-[#1e293b] flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-semibold text-slate-100 tracking-tight">
                Maritime Situation Overview
              </h1>
              <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/60">
                {activeCount} Active Case{activeCount !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Sentinel-1A SAR Dual-Pol · Copernicus CMEMS Current Vectors · AIS Stream
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActivePage('new-investigation')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-sm transition-colors cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Investigation</span>
          </button>

          <button
            onClick={executeDemo}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#161e2e] hover:bg-[#1c2638] border border-[#1e293b] text-slate-200 text-xs font-medium transition-colors disabled:opacity-50 cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 text-blue-400 fill-blue-400" />
            <span>{loading ? 'Simulating...' : 'Demo Scenario'}</span>
          </button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="px-4 py-2.5 grid grid-cols-2 lg:grid-cols-4 gap-3 bg-[#0e131d] border-b border-[#1e293b] shrink-0">
        {[
          {
            label: 'Active Targets',
            value: activeCount,
            suffix: '',
            icon: Activity,
            badge: 'High Priority',
            badgeClass: 'bg-rose-950 text-rose-300 border-rose-800/60',
            sub: 'Arabian Sea Corridor',
          },
          {
            label: 'Confirmed Slicks',
            value: totalSpills,
            suffix: '',
            icon: AlertTriangle,
            badge: 'C-Band SAR',
            badgeClass: 'bg-amber-950 text-amber-300 border-amber-800/60',
            sub: 'Zenodo Model Verified',
          },
          {
            label: 'Surveillance Area',
            value: monitoredArea,
            suffix: ' km²',
            icon: Satellite,
            badge: '10m Res',
            badgeClass: 'bg-blue-950 text-blue-300 border-blue-800/60',
            sub: 'Sentinel-1 Swath',
          },
          {
            label: 'AIS Tracks Correlated',
            value: vesselsAnalyzed,
            suffix: '',
            icon: Ship,
            badge: 'Hydrodynamic',
            badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-800/60',
            sub: 'OpenDrift Lagrangian',
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="p-3 bg-[#111622] border border-[#1e293b] rounded hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span className="font-medium">{kpi.label}</span>
                <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded border font-medium ${kpi.badgeClass}`}>
                  {kpi.badge}
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <div className="text-xl font-bold font-mono text-slate-100 tabular-nums">
                  <AnimatedCounter value={kpi.value} />{kpi.suffix}
                </div>
                <Icon className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-[10px] text-slate-500 mt-1">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* SpaceShift Real-Time Radar Alert Bar */}
      <div className="px-4 py-2 bg-[#141a29] border-b border-[#1e293b] flex flex-wrap items-center justify-between gap-3 text-xs shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span className="font-medium text-slate-200 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-blue-400" />
            <span>SpaceShift Satellite AIS & SAR Stream:</span>
            <span className="font-mono text-slate-100 bg-[#1e293b] px-1.5 py-0.2 rounded font-semibold">
              {spcsftLiveDetections.length} Live Detections
            </span>
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline text-[11px]">
            Sync Status: {spcsftSyncEnabled ? 'Connected (Active Polling)' : 'Paused'}
          </span>
        </div>

        <button
          onClick={() => setActivePage('spcsft-realtime')}
          className="px-2.5 py-1 rounded bg-[#1c2638] hover:bg-[#233047] border border-slate-700 text-slate-200 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
        >
          <span>Open Ground Station</span>
          <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
        </button>
      </div>

      {/* Main Workspace Split */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* LEFT: GIS Map Viewport */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 relative">
          <div className="h-7 bg-[#111622] border-b border-[#1e293b] px-3 flex items-center justify-between text-xs text-slate-400 shrink-0">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Crosshair className="w-3.5 h-3.5 text-blue-400" />
              <span>Interactive Maritime GIS Workspace</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] font-mono text-slate-500">
              <span>EPSG:4326 (WGS 84)</span>
              <span>·</span>
              <span>10m Sentinel-1 SAR</span>
              <span>·</span>
              <span>CMEMS Vectors</span>
            </div>
          </div>

          <div className="flex-1 relative bg-[#0b0f17]">
            <MaritimeMap />
            <MapLayerControls />
            <MapLegend />
          </div>
        </div>

        {/* RIGHT: Analytical Forensics Panel */}
        <div className="w-80 bg-[#111622] border-l border-[#1e293b] flex flex-col overflow-hidden shrink-0">
          {/* Panel Tab Navigation */}
          <div className="flex border-b border-[#1e293b] bg-[#0c1017] shrink-0 text-xs">
            <button
              onClick={() => setActiveRightTab('spill')}
              className={`flex-1 py-2 font-medium transition-colors border-b-2 cursor-pointer ${
                activeRightTab === 'spill'
                  ? 'border-blue-500 text-white bg-[#111622]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Incident Target
            </button>
            <button
              onClick={() => setActiveRightTab('vessels')}
              className={`flex-1 py-2 font-medium transition-colors border-b-2 cursor-pointer ${
                activeRightTab === 'vessels'
                  ? 'border-blue-500 text-white bg-[#111622]'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Suspect Vessels ({investigation?.vessels.length || 0})
            </button>
          </div>

          {/* Tab Content */}
          <div className="flex-1 overflow-y-auto p-3 space-y-3">
            {activeRightTab === 'spill' && (
              <SpillInfoPanel />
            )}

            {activeRightTab === 'vessels' && (
              <VesselRankList />
            )}
          </div>

          {/* Recent Incident Cases */}
          <div className="border-t border-[#1e293b] p-3 bg-[#0c1017] shrink-0">
            <div className="flex items-center justify-between text-xs font-medium text-slate-400 mb-2">
              <span>Recent Case Log</span>
              <span className="text-[10px] text-slate-500 font-mono">Past 30 Days</span>
            </div>
            <div className="space-y-1.5">
              {investigationList.slice(0, 2).map((inv) => (
                <button
                  key={inv.investigation_id}
                  onClick={() => setActivePage('investigation')}
                  className="w-full flex items-center justify-between p-2 rounded bg-[#111622] hover:bg-[#161e2e] border border-[#1e293b] text-xs transition-colors group cursor-pointer"
                >
                  <div className="text-left min-w-0">
                    <div className="text-[11px] font-mono font-medium text-slate-200 group-hover:text-blue-400 transition-colors">
                      Case #{inv.investigation_id}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5 text-slate-500" />
                      {new Date(inv.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-medium text-emerald-400 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-900/60">
                      {inv.status}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-slate-300 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
