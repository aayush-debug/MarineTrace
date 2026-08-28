import React from 'react';
import {
  CheckCircle2,
  Loader2,
  CircleDot,
  Satellite,
  Compass,
  Ship,
  Sparkles,
  ShieldAlert,
} from 'lucide-react';

interface PipelineStep {
  id: string;
  label: string;
  sublabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const PIPELINE_STEPS: PipelineStep[] = [
  {
    id: 'step-1',
    label: 'Satellite SAR Ingestion & Preprocessing',
    sublabel: 'Sentinel-1 C-Band VV backscatter calibration & damping filter',
    icon: Satellite,
  },
  {
    id: 'step-2',
    label: 'Deep Neural Spill Segmentation',
    sublabel: 'U-Net semantic mask extraction & XGBoost confidence scoring',
    icon: Sparkles,
  },
  {
    id: 'step-3',
    label: 'Hydrodynamic Drift Backtracking',
    sublabel: 'OpenDrift 500-particle ensemble simulation (-24h hindcast)',
    icon: Compass,
  },
  {
    id: 'step-4',
    label: 'Discharge Origin Zone Estimation',
    sublabel: 'Spatial convex hull & temporal window envelope convergence',
    icon: ShieldAlert,
  },
  {
    id: 'step-5',
    label: 'Historical AIS Traffic Reconstruction',
    sublabel: '3-stage spatial, temporal, and trajectory candidate filtering',
    icon: Ship,
  },
  {
    id: 'step-6',
    label: 'Explainable Multi-Feature Attribution',
    sublabel: '5-dimension spatial-temporal anomaly scoring & priority ranking',
    icon: CheckCircle2,
  },
];

interface PipelineProgressModalProps {
  isOpen: boolean;
  currentStepMessage?: string;
}

export const PipelineProgressModal: React.FC<PipelineProgressModalProps> = ({
  isOpen,
  currentStepMessage = 'Executing intelligence pipeline...',
}) => {
  if (!isOpen) return null;

  // Determine active step index based on currentStepMessage or fallback
  const getActiveStepIndex = () => {
    const msg = currentStepMessage.toLowerCase();
    if (msg.includes('sar') || msg.includes('sentinel') || msg.includes('[1/4]')) return 1;
    if (msg.includes('drift') || msg.includes('opendrift') || msg.includes('[2/4]')) return 2;
    if (msg.includes('origin')) return 3;
    if (msg.includes('ais') || msg.includes('[3/4]')) return 4;
    if (msg.includes('attribution') || msg.includes('scoring') || msg.includes('[4/4]')) return 5;
    return 1;
  };

  const activeIndex = getActiveStepIndex();

  return (
    <div className="fixed inset-0 z-[9999] bg-[#050811]/90 backdrop-blur-md flex items-center justify-center p-4 font-mono select-none animate-in fade-in duration-200">
      <div className="w-full max-w-xl bg-[#0a101d] border border-cyan-500/40 rounded-xl p-6 shadow-2xl shadow-cyan-950/50 space-y-6 relative overflow-hidden">
        {/* Ambient Top Glow */}
        <div className="absolute top-0 left-1/4 right-1/4 h-[2px] bg-gradient-to-r from-transparent via-cyan-400 to-transparent" />

        {/* Modal Header */}
        <div className="flex items-center justify-between border-b border-slate-800/90 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Loader2 className="w-5 h-5 animate-spin" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100 tracking-wider">
                  MARINETRACE ANALYSIS PIPELINE
                </h3>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
                  LIVE RUN
                </span>
              </div>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Multi-Sensor Correlation & Hydrodynamic Attribution Engine
              </p>
            </div>
          </div>

          <div className="text-right text-[11px] text-cyan-400 font-bold">
            STEP {activeIndex + 1} OF {PIPELINE_STEPS.length}
          </div>
        </div>

        {/* Pipeline Step Progression Checklist */}
        <div className="space-y-3">
          {PIPELINE_STEPS.map((step, idx) => {
            const isCompleted = idx < activeIndex;
            const isCurrent = idx === activeIndex;

            return (
              <div
                key={step.id}
                className={`p-3 rounded-lg border flex items-start gap-3 transition-all duration-300 ${
                  isCurrent
                    ? 'bg-cyan-500/10 border-cyan-500/50 shadow-md shadow-cyan-950/40 ring-1 ring-cyan-500/30'
                    : isCompleted
                    ? 'bg-[#0d1424]/60 border-slate-800/80 text-slate-300'
                    : 'bg-slate-950/40 border-slate-900 text-slate-600'
                }`}
              >
                <div className="mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <Loader2 className="w-4 h-4 text-cyan-400 animate-spin" />
                  ) : (
                    <CircleDot className="w-4 h-4 text-slate-700" />
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs font-bold ${
                        isCurrent
                          ? 'text-cyan-300'
                          : isCompleted
                          ? 'text-slate-200'
                          : 'text-slate-500'
                      }`}
                    >
                      {step.label}
                    </span>
                    <span className="text-[10px]">
                      {isCompleted ? (
                        <span className="text-emerald-400 font-semibold">COMPLETE</span>
                      ) : isCurrent ? (
                        <span className="text-cyan-400 font-bold animate-pulse">PROCESSING...</span>
                      ) : (
                        <span className="text-slate-600">QUEUED</span>
                      )}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-0.5 leading-tight truncate">
                    {step.sublabel}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

        {/* Live Subtitle Info Banner */}
        <div className="p-3 bg-slate-950/80 border border-slate-800 rounded-lg flex items-center justify-between text-[11px] text-slate-400">
          <span className="truncate max-w-sm text-cyan-300 font-semibold">
            › {currentStepMessage}
          </span>
          <span className="text-slate-500 text-[10px]">Copernicus & AIS Synced</span>
        </div>
      </div>
    </div>
  );
};
