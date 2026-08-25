import React from 'react';
import { Compass, Waves, AlertCircle } from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import { MaritimeMap } from '../components/map/MaritimeMap';
import { MapLayerControls } from '../components/map/MapLayerControls';
import { MapLegend } from '../components/map/MapLegend';
import { DriftTimelineControl } from '../components/drift/DriftTimelineControl';
import { EnvironmentalConditionsCard } from '../components/drift/EnvironmentalConditionsCard';

export const DriftAnalysis: React.FC = () => {
  const { investigation } = useInvestigation();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#060a12] overflow-y-auto font-mono p-4 sm:p-6 space-y-4">
      {/* Title */}
      <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Compass className="w-5 h-5 text-cyan-400" />
            <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-wide">
              SPILL DRIFT RECONSTRUCTION & FORWARD FORECAST
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            OpenDrift physical trajectory modeling using Copernicus Marine hydrodynamic currents and ECMWF surface winds.
          </p>
        </div>
      </div>

      {/* Main Grid: Map & Controls */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-4 flex-1 min-h-[550px]">
        {/* Left Column: Interactive Map */}
        <div className="xl:col-span-8 relative rounded-lg overflow-hidden border border-slate-800 shadow-2xl min-h-[480px] flex flex-col">
          <div className="bg-[#0b101f] px-3 py-2 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-slate-200">
              VECTOR RECONSTRUCTION VIEW — 500-PARTICLE ENSEMBLE
            </span>
            <span className="text-cyan-400 text-[11px]">Time Step: -15 min</span>
          </div>

          <div className="flex-1 relative">
            <MaritimeMap />
            <MapLayerControls />
            <MapLegend />
          </div>
        </div>

        {/* Right Column: Timeline Controls & Metocean Conditions */}
        <div className="xl:col-span-4 space-y-4 flex flex-col">
          <DriftTimelineControl />
          <EnvironmentalConditionsCard />

          {/* Theoretical Physics Info Card */}
          <div className="p-3 bg-[#0d1424] border border-slate-800 rounded-lg text-xs space-y-2 text-slate-300">
            <div className="font-bold text-cyan-400 uppercase text-[10px] flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5" />
              <span>HYDRODYNAMIC SIMULATION MECHANICS</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Backtracking inverts the advective current velocity vectors while maintaining physical turbulent diffusion, converging particles toward the historical discharge envelope.
            </p>
            {investigation && (
              <div className="text-[10px] text-amber-300 font-mono border-t border-slate-800 pt-1.5 flex items-center gap-1">
                <AlertCircle className="w-3 h-3 text-amber-400" />
                <span>Estimated Origin Confidence: {(investigation.drift.origin.confidence * 100).toFixed(0)}%</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
