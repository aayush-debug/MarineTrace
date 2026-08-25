import React from 'react';
import { Wind, Waves, Thermometer, Compass } from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';

export const EnvironmentalConditionsCard: React.FC = () => {
  const { environmental } = useInvestigation();

  return (
    <div className="bg-[#0e1626] border border-slate-800 rounded-lg p-4 font-mono space-y-3 shadow-lg text-xs">
      <div className="flex items-center justify-between border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-cyan-400" />
          <span className="font-bold text-slate-200 tracking-wider">
            METOCEAN CONDITIONS
          </span>
        </div>
        <span className="text-[10px] text-cyan-400 font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 border border-cyan-500/20">
          COPERNICUS MARINE SYNCED
        </span>
      </div>

      <div className="grid grid-cols-2 gap-2.5">
        {/* Ocean Currents */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase">
            <Compass className="w-3.5 h-3.5 text-blue-400" />
            <span>Ocean Currents</span>
          </div>
          <div className="text-base font-bold text-blue-300 mt-1">
            {environmental.currentSpeedKnots.toFixed(2)} kn
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            Bearing: {environmental.currentDirectionDeg}° ({environmental.currentDirectionCardinal})
          </div>
        </div>

        {/* Surface Wind */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase">
            <Wind className="w-3.5 h-3.5 text-cyan-400" />
            <span>Surface Wind</span>
          </div>
          <div className="text-base font-bold text-cyan-300 mt-1">
            {environmental.windSpeedKnots.toFixed(1)} kn
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">
            From: {environmental.windDirectionDeg}° ({environmental.windDirectionCardinal})
          </div>
        </div>

        {/* Sea Surface Temp */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase">
            <Thermometer className="w-3.5 h-3.5 text-amber-400" />
            <span>Sea Surface Temp</span>
          </div>
          <div className="text-base font-bold text-amber-300 mt-1">
            {environmental.seaSurfaceTempC.toFixed(1)} °C
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">Moderate Evaporation Rate</div>
        </div>

        {/* Significant Wave Height */}
        <div className="bg-slate-900/90 border border-slate-800 p-2.5 rounded">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 uppercase">
            <Waves className="w-3.5 h-3.5 text-emerald-400" />
            <span>Wave Height</span>
          </div>
          <div className="text-base font-bold text-emerald-300 mt-1">
            {environmental.waveHeightMeters.toFixed(1)} m
          </div>
          <div className="text-[10px] text-slate-400 mt-0.5">State: Slight to Moderate</div>
        </div>
      </div>
    </div>
  );
};
