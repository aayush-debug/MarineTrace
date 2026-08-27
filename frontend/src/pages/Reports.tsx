import {
  Printer,
  Download,
  FileText,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Clock,
  Cpu,
  TrendingUp,
  Satellite,
  Compass,
  Ship,
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';

const ML_PERF_TABLE = [
  { metric: 'Dice Similarity Coefficient', value: '0.87', benchmark: 'Target Benchmark ≥ 0.85' },
  { metric: 'Intersection over Union (IoU)', value: '0.79', benchmark: 'Target Benchmark ≥ 0.75' },
  { metric: 'Pixel Precision', value: '0.91', benchmark: 'Minimizes false alarms' },
  { metric: 'Pixel Recall', value: '0.84', benchmark: 'Captures diffuse sheen' },
  { metric: 'F1 Score', value: '0.87', benchmark: 'Harmonic mean' },
  { metric: 'Overall Pixel Accuracy', value: '0.96', benchmark: 'Zenodo test set' },
];

export const Reports: React.FC = () => {
  const { investigation, environmental } = useInvestigation();

  const handlePrint = () => window.print();

  const handleDownloadJSON = () => {
    if (!investigation) return;
    const blob = new Blob([JSON.stringify(investigation, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MarineTrace_Dossier_${investigation.investigation_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    if (!investigation) return;
    const rows = [
      ['Rank', 'Vessel Name', 'MMSI', 'Type', 'Flag', 'Score', 'Priority', 'Spatial', 'Temporal', 'Trajectory', 'Behaviour', 'Relevance'],
      ...investigation.vessels.map((v) => [
        v.rank, v.vessel_name, v.mmsi, v.vessel_type, v.flag, v.score.toFixed(1), v.investigative_priority,
        v.feature_scores.spatial.toFixed(1), v.feature_scores.temporal.toFixed(1),
        v.feature_scores.trajectory.toFixed(1), v.feature_scores.behaviour.toFixed(1),
        v.feature_scores.vessel_relevance.toFixed(1),
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `MarineTrace_Attribution_${investigation.investigation_id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!investigation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#090d16] p-6 text-center">
        <div className="space-y-3 max-w-sm">
          <FileText className="w-10 h-10 text-slate-600 mx-auto" />
          <h2 className="text-sm font-semibold text-slate-200">No Investigation Loaded</h2>
          <p className="text-xs text-slate-400">Launch a scenario or ingest SAR imagery to compile an intelligence dossier.</p>
        </div>
      </div>
    );
  }

  const { spill, drift, vessels } = investigation;
  const centroidLat = spill.geometry?.coordinates?.[0]?.[0]?.[1] ?? 18.721;
  const generatedAt = new Date().toUTCString();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#090d16] overflow-y-auto">

      {/* Action Bar — no-print */}
      <div className="px-6 py-3.5 bg-[#0c121e] border-b border-[rgba(255,255,255,0.08)] flex items-center justify-between gap-4 no-print shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <FileText className="w-5 h-5 text-sky-400" />
          <div>
            <h1 className="text-sm font-semibold text-slate-100">
              Maritime Incident Intelligence Dossier
            </h1>
            <p className="text-xs text-slate-400 mt-0.5">
              Auditable decision-support report for maritime law enforcement and pollution response authorities.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-indigo-400" />
            <span>Export CSV</span>
          </button>

          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-sky-400" />
            <span>Export JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow-sm transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Print Dossier</span>
          </button>
        </div>
      </div>

      {/* Report Canvas */}
      <div className="p-6 max-w-4xl mx-auto w-full space-y-6">

        {/* Document Header & Provenance */}
        <div className="bg-[#0c121e] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 shadow-sm space-y-4">
          <div className="flex items-start justify-between border-b border-slate-800 pb-4">
            <div>
              <div className="flex items-center gap-2 text-sky-400 font-bold text-base tracking-tight mb-1">
                <Shield className="w-5 h-5" />
                <span>MarineTrace Intelligence Dossier</span>
              </div>
              <div className="text-xs text-slate-400 font-medium">
                Maritime Oil Pollution Detection & Source Attribution Report
              </div>
              <div className="text-[11px] text-slate-400 mt-1">
                Security Classification: Official / Decision-Support
              </div>
            </div>
            <div className="text-right text-xs">
              <div className="font-bold text-slate-100 font-mono text-sm">Case #{investigation.investigation_id}</div>
              <div className="text-slate-400 mt-1 flex items-center justify-end gap-1 font-mono text-[11px]">
                <Clock className="w-3 h-3" />
                <span>{generatedAt}</span>
              </div>
            </div>
          </div>

          {/* Section 0: System Architecture & Provenance */}
          <div>
            <div className="text-xs font-semibold text-slate-300 mb-2.5 flex items-center gap-1.5">
              <Cpu className="w-4 h-4 text-indigo-400" />
              <span>Section 0 — System Provenance & Multi-Stage Pipeline</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { k: 'Software Version', v: 'MarineTrace v2.4' },
                { k: 'SAR Model', v: 'U-Net ResNet-34' },
                { k: 'Backtracking', v: 'OpenDrift 500-P' },
                { k: 'Current Model', v: 'Copernicus CMEMS' },
                { k: 'Wind Forcing', v: 'ECMWF ERA5' },
                { k: 'AIS Ingestion', v: 'Spatio-Temporal' },
                { k: 'Attribution', v: '5D Explainable AI' },
                { k: 'Reference CRS', v: 'EPSG:4326 (WGS84)' },
              ].map(({ k, v }) => (
                <div key={k} className="p-2.5 bg-slate-900/80 rounded-lg border border-slate-800">
                  <div className="text-slate-400 text-[10px]">{k}</div>
                  <div className="text-slate-200 font-semibold font-mono text-[11px] mt-0.5">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Model Validation Benchmarks */}
          <div className="pt-2 border-t border-slate-800">
            <div className="text-xs font-semibold text-slate-300 mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>ML Model Validation Performance (Zenodo 450-Scene Benchmark)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-slate-800 text-[11px] text-slate-400">
                    <th className="py-1.5 px-3 font-medium">Metric</th>
                    <th className="py-1.5 px-3 font-medium">Evaluation Score</th>
                    <th className="py-1.5 px-3 font-medium">Verification Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {ML_PERF_TABLE.map((r) => (
                    <tr key={r.metric} className="hover:bg-slate-800/30">
                      <td className="py-1.5 px-3 text-slate-300">{r.metric}</td>
                      <td className="py-1.5 px-3 text-emerald-400 font-semibold font-mono">{r.value}</td>
                      <td className="py-1.5 px-3 text-slate-400 text-[11px]">{r.benchmark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 1: Satellite SAR Characterization */}
        <div className="bg-[#0c121e] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 shadow-sm space-y-3">
          <div className="text-xs font-semibold text-sky-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Satellite className="w-4 h-4" />
            <span>1. Satellite SAR Detection & Spill Characterization</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Detection Confidence', value: `${(spill.confidence * 100).toFixed(1)}%`, color: 'text-emerald-400' },
              { label: 'Estimated Slick Area', value: `${spill.area_km2.toFixed(2)} km²`, color: 'text-amber-400' },
              { label: 'Observed Centroid', value: `${centroidLat.toFixed(4)}°N`, color: 'text-slate-200' },
              { label: 'Sensor Mode', value: 'Sentinel-1 C-Band', color: 'text-slate-200' },
            ].map((item) => (
              <div key={item.label} className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
                <div className="text-[10px] text-slate-400 mb-1">{item.label}</div>
                <div className={`text-base font-bold font-mono ${item.color}`}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Section 2: Hydrodynamic Drift & Origin Estimation */}
        <div className="bg-[#0c121e] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 shadow-sm space-y-3">
          <div className="text-xs font-semibold text-sky-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Compass className="w-4 h-4" />
            <span>2. Hydrodynamic Backtracking & Origin Zone Estimation</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 mb-1">Estimated Discharge Origin</div>
              <div className="text-xs font-bold text-amber-300 font-mono">
                {drift.origin.latitude.toFixed(4)}°N, {drift.origin.longitude.toFixed(4)}°E
              </div>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 mb-1">Origin Zone Confidence</div>
              <div className="text-xs font-bold text-emerald-400 font-mono">
                {(drift.origin.confidence * 100).toFixed(0)}% (68% Particle Envelope)
              </div>
            </div>

            <div className="p-3 bg-slate-900/80 rounded-lg border border-slate-800">
              <div className="text-[10px] text-slate-400 mb-1">Discharge Time Window</div>
              <div className="text-xs font-bold text-slate-200 font-mono">
                {new Date(drift.origin_time_window.start).toLocaleTimeString()} – {new Date(drift.origin_time_window.end).toLocaleTimeString()} UTC
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs bg-slate-900/40 p-3 rounded-lg border border-slate-800">
            <div><span className="text-slate-400">Surface Current:</span> <span className="text-slate-200 font-mono ml-1">{environmental.currentSpeedKnots.toFixed(2)} kn ({environmental.currentDirectionCardinal})</span></div>
            <div><span className="text-slate-400">Wind Velocity:</span> <span className="text-slate-200 font-mono ml-1">{environmental.windSpeedKnots.toFixed(1)} kn ({environmental.windDirectionCardinal})</span></div>
            <div><span className="text-slate-400">SST:</span> <span className="text-slate-200 font-mono ml-1">{environmental.seaSurfaceTempC.toFixed(1)}°C</span></div>
            <div><span className="text-slate-400">Significant Waves:</span> <span className="text-slate-200 font-mono ml-1">{environmental.waveHeightMeters.toFixed(1)} m</span></div>
          </div>
        </div>

        {/* Section 3: Candidate Suspect Prioritization */}
        <div className="bg-[#0c121e] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 shadow-sm space-y-4">
          <div className="text-xs font-semibold text-sky-400 flex items-center gap-1.5 border-b border-slate-800 pb-2">
            <Ship className="w-4 h-4" />
            <span>3. Correlated Candidate Vessels & Attribution Priority</span>
          </div>

          <div className="space-y-3">
            {vessels.map((vessel) => (
              <div
                key={vessel.mmsi}
                className={`p-4 border rounded-xl print-avoid-break space-y-3 ${
                  vessel.rank === 1
                    ? 'bg-rose-950/20 border-rose-500/30'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                {/* Vessel Summary */}
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-7 h-7 rounded-lg flex items-center justify-center font-bold text-xs font-mono ${
                      vessel.rank === 1
                        ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30'
                        : vessel.rank === 2
                        ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-800 text-slate-400 border border-slate-700'
                    }`}>
                      #{vessel.rank}
                    </span>
                    <div>
                      <div className="font-bold text-slate-100 text-sm">{vessel.vessel_name}</div>
                      <div className="text-xs text-slate-400 font-mono">
                        MMSI: {vessel.mmsi} · {vessel.vessel_type} · Flag: {vessel.flag}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className="text-[10px] text-slate-400">Attribution Score</div>
                    <div className={`text-xl font-bold font-mono ${
                      vessel.rank === 1 ? 'text-rose-400' : vessel.rank === 2 ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      {vessel.score.toFixed(1)}%
                    </div>
                  </div>
                </div>

                {/* 5-Factor Feature Weights */}
                <div className="grid grid-cols-5 gap-2 text-center text-xs">
                  {[
                    { k: 'Spatial', v: vessel.feature_scores.spatial, w: '30%' },
                    { k: 'Temporal', v: vessel.feature_scores.temporal, w: '25%' },
                    { k: 'Trajectory', v: vessel.feature_scores.trajectory, w: '20%' },
                    { k: 'Behaviour', v: vessel.feature_scores.behaviour, w: '15%' },
                    { k: 'Relevance', v: vessel.feature_scores.vessel_relevance, w: '10%' },
                  ].map(({ k, v, w }) => (
                    <div key={k} className="p-2 bg-slate-950/60 rounded-lg border border-slate-800/80">
                      <div className="text-[10px] text-slate-400">{k}</div>
                      <div className="text-xs font-semibold text-slate-200 font-mono mt-0.5">{v.toFixed(0)}%</div>
                      <div className="text-[9px] text-slate-400">Wt {w}</div>
                    </div>
                  ))}
                </div>

                {/* Evidence Observations */}
                {vessel.reasons && vessel.reasons.length > 0 && (
                  <div className="space-y-1.5 pt-1">
                    {vessel.reasons.map((reason, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-300">
                        <CheckCircle2 className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Legal Notice */}
        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl print-avoid-break space-y-1.5 text-xs text-amber-200/80">
          <div className="font-semibold flex items-center gap-1.5 text-amber-400">
            <AlertTriangle className="w-4 h-4" />
            <span>Decision-Support Notice & Statutory Disclaimer</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            {investigation.disclaimer ||
              'This analysis establishes statistical correlation only and does not constitute a legal determination of liability.'} This document is compiled to assist maritime law enforcement, port state control officers, and coast guard investigators under MARPOL 73/78 Annex I provisions.
          </p>
        </div>

      </div>
    </div>
  );
};
