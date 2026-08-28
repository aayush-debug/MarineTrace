import { Compass, Waves, Wind, Thermometer, Navigation, Cpu, Crosshair } from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import { MaritimeMap } from '../components/map/MaritimeMap';
import { MapLayerControls } from '../components/map/MapLayerControls';
import { MapLegend } from '../components/map/MapLegend';
import { DriftTimelineControl } from '../components/drift/DriftTimelineControl';
import { EnvironmentalConditionsCard } from '../components/drift/EnvironmentalConditionsCard';

const SIM_PARAMS = [
  { label: 'Particles', value: '500', color: 'text-slate-200' },
  { label: 'Physics Core', value: 'OpenDrift v1.14', color: 'text-slate-200' },
  { label: 'Current Vectors', value: 'CMEMS uo/vo', color: 'text-blue-400' },
  { label: 'Wind Forcing', value: 'ECMWF 10m', color: 'text-slate-200' },
  { label: 'Euler Step', value: '15 min', color: 'text-slate-200' },
  { label: 'Hindcast', value: '24 h', color: 'text-amber-400' },
  { label: 'Forecast', value: '24 h', color: 'text-emerald-400' },
  { label: 'Geodetic CRS', value: 'EPSG:4326', color: 'text-slate-400' },
];

export const DriftAnalysis: React.FC = () => {
  const { investigation, environmental } = useInvestigation();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#0c1017] overflow-hidden select-none">

      {/* Header */}
      <div className="px-4 py-2.5 bg-[#111622] border-b border-[#1e293b] flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-[#161e2e] border border-slate-800 flex items-center justify-center text-blue-400">
            <Compass className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-semibold text-slate-100">
                Hydrodynamic Advection & Drift Physics // OpenDrift Ensemble
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60 font-medium">
                Stage 2
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              500-Particle Lagrangian Monte Carlo Advection · Copernicus CMEMS Currents · ECMWF Surface Wind Fields
            </p>
          </div>
        </div>
        {investigation && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-950/70 border border-amber-800/60 rounded text-xs font-mono font-medium">
              <span className="w-2 h-2 rounded-full bg-amber-400" />
              <span className="text-amber-300">Origin Confidence:</span>
              <span className="text-amber-100 font-semibold font-mono">{(investigation.drift.origin.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Simulation Parameter Telemetry Strip */}
      <div className="h-8 bg-[#0e131d] border-b border-[#1e293b] px-4 flex items-center gap-4 text-xs font-mono text-slate-400 overflow-x-auto shrink-0">
        <span className="text-slate-500 font-semibold uppercase text-[11px]">Parameters:</span>
        {SIM_PARAMS.map((p, i) => (
          <div key={p.label} className="flex items-center gap-1.5 shrink-0">
            {i > 0 && <span className="text-slate-700">·</span>}
            <span className="text-slate-500">{p.label}:</span>
            <span className={`font-medium text-[11px] ${p.color}`}>{p.value}</span>
          </div>
        ))}
      </div>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* LEFT: GIS Map Viewport */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className="h-7 bg-[#111622] border-b border-[#1e293b] px-3 flex items-center justify-between text-xs text-slate-400 shrink-0">
            <div className="flex items-center gap-1.5 text-slate-300 font-medium">
              <Crosshair className="w-3.5 h-3.5 text-blue-400" />
              <span>500-Particle Lagrangian Advection Ensemble</span>
            </div>
            <div className="flex items-center gap-3 text-[11px] font-mono">
              <span className="text-amber-400 font-medium">← Reverse Hindcast (Origin)</span>
              <span className="text-slate-700">|</span>
              <span className="text-emerald-400 font-medium">Forward Forecast (Dispersion) →</span>
            </div>
          </div>
          <div className="flex-1 relative bg-[#0b0f17]">
            <MaritimeMap />
            <MapLayerControls />
            <MapLegend />
          </div>
        </div>

        {/* RIGHT: Physics Controls Panel */}
        <div className="w-80 bg-[#111622] border-l border-[#1e293b] flex flex-col overflow-y-auto shrink-0 p-3 space-y-3">
          {/* Timeline Scrubber */}
          <DriftTimelineControl />

          {/* Environmental Conditions */}
          <EnvironmentalConditionsCard />

          {/* Metocean Telemetry Summary */}
          <div className="p-3.5 bg-[#161e2e] border border-slate-800 rounded space-y-2.5">
            <div className="text-xs font-semibold text-slate-200 uppercase tracking-wide flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-blue-400" />
              <span>Metocean Forcing at T₀</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { icon: Wind, label: 'Wind Speed', value: `${environmental.windSpeedKnots.toFixed(1)} kn`, color: 'text-slate-200' },
                { icon: Navigation, label: 'Wind Direction', value: `${environmental.windDirectionDeg}° ${environmental.windDirectionCardinal}`, color: 'text-slate-200' },
                { icon: Waves, label: 'Surface Current', value: `${environmental.currentSpeedKnots.toFixed(2)} kn`, color: 'text-blue-400' },
                { icon: Navigation, label: 'Current Direction', value: `${environmental.currentDirectionDeg}° ${environmental.currentDirectionCardinal}`, color: 'text-blue-400' },
                { icon: Thermometer, label: 'Sea Temp (SST)', value: `${environmental.seaSurfaceTempC.toFixed(1)}°C`, color: 'text-amber-400' },
                { icon: Waves, label: 'Sig Wave Height', value: `${environmental.waveHeightMeters.toFixed(1)} m`, color: 'text-slate-300' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-2 bg-[#0e131d] p-2 rounded border border-slate-800/80">
                    <Icon className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[10px] text-slate-500">{item.label}</div>
                      <div className={`font-mono font-medium text-[11px] ${item.color}`}>{item.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Physics Explanation Module */}
          <div className="p-3 bg-[#161e2e] border border-slate-800 rounded text-xs">
            <div className="flex items-center gap-1.5 mb-1.5 text-xs font-semibold text-slate-200 uppercase tracking-wide">
              <Cpu className="w-3.5 h-3.5 text-blue-400" />
              <span>Lagrangian Dynamics</span>
            </div>
            <p className="text-slate-400 leading-relaxed text-[11px]">
              Backward advection inverts regional surface current vectors while applying Monte Carlo turbulent diffusion,
              converging the simulated slick envelope onto the probable time and geodetic coordinate of discharge.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
