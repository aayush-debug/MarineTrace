import { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Satellite,
  Ship,
  PlusCircle,
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

// Animated KPI counter with tabular numerals
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
    <div className="flex-1 flex flex-col min-h-0 bg-[#040814] overflow-hidden">

      {/* Mission Control Top Header Bar */}
      <div className="px-5 py-2.5 bg-[#070d1d] border-b border-[rgba(0,240,255,0.18)] flex items-center justify-between gap-4 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse shadow-[0_0_8px_#00f0ff]" />
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-orbitron text-xs sm:text-sm font-bold text-slate-100 tracking-wider uppercase">
                Maritime Mission Overview // Sector West
              </h1>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950/80 text-rose-300 border border-rose-500/40">
                {activeCount} TARGET{activeCount !== 1 ? 'S' : ''} ACTIVE
              </span>
            </div>
            <p className="text-[11px] font-mono text-cyan-400/80 mt-0.5">
              ORBITAL PASS: S1A-DESC-142 · COPERNICUS CMEMS PHYSICS · WSS AIS STREAM
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActivePage('new-investigation')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-mono font-bold text-xs shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-all cursor-pointer"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>LAUNCH TARGET</span>
          </button>

          <button
            onClick={executeDemo}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0a1226] hover:bg-cyan-950/60 border border-cyan-500/30 text-slate-200 text-xs font-mono font-medium transition-colors disabled:opacity-50"
          >
            <Play className="w-3.5 h-3.5 text-cyan-400 fill-cyan-400" />
            <span>{loading ? 'SIMULATING...' : 'REPLAY FLIGHT'}</span>
          </button>
        </div>
      </div>

      {/* Telemetry Metric Cards Row with Corner Brackets */}
      <div className="px-5 py-2.5 grid grid-cols-2 lg:grid-cols-4 gap-3 bg-[#060b18]/80 border-b border-[rgba(0,240,255,0.12)] shrink-0">
        {[
          {
            label: 'ACTIVE TARGETS',
            value: activeCount,
            suffix: '',
            icon: Activity,
            badge: 'PRIORITY_1',
            badgeClass: 'bg-rose-950 text-rose-300 border-rose-500/40',
            sub: 'Arabian Sea High Risk',
          },
          {
            label: 'SAR SLICKS VERIFIED',
            value: totalSpills,
            suffix: '',
            icon: AlertTriangle,
            badge: 'C-BAND SAR',
            badgeClass: 'bg-amber-950 text-amber-300 border-amber-500/40',
            sub: 'Zenodo Model Verified',
          },
          {
            label: 'MONITORED RADAR GRID',
            value: monitoredArea,
            suffix: ' KM²',
            icon: Satellite,
            badge: 'ORBITAL',
            badgeClass: 'bg-cyan-950 text-cyan-300 border-cyan-500/40',
            sub: '10m Resolution Swath',
          },
          {
            label: 'AIS TRACKS CORRELATED',
            value: vesselsAnalyzed,
            suffix: '',
            icon: Ship,
            badge: 'SPATIAL-TIME',
            badgeClass: 'bg-emerald-950 text-emerald-300 border-emerald-500/40',
            sub: 'OpenDrift Hydrodynamic',
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="p-3 bg-[#081024]/90 border border-cyan-500/20 rounded-md hover:border-cyan-400/50 transition-all shadow-inner relative group"
            >
              {/* Corner accents */}
              <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-cyan-400/60" />
              <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-cyan-400/60" />

              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span className="tracking-wider">{kpi.label}</span>
                <span className={`text-[8px] font-bold px-1.5 py-0.2 rounded border uppercase ${kpi.badgeClass}`}>
                  {kpi.badge}
                </span>
              </div>
              <div className="flex items-baseline justify-between mt-1">
                <div className="text-xl font-bold font-mono text-cyan-100 tracking-tight">
                  <AnimatedCounter value={kpi.value} />{kpi.suffix}
                </div>
                <Icon className="w-4 h-4 text-cyan-400/60 group-hover:text-cyan-300 transition-colors" />
              </div>
              <div className="text-[10px] font-mono text-slate-500 mt-1">{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* Space Shift Real-Time Radar Ground Station Alert Bar */}
      <div className="px-5 py-2 bg-gradient-to-r from-rose-950/60 via-[#071126] to-cyan-950/60 border-b border-rose-500/30 flex flex-wrap items-center justify-between gap-3 text-xs font-mono shrink-0">
        <div className="flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping shadow-[0_0_8px_#ff0055]" />
          <span className="font-bold text-rose-300 flex items-center gap-1.5">
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>SPACE SHIFT SATE-AIS™ SURVEILLANCE:</span>
            <span className="text-white font-mono bg-rose-900/60 px-1.5 py-0.2 rounded border border-rose-500/40">
              {spcsftLiveDetections.length} ACTIVE RADAR SLICKS
            </span>
          </span>
          <span className="text-cyan-900 hidden sm:inline">|</span>
          <span className="text-slate-400 hidden sm:inline text-[11px]">
            SENTINEL-1 SAR AI SEGMENTATION · SYNC {spcsftSyncEnabled ? 'ONLINE' : 'PAUSED'}
          </span>
        </div>

        <button
          onClick={() => setActivePage('spcsft-realtime')}
          className="px-3 py-1 rounded bg-rose-950/80 hover:bg-rose-900/90 border border-rose-500/50 text-rose-200 text-[11px] font-bold font-mono flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(255,0,85,0.25)] cursor-pointer"
        >
          <span>OPEN RADAR GROUND STATION</span>
          <ChevronRight className="w-3.5 h-3.5 text-rose-400" />
        </button>
      </div>

      {/* Main Mission Control Workspace Split */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* LEFT: Situation Radar Map Viewport */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 relative">
          {/* Tactical Coordinate Telemetry Header */}
          <div className="h-8 bg-[#070d1d] border-b border-[rgba(0,240,255,0.15)] px-4 flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
              <span>MARITIME TACTICAL RADAR // SECTOR WEST</span>
            </div>
            <div className="flex items-center gap-3 text-[10px] text-cyan-400/80">
              <span>WGS84 EPSG:4326</span>
              <span className="text-cyan-900">·</span>
              <span>10M SAR GRID</span>
              <span className="text-cyan-900">·</span>
              <span>HYDRODYNAMIC VECTORS</span>
            </div>
          </div>

          {/* Tactical Map Container */}
          <div className="flex-1 relative bg-[#030610]">
            <MaritimeMap />
            <MapLayerControls />
            <MapLegend />
          </div>
        </div>

        {/* RIGHT: Tactical Intelligence Forensics Panel */}
        <div className="w-84 bg-[#060b18] border-l border-[rgba(0,240,255,0.18)] flex flex-col overflow-hidden shrink-0 shadow-2xl">
          {/* Panel Tab Navigation */}
          <div className="flex border-b border-cyan-900/40 bg-[#040814] shrink-0 font-mono text-xs">
            <button
              onClick={() => setActiveRightTab('spill')}
              className={`flex-1 py-2.5 font-bold transition-all border-b-2 cursor-pointer ${
                activeRightTab === 'spill'
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              RADAR TARGET
            </button>
            <button
              onClick={() => setActiveRightTab('vessels')}
              className={`flex-1 py-2.5 font-bold transition-all border-b-2 cursor-pointer ${
                activeRightTab === 'vessels'
                  ? 'border-cyan-400 text-cyan-300 bg-cyan-950/40'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              SUSPECT AIS ({investigation?.vessels.length || 0})
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

          {/* Recent Mission Feed Drawer */}
          <div className="border-t border-cyan-900/40 p-3 bg-[#040814] shrink-0">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400 font-bold mb-2">
              <span>MISSION HISTORY LOG</span>
              <span className="text-[10px] text-slate-500">T-30 DAYS</span>
            </div>
            <div className="space-y-1.5">
              {investigationList.slice(0, 2).map((inv) => (
                <button
                  key={inv.investigation_id}
                  onClick={() => setActivePage('investigation')}
                  className="w-full flex items-center justify-between p-2 rounded-md bg-[#081024] hover:bg-cyan-950/50 border border-cyan-500/20 text-xs transition-colors group cursor-pointer"
                >
                  <div className="text-left min-w-0 font-mono">
                    <div className="text-[11px] font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                      #{inv.investigation_id}
                    </div>
                    <div className="text-[9px] text-slate-400 flex items-center gap-1">
                      <Clock className="w-2.5 h-2.5 text-cyan-400" />
                      {new Date(inv.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono font-bold text-emerald-300 bg-emerald-950/80 px-1.5 py-0.5 rounded border border-emerald-500/40">
                      {inv.status}
                    </span>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
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
