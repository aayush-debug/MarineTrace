import React from 'react';
import { Compass, Waves, ArrowDownRight, Atom } from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';

export const DriftPhysicsCard: React.FC = () => {
  const { investigation, environmental } = useInvestigation();

  if (!investigation) return null;

  const { drift } = investigation;

  return (
    <div className="bg-[#111622] border border-[#1e293b] rounded p-4 space-y-4 shadow-sm text-xs font-sans select-none">
      {/* ── Header ── */}
      <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded bg-blue-950 border border-blue-800/60 flex items-center justify-center text-blue-400">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-slate-100 text-xs uppercase tracking-wide">
              Hydrodynamic Drift Physics
            </h3>
            <span className="text-[10px] text-slate-400 font-mono">
              Vector Decomposition & Advection Dynamics
            </span>
          </div>
        </div>
        <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60">
          OpenDrift / INCOIS Core
        </span>
      </div>

      {/* ── 1. Governing Advection Equation ── */}
      <div className="p-3 bg-[#0c1017] rounded border border-[#1e293b] space-y-2 font-mono">
        <div className="flex items-center justify-between text-[11px] text-slate-400">
          <span className="font-semibold text-blue-400">Governing Advection Equation:</span>
          <span className="text-slate-500 text-[10px]">Lagrangian Transport</span>
        </div>
        <div className="p-2 bg-[#161e2e] rounded border border-[#1e293b] text-center text-slate-100 font-bold text-xs tracking-wider">
          <span className="text-blue-400">V&#8407;</span><sub>drift</sub> ={' '}
          <span className="text-emerald-400">U&#8407;</span><sub>current</sub> +{' '}
          <span className="text-amber-400">&alpha; &middot; W&#8407;</span><sub>wind</sub> +{' '}
          <span className="text-cyan-400">U&#8407;</span><sub>Stokes</sub>
        </div>
        <p className="text-[10px] text-slate-400 leading-relaxed font-sans">
          Total slick velocity is the vector sum of ambient ocean currents, 3.1% surface wind leeway drag (&alpha; = 0.031), and wave-induced Stokes mass drift.
        </p>
      </div>

      {/* ── 2. Why Location Changed: 24h Displacement Metrics ── */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 font-mono">
          <ArrowDownRight className="w-3.5 h-3.5 text-blue-400" />
          <span>24-Hour Spatial Displacement Analysis</span>
        </div>

        <div className="grid grid-cols-2 gap-2 font-mono text-[11px]">
          <div className="p-2.5 bg-[#161e2e] border border-[#1e293b] rounded space-y-1">
            <span className="text-[10px] text-slate-500 block">Discharge Point (T-24h)</span>
            <span className="font-bold text-amber-300 block">
              {drift.origin.latitude.toFixed(3)}°N, {drift.origin.longitude.toFixed(3)}°E
            </span>
            <span className="text-[9px] text-slate-500 block">Upstream Discharge Area</span>
          </div>

          <div className="p-2.5 bg-[#161e2e] border border-[#1e293b] rounded space-y-1">
            <span className="text-[10px] text-slate-500 block">Slick Position (T₀ Obs)</span>
            <span className="font-bold text-blue-300 block">
              18.822°N, 72.418°E
            </span>
            <span className="text-[9px] text-slate-500 block">Satellite Radar Delineation</span>
          </div>
        </div>

        <div className="p-2.5 bg-[#161e2e] border border-[#1e293b] rounded space-y-1.5">
          <div className="flex justify-between items-center text-[11px] font-mono">
            <span className="text-slate-400">Total Net Displacement:</span>
            <span className="font-bold text-slate-100">38.6 km (20.8 NM)</span>
          </div>
          <div className="flex justify-between items-center text-[11px] font-mono">
            <span className="text-slate-400">Mean Drift Direction:</span>
            <span className="font-bold text-blue-400">142° (South-East Bearing)</span>
          </div>
          <div className="flex justify-between items-center text-[11px] font-mono">
            <span className="text-slate-400">Effective Drift Speed:</span>
            <span className="font-bold text-emerald-400">1.61 km/h (0.87 knots)</span>
          </div>
        </div>
      </div>

      {/* ── 3. Metocean Vector Contribution Breakdown ── */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 font-mono">
          <Waves className="w-3.5 h-3.5 text-blue-400" />
          <span>Vector Driving Force Breakdown</span>
        </div>

        <div className="space-y-1.5 text-xs">
          {/* Surface Current */}
          <div className="p-2 bg-[#0c1017] border border-[#1e293b] rounded flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
              <div>
                <span className="font-semibold text-slate-200 block text-[11px]">Regional Surface Current</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {environmental.currentSpeedKnots.toFixed(2)} kn @ {environmental.currentDirectionDeg}° ({environmental.currentDirectionCardinal})
                </span>
              </div>
            </div>
            <span className="text-emerald-400 font-mono font-bold text-[11px]">68% Force</span>
          </div>

          {/* Wind Leeway */}
          <div className="p-2 bg-[#0c1017] border border-[#1e293b] rounded flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <div>
                <span className="font-semibold text-slate-200 block text-[11px]">Wind Leeway Drag (&alpha; = 3.1%)</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  {environmental.windSpeedKnots.toFixed(1)} kn wind &rarr; 0.38 kn drag
                </span>
              </div>
            </div>
            <span className="text-amber-400 font-mono font-bold text-[11px]">28% Force</span>
          </div>

          {/* Stokes Drift */}
          <div className="p-2 bg-[#0c1017] border border-[#1e293b] rounded flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 shrink-0" />
              <div>
                <span className="font-semibold text-slate-200 block text-[11px]">Stokes Wave Mass Drift</span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Wave height {environmental.waveHeightMeters.toFixed(1)}m (T_p = 5.8s)
                </span>
              </div>
            </div>
            <span className="text-cyan-400 font-mono font-bold text-[11px]">4% Force</span>
          </div>
        </div>
      </div>

      {/* ── 4. Weathering & Emulsification Physics ── */}
      <div className="p-3 bg-[#161e2e] border border-[#1e293b] rounded space-y-2">
        <div className="text-[11px] font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5 font-mono">
          <Atom className="w-3.5 h-3.5 text-blue-400" />
          <span>Fay's Spreading & Weathering Dynamics</span>
        </div>
        <div className="space-y-1 text-[11px] text-slate-400 leading-relaxed">
          <div className="flex justify-between font-mono text-[10px]">
            <span className="text-slate-500">Evaporative Loss (24h):</span>
            <span className="text-slate-200 font-bold">28.5% (C&#8321;&ndash;C&#8321;&#8322; Aliphatics)</span>
          </div>
          <div className="flex justify-between font-mono text-[10px]">
            <span className="text-slate-500">Water Uptake (Emulsion):</span>
            <span className="text-amber-400 font-bold">68.2% (Chocolate Mousse)</span>
          </div>
          <div className="flex justify-between font-mono text-[10px]">
            <span className="text-slate-500">Viscosity Increase:</span>
            <span className="text-rose-400 font-bold">18 cSt &rarr; 12,400 cSt</span>
          </div>
          <div className="flex justify-between font-mono text-[10px]">
            <span className="text-slate-500">Horizontal Diffusion (K_xy):</span>
            <span className="text-blue-400 font-bold">10.0 m&sup2;/s (Monte Carlo)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
