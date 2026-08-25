import { Compass, Waves, AlertCircle, Wind, Thermometer, Navigation, Clock } from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import { MaritimeMap } from '../components/map/MaritimeMap';
import { MapLayerControls } from '../components/map/MapLayerControls';
import { MapLegend } from '../components/map/MapLegend';
import { DriftTimelineControl } from '../components/drift/DriftTimelineControl';
import { EnvironmentalConditionsCard } from '../components/drift/EnvironmentalConditionsCard';

const SIM_PARAMS = [
  { label: 'Particles', value: '500', color: 'text-cyan-400' },
  { label: 'Engine', value: 'OpenDrift', color: 'text-blue-400' },
  { label: 'Currents', value: 'CMEMS', color: 'text-indigo-400' },
  { label: 'Winds', value: 'ECMWF', color: 'text-violet-400' },
  { label: 'Timestep', value: '15 min', color: 'text-slate-300' },
  { label: 'Hindcast', value: '24 h', color: 'text-amber-400' },
  { label: 'Forecast', value: '24 h', color: 'text-emerald-400' },
  { label: 'CRS', value: 'EPSG:4326', color: 'text-slate-400' },
];

export const DriftAnalysis: React.FC = () => {
  const { investigation, environmental } = useInvestigation();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#05080f] overflow-hidden font-mono">

      {/* Page Header */}
      <div className="px-5 py-3 bg-[#080d18] border-b border-[rgba(255,255,255,0.07)] flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <Compass className="w-4 h-4 text-cyan-400" />
          <div>
            <h1 className="text-[12px] font-bold text-slate-100 tracking-wider">
              SPILL DRIFT RECONSTRUCTION & FORWARD FORECAST
            </h1>
            <p className="text-[9px] text-slate-600 mt-0.5">
              OpenDrift physical trajectory modeling · Copernicus Marine hydrodynamic currents · ECMWF surface winds
            </p>
          </div>
        </div>
        {investigation && (
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1.5 px-2.5 py-1 bg-amber-500/8 border border-amber-500/15 rounded text-[9px] font-mono">
              <AlertCircle className="w-3 h-3 text-amber-400" />
              <span className="text-amber-400">Origin Confidence: </span>
              <span className="text-amber-300 font-bold">{(investigation.drift.origin.confidence * 100).toFixed(0)}%</span>
            </div>
          </div>
        )}
      </div>

      {/* Simulation Parameter Strip */}
      <div className="h-9 bg-[#080d18] border-b border-[rgba(255,255,255,0.05)] px-5 flex items-center gap-5 text-[9px] font-mono text-slate-500 overflow-x-auto shrink-0">
        <div className="flex items-center gap-1.5 shrink-0">
          <Waves className="w-3 h-3 text-blue-400" />
          <span className="tracking-widest uppercase text-blue-400/70">Simulation Parameters</span>
        </div>
        {SIM_PARAMS.map((p, i) => (
          <div key={p.label} className="flex items-center gap-1.5 shrink-0">
            {i > 0 && <span className="text-slate-800">·</span>}
            <span className="text-slate-600">{p.label}:</span>
            <span className={`font-bold ${p.color}`}>{p.value}</span>
          </div>
        ))}
      </div>

      {/* Main Layout: Map | Right Panel */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* LEFT: Dominant Map */}
        <div className="flex-1 flex flex-col min-h-0 relative">
          <div className="h-9 bg-[#0a0f1d] border-b border-[rgba(255,255,255,0.06)] px-3 flex items-center justify-between text-[10px] font-mono shrink-0">
            <span className="font-bold text-slate-300 tracking-widest">
              VECTOR RECONSTRUCTION VIEW — 500-PARTICLE ENSEMBLE
            </span>
            <div className="flex items-center gap-3 text-slate-600">
              <span>← Hindcast 24h</span>
              <span>·</span>
              <span>Forecast 24h →</span>
            </div>
          </div>
          <div className="flex-1 relative">
            <MaritimeMap />
            <MapLayerControls />
            <MapLegend />
          </div>
        </div>

        {/* RIGHT: Controls Panel */}
        <div className="w-72 bg-[#080d18] border-l border-[rgba(255,255,255,0.07)] flex flex-col overflow-y-auto shrink-0 p-3 space-y-3">
          {/* Timeline Scrubber */}
          <DriftTimelineControl />

          {/* Environmental Conditions */}
          <EnvironmentalConditionsCard />

          {/* Current Conditions Quick Reference */}
          <div className="p-3 bg-[#0d1427] border border-[rgba(255,255,255,0.07)] rounded-lg">
            <div className="text-[9px] font-bold text-slate-400 tracking-widest uppercase mb-3">
              METOCEAN CONDITIONS
            </div>
            <div className="grid grid-cols-2 gap-2 text-[9px]">
              {[
                { icon: Wind, label: 'Wind Speed', value: `${environmental.windSpeedKnots.toFixed(1)} kn`, color: 'text-cyan-400' },
                { icon: Navigation, label: 'Wind Dir.', value: `${environmental.windDirectionDeg}° ${environmental.windDirectionCardinal}`, color: 'text-cyan-400' },
                { icon: Waves, label: 'Current', value: `${environmental.currentSpeedKnots.toFixed(2)} kn`, color: 'text-blue-400' },
                { icon: Navigation, label: 'Current Dir.', value: `${environmental.currentDirectionDeg}° ${environmental.currentDirectionCardinal}`, color: 'text-blue-400' },
                { icon: Thermometer, label: 'SST', value: `${environmental.seaSurfaceTempC.toFixed(1)}°C`, color: 'text-amber-400' },
                { icon: Waves, label: 'Wave Height', value: `${environmental.waveHeightMeters.toFixed(1)} m`, color: 'text-indigo-400' },
              ].map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="flex items-start gap-1.5">
                    <Icon className="w-3 h-3 text-slate-600 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-slate-600">{item.label}</div>
                      <div className={`font-bold ${item.color}`}>{item.value}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Physics Explanation */}
          <div className="p-3 bg-[#0a0f20] border border-[rgba(255,255,255,0.05)] rounded-lg">
            <div className="flex items-center gap-1.5 mb-2">
              <Waves className="w-3 h-3 text-blue-500" />
              <span className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">Simulation Mechanics</span>
            </div>
            <p className="text-[9px] text-slate-600 leading-relaxed">
              Backtracking inverts advective current velocity vectors while maintaining physical turbulent diffusion,
              converging particles toward the historical discharge envelope.
            </p>
            {investigation && (
              <div className="mt-2 pt-2 border-t border-[rgba(255,255,255,0.05)] text-[9px] font-mono space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-600">Origin lat:</span>
                  <span className="text-amber-400">{investigation.drift.origin.latitude.toFixed(4)}°N</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Origin lon:</span>
                  <span className="text-amber-400">{investigation.drift.origin.longitude.toFixed(4)}°E</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Window start:</span>
                  <span className="text-slate-300 text-[8px]">
                    <Clock className="w-2 h-2 inline mr-0.5" />
                    {new Date(investigation.drift.origin_time_window.start).toLocaleTimeString()} UTC
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Window end:</span>
                  <span className="text-slate-300 text-[8px]">
                    {new Date(investigation.drift.origin_time_window.end).toLocaleTimeString()} UTC
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
