import React, { useState } from 'react';
import { Layers, Eye, EyeOff, Globe, Check } from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';
import { BASEMAP_CONFIGS, type BasemapType } from '../../utils/mapTiles';

export const MapLayerControls: React.FC = () => {
  const { layers, toggleLayer, basemap, setBasemap } = useInvestigation();
  const [tab, setTab] = useState<'layers' | 'basemap'>('layers');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const layerItems: { id: keyof typeof layers; label: string; dotClass: string }[] = [
    { id: 'spill', label: 'Oil Slick Radar Geometry', dotClass: 'bg-rose-500 shadow-[0_0_6px_#ff0055]' },
    { id: 'spcsft', label: 'Space Shift SateAIs Slicks', dotClass: 'bg-cyan-400 shadow-[0_0_6px_#00f0ff]' },
    { id: 'origin', label: 'Origin Probability Envelope', dotClass: 'bg-amber-500 shadow-[0_0_6px_#f59e0b]' },
    { id: 'drift', label: 'Lagrangian Reverse Track', dotClass: 'bg-sky-400 shadow-[0_0_6px_#38bdf8]' },
    { id: 'forecast', label: 'Forward Advection 24h', dotClass: 'bg-emerald-500 shadow-[0_0_6px_#10b981]' },
    { id: 'vessels', label: 'AIS Vessels & Headings', dotClass: 'bg-indigo-400 shadow-[0_0_6px_#818cf8]' },
    { id: 'tracks', label: 'Historical AIS Vectors', dotClass: 'bg-purple-400 shadow-[0_0_6px_#c084fc]' },
  ];

  const basemapList = Object.values(BASEMAP_CONFIGS);

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="absolute top-3 right-3 z-[1000] bg-[#070d1d]/90 hover:bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 rounded-md p-2 shadow-2xl backdrop-blur-md flex items-center gap-1.5 text-xs font-mono font-bold transition-all cursor-pointer"
        title="Show Tactical Map Controls"
      >
        <Layers className="w-4 h-4 text-cyan-400 animate-pulse" />
        <span>LAYERS</span>
      </button>
    );
  }

  return (
    <div className="absolute top-3 right-3 z-[1000] bg-[#070d1d]/95 backdrop-blur-xl border border-cyan-500/35 rounded-md p-3 shadow-2xl text-xs font-mono select-none w-72 relative">
      {/* Corner brackets */}
      <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-cyan-400" />
      <div className="absolute bottom-1 left-1 w-1.5 h-1.5 border-b border-l border-cyan-400" />

      {/* Header & Tabs */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-cyan-900/40">
        <div className="flex items-center gap-1 bg-[#040814] p-0.5 rounded border border-cyan-900/40">
          <button
            onClick={() => setTab('layers')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
              tab === 'layers'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-inner'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3 text-cyan-400" />
            <span>LAYERS</span>
          </button>
          <button
            onClick={() => setTab('basemap')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[10px] font-bold uppercase transition-all cursor-pointer ${
              tab === 'basemap'
                ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40 shadow-inner'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3 h-3 text-cyan-400" />
            <span>BASEMAP</span>
          </button>
        </div>

        <button
          onClick={() => setIsCollapsed(true)}
          className="text-slate-500 hover:text-cyan-300 text-[10px] px-1.5 py-0.5 rounded transition-colors cursor-pointer"
          title="Minimize"
        >
          ✕
        </button>
      </div>

      {/* Tab Content: Overlay Layers */}
      {tab === 'layers' && (
        <div className="space-y-1">
          {layerItems.map((item) => {
            const isVisible = layers[item.id];
            return (
              <button
                key={item.id}
                onClick={() => toggleLayer(item.id)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                  isVisible
                    ? 'bg-cyan-950/40 text-slate-100 font-bold border border-cyan-500/20'
                    : 'text-slate-400 hover:bg-cyan-950/20 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${item.dotClass} ${!isVisible ? 'opacity-20' : ''}`} />
                  <span className="text-[10px]">{item.label}</span>
                </div>
                {isVisible ? (
                  <Eye className="w-3.5 h-3.5 text-cyan-400" />
                ) : (
                  <EyeOff className="w-3.5 h-3.5 text-slate-600" />
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Tab Content: Basemap Selection */}
      {tab === 'basemap' && (
        <div className="space-y-1.5">
          {basemapList.map((bm) => {
            const isSelected = basemap === bm.id;
            return (
              <button
                key={bm.id}
                onClick={() => setBasemap(bm.id as BasemapType)}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded transition-all text-left cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-950/60 border border-cyan-400/50 text-cyan-200 shadow-[0_0_8px_rgba(0,240,255,0.2)]'
                    : 'bg-[#040814] hover:bg-cyan-950/30 text-slate-400 border border-cyan-900/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{bm.icon}</span>
                  <div>
                    <div className="text-[10px] font-bold">{bm.name}</div>
                    <div className="text-[8px] text-slate-500">{bm.sublabel}</div>
                  </div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-cyan-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
