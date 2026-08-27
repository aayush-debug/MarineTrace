import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Satellite,
  Compass,
  Ship,
  PlusCircle,
  Play,
  Activity,
  ChevronRight,
  Clock,
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import { MaritimeMap } from '../components/map/MaritimeMap';
import { MapLayerControls } from '../components/map/MapLayerControls';
import { MapLegend } from '../components/map/MapLegend';
import { SpillInfoPanel } from '../components/spill/SpillInfoPanel';
import { VesselRankList } from '../components/vessel/VesselRankList';

// Animated KPI counter
const AnimatedCounter: React.FC<{ value: number | string; duration?: number }> = ({
  value,
  duration = 800,
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
      const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
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
    <div className="flex-1 flex flex-col min-h-0 bg-[#090d16] overflow-hidden">

      {/* Top Banner */}
      <div className="px-5 py-3 bg-[#0c121e] border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-semibold text-slate-100 tracking-tight">
                Operational Situation Overview
              </h1>
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/20">
                {activeCount} Active Case{activeCount !== 1 ? 's' : ''}
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Sector West (Arabian Sea / Mumbai High) · Sentinel-1 SAR & AIS Tracking
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActivePage('new-investigation')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow-sm transition-colors"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>New Investigation</span>
          </button>

          <button
            onClick={executeDemo}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-slate-800/90 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
            <span>{loading ? 'Simulating...' : 'Replay Scenario'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Row */}
      <div className="px-5 py-2.5 grid grid-cols-2 lg:grid-cols-4 gap-3 bg-[#0c121e]/60 border-b border-[rgba(255,255,255,0.06)] shrink-0">
        {[
          {
            label: 'Active Cases',
            value: activeCount,
            suffix: '',
            icon: Activity,
            badge: 'High Priority',
            badgeClass: 'bg-rose-500/10 text-rose-400 border-rose-500/20',
            sub: 'Arabian Sea EEZ',
          },
          {
            label: 'Spills Verified',
            value: totalSpills,
            suffix: '',
            icon: AlertTriangle,
            badge: 'SAR C-Band',
            badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
            sub: 'Zenodo Model Verified',
          },
          {
            label: 'Monitored Coverage',
            value: monitoredArea,
            suffix: ' km²',
            icon: Satellite,
            badge: 'Real-time',
            badgeClass: 'bg-sky-500/10 text-sky-400 border-sky-500/20',
            sub: 'Indian EEZ Western Sector',
          },
          {
            label: 'AIS Targets Analyzed',
            value: vesselsAnalyzed,
            suffix: '',
            icon: Ship,
            badge: 'Correlated',
            badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
            sub: 'Spatio-temporal matched',
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="p-3 bg-[#111827]/70 border border-[rgba(255,255,255,0.06)] rounded-lg hover:border-slate-700 transition-colors"
            >
              <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
                <span>{kpi.label}</span>
                <span className={`text-[10px] px-1.5 py-0.2 rounded border font-medium ${kpi.badgeClass}`}>
                  {kpi.badge}
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <div className="text-xl font-bold text-slate-100 kpi-value">
                  <AnimatedCounter value={kpi.value} />{kpi.suffix}
                </div>
                <Icon className="w-4 h-4 text-slate-500" />
              </div>
              <div className="text-[11px] text-slate-400 mt-1">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Space Shift Real-Time Surveillance Alert Bar */}
      <div className="px-5 py-2 bg-gradient-to-r from-rose-950/40 via-slate-900/80 to-cyan-950/40 border-b border-rose-500/20 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span className="font-bold text-rose-300 flex items-center gap-1.5">
            <span>🛰️ Space Shift SateAIs™:</span>
            <span className="text-slate-100 font-semibold">{spcsftLiveDetections.length} Active Oil Slicks Monitored</span>
          </span>
          <span className="text-slate-600 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline">
            Sentinel-1 SAR C-Band AI Segmentation · Auto-Sync {spcsftSyncEnabled ? 'Active' : 'Paused'}
          </span>
        </div>

        <button
          onClick={() => setActivePage('spcsft-realtime')}
          className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 border border-rose-500/40 text-rose-200 text-[11px] font-bold flex items-center gap-1.5 transition-colors"
        >
          <span>Open Space Shift Radar Monitor</span>
          <ChevronRight className="w-3.5 h-3.5 text-rose-400" />
        </button>
      </div>

      {/* Main Workspace Split */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* LEFT: Dominant Situation Map */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 relative">
          {/* Integrated Map Status Header */}
          <div className="h-8 bg-[#0e1422] border-b border-[rgba(255,255,255,0.06)] px-4 flex items-center justify-between text-xs text-slate-400 shrink-0">
            <div className="flex items-center gap-2 font-medium text-slate-300">
              <Compass className="w-3.5 h-3.5 text-sky-400" />
              <span>Maritime Situation Map · Sector West</span>
            </div>
            <div className="flex items-center gap-3 text-[11px]">
              <span>EPSG:4326</span>
              <span className="text-slate-700">·</span>
              <span>10m Spatial Resolution</span>
              <span className="text-slate-700">·</span>
              <span>ECMWF Hydrodynamic Currents</span>
            </div>
          </div>

          {/* Interactive Map Viewport */}
          <div className="flex-1 relative">
            <MaritimeMap />
            <MapLayerControls />
            <MapLegend />
          </div>
        </div>

        {/* RIGHT: Intelligence Panel */}
        <div className="w-80 bg-[#0c121e] border-l border-[rgba(255,255,255,0.08)] flex flex-col overflow-hidden shrink-0">
          {/* Panel Tab Navigation */}
          <div className="flex border-b border-slate-800 bg-[#0a0f19] shrink-0">
            <button
              onClick={() => setActiveRightTab('spill')}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                activeRightTab === 'spill'
                  ? 'border-sky-500 text-sky-400 bg-sky-500/5 font-semibold'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              Detection Profile
            </button>
            <button
              onClick={() => setActiveRightTab('vessels')}
              className={`flex-1 py-2.5 text-xs font-medium transition-colors border-b-2 ${
                activeRightTab === 'vessels'
                  ? 'border-sky-500 text-sky-400 bg-sky-500/5 font-semibold'
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

          {/* Recent Incident Feed Drawer */}
          <div className="border-t border-slate-800 p-3 bg-[#090e18] shrink-0">
            <div className="flex items-center justify-between text-xs text-slate-400 font-semibold mb-2">
              <span>Incident History</span>
              <span className="text-[10px] text-slate-500">Last 30 Days</span>
            </div>
            <div className="space-y-1.5">
              {investigationList.slice(0, 2).map((inv) => (
                <button
                  key={inv.investigation_id}
                  onClick={() => setActivePage('investigation')}
                  className="w-full flex items-center justify-between p-2 rounded-lg bg-slate-900/80 hover:bg-slate-800/80 border border-slate-800 text-xs transition-colors group"
                >
                  <div className="text-left min-w-0">
                    <div className="font-mono text-[11px] font-semibold text-slate-200 group-hover:text-sky-400 transition-colors">
                      {inv.investigation_id}
                    </div>
                    <div className="text-[10px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5" />
                      {new Date(inv.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-medium text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      {inv.status}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-slate-300 transition-colors" />
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

