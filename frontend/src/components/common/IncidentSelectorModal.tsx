import React from 'react';
import {
  Satellite,
  Compass,
  CheckCircle2,
  X,
  ArrowRight,
} from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';
import { ALL_INCIDENT_PRESETS } from '../../data/demo/demoData';

export const IncidentSelectorModal: React.FC = () => {
  const {
    isIncidentSelectorOpen,
    setIsIncidentSelectorOpen,
    selectPresetScenario,
    investigation,
    setActivePage,
  } = useInvestigation();

  if (!isIncidentSelectorOpen) return null;

  const currentId = investigation?.investigation_id;

  const handleSelect = (scenarioId: string) => {
    selectPresetScenario(scenarioId);
    setActivePage('investigation');
  };

  return (
    <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none font-sans">
      <div className="bg-[#111622] border border-[#1e293b] rounded-xl max-w-3xl w-full shadow-2xl overflow-hidden flex flex-col max-h-[90vh] relative z-[100000]">
        {/* Modal Header */}
        <div className="px-6 py-4 bg-[#161e2e] border-b border-[#1e293b] flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-blue-950 border border-blue-800/60 flex items-center justify-center text-blue-400 shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold text-slate-100 uppercase tracking-wide">
                  Select Target Pollution Incident Scenario
                </h2>
                <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60">
                  SATELLITE SAR TELEMETRY
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Choose an authentic satellite radar oil spill scenario to launch full reverse drift advection and 5D vessel attribution.
              </p>
            </div>
          </div>

          <button
            onClick={() => setIsIncidentSelectorOpen(false)}
            className="p-1.5 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors cursor-pointer"
            title="Close scenario picker"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Scenario Cards */}
        <div className="p-6 overflow-y-auto space-y-3.5 flex-1">
          <div className="text-xs font-mono text-slate-400 uppercase tracking-wider font-semibold mb-1 flex items-center justify-between">
            <span>Available Verified Satellite Incidents ({ALL_INCIDENT_PRESETS.length})</span>
            <span className="text-[11px] text-blue-400 font-medium">Click to Load & Inspect</span>
          </div>

          {ALL_INCIDENT_PRESETS.map((preset) => {
            const isCurrent = currentId === preset.id;
            return (
              <div
                key={preset.id}
                onClick={() => handleSelect(preset.id)}
                className={`p-4 rounded-xl border transition-all cursor-pointer relative group ${isCurrent
                    ? 'bg-blue-950/30 border-blue-500/80 ring-1 ring-blue-500/50 shadow-lg'
                    : 'bg-[#0c1017] border-[#1e293b] hover:border-slate-600 hover:bg-[#161e2e]'
                  }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-mono text-xs font-bold text-slate-200">
                        {preset.id}
                      </span>
                      <span className="text-xs font-semibold text-slate-100">
                        {preset.name}
                      </span>
                      <span
                        className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${preset.severity === 'CRITICAL'
                            ? 'bg-rose-950 text-rose-300 border-rose-800/60'
                            : 'bg-amber-950 text-amber-300 border-amber-800/60'
                          }`}
                      >
                        {preset.severity}
                      </span>
                      {isCurrent && (
                        <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                          ACTIVE CASE
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-slate-400 flex items-center gap-1.5 font-mono">
                      <span className="text-slate-500">Region:</span>
                      <span className="text-slate-300">{preset.region}</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs pt-1 font-mono">
                      <div className="p-2 bg-[#111622] rounded border border-[#1e293b] space-y-0.5">
                        <span className="text-[10px] text-slate-500 block">Footprint Area</span>
                        <span className="font-bold text-slate-100">{preset.area_km2.toFixed(2)} km²</span>
                      </div>

                      <div className="p-2 bg-[#111622] rounded border border-[#1e293b] space-y-0.5">
                        <span className="text-[10px] text-slate-500 block">SAR Confidence</span>
                        <span className="font-bold text-emerald-400">{(preset.confidence * 100).toFixed(1)}%</span>
                      </div>

                      <div className="p-2 bg-[#111622] rounded border border-[#1e293b] space-y-0.5 col-span-2 sm:col-span-1">
                        <span className="text-[10px] text-slate-500 block">Primary Suspect</span>
                        <span className="font-bold text-rose-300 truncate block">{preset.primary_suspect}</span>
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0 flex sm:flex-col items-center justify-between gap-2 sm:self-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(preset.id);
                      }}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer w-full justify-center ${isCurrent
                          ? 'bg-blue-600 hover:bg-blue-500 text-white'
                          : 'bg-[#161e2e] hover:bg-blue-600 text-slate-200 hover:text-white border border-[#1e293b] group-hover:border-blue-500/60'
                        }`}
                    >
                      <span>{isCurrent ? 'Inspect Active Case' : 'Select Incident'}</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 bg-[#161e2e] border-t border-[#1e293b] flex items-center justify-between text-xs text-slate-400 shrink-0 font-mono">
          <div className="flex items-center gap-2">
            <Satellite className="w-3.5 h-3.5 text-blue-400" />
            <span>Telemetry pre-calibrated to European Space Agency (ESA) Sentinel-1 standards.</span>
          </div>

          <button
            onClick={() => setIsIncidentSelectorOpen(false)}
            className="px-3 py-1.5 rounded hover:bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer font-sans text-xs"
          >
            Continue with Current
          </button>
        </div>
      </div>
    </div>
  );
};
