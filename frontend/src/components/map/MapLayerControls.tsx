import React, { useState } from 'react';
import { Layers, Eye, EyeOff, ChevronDown, ChevronUp, Shield, Anchor, Globe2 } from 'lucide-react';
import { useInvestigation, type LayerVisibility } from '../../context/InvestigationContext';

interface LayerGroup {
  category: string;
  icon: React.ComponentType<{ className?: string }>;
  items: { id: keyof LayerVisibility; label: string; color: string }[];
}

const LAYER_GROUPS: LayerGroup[] = [
  {
    category: 'INCIDENT INTELLIGENCE',
    icon: Shield,
    items: [
      { id: 'spill', label: 'Oil Slick Polygon', color: 'bg-rose-500' },
      { id: 'origin', label: 'Origin Zone & Point', color: 'bg-amber-500' },
      { id: 'drift', label: 'Reverse Drift Trajectory', color: 'bg-sky-400' },
      { id: 'forecast', label: 'Forward 24h Forecast', color: 'bg-emerald-500' },
      { id: 'vessels', label: 'AIS Vessels', color: 'bg-cyan-400' },
      { id: 'tracks', label: 'Vessel Trajectories', color: 'bg-indigo-400' },
    ],
  },
  {
    category: 'NAUTICAL & BOUNDARIES',
    icon: Anchor,
    items: [
      { id: 'eez', label: 'Indian EEZ (200 NM)', color: 'bg-blue-500' },
      { id: 'lanes', label: 'TSS Shipping Corridors', color: 'bg-indigo-400' },
      { id: 'seamarks', label: 'OpenSeaMap Seamarks', color: 'bg-amber-400' },
    ],
  },
  {
    category: 'OFFSHORE INFRASTRUCTURE',
    icon: Globe2,
    items: [
      { id: 'platforms', label: 'Mumbai High Oil Rigs', color: 'bg-amber-600' },
    ],
  },
];

export const MapLayerControls: React.FC = () => {
  const { layers, toggleLayer } = useInvestigation();
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="absolute top-14 right-3 z-[1000] font-mono select-none">
      {/* Expanded Layers Drawer */}
      {isOpen ? (
        <div className="bg-[#080d1a]/95 backdrop-blur-md border border-[rgba(255,255,255,0.14)] rounded-xl p-3 shadow-2xl text-xs w-64 space-y-3 animate-fade-up max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-2 border-b border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-1.5 text-slate-200 font-bold text-xs">
              <Layers className="w-4 h-4 text-cyan-400" />
              <span>MAP LAYERS</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-200 p-1"
            >
              <ChevronUp className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {LAYER_GROUPS.map((group) => {
              const GroupIcon = group.icon;
              return (
                <div key={group.category} className="space-y-1">
                  <div className="flex items-center gap-1 text-[9px] font-bold text-slate-500 uppercase tracking-widest px-1">
                    <GroupIcon className="w-2.5 h-2.5 text-slate-400" />
                    <span>{group.category}</span>
                  </div>

                  <div className="space-y-1">
                    {group.items.map((item) => {
                      const isVisible = layers[item.id];
                      return (
                        <button
                          key={item.id}
                          onClick={() => toggleLayer(item.id)}
                          className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg transition-all ${
                            isVisible
                              ? 'bg-[#0f1930] text-slate-200 border border-cyan-500/20'
                              : 'text-slate-500 hover:bg-[#0c1426] border border-transparent'
                          }`}
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${item.color} ${
                                !isVisible ? 'opacity-25' : ''
                              }`}
                            />
                            <span className="text-[11px] font-medium">{item.label}</span>
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
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        /* Collapsed Button */
        <button
          onClick={() => setIsOpen(true)}
          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#080d1a]/95 backdrop-blur-md border border-[rgba(255,255,255,0.12)] text-slate-200 shadow-xl hover:border-cyan-500/50 hover:bg-[#0c152a] transition-all"
        >
          <Layers className="w-4 h-4 text-cyan-400" />
          <span className="text-[10px] font-bold">LAYERS</span>
          <ChevronDown className="w-3 h-3 text-slate-400" />
        </button>
      )}
    </div>
  );
};
