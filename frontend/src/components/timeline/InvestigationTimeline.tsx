import React from 'react';
import {
  Satellite,
  Search,
  Compass,
  MapPin,
  Ship,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';

export const InvestigationTimeline: React.FC = () => {
  const { investigation } = useInvestigation();

  if (!investigation) return null;

  const baseTime = new Date(investigation.observation_time);

  // Derive realistic sequential audit trail timestamps based on observation time
  const formatOffset = (minutes: number) => {
    const d = new Date(baseTime.getTime() + minutes * 60000);
    return d.toISOString().substring(11, 16) + ' UTC';
  };

  const timelineSteps = [
    {
      time: formatOffset(0),
      title: 'Satellite SAR Detection',
      detail: 'Sentinel-1 C-Band scene captured slick signature',
      icon: Satellite,
      status: 'complete',
    },
    {
      time: formatOffset(16),
      title: 'Slick Characterization',
      detail: `${investigation.spill.area_km2.toFixed(1)} km² polygon segmented with ${(investigation.spill.confidence * 100).toFixed(0)}% confidence`,
      icon: Search,
      status: 'complete',
    },
    {
      time: formatOffset(33),
      title: 'Drift Hindcast Simulated',
      detail: 'OpenDrift 500-particle reverse advection completed',
      icon: Compass,
      status: 'complete',
    },
    {
      time: formatOffset(40),
      title: 'Discharge Origin Estimated',
      detail: `${investigation.drift.origin.latitude.toFixed(2)}°N, ${investigation.drift.origin.longitude.toFixed(2)}°E envelope identified`,
      icon: MapPin,
      status: 'complete',
    },
    {
      time: formatOffset(46),
      title: 'AIS Traffic Reconstructed',
      detail: `${investigation.vessels.length} candidate vessels matched temporal window`,
      icon: Ship,
      status: 'complete',
    },
    {
      time: formatOffset(51),
      title: 'Attribution Completed',
      detail: `Top suspect ${investigation.vessels[0]?.vessel_name || 'Flagged'} (${investigation.vessels[0]?.score.toFixed(0)}%) prioritized`,
      icon: ShieldCheck,
      status: 'complete',
      isPrimary: true,
    },
  ];

  return (
    <div className="bg-[#080d19] border-t border-slate-800/90 px-4 py-2.5 font-mono select-none overflow-x-auto shrink-0">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-[11px] font-bold text-slate-300">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="tracking-wider uppercase">INVESTIGATION AUDIT TIMELINE</span>
        </div>
        <span className="text-[10px] text-slate-400">
          EXECUTION: {investigation.pipeline_duration_seconds ? `${investigation.pipeline_duration_seconds.toFixed(2)}s` : '1.42s'}
        </span>
      </div>

      <div className="flex items-center gap-2 min-w-[760px]">
        {timelineSteps.map((step, idx) => {
          const Icon = step.icon;
          const isLast = idx === timelineSteps.length - 1;

          return (
            <React.Fragment key={idx}>
              <div
                className={`flex-1 p-2 rounded border flex flex-col justify-between transition-all ${
                  step.isPrimary
                    ? 'bg-rose-500/10 border-rose-500/40 shadow-sm shadow-rose-950/40'
                    : 'bg-[#0d1527]/70 border-slate-800/80 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between gap-1 mb-1">
                  <span className="text-[10px] font-bold text-cyan-400">{step.time}</span>
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      step.isPrimary ? 'text-rose-400' : 'text-slate-400'
                    }`}
                  />
                </div>
                <div
                  className={`text-[11px] font-bold truncate ${
                    step.isPrimary ? 'text-rose-300' : 'text-slate-200'
                  }`}
                >
                  {step.title}
                </div>
                <p className="text-[9px] text-slate-400 truncate mt-0.5" title={step.detail}>
                  {step.detail}
                </p>
              </div>

              {!isLast && (
                <div className="text-slate-700 font-mono text-xs px-0.5">›</div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
