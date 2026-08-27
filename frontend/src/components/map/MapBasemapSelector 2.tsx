import React, { useState } from 'react';
import { Layers, Globe, Moon, Waves, Map as MapIcon, Anchor, Check } from 'lucide-react';
import { useInvestigation, type BasemapStyle } from '../../context/InvestigationContext';

interface BasemapOption {
  id: BasemapStyle;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
  gradient: string;
  previewBg: string;
}

const BASEMAP_OPTIONS: BasemapOption[] = [
  {
    id: 'satellite',
    label: 'Satellite Hybrid',
    sublabel: 'High-Res SAR & Earth Optics',
    icon: Globe,
    gradient: 'from-emerald-900/60 to-blue-950/80',
    previewBg: 'bg-[#0f281e] border-emerald-500/40',
  },
  {
    id: 'dark',
    label: 'Dark Maritime',
    sublabel: 'Tactical Command Center',
    icon: Moon,
    gradient: 'from-slate-900 to-cyan-950/60',
    previewBg: 'bg-[#070b14] border-cyan-500/40',
  },
  {
    id: 'ocean',
    label: 'Ocean Bathymetry',
    sublabel: 'Subsea Contours & Depth',
    icon: Waves,
    gradient: 'from-blue-950 to-indigo-950/70',
    previewBg: 'bg-[#0b1b36] border-blue-500/40',
  },
  {
    id: 'standard',
    label: 'Nautical Standard',
    sublabel: 'Daytime Coastal Navigation',
    icon: MapIcon,
    gradient: 'from-slate-800 to-slate-900',
    previewBg: 'bg-[#1a2333] border-slate-400/40',
  },
];

export const MapBasemapSelector: React.FC = () => {
  const { basemap, setBasemap, layers, toggleLayer } = useInvestigation();
  const [isOpen, setIsOpen] = useState(false);

  const activeOption = BASEMAP_OPTIONS.find((b) => b.id === basemap) || BASEMAP_OPTIONS[1];
  const ActiveIcon = activeOption.icon;

  return (
    <div
      className="absolute bottom-10 left-3 z-[1000] font-mono select-none"
      onMouseEnter={() => setIsOpen(true)}
      onMouseLeave={() => setIsOpen(false)}
    >
      {/* Expanded Palette Card */}
      {isOpen && (
        <div className="mb-2.5 p-2.5 bg-[#080d1a]/95 backdrop-blur-md border border-[rgba(255,255,255,0.12)] rounded-xl shadow-2xl space-y-2.5 animate-fade-up min-w-[280px]">
          <div className="flex items-center justify-between px-1 pb-1.5 border-b border-[rgba(255,255,255,0.08)]">
            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-300 tracking-wider">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>BASEMAP SELECTOR</span>
            </div>
            <span className="text-[9px] text-slate-500 uppercase">Google / GIS Tiling</span>
          </div>

          {/* Grid of Basemaps */}
          <div className="grid grid-cols-2 gap-2">
            {BASEMAP_OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const isSelected = basemap === opt.id;
              return (
                <button
                  key={opt.id}
                  onClick={() => setBasemap(opt.id)}
                  className={`p-2 rounded-lg border text-left transition-all duration-150 relative overflow-hidden group ${
                    isSelected
                      ? `${opt.previewBg} ring-1 ring-cyan-400 shadow-md`
                      : 'bg-[#0d1427]/80 border-[rgba(255,255,255,0.06)] hover:border-[rgba(255,255,255,0.18)] hover:bg-[#121c33]'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <Icon
                      className={`w-4 h-4 ${
                        isSelected ? 'text-cyan-400' : 'text-slate-400 group-hover:text-slate-200'
                      }`}
                    />
                    {isSelected && (
                      <span className="w-3.5 h-3.5 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <div
                    className={`text-[10px] font-bold truncate ${
                      isSelected ? 'text-slate-100' : 'text-slate-300'
                    }`}
                  >
                    {opt.label}
                  </div>
                  <div className="text-[8px] text-slate-500 truncate mt-0.5">{opt.sublabel}</div>
                </button>
              );
            })}
          </div>

          {/* Seamarks / OpenSeaMap Overlay Quick Toggle */}
          <div className="pt-2 border-t border-[rgba(255,255,255,0.08)]">
            <button
              onClick={() => toggleLayer('seamarks')}
              className={`w-full flex items-center justify-between px-2 py-1.5 rounded-md border text-[10px] font-semibold transition-colors ${
                layers.seamarks
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  : 'bg-[#0d1427] border-[rgba(255,255,255,0.06)] text-slate-400 hover:text-slate-200'
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Anchor className="w-3.5 h-3.5 text-amber-400" />
                <span>OpenSeaMap Nautical Seamarks</span>
              </div>
              <span
                className={`text-[8px] px-1.5 py-0.5 rounded font-bold ${
                  layers.seamarks ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-500'
                }`}
              >
                {layers.seamarks ? 'ON' : 'OFF'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Collapsed Google Maps-Style Layer Button in Bottom-Left */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="group relative flex items-center gap-2 px-3 py-2 rounded-xl bg-[#080d1a]/95 backdrop-blur-md border border-[rgba(255,255,255,0.12)] text-slate-200 shadow-xl hover:border-cyan-500/50 hover:bg-[#0c152a] transition-all"
        title="Change Basemap Style (Satellite, Dark, Ocean, Standard)"
      >
        <div className="relative w-6 h-6 rounded-md bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/30 flex items-center justify-center overflow-hidden">
          <ActiveIcon className="w-3.5 h-3.5 text-cyan-300 group-hover:scale-110 transition-transform" />
        </div>
        <div className="text-left">
          <span className="text-[8px] text-slate-500 uppercase tracking-widest block leading-tight">
            MAP LAYER
          </span>
          <span className="text-[10px] font-bold text-slate-100 group-hover:text-cyan-300 transition-colors">
            {activeOption.label}
          </span>
        </div>
      </button>
    </div>
  );
};
