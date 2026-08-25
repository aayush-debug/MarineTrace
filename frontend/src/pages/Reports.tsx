import React from 'react';
import {
  Printer,
  Download,
  FileText,
  Shield,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';

export const Reports: React.FC = () => {
  const { investigation, environmental } = useInvestigation();

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadJSON = () => {
    if (!investigation) return;
    const blob = new Blob([JSON.stringify(investigation, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MarineTrace_Report_${investigation.investigation_id}.json`;
    a.click();
  };

  if (!investigation) {
    return (
      <div className="p-8 text-center text-slate-400 font-mono">
        No active investigation available for report generation.
      </div>
    );
  }

  const { spill, drift, vessels } = investigation;
  const centroidLat =
    spill.geometry?.coordinates?.[0]?.[0]?.[1] || 18.721;
  const centroidLon =
    spill.geometry?.coordinates?.[0]?.[0]?.[0] || 72.914;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#060a12] overflow-y-auto font-mono p-4 sm:p-8 space-y-6">
      {/* Action Header */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-4 no-print">
        <div>
          <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-400" />
            MARITIME INVESTIGATION INCIDENT DOSSIER
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Official decision-support report for maritime enforcement and pollution response authorities.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>EXPORT JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-md"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT OFFICIAL DOSSIER</span>
          </button>
        </div>
      </div>

      {/* Printable Report Canvas */}
      <div className="max-w-4xl mx-auto bg-[#0d1424] border border-slate-800 rounded-xl p-8 space-y-6 shadow-2xl text-slate-200">
        {/* Document Official Header */}
        <div className="border-b-2 border-slate-700 pb-4 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-base tracking-wider">
              <Shield className="w-5 h-5" />
              <span>MARINETRACE INTELLIGENCE DOSSIER</span>
            </div>
            <div className="text-xs text-slate-400 mt-1">
              MARITIME OIL POLLUTION INVESTIGATION & SOURCE ATTRIBUTION REPORT
            </div>
          </div>

          <div className="text-right text-xs">
            <div className="font-bold text-slate-100">
              ID: {investigation.investigation_id}
            </div>
            <div className="text-slate-400 text-[10px]">
              DATE: {new Date(investigation.observation_time).toUTCString()}
            </div>
          </div>
        </div>

        {/* Section 1: Executive Summary */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-1">
            1. EXECUTIVE SUMMARY & SATELLITE DETECTION
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs bg-slate-950/60 p-3 rounded border border-slate-800">
            <div>
              <div className="text-slate-400 text-[10px]">DETECTION CONFIDENCE</div>
              <div className="text-base font-bold text-emerald-400">
                {(spill.confidence * 100).toFixed(1)}%
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">ESTIMATED SLICK AREA</div>
              <div className="text-base font-bold text-amber-400">
                {spill.area_km2.toFixed(2)} km²
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">OBSERVED CENTROID</div>
              <div className="text-xs font-bold text-slate-200">
                {centroidLat.toFixed(4)}°N, {centroidLon.toFixed(4)}°E
              </div>
            </div>
            <div>
              <div className="text-slate-400 text-[10px]">SATELLITE SENSOR</div>
              <div className="text-xs font-bold text-slate-200">
                Sentinel-1 SAR IW (C-Band)
              </div>
            </div>
          </div>
        </div>

        {/* Section 2: Physical Drift Reconstruction */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-1">
            2. HYDRODYNAMIC BACKTRACKING & ORIGIN ZONE ESTIMATION
          </div>
          <div className="p-3 bg-slate-950/60 rounded border border-slate-800 text-xs space-y-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              <div>
                <span className="text-slate-400 text-[10px] block">ESTIMATED DISCHARGE ORIGIN:</span>
                <span className="font-bold text-amber-300">
                  {drift.origin.latitude.toFixed(4)}°N, {drift.origin.longitude.toFixed(4)}°E
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">ORIGIN PROBABILITY CONFIDENCE:</span>
                <span className="font-bold text-emerald-400">
                  {(drift.origin.confidence * 100).toFixed(0)}% (68% Envelope)
                </span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">ESTIMATED DISCHARGE WINDOW:</span>
                <span className="font-bold text-slate-200">
                  {new Date(drift.origin_time_window.start).toLocaleTimeString()} – {new Date(drift.origin_time_window.end).toLocaleTimeString()} UTC
                </span>
              </div>
            </div>

            <div className="border-t border-slate-800/80 pt-2 text-[11px] text-slate-400 grid grid-cols-2 gap-2">
              <div>Surface Current: {environmental.currentSpeedKnots.toFixed(2)} kn at {environmental.currentDirectionDeg}° ({environmental.currentDirectionCardinal})</div>
              <div>Surface Wind: {environmental.windSpeedKnots.toFixed(1)} kn ({environmental.windDirectionCardinal})</div>
            </div>
          </div>
        </div>

        {/* Section 3: Potential Responsible Vessel Attribution */}
        <div className="space-y-2">
          <div className="text-xs font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-1">
            3. CANDIDATE VESSEL ATTRIBUTION & RANKINGS
          </div>

          <div className="space-y-3">
            {vessels.map((vessel) => (
              <div
                key={vessel.mmsi}
                className="p-3.5 bg-slate-950/70 border border-slate-800 rounded-lg text-xs space-y-2"
              >
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`w-5 h-5 rounded flex items-center justify-center font-bold text-xs ${
                        vessel.rank === 1
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      }`}
                    >
                      #{vessel.rank}
                    </span>
                    <span className="font-bold text-slate-100 text-sm">{vessel.vessel_name}</span>
                    <span className="text-[10px] text-slate-400">
                      MMSI: {vessel.mmsi} • {vessel.vessel_type}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] uppercase block">
                      ATTRIBUTION SCORE
                    </span>
                    <span className="font-bold text-base text-rose-400">
                      {vessel.score.toFixed(1)}% ({vessel.investigative_priority} PRIORITY)
                    </span>
                  </div>
                </div>

                {/* Scores Matrix */}
                <div className="grid grid-cols-5 gap-1.5 text-[10px] text-center font-mono py-1">
                  <div className="bg-slate-900 p-1 rounded">
                    <div className="text-slate-400">Spatial</div>
                    <div className="font-bold text-slate-200">{vessel.feature_scores.spatial.toFixed(0)}%</div>
                  </div>
                  <div className="bg-slate-900 p-1 rounded">
                    <div className="text-slate-400">Temporal</div>
                    <div className="font-bold text-slate-200">{vessel.feature_scores.temporal.toFixed(0)}%</div>
                  </div>
                  <div className="bg-slate-900 p-1 rounded">
                    <div className="text-slate-400">Trajectory</div>
                    <div className="font-bold text-slate-200">{vessel.feature_scores.trajectory.toFixed(0)}%</div>
                  </div>
                  <div className="bg-slate-900 p-1 rounded">
                    <div className="text-slate-400">Behaviour</div>
                    <div className="font-bold text-slate-200">{vessel.feature_scores.behaviour.toFixed(0)}%</div>
                  </div>
                  <div className="bg-slate-900 p-1 rounded">
                    <div className="text-slate-400">Relevance</div>
                    <div className="font-bold text-slate-200">{vessel.feature_scores.vessel_relevance.toFixed(0)}%</div>
                  </div>
                </div>

                {/* Evidence list */}
                <div className="space-y-1 pt-1">
                  {vessel.reasons?.map((reason, idx) => (
                    <div key={idx} className="text-[11px] text-slate-300 flex items-start gap-1.5">
                      <CheckCircle2 className="w-3 h-3 text-cyan-400 flex-shrink-0 mt-0.5" />
                      <span>{reason}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 4: Mandatory Legal Disclaimer */}
        <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded text-[11px] text-amber-200 space-y-1">
          <div className="font-bold flex items-center gap-1.5 text-amber-300">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
            <span>STATUTORY NOTICE & LEGAL LIMITATION OF ATTRIBUTION</span>
          </div>
          <p className="leading-relaxed">
            {investigation.disclaimer} This document serves as preliminary intelligence to guide maritime law enforcement, port state control inspections, and aerial surveillance operations.
          </p>
        </div>
      </div>
    </div>
  );
};
