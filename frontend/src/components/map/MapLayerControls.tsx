import React, { useState } from 'react';
import {
  Compass,
  Wind,
  Waves,
  Thermometer,
  Check,
  Eye,
  EyeOff,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Activity,
  Ship,
  Satellite,
} from 'lucide-react';
import { useInvestigation, type LayerVisibility } from '../../context/InvestigationContext';
import { BASEMAP_CONFIGS, type BasemapType } from '../../utils/mapTiles';

type HUDTab = 'presets' | 'metocean' | 'basemap' | 'layers';

export const MapLayerControls: React.FC = () => {
  const {
    layers,
    setLayers,
    toggleLayer,
    basemap,
    setBasemap,
    environmental,
    investigation,
  } = useInvestigation();

  const [activeTab, setActiveTab] = useState<HUDTab>('presets');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);

  // Preset Mission Configurations
  const applyPreset = (presetType: 'all' | 'sar' | 'drift' | 'ais') => {
    switch (presetType) {
      case 'all':
        setLayers({
          sar: true,
          spill: true,
          origin: true,
          drift: true,
          forecast: true,
          vessels: true,
          tracks: true,
          spcsft: true,
        });
        break;
      case 'sar':
        setLayers({
          sar: true,
          spill: true,
          origin: false,
          drift: false,
          forecast: false,
          vessels: false,
          tracks: false,
          spcsft: true,
        });
        break;
      case 'drift':
        setLayers({
          sar: false,
          spill: true,
          origin: true,
          drift: true,
          forecast: true,
          vessels: false,
          tracks: false,
          spcsft: false,
        });
        break;
      case 'ais':
        setLayers({
          sar: false,
          spill: true,
          origin: true,
          drift: false,
          forecast: false,
          vessels: true,
          tracks: true,
          spcsft: false,
        });
        break;
    }
  };

  const layerItems: { id: keyof LayerVisibility; label: string; dotColor: string }[] = [
    { id: 'sar', label: 'Sentinel-1 SAR Radar Image', dotColor: 'bg-cyan-400' },
    { id: 'spill', label: 'Oil Slick Delineation', dotColor: 'bg-rose-500' },
    { id: 'origin', label: 'Origin Probability Envelope', dotColor: 'bg-amber-500' },
    { id: 'drift', label: 'Reverse Hindcast Drift', dotColor: 'bg-sky-400' },
    { id: 'forecast', label: '24h Forward Spread Forecast', dotColor: 'bg-emerald-500' },
    { id: 'vessels', label: 'Candidate AIS Transponders', dotColor: 'bg-indigo-400' },
    { id: 'tracks', label: 'Historical Track Vectors', dotColor: 'bg-purple-400' },
    { id: 'spcsft', label: 'SpaceShift Live Slicks', dotColor: 'bg-blue-400' },
  ];

  const basemapList = Object.values(BASEMAP_CONFIGS);

  // Collapsed Trigger Pill
  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="absolute top-3 right-3 z-[1000] bg-white/95 hover:bg-slate-50 text-slate-800 border-slate-300 dark:bg-[#111622]/95 dark:hover:bg-[#161e2e] dark:text-slate-200 dark:border-blue-500/50 rounded-lg px-3 py-2 shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer group border"
      >
        <div className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-950/80 border border-blue-400 dark:border-blue-500/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
          <Activity className="w-3.5 h-3.5 group-hover:scale-110 transition-transform" />
        </div>
        <span className="font-bold">Mission Intelligence HUD</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 ml-auto" />
      </button>
    );
  }

  return (
    <div className="absolute top-3 right-3 z-[1000] bg-white/95 text-slate-900 border-slate-300 dark:bg-[#111622]/95 dark:border-[#1e293b] dark:text-slate-200 rounded-xl shadow-2xl backdrop-blur-md overflow-hidden text-xs font-sans select-none w-80 border">
      
      {/* Header & Tabs */}
      <div className="px-3 py-2.5 bg-slate-50 dark:bg-[#161e2e] border-b border-slate-200 dark:border-[#1e293b] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded bg-blue-100 dark:bg-blue-950 border border-blue-400 dark:border-blue-500/60 flex items-center justify-center text-blue-600 dark:text-blue-400">
            <Activity className="w-3 h-3" />
          </div>
          <div>
            <div className="font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
              Mission Intelligence HUD
            </div>
            <div className="text-[9px] font-mono text-slate-500 dark:text-slate-400">
              Forensic Presets & Environmental Forcing
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsCollapsed(true)}
          className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 p-0.5 rounded transition-colors cursor-pointer"
          title="Minimize HUD"
        >
          <ChevronUp className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="grid grid-cols-4 p-1 bg-slate-100 dark:bg-[#0c1017] border-b border-slate-200 dark:border-[#1e293b] text-[10.5px] font-mono">
        <button
          onClick={() => setActiveTab('presets')}
          className={`py-1 rounded font-medium transition-colors cursor-pointer text-center ${
            activeTab === 'presets'
              ? 'bg-white text-blue-700 font-bold border border-blue-300 dark:bg-[#161e2e] dark:text-blue-300 dark:border-blue-800/50 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Presets
        </button>
        <button
          onClick={() => setActiveTab('metocean')}
          className={`py-1 rounded font-medium transition-colors cursor-pointer text-center ${
            activeTab === 'metocean'
              ? 'bg-white text-blue-700 font-bold border border-blue-300 dark:bg-[#161e2e] dark:text-blue-300 dark:border-blue-800/50 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Metocean
        </button>
        <button
          onClick={() => setActiveTab('basemap')}
          className={`py-1 rounded font-medium transition-colors cursor-pointer text-center ${
            activeTab === 'basemap'
              ? 'bg-white text-blue-700 font-bold border border-blue-300 dark:bg-[#161e2e] dark:text-blue-300 dark:border-blue-800/50 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Basemaps
        </button>
        <button
          onClick={() => setActiveTab('layers')}
          className={`py-1 rounded font-medium transition-colors cursor-pointer text-center ${
            activeTab === 'layers'
              ? 'bg-white text-blue-700 font-bold border border-blue-300 dark:bg-[#161e2e] dark:text-blue-300 dark:border-blue-800/50 shadow-sm'
              : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          Layers
        </button>
      </div>

      {/* ── TAB 1: FORENSIC INVESTIGATION PRESETS ── */}
      {activeTab === 'presets' && (
        <div className="p-3 space-y-2">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            Focus Presets (1-Click Investigation Modes)
          </div>

          <div className="grid grid-cols-2 gap-1.5">
            <button
              onClick={() => applyPreset('all')}
              className="p-2 rounded-lg bg-[#161e2e] hover:bg-[#1d283d] border border-blue-500/40 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-blue-300 font-bold text-[11px]">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>All Evidence</span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                Full multi-source overlay
              </div>
            </button>

            <button
              onClick={() => applyPreset('sar')}
              className="p-2 rounded-lg bg-[#161e2e] hover:bg-[#1d283d] border border-slate-700 hover:border-cyan-500/50 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-cyan-300 font-bold text-[11px]">
                <Satellite className="w-3.5 h-3.5 text-cyan-400" />
                <span>SAR Match</span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                Radar damping & slick
              </div>
            </button>

            <button
              onClick={() => applyPreset('drift')}
              className="p-2 rounded-lg bg-[#161e2e] hover:bg-[#1d283d] border border-slate-700 hover:border-sky-500/50 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-sky-300 font-bold text-[11px]">
                <Compass className="w-3.5 h-3.5 text-sky-400" />
                <span>Drift Advection</span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                Lagrangian hindcast path
              </div>
            </button>

            <button
              onClick={() => applyPreset('ais')}
              className="p-2 rounded-lg bg-[#161e2e] hover:bg-[#1d283d] border border-slate-700 hover:border-indigo-500/50 text-left transition-colors cursor-pointer group"
            >
              <div className="flex items-center gap-1.5 text-indigo-300 font-bold text-[11px]">
                <Ship className="w-3.5 h-3.5 text-indigo-400" />
                <span>AIS Intercept</span>
              </div>
              <div className="text-[9px] text-slate-400 font-mono mt-0.5">
                Vessel CPA correlation
              </div>
            </button>
          </div>

          <div className="p-2 bg-[#0c1017] rounded border border-slate-800 text-[10px] font-mono text-slate-400">
            Active Case: <strong className="text-slate-200">{investigation?.investigation_id || 'DEMO-01'}</strong>
          </div>
        </div>
      )}

      {/* ── TAB 2: LIVE METOCEAN & HYDRODYNAMIC FORCING ── */}
      {activeTab === 'metocean' && (
        <div className="p-3 space-y-2.5 font-mono text-[11px]">
          <div className="text-[10px] text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Copernicus & ECMWF Forcing</span>
            <span className="text-emerald-400 font-bold text-[9px] px-1.5 py-0.2 rounded bg-emerald-950 border border-emerald-800">
              ● SYNCED
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="p-2 rounded bg-[#0c1017] border border-slate-800">
              <div className="flex items-center gap-1.5 text-blue-400 text-[10px] mb-1">
                <Waves className="w-3.5 h-3.5" />
                <span>Surface Current</span>
              </div>
              <div className="text-sm font-bold text-slate-100">
                {environmental.currentSpeedKnots.toFixed(2)} kn
              </div>
              <div className="text-[9.5px] text-slate-400">
                {environmental.currentDirectionDeg}° ({environmental.currentDirectionCardinal})
              </div>
            </div>

            <div className="p-2 rounded bg-[#0c1017] border border-slate-800">
              <div className="flex items-center gap-1.5 text-cyan-400 text-[10px] mb-1">
                <Wind className="w-3.5 h-3.5" />
                <span>ERA5 10m Wind</span>
              </div>
              <div className="text-sm font-bold text-slate-100">
                {environmental.windSpeedKnots.toFixed(1)} kn
              </div>
              <div className="text-[9.5px] text-slate-400">
                {environmental.windDirectionDeg}° ({environmental.windDirectionCardinal})
              </div>
            </div>

            <div className="p-2 rounded bg-[#0c1017] border border-slate-800">
              <div className="flex items-center gap-1.5 text-amber-400 text-[10px] mb-1">
                <Thermometer className="w-3.5 h-3.5" />
                <span>Sea Surface Temp</span>
              </div>
              <div className="text-sm font-bold text-slate-100">
                {environmental.seaSurfaceTempC.toFixed(1)}°C
              </div>
              <div className="text-[9.5px] text-slate-400">
                Tropical Warm Pool
              </div>
            </div>

            <div className="p-2 rounded bg-[#0c1017] border border-slate-800">
              <div className="flex items-center gap-1.5 text-emerald-400 text-[10px] mb-1">
                <Activity className="w-3.5 h-3.5" />
                <span>Wave Height (Hs)</span>
              </div>
              <div className="text-sm font-bold text-slate-100">
                {environmental.waveHeightMeters.toFixed(1)} m
              </div>
              <div className="text-[9.5px] text-slate-400">
                Moderate Sea State
              </div>
            </div>
          </div>

          <div className="p-2 bg-[#0c1017] rounded border border-slate-800 text-[9.5px] text-slate-400 space-y-0.5">
            <div><strong>Advection Vector:</strong> V_drift = U_curr + 0.03*W_wind + U_stokes</div>
            <div><strong>Hydrodynamic Model:</strong> OpenDrift Lagrangian (500 Particles)</div>
          </div>
        </div>
      )}

      {/* ── TAB 3: BASEMAPS ── */}
      {activeTab === 'basemap' && (
        <div className="p-3 space-y-1.5">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            Nautical Charts & Basemap View
          </div>
          {basemapList.map((bm) => {
            const isSelected = basemap === bm.id;
            return (
              <button
                key={bm.id}
                onClick={() => setBasemap(bm.id as BasemapType)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-950 text-blue-200 font-bold border border-blue-800/60'
                    : 'text-slate-400 hover:bg-[#161e2e]/50 border border-transparent'
                }`}
              >
                <span className="text-[11px]">{bm.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
            );
          })}
        </div>
      )}

      {/* ── TAB 4: INDIVIDUAL EVIDENCE LAYERS ── */}
      {activeTab === 'layers' && (
        <div className="p-3 space-y-1">
          <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1">
            Individual Layer Switches
          </div>
          {layerItems.map((item) => {
            const isVisible = layers[item.id];
            return (
              <button
                key={item.id}
                onClick={() => toggleLayer(item.id)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                  isVisible
                    ? 'bg-[#161e2e] text-slate-100 font-medium'
                    : 'text-slate-400 hover:bg-[#161e2e]/50'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${item.dotColor} ${!isVisible ? 'opacity-30' : ''}`} />
                  <span className="text-[11px]">{item.label}</span>
                </div>
                {isVisible ? (
                  <Eye className="w-3.5 h-3.5 text-blue-400" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                )}
              </button>
            );
          })}
        </div>
      )}

    </div>
  );
};
