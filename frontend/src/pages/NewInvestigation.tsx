import React, { useState } from 'react';
import {
  AlertCircle,
  Play,
  Calendar,
  Compass,
  Satellite,
  Zap,
  Ship,
  Waves,
  ShieldAlert,
  CheckCircle2,
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';

interface ScenarioPreset {
  id: string;
  name: string;
  region: string;
  satellite: string;
  confidence: number;
  area_km2: number;
  coords: string;
  observation_time: string;
  backward_hours: number;
  suspect_target: string;
  description: string;
}

const PRESET_SCENARIOS: ScenarioPreset[] = [
  {
    id: 'arabian-sea-01',
    name: 'Arabian Sea Tanker Discharge',
    region: 'Mumbai Offshore Shipping Corridor',
    satellite: 'Sentinel-1A IW Dual-Pol (C-Band SAR)',
    confidence: 0.942,
    area_km2: 18.4,
    coords: '18.8220°N, 72.4180°E',
    observation_time: '2026-08-25T10:32:00',
    backward_hours: 24,
    suspect_target: 'MV Ocean Star (Crude Oil Tanker)',
    description: 'High-confidence hydrocarbon slick trailing an international crude tanker with anomalous speed reduction inside origin perimeter.',
  },
  {
    id: 'hormuz-chokepoint-02',
    name: 'Strait of Hormuz Heavy Bilge Washings',
    region: 'Gulf of Oman / TSS Transit Sector',
    satellite: 'Sentinel-1B IW Dual-Pol GRD',
    confidence: 0.895,
    area_km2: 6.8,
    coords: '25.4200°N, 57.1800°E',
    observation_time: '2026-08-26T04:15:00',
    backward_hours: 12,
    suspect_target: 'MT Persian Pioneer (Chemical Tanker)',
    description: 'Fresh bilge washings along the Traffic Separation Scheme (TSS) correlated with AIS transponder blackout.',
  },
  {
    id: 'kutch-terminal-03',
    name: 'Gulf of Kutch SPM Deepwater Offshore Anomaly',
    region: 'Vadinar Single Point Mooring (SPM)',
    satellite: 'Sentinel-1A IW GRD Mode',
    confidence: 0.820,
    area_km2: 4.2,
    coords: '22.6500°N, 69.8200°E',
    observation_time: '2026-08-27T14:45:00',
    backward_hours: 48,
    suspect_target: 'MT Arabian Dawn (Product Tanker)',
    description: 'Terminal approach pipeline/manifold anomaly requiring extended 48h hydrodynamic backward dispersion ensemble.',
  },
];

export const NewInvestigation: React.FC = () => {
  const {
    executeInvestigation,
    executeDemo,
    loading,
    loadingStep,
    error,
  } = useInvestigation();

  const [selectedScenarioId, setSelectedScenarioId] = useState<string>('arabian-sea-01');
  const [acquisitionTime, setAcquisitionTime] = useState<string>('2026-08-25T10:32:00');
  const [backwardHours, setBackwardHours] = useState<number>(24);

  const handleSelectScenario = (scenario: ScenarioPreset) => {
    setSelectedScenarioId(scenario.id);
    setAcquisitionTime(scenario.observation_time);
    setBackwardHours(scenario.backward_hours);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedScenarioId === 'arabian-sea-01') {
      await executeDemo();
    } else {
      await executeInvestigation({
        observation_time: new Date(acquisitionTime).toISOString(),
        backward_hours: backwardHours,
        forward_hours: 24,
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg-canvas)] overflow-y-auto p-4 sm:p-6 select-none font-sans">
      {/* ── Top Header ── */}
      <div className="max-w-6xl mx-auto w-full mb-5">
        <div className="p-4 sm:p-5 rounded bg-[#111622] border border-[#1e293b] shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-[#161e2e] border border-[#1e293b] flex items-center justify-center text-blue-400">
                <Satellite className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-semibold text-slate-100">
                    New Investigation // Incident Dispatch Studio
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60 font-medium">
                    Stage 1
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5 font-mono">
                  Sentinel-1 C-Band SAR Telemetry · OpenDrift Reverse Advection · AIS 5D Vessel Attribution
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={executeDemo}
                disabled={loading}
                className="flex-1 sm:flex-initial px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5 fill-current" />
                <span>Instant Demo Launch</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Main Setup Grid ── */}
      <form onSubmit={handleSubmit} className="max-w-6xl mx-auto w-full space-y-5">
        {/* Scenario Selection Cards */}
        <div className="p-5 rounded bg-[#111622] border border-[#1e293b] shadow-sm space-y-3">
          <div className="flex items-center justify-between border-b border-[#1e293b] pb-2.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase tracking-wider font-mono">
              <ShieldAlert className="w-4 h-4 text-blue-400" />
              <span>Select Satellite Surveillance Incident Scenario</span>
            </div>
            <span className="text-[10px] font-mono text-slate-400">
              Authenticated Datasets
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5 pt-1">
            {PRESET_SCENARIOS.map((scenario) => {
              const isSelected = selectedScenarioId === scenario.id;

              return (
                <div
                  key={scenario.id}
                  onClick={() => handleSelectScenario(scenario)}
                  className={`p-4 rounded border text-xs space-y-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'bg-[#161e2e] border-blue-500 shadow-md ring-1 ring-blue-500/40'
                      : 'bg-[#161e2e] border-[#1e293b] hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h3 className="font-bold text-slate-100 text-xs">
                        {scenario.name}
                      </h3>
                      <span className="text-[11px] text-slate-400 block font-mono mt-0.5">
                        {scenario.region}
                      </span>
                    </div>
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/60 shrink-0">
                      {(scenario.confidence * 100).toFixed(1)}% Conf
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    {scenario.description}
                  </p>

                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[#1e293b] font-mono text-[10px]">
                    <div>
                      <span className="text-slate-500 block">Slick Footprint</span>
                      <span className="font-bold text-slate-200">{scenario.area_km2.toFixed(1)} km²</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Hindcast Horizon</span>
                      <span className="font-bold text-blue-400">{scenario.backward_hours} Hours</span>
                    </div>
                  </div>

                  <div className="text-[10px] font-mono text-slate-400 pt-1 border-t border-[#1e293b] flex items-center justify-between">
                    <span className="text-slate-500">Suspect:</span>
                    <span className="text-rose-400 font-semibold truncate max-w-[170px]">{scenario.suspect_target}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Horizon & Pipeline Configuration Split */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Left Column: Simulation Timing */}
          <div className="p-5 rounded bg-[#111622] border border-[#1e293b] shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase tracking-wider border-b border-[#1e293b] pb-2 font-mono">
              <Compass className="w-4 h-4 text-blue-400" />
              <span>Simulation Horizon & Hydrodynamic Timing</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 flex items-center gap-1.5 font-medium font-mono">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Satellite Observation Timestamp (UTC)</span>
              </label>
              <input
                type="datetime-local"
                value={acquisitionTime}
                onChange={(e) => setAcquisitionTime(e.target.value)}
                className="w-full bg-[#0c1017] border border-[#1e293b] rounded px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 flex items-center gap-1.5 font-medium font-mono">
                <Waves className="w-3.5 h-3.5 text-blue-400" />
                <span>Reverse Advection Hindcast Horizon</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[12, 24, 48, 72].map((h) => (
                  <button
                    type="button"
                    key={h}
                    onClick={() => setBackwardHours(h)}
                    className={`py-2 rounded text-center text-xs font-medium font-mono border transition-colors cursor-pointer ${
                      backwardHours === h
                        ? 'bg-blue-950 border-blue-700 text-blue-200 font-semibold'
                        : 'bg-[#0c1017] border-[#1e293b] text-slate-400 hover:bg-[#161e2e]'
                    }`}
                  >
                    {h} Hours
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Automated Pipeline Steps Summary */}
          <div className="p-5 rounded bg-[#111622] border border-[#1e293b] shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-[#1e293b] pb-2 font-mono">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase tracking-wider">
                <Ship className="w-4 h-4 text-blue-400" />
                <span>Automated 4-Stage Forensic Pipeline</span>
              </div>
              <span className="text-[10px] text-blue-400 font-bold">4 Passes</span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <div className="p-2 bg-[#161e2e] border border-[#1e293b] rounded flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-200">[1/4] Sentinel-1 SAR U-Net Segmentation</span>
                </div>
                <span className="text-[10px] text-slate-400">ResNet-34</span>
              </div>

              <div className="p-2 bg-[#161e2e] border border-[#1e293b] rounded flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-200">[2/4] OpenDrift Hydrodynamic Hindcasting</span>
                </div>
                <span className="text-[10px] text-slate-400">Lagrangian</span>
              </div>

              <div className="p-2 bg-[#161e2e] border border-[#1e293b] rounded flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-200">[3/4] AIS Corridor 3-Stage Filtering</span>
                </div>
                <span className="text-[10px] text-slate-400">Spatio-Temporal</span>
              </div>

              <div className="p-2 bg-[#161e2e] border border-[#1e293b] rounded flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-slate-200">[4/4] 5-Dimension Explainable Scoring</span>
                </div>
                <span className="text-[10px] text-slate-400">100-pt Scale</span>
              </div>
            </div>
          </div>
        </div>

        {/* Launch Action Button */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs uppercase tracking-wider rounded shadow-md transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
        >
          {loading ? (
            <>
              <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
              <span>{loadingStep || 'Executing Forensic Investigation Pipeline...'}</span>
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-white" />
              <span>Execute Forensic Investigation Pipeline</span>
            </>
          )}
        </button>

        {error && (
          <div className="p-3.5 bg-rose-950/80 border border-rose-800/60 rounded text-rose-200 text-xs flex items-center gap-2 font-mono">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </form>
    </div>
  );
};
