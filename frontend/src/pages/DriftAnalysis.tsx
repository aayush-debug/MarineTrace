import { Compass, Waves, Wind, Thermometer, Navigation } from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import { MaritimeMap } from '../components/map/MaritimeMap';
import { MapLayerControls } from '../components/map/MapLayerControls';
import { MapLegend } from '../components/map/MapLegend';
import { DriftTimelineControl } from '../components/drift/DriftTimelineControl';
import { EnvironmentalConditionsCard } from '../components/drift/EnvironmentalConditionsCard';

const SIM_PARAMS = [
  { label: 'Particles', value: '500', color: 'text-sky-400' },
  { label: 'Physics Model', value: 'OpenDrift', color: 'text-slate-200' },
  { label: 'Currents', value: 'CMEMS', color: 'text-slate-200' },
  { label: 'Winds', value: 'ECMWF', color: 'text-slate-200' },
  { label: 'Timestep', value: '15 min', color: 'text-slate-200' },
  { label: 'Hindcast', value: '24 h', color: 'text-amber-400' },
  { label: 'Forecast', value: '24 h', color: 'text-emerald-400' },
  { label: 'CRS', value: 'EPSG:4326', color: 'text-slate-400' },
];

export const DriftAnalysis: React.FC = () => {
  const { investigation, environmental } = useInvestigation();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#090d16] overflow-hidden">

      {/* Page Header */}
      <div className="px-5 py-3 bg-[#0c121e] border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <Compass className="w-5 h-5 text-sky-400" />
          <div>
            <h1 className="text-sm font-semibold text-slate-100">
              Spill Drift Reconstruction & 24h Forward Spread
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              OpenDrift Lagrangian trajectory modeling · Copernicus Marine currents · ECMWF surface wind forcing
            </p>
          </div>
        </div>
        {investigation && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-3 py-1 bg-amber-500/10 border border-amber-500/20 rounded-full text-xs font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-amber-400">Origin Confidence: </span>
              <span className="text-amber-300 font-bold font-mono">{(investigation.drift.origin.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Simulation Parameter Strip */}
      <div className="h-8 bg-[#0c121e]/60 border-b border-[rgba(255,255,255,0.06)] px-5 flex items-center gap-4 text-xs text-slate-400 overflow-x-auto shrink-0">
        <span className="text-slate-500 font-medium">Simulation Setup:</span>
        {SIM_PARAMS.map((p, i) => (
          <div key={p.label} className="flex items-center gap-1.5 shrink-0">
            {i > 0 && <span className="text-slate-800">·</span>}
            <span className="text-slate-500">{p.label}:</span>
            <span className={`font-semibold font-mono text-[11px] ${p.color}`}>{p.value}</span>
          </div>
        ))}
      </div>

      {/* Main Layout: Map | Right Panel */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* LEFT: Dominant Map */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className="h-8 bg-[#0e1422] border-b border-[rgba(255,255,255,0.06)] px-4 flex items-center justify-between text-xs text-slate-400 shrink-0">
            <span className="font-medium text-slate-300">
              Vector Reconstruction View — 500-Particle Lagrangian Ensemble
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="text-sky-400">← Hindcast 24h</span>
              <span className="text-slate-700">·</span>
              <span className="text-emerald-400">Forecast 24h →</span>
            </div>
          </div>
          <div className="flex-1 relative">
            <MaritimeMap />
            <MapLayerControls />
            <MapLegend />
          </div>
        </div>

        {/* RIGHT: Controls Panel */}
        <div className="w-80 bg-[#0c121e] border-l border-[rgba(255,255,255,0.08)] flex flex-col overflow-y-auto shrink-0 p-3 space-y-3">
          {/* Timeline Scrubber */}
          <DriftTimelineControl />

          {/* Environmental Conditions */}
          <EnvironmentalConditionsCard />

          {/* Metocean Quick Reference */}
          <div className="p-3.5 bg-slate-900/70 border border-slate-800 rounded-xl space-y-2.5">
            <div className="text-xs font-semibold text-slate-200">
              Metocean Conditions at Observation
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { icon: Wind, label: 'Wind Speed', value: `${environmental.windSpeedKnots.toFixed(1)} kn`, color: 'text-sky-400' },
                { icon: Navigation, label: 'Wind Dir.', value: `${environmental.windDirectionDeg}° ${environmental.windDirectionCardinal}`, color: 'text-sky-400' },
                { icon: Waves, label: 'Current', value: `${environmental.currentSpeedKnots.toFixed(2)} kn`, color: 'text-blue-400' },
                { icon: Navigation, label: 'Current Dir.', value: `${environmental.currentDirectionDeg}° ${environmental.currentDirectionCardinal}`, color: 'text-blue-400' },
                { icon: Thermometer, label: 'SST', value: `${environmental.seaSurfaceTempC.toFixed(1)}°C`, color: 'text-amber-400' },
                { icon: Waves, label: 'Wave Height', value: `${environmental.waveHeightMeters.toFixed(1)} m`, color: 'text-indigo-400' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-2 bg-slate-950/40 p-2 rounded-lg border border-slate-800/60">
                    <Icon className="w-3.5 h-3.5 text-slate-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] text-slate-400">{item.label}</div>
                      <div className={`font-semibold font-mono text-[11px] ${item.color}`}>{item.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Physics Explanation */}
          <div className="p-3 bg-slate-900/40 border border-slate-800/60 rounded-xl">
            <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-slate-300">
              <Waves className="w-3.5 h-3.5 text-sky-400" />
              <span>Hydrodynamic Advection Mechanics</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Backward advection inverts the regional surface current velocity vectors while applying Monte Carlo turbulent diffusion,
              converging the simulated slick envelope onto the probable time and location of discharge.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

