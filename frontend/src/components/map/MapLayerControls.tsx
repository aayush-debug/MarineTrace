import React, { useState } from 'react';
import { Layers, Eye, EyeOff, Globe, Check } from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';
import { BASEMAP_CONFIGS, type BasemapType } from '../../utils/mapTiles';

export const MapLayerControls: React.FC = () => {
  const { layers, toggleLayer, basemap, setBasemap } = useInvestigation();
  const [tab, setTab] = useState<'layers' | 'basemap'>('layers');
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  const layerItems: { id: keyof typeof layers; label: string; dotColor: string }[] = [
    { id: 'sar', label: 'Sentinel-1 SAR Radar Image', dotColor: 'bg-cyan-400' },
    { id: 'spill', label: 'Oil Slick Geometry', dotColor: 'bg-rose-500' },
    { id: 'spcsft', label: 'SpaceShift Radar Slicks', dotColor: 'bg-blue-400' },
    { id: 'origin', label: 'Origin Probability Area', dotColor: 'bg-amber-500' },
    { id: 'drift', label: 'Reverse Hindcast Drift', dotColor: 'bg-sky-400' },
    { id: 'forecast', label: 'Forward Forecast 24h', dotColor: 'bg-emerald-500' },
    { id: 'vessels', label: 'AIS Vessels & Headings', dotColor: 'bg-indigo-400' },
    { id: 'tracks', label: 'Historical AIS Tracks', dotColor: 'bg-purple-400' },
  ];

  const basemapList = Object.values(BASEMAP_CONFIGS);

  if (isCollapsed) {
    return (
      <button
        onClick={() => setIsCollapsed(false)}
        className="absolute top-3 right-3 z-[1000] bg-[#111622] hover:bg-[#161e2e] text-slate-200 border border-[#1e293b] rounded p-2 shadow-lg flex items-center gap-1.5 text-xs font-medium transition-colors cursor-pointer"
        title="Show Map Layers & Basemap Controls"
      >
        <Layers className="w-4 h-4 text-blue-400" />
        <span>Layers</span>
      </button>
    );
  }

  return (
    <div className="absolute top-3 right-3 z-[1000] bg-[#111622] border border-[#1e293b] rounded p-3 shadow-xl text-xs select-none w-68">
      {/* Header & Tabs */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
        <div className="flex items-center gap-1 bg-[#0c1017] p-0.5 rounded border border-slate-800">
          <button
            onClick={() => setTab('layers')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              tab === 'layers'
                ? 'bg-[#161e2e] text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3 h-3 text-blue-400" />
            <span>Layers</span>
          </button>
          <button
            onClick={() => setTab('basemap')}
            className={`flex items-center gap-1 px-2.5 py-1 rounded text-[11px] font-medium transition-colors cursor-pointer ${
              tab === 'basemap'
                ? 'bg-[#161e2e] text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Globe className="w-3 h-3 text-blue-400" />
            <span>Basemap</span>
          </button>
        </div>

        <button
          onClick={() => setIsCollapsed(true)}
          className="text-slate-500 hover:text-slate-300 text-xs px-1.5 py-0.5 rounded transition-colors cursor-pointer"
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

      {/* Tab Content: Basemap Selection */}
      {tab === 'basemap' && (
        <div className="space-y-1">
          {basemapList.map((bm) => {
            const isSelected = basemap === bm.id;
            return (
              <button
                key={bm.id}
                onClick={() => setBasemap(bm.id as BasemapType)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded text-xs transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-blue-950 text-blue-200 font-medium border border-blue-800/60'
                    : 'text-slate-400 hover:bg-[#161e2e]/50'
                }`}
              >
                <span className="text-[11px]">{bm.name}</span>
                {isSelected && <Check className="w-3.5 h-3.5 text-blue-400" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
