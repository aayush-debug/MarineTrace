import { Compass, Waves, Wind, Thermometer, Navigation, Cpu, Crosshair } from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import { MaritimeMap } from '../components/map/MaritimeMap';
import { MapLayerControls } from '../components/map/MapLayerControls';
import { MapLegend } from '../components/map/MapLegend';
import { DriftTimelineControl } from '../components/drift/DriftTimelineControl';
import { EnvironmentalConditionsCard } from '../components/drift/EnvironmentalConditionsCard';

const SIM_PARAMS = [
  { label: 'PARTICLES', value: '500', color: 'text-cyan-400' },
  { label: 'PHYSICS CORE', value: 'OpenDrift v1.14', color: 'text-slate-200' },
  { label: 'OCEAN CURRENTS', value: 'CMEMS uo/vo', color: 'text-cyan-300' },
  { label: 'ATMOSPHERIC WIND', value: 'ECMWF 10m', color: 'text-slate-200' },
  { label: 'TIME STEP', value: '15 min', color: 'text-slate-200' },
  { label: 'HINDCAST', value: '24 h', color: 'text-amber-400' },
  { label: 'FORECAST', value: '24 h', color: 'text-emerald-400' },
  { label: 'GRID CRS', value: 'EPSG:4326', color: 'text-slate-400' },
];

export const DriftAnalysis: React.FC = () => {
  const { investigation, environmental } = useInvestigation();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#040814] overflow-hidden select-none">

      {/* NASA Mission Control Header */}
      <div className="px-5 py-2.5 bg-[#070d1d] border-b border-[rgba(0,240,255,0.18)] flex items-center justify-between gap-4 shrink-0 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.25)]">
            <Compass className="w-4.5 h-4.5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-orbitron text-xs sm:text-sm font-bold text-slate-100 uppercase tracking-wider">
                Hydrodynamic Drift Physics Matrix // OpenDrift Ensemble
              </h1>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                STAGE-02
              </span>
            </div>
            <p className="text-[11px] font-mono text-cyan-400/80 mt-0.5">
              OpenDrift 500-Particle Lagrangian Trajectory · Copernicus CMEMS Currents · ECMWF Surface Forcing
            </p>
          </div>
        </div>
        {investigation && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-2 px-3 py-1 bg-amber-950/80 border border-amber-500/40 rounded-md text-xs font-mono font-bold shadow-[0_0_8px_rgba(245,158,11,0.2)]">
              <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
              <span className="text-amber-300">EST. ORIGIN CONFIDENCE:</span>
              <span className="text-amber-200 font-bold font-mono">{(investigation.drift.origin.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Simulation Parameter Telemetry Strip */}
      <div className="h-8 bg-[#060b18] border-b border-[rgba(0,240,255,0.12)] px-5 flex items-center gap-4 text-xs font-mono text-slate-400 overflow-x-auto shrink-0">
        <span className="text-cyan-400 font-bold uppercase tracking-wider">TELEMETRY PARAMS:</span>
        {SIM_PARAMS.map((p, i) => (
          <div key={p.label} className="flex items-center gap-1.5 shrink-0">
            {i > 0 && <span className="text-cyan-900">·</span>}
            <span className="text-slate-500">{p.label}:</span>
            <span className={`font-bold font-mono text-[11px] ${p.color}`}>{p.value}</span>
          </div>
        ))}
      </div>

      {/* Main Mission Control Layout: Map | Right Panel */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* LEFT: Dominant Tactical Map Viewport */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className="h-8 bg-[#070d1d] border-b border-[rgba(0,240,255,0.15)] px-4 flex items-center justify-between text-xs font-mono text-slate-400 shrink-0">
            <div className="flex items-center gap-2 text-cyan-300 font-semibold">
              <Crosshair className="w-3.5 h-3.5 text-cyan-400" />
              <span>500-PARTICLE LAGRANGIAN MONTE CARLO TRAJECTORY</span>
            </div>
            <div className="flex items-center gap-3 text-[10px]">
              <span className="text-cyan-400 font-bold">← REVERSE HINDCAST (ORIGIN)</span>
              <span className="text-cyan-900">|</span>
              <span className="text-emerald-400 font-bold">FORWARD FORECAST (SPREAD) →</span>
            </div>
          </div>
          <div className="flex-1 relative bg-[#030610]">
            <MaritimeMap />
            <MapLayerControls />
            <MapLegend />
          </div>
        </div>

        {/* RIGHT: Tactical Physics Controls Panel */}
        <div className="w-84 bg-[#060b18] border-l border-[rgba(0,240,255,0.18)] flex flex-col overflow-y-auto shrink-0 p-3 space-y-3 shadow-2xl">
          {/* Timeline Scrubber */}
          <DriftTimelineControl />

          {/* Environmental Conditions */}
          <EnvironmentalConditionsCard />

          {/* Metocean Quick Telemetry Reference */}
          <div className="p-3.5 bg-[#081024] border border-cyan-500/25 rounded-md space-y-2.5 font-mono relative">
            <div className="absolute top-1 right-1 w-1.5 h-1.5 border-t border-r border-cyan-400" />
            <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <Waves className="w-3.5 h-3.5 text-cyan-400" />
              <span>METOCEAN TELEMETRY AT T₀</span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-xs">
              {[
                { icon: Wind, label: 'WIND SPEED', value: `${environmental.windSpeedKnots.toFixed(1)} KN`, color: 'text-cyan-300' },
                { icon: Navigation, label: 'WIND DIR', value: `${environmental.windDirectionDeg}° ${environmental.windDirectionCardinal}`, color: 'text-cyan-300' },
                { icon: Waves, label: 'SURFACE CURRENT', value: `${environmental.currentSpeedKnots.toFixed(2)} KN`, color: 'text-sky-300' },
                { icon: Navigation, label: 'CURRENT DIR', value: `${environmental.currentDirectionDeg}° ${environmental.currentDirectionCardinal}`, color: 'text-sky-300' },
                { icon: Thermometer, label: 'SST TEMP', value: `${environmental.seaSurfaceTempC.toFixed(1)}°C`, color: 'text-amber-300' },
                { icon: Waves, label: 'SIG WAVE HT', value: `${environmental.waveHeightMeters.toFixed(1)} M`, color: 'text-indigo-300' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-2 bg-[#040814] p-2 rounded border border-cyan-900/40">
                    <Icon className="w-3.5 h-3.5 text-cyan-500 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-[9px] text-slate-400">{item.label}</div>
                      <div className={`font-bold font-mono text-[10px] ${item.color}`}>{item.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Physics Explanation Module */}
          <div className="p-3 bg-[#081024] border border-cyan-500/20 rounded-md font-mono text-[10px]">
            <div className="flex items-center gap-1.5 mb-1.5 text-xs font-bold text-cyan-300 uppercase">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span>HYDRODYNAMIC ADVECTION DYNAMICS</span>
            </div>
            <p className="text-slate-400 leading-relaxed">
              Backward advection inverts the regional surface current velocity vectors while applying Monte Carlo turbulent diffusion,
              converging the simulated slick envelope onto the probable time and location of discharge.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
