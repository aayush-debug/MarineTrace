import React from 'react';
import { Wind, Waves, Thermometer, Compass } from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';

export const EnvironmentalConditionsCard: React.FC = () => {
  const { environmental } = useInvestigation();

  return (
    <div className="bg-[#111827]/80 border border-slate-800 rounded-xl p-4 space-y-3 shadow-sm text-xs">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
        <div className="flex items-center gap-1.5 font-semibold text-slate-200">
          <Waves className="w-4 h-4 text-sky-400" />
          <span>Hydrodynamic Forcing</span>
        </div>
        <span className="text-[10px] text-emerald-400 font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20">
          CMEMS Synced
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Ocean Currents */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Compass className="w-3 h-3 text-blue-400" />
            <span>Surface Current</span>
          </div>
          <div className="text-sm font-bold text-blue-300 font-mono mt-0.5">
            {environmental.currentSpeedKnots.toFixed(2)} kn
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {environmental.currentDirectionDeg}° ({environmental.currentDirectionCardinal})
          </div>
        </div>

        {/* Surface Wind */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Wind className="w-3 h-3 text-sky-400" />
            <span>Surface Wind</span>
          </div>
          <div className="text-sm font-bold text-sky-300 font-mono mt-0.5">
            {environmental.windSpeedKnots.toFixed(1)} kn
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            {environmental.windDirectionDeg}° ({environmental.windDirectionCardinal})
          </div>
        </div>

        {/* Sea Surface Temp */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Thermometer className="w-3 h-3 text-amber-400" />
            <span>SST</span>
          </div>
          <div className="text-sm font-bold text-amber-300 font-mono mt-0.5">
            {environmental.seaSurfaceTempC.toFixed(1)} °C
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Moderate Evaporation</div>
        </div>

        {/* Significant Wave Height */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded-lg">
          <div className="flex items-center gap-1 text-[10px] text-slate-400">
            <Waves className="w-3 h-3 text-indigo-400" />
            <span>Wave Height</span>
          </div>
          <div className="text-sm font-bold text-indigo-300 font-mono mt-0.5">
            {environmental.waveHeightMeters.toFixed(1)} m
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Sea State: Moderate</div>
        </div>
      </div>
    </div>
  );
};

