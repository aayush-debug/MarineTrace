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
  TrendingUp,
  Eye,
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import { MaritimeMap } from '../components/map/MaritimeMap';
import { MapLayerControls } from '../components/map/MapLayerControls';
import { MapLegend } from '../components/map/MapLegend';
import { SpillInfoPanel } from '../components/spill/SpillInfoPanel';
import { VesselRankList } from '../components/vessel/VesselRankList';
import { MLModelCard } from '../components/ml/MLModelCard';

// Animated KPI counter
const AnimatedCounter: React.FC<{ value: number | string; duration?: number }> = ({
  value,
  duration = 1200,
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

const ML_PERF = [
  { label: 'Dice', value: '0.87', color: 'text-emerald-400' },
  { label: 'IoU', value: '0.79', color: 'text-emerald-400' },
  { label: 'Precision', value: '0.91', color: 'text-cyan-400' },
  { label: 'Recall', value: '0.84', color: 'text-cyan-400' },
  { label: 'F1', value: '0.87', color: 'text-indigo-400' },
  { label: 'Pxl Acc', value: '0.96', color: 'text-indigo-400' },
];

export const Dashboard: React.FC = () => {
  const {
    investigationList,
    setActivePage,
    executeDemo,
    loading,
  } = useInvestigation();

  const activeCount = investigationList.length > 0 ? investigationList.length : 1;
  const totalSpills = 37;
  const monitoredArea = 4280;
  const vesselsAnalyzed = 1284;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#05080f] overflow-hidden font-mono">

      {/* Top Banner */}
      <div className="px-5 py-3 bg-[#080d18] border-b border-[rgba(255,255,255,0.07)] flex items-center justify-between gap-4 shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-cyan-400 signal-blink" />
            <h1 className="text-[13px] font-bold text-slate-100 tracking-[0.08em]">
              MARINE POLLUTION INTELLIGENCE — LIVE SURVEILLANCE
            </h1>
            <span className="text-[9px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/25 font-bold">
              {activeCount} INCIDENT{activeCount !== 1 ? 'S' : ''} ACTIVE
            </span>
          </div>
          <p className="text-[10px] text-slate-600 mt-0.5">
            Sentinel-1 SAR · OpenDrift Hydrodynamics · Historical AIS Attribution · U-Net ResNet-34 ML
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setActivePage('new-investigation')}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-[10px] shadow-md shadow-cyan-900/30 transition-colors tracking-wider"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>NEW INVESTIGATION</span>
          </button>

          <button
            onClick={executeDemo}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0d1427] hover:bg-[#111e35] border border-[rgba(255,255,255,0.1)] text-slate-300 text-[10px] font-semibold transition-colors tracking-wider disabled:opacity-40"
          >
            <Play className="w-3 h-3 text-cyan-400" />
            <span>{loading ? 'RUNNING...' : 'DEMO SCENARIO'}</span>
          </button>
        </div>
      </div>

      {/* KPI Strip */}
      <div className="px-5 py-3 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#080d18] border-b border-[rgba(255,255,255,0.05)] shrink-0">
        {[
          {
            label: 'ACTIVE INVESTIGATIONS',
            value: activeCount,
            suffix: '',
            icon: Activity,
            color: 'text-cyan-400',
            iconColor: 'text-cyan-400',
            sub: '● 1 High Priority (Arabian Sea)',
            subColor: 'text-cyan-500/70',
          },
          {
            label: 'SPILLS DETECTED',
            value: totalSpills,
            suffix: '',
            icon: AlertTriangle,
            color: 'text-rose-400',
            iconColor: 'text-rose-400',
            sub: 'Sentinel-1 C-Band verified',
            subColor: 'text-slate-600',
          },
          {
            label: 'AREA MONITORED',
            value: monitoredArea,
            suffix: ' km²',
            icon: Satellite,
            color: 'text-amber-400',
            iconColor: 'text-amber-400',
            sub: 'Indian EEZ — West Coast',
            subColor: 'text-slate-600',
          },
          {
            label: 'VESSELS ANALYZED',
            value: vesselsAnalyzed,
            suffix: '',
            icon: Ship,
            color: 'text-indigo-300',
            iconColor: 'text-indigo-400',
            sub: 'AIS Spatio-Temporal Correlated',
            subColor: 'text-slate-600',
          },
        ].map((kpi) => {
          const Icon = kpi.icon;
          return (
            <div
              key={kpi.label}
              className="p-3 bg-[#0d1427] border border-[rgba(255,255,255,0.07)] rounded-lg hover:border-[rgba(255,255,255,0.12)] transition-colors"
            >
              <div className="flex items-center justify-between text-[9px] text-slate-500 mb-1.5">
                <span className="tracking-widest uppercase">{kpi.label}</span>
                <Icon className={`w-3.5 h-3.5 ${kpi.iconColor}`} />
              </div>
              <div className={`text-2xl font-bold ${kpi.color} kpi-value`}>
                <AnimatedCounter value={kpi.value} />{kpi.suffix}
              </div>
              <div className={`text-[9px] ${kpi.subColor} mt-1`}>{kpi.sub}</div>
            </div>
          );
        })}
      </div>

      {/* ML Performance Strip */}
      <div className="px-5 py-2 bg-[#080d18] border-b border-[rgba(255,255,255,0.05)] flex items-center gap-4 shrink-0">
        <div className="flex items-center gap-1.5 text-[9px] text-slate-500 font-mono">
          <TrendingUp className="w-3 h-3 text-indigo-400" />
          <span className="tracking-widest uppercase text-indigo-400/70">Model Performance</span>
          <span className="text-slate-700">·</span>
          <span>slicktrace-unet-v1</span>
        </div>
        <div className="flex items-center gap-3">
          {ML_PERF.map((m) => (
            <div key={m.label} className="flex items-center gap-1 text-[9px] font-mono">
              <span className="text-slate-600">{m.label}:</span>
              <span className={`font-bold ${m.color}`}>{m.value}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Workspace */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* LEFT: Dominant Map */}
        <div className="flex-1 flex flex-col min-h-0 min-w-0 relative">
          {/* Map Title Bar */}
          <div className="h-9 bg-[#0a0f1d] border-b border-[rgba(255,255,255,0.06)] px-3 flex items-center justify-between text-[10px] font-mono shrink-0">
            <div className="flex items-center gap-2">
              <Compass className="w-3.5 h-3.5 text-cyan-400" />
              <span className="font-bold text-slate-300 tracking-widest">
                MARITIME SITUATION MAP — SECTOR WEST (MUMBAI / GUJARAT EEZ)
              </span>
            </div>
            <div className="flex items-center gap-3 text-slate-600">
              <span>Projection: EPSG:4326</span>
              <span>·</span>
              <span>CARTO Dark Basemap</span>
            </div>
          </div>

          {/* Map */}
          <div className="flex-1 relative">
            <MaritimeMap />
            <MapLayerControls />
            <MapLegend />
          </div>
        </div>

        {/* RIGHT: Intelligence Panel */}
        <div className="w-72 bg-[#080d18] border-l border-[rgba(255,255,255,0.07)] flex flex-col overflow-hidden shrink-0">
          <div className="flex-1 overflow-y-auto space-y-3 p-3">

            {/* Spill Info */}
            <SpillInfoPanel />

            {/* Vessel Rank List */}
            <VesselRankList />
          </div>

          {/* Recent Investigations Feed */}
          <div className="border-t border-[rgba(255,255,255,0.07)] p-3">
            <div className="flex items-center gap-1.5 mb-2">
              <Eye className="w-3 h-3 text-slate-500" />
              <span className="text-[9px] text-slate-500 tracking-widest uppercase font-semibold">
                Recent Incidents
              </span>
            </div>
            <div className="space-y-1.5">
              {investigationList.slice(0, 3).map((inv) => (
                <button
                  key={inv.investigation_id}
                  onClick={() => setActivePage('investigation')}
                  className="w-full flex items-center justify-between p-2 rounded bg-[#0d1427] hover:bg-[#111e35] border border-[rgba(255,255,255,0.06)] transition-colors group"
                >
                  <div className="text-left min-w-0">
                    <div className="text-[9px] text-cyan-400 font-bold truncate">{inv.investigation_id}</div>
                    <div className="text-[8px] text-slate-600">
                      <Clock className="w-2 h-2 inline mr-0.5" />
                      {new Date(inv.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[8px] text-emerald-400 font-bold">{inv.status}</span>
                    <ChevronRight className="w-3 h-3 text-slate-700 group-hover:text-slate-400 transition-colors" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ML Model Strip at bottom */}
      <div className="shrink-0 border-t border-[rgba(255,255,255,0.05)] px-5 py-2">
        <MLModelCard compact />
      </div>
    </div>
  );
};
