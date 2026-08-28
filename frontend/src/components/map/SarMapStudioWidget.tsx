import React, { useState } from 'react';
import {
  Satellite,
  Eye,
  EyeOff,
  ChevronDown,
  ChevronUp,
  CheckCircle2,
} from 'lucide-react';
import { useInvestigation, type SARChannelType } from '../../context/InvestigationContext';

export const SarMapStudioWidget: React.FC = () => {
  const {
    investigation,
    layers,
    toggleLayer,
    sarConfig,
    updateSarConfig,
  } = useInvestigation();

  const [isExpanded, setIsExpanded] = useState<boolean>(true);

  if (!investigation) return null;

  const channels: { id: SARChannelType; label: string; desc: string }[] = [
    { id: 'composite', label: 'Dual-Pol', desc: 'VV+VH False Color' },
    { id: 'VV', label: 'VV (dB)', desc: 'Co-polarization' },
    { id: 'VH', label: 'VH (dB)', desc: 'Cross-polarization' },
    { id: 'prob', label: 'AI Heatmap', desc: 'U-Net Probabilities' },
    { id: 'mask', label: 'Binary Mask', desc: 'Thresholded' },
  ];

  return (
    <div className="absolute top-3 left-3 z-[1000] font-sans select-none max-w-xs w-80">
      {/* ── Collapsed Pill Trigger ── */}
      {!isExpanded ? (
        <button
          onClick={() => setIsExpanded(true)}
          className="bg-[#111622]/95 hover:bg-[#161e2e] text-slate-200 border border-cyan-500/50 rounded-lg px-3 py-2 shadow-2xl backdrop-blur-md flex items-center gap-2 text-xs font-semibold transition-all cursor-pointer group"
        >
          <div className="w-5 h-5 rounded bg-cyan-950/80 border border-cyan-500/60 flex items-center justify-center text-cyan-400">
            <Satellite className="w-3.5 h-3.5 group-hover:rotate-12 transition-transform" />
          </div>
          <span>Sentinel-1 SAR Studio</span>
          <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold ${
            layers.sar ? 'bg-cyan-950 text-cyan-300 border border-cyan-800' : 'bg-slate-800 text-slate-400'
          }`}>
            {layers.sar ? 'LIVE' : 'OFF'}
          </span>
          <ChevronUp className="w-3.5 h-3.5 text-slate-400 ml-auto" />
        </button>
      ) : (
        /* ── Expanded Full Radar Control Studio ── */
        <div className="bg-[#111622]/95 border border-[#1e293b] rounded-xl shadow-2xl backdrop-blur-md overflow-hidden text-xs text-slate-200">
          
          {/* Header */}
          <div className="px-3 py-2 bg-[#161e2e] border-b border-[#1e293b] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded bg-cyan-950/80 border border-cyan-500/60 flex items-center justify-center text-cyan-400">
                <Satellite className="w-3 h-3" />
              </div>
              <span className="font-bold text-slate-100 tracking-tight">
                Sentinel-1 SAR Studio
              </span>
            </div>

            <div className="flex items-center gap-1.5">
              {/* On/Off Toggle Button */}
              <button
                onClick={() => toggleLayer('sar')}
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold transition-colors cursor-pointer border ${
                  layers.sar
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-700/80 hover:bg-cyan-900/60'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
                }`}
                title="Toggle SAR Satellite Raster Layer"
              >
                {layers.sar ? '● ACTIVE' : '○ DISABLED'}
              </button>

              <button
                onClick={() => setIsExpanded(false)}
                className="text-slate-400 hover:text-slate-200 p-0.5 rounded transition-colors cursor-pointer"
                title="Minimize Panel"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="p-3 space-y-3">
            
            {/* 1. Band / Polarization Channel Selection */}
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                <span>Radar Band / Product</span>
                <span className="text-cyan-400 font-bold">{sarConfig.channel}</span>
              </div>
              <div className="grid grid-cols-3 gap-1">
                {channels.map((ch) => {
                  const isSelected = sarConfig.channel === ch.id;
                  return (
                    <button
                      key={ch.id}
                      onClick={() => updateSarConfig({ channel: ch.id })}
                      className={`p-1.5 rounded border text-left transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-cyan-950/70 border-cyan-500 text-cyan-200 font-bold shadow-sm'
                          : 'bg-[#0c1017] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                      }`}
                    >
                      <div className="text-[11px] leading-none">{ch.label}</div>
                      <div className="text-[8.5px] text-slate-500 truncate mt-0.5 font-mono">{ch.desc}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 2. Raster Opacity Slider */}
            <div>
              <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>Radar Overlay Opacity</span>
                <span className="text-slate-200 font-bold">{(sarConfig.opacity * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={sarConfig.opacity}
                onChange={(e) => updateSarConfig({ opacity: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
              />
            </div>

            {/* 3. Verification & Comparison Controls */}
            <div className="p-2 bg-[#0c1017] rounded-lg border border-slate-800 space-y-2">
              <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider flex items-center justify-between">
                <span>Visual Match Verification</span>
                <span className="text-emerald-400 font-bold flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {(investigation.spill.confidence * 100).toFixed(1)}% Match
                </span>
              </div>

              {/* Toggle Vector Slick Layer right over the radar */}
              <button
                onClick={() => toggleLayer('spill')}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded text-[11px] border transition-colors cursor-pointer ${
                  layers.spill
                    ? 'bg-rose-950/50 border-rose-600/70 text-rose-200 font-medium'
                    : 'bg-[#161e2e] border-slate-800 text-slate-400 hover:text-slate-300'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full bg-rose-500 ${!layers.spill ? 'opacity-30' : ''}`} />
                  <span>Highlight Red Oil Slick Boundary</span>
                </div>
                {layers.spill ? <Eye className="w-3.5 h-3.5 text-rose-400" /> : <EyeOff className="w-3.5 h-3.5 text-slate-600" />}
              </button>
            </div>

            {/* 4. Physical Radar Telemetry */}
            <div className="grid grid-cols-2 gap-1.5 text-[9.5px] font-mono text-slate-400 pt-1 border-t border-slate-800">
              <div>
                <span className="text-slate-500 block">Mean σ₀ Backscatter</span>
                <strong className="text-slate-200 font-bold">-24.8 dB (Damped)</strong>
              </div>
              <div>
                <span className="text-slate-500 block">Suppression Ratio</span>
                <strong className="text-cyan-400 font-bold">7.4 dB vs Sea</strong>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
