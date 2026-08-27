import React, { useState } from 'react';
import { Layers, Eye, EyeOff, Globe, Check } from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';
import { BASEMAP_CONFIGS, type BasemapType } from '../../utils/mapTiles';

export const MapLayerControls: React.FC = () => {
  const { layers, toggleLayer, basemap, setBasemap } = useInvestigation();
  const [tab, setTab] = useState<'layers' | 'basemap'>('layers');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const layerItems: { id: keyof typeof layers; label: string; dotClass: string }[] = [
    { id: 'spill', label: 'Oil Slick Geometry', dotClass: 'bg-rose-500' },
    { id: 'spcsft', label: 'Space Shift Live API Slicks', dotClass: 'bg-cyan-400' },
    { id: 'origin', label: 'Origin Probability Zone', dotClass: 'bg-amber-500' },
    { id: 'drift', label: 'Reverse Drift Trajectory', dotClass: 'bg-sky-400' },
    { id: 'forecast', label: '24h Forward Spread', dotClass: 'bg-emerald-500' },
    { id: 'vessels', label: 'AIS Vessels', dotClass: 'bg-indigo-400' },
    { id: 'tracks', label: 'Historical AIS Tracks', dotClass: 'bg-purple-400' },
  ];

  const basemapList = Object.values(BASEMAP_CONFIGS);

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="absolute top-3 right-3 z-[1000] bg-slate-900/90 hover:bg-slate-800/90 text-slate-200 border border-slate-700/80 rounded-lg p-2 shadow-lg backdrop-blur-md flex items-center gap-1.5 text-xs font-medium transition-all"
        title="Show Map Controls"
      >
        <Layers className="w-4 h-4 text-sky-400" />
        <span>Layers</span>
      </button>
    );
  }

  return (
    <div className="absolute top-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur-md border border-slate-800/90 rounded-xl p-3 shadow-2xl text-xs select-none w-64">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-1 bg-slate-950/80 p-0.5 rounded-lg border border-slate-800">
          <button
            onClick={() => setTab('layers')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              tab === 'layers'
                ? 'bg-sky-500/20 text-sky-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span>Layers</span>
          </button>
          <button
            onClick={() => setTab('basemap')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-medium transition-all ${
              tab === 'basemap'
                ? 'bg-sky-500/20 text-sky-300 font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3 h-3" />
            <span>Basemap</span>
          </button>
        </div>

        <button
          onClick={() => setIsCollapsed(true)}
          className="text-slate-500 hover:text-slate-300 text-[11px] px-1 py-0.5 rounded transition-colors"
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
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs transition-colors ${
                  isVisible
                    ? 'bg-slate-800/70 text-slate-200 font-medium'
                    : 'text-slate-400 hover:bg-slate-800/30'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${item.dotClass} ${!isVisible ? 'opacity-30' : ''}`} />
                  <span className="text-[11px]">{item.label}</span>
                </div>
                {isVisible ? (
                  <Eye className="w-3.5 h-3.5 text-sky-400" />
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
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg transition-all text-left ${
                  isSelected
                    ? 'bg-sky-500/15 border border-sky-500/30 text-sky-200'
                    : 'bg-slate-800/40 hover:bg-slate-800/80 text-slate-400 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm">{bm.icon}</span>
                  <div>
                    <div className="text-[11px] font-semibold">{bm.name}</div>
                    <div className="text-[9px] text-slate-400">{bm.sublabel}</div>
                  </div>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-sky-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};


