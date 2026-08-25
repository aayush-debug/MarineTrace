import React from 'react';
import { Layers, Eye, EyeOff } from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';

export const MapLayerControls: React.FC = () => {
  const { layers, toggleLayer } = useInvestigation();

  const layerItems: { id: keyof typeof layers; label: string; color: string }[] = [
    { id: 'spill', label: 'Oil Slick Polygon', color: 'bg-rose-500' },
    { id: 'origin', label: 'Origin Zone & Point', color: 'bg-amber-500' },
    { id: 'drift', label: 'Reverse Drift Path', color: 'bg-sky-400' },
    { id: 'forecast', label: 'Forward 24h Forecast', color: 'bg-emerald-500' },
    { id: 'vessels', label: 'AIS Vessels', color: 'bg-cyan-400' },
    { id: 'tracks', label: 'Vessel Trajectories', color: 'bg-indigo-400' },
  ];

  return (
    <div className="absolute top-3 right-3 z-[1000] bg-slate-900/90 backdrop-blur border border-slate-800 rounded-md p-2.5 shadow-xl text-xs font-mono select-none w-56">
      <div className="flex items-center gap-1.5 text-slate-300 font-bold mb-2 pb-1.5 border-b border-slate-800">
        <Layers className="w-3.5 h-3.5 text-cyan-400" />
        <span>MAP LAYERS</span>
      </div>

      <div className="space-y-1.5">
        {layerItems.map((item) => {
          const isVisible = layers[item.id];
          return (
            <button
              key={item.id}
              onClick={() => toggleLayer(item.id)}
              className={`w-full flex items-center justify-between px-2 py-1 rounded transition-colors ${
                isVisible ? 'bg-slate-800/80 text-slate-200' : 'text-slate-500 hover:bg-slate-800/40'
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full ${item.color} ${!isVisible ? 'opacity-30' : ''}`} />
                <span className="text-[11px]">{item.label}</span>
              </div>
              {isVisible ? (
                <Eye className="w-3 h-3 text-cyan-400" />
              ) : (
                <EyeOff className="w-3 h-3 text-slate-600" />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};
