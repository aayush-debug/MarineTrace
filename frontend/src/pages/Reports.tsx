import {
  Printer,
  Download,
  FileText,
  Shield,
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
  const { investigation } = useInvestigation();

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
      <div className="flex-1 flex items-center justify-center bg-[#040814] p-6 text-center select-none">
        <div className="space-y-3 max-w-md p-8 rounded-lg bg-[#070d1d] border border-cyan-500/25 shadow-2xl relative">
          <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-cyan-400" />
          <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-cyan-400" />
          <FileText className="w-12 h-12 text-cyan-400 mx-auto animate-pulse" />
          <h2 className="font-orbitron text-sm font-bold text-slate-100 uppercase tracking-wider">
            NO MISSION TARGET LOADED
          </h2>
          <p className="text-xs font-mono text-slate-400">
            Launch a mission scenario or ingest satellite SAR imagery to compile an official forensics dossier.
          </p>
        </div>
      </div>
    );
  }

  const { spill, drift, vessels } = investigation;
  const generatedAt = new Date().toUTCString();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#040814] overflow-y-auto select-none">

      {/* Action Bar — no-print */}
      <div className="px-6 py-3 bg-[#070d1d] border-b border-[rgba(0,240,255,0.18)] flex items-center justify-between gap-4 no-print shrink-0 sticky top-0 z-10 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-md bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_10px_rgba(0,240,255,0.25)]">
            <FileText className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-orbitron text-xs sm:text-sm font-bold text-slate-100 uppercase tracking-wider">
                Mission Incident Intelligence Dossier
              </h1>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                AUDITABLE REPORT
              </span>
            </div>
            <p className="text-[11px] font-mono text-cyan-400/80 mt-0.5">
              Auditable forensic decision-support dossier for maritime law enforcement and pollution response authorities.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0 font-mono">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#091124] hover:bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>EXPORT CSV</span>
          </button>

          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#091124] hover:bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-bold transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>EXPORT JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-md bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-bold text-xs shadow-[0_0_12px_rgba(0,240,255,0.3)] transition-all cursor-pointer"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT DOSSIER</span>
          </button>
        </div>
      </div>

      {/* Report Canvas */}
      <div className="p-6 max-w-4xl mx-auto w-full space-y-6">

        {/* Document Header & Provenance */}
        <div className="bg-[#070d1d] border border-cyan-500/25 rounded-lg p-6 shadow-xl space-y-4 relative">
          <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-cyan-400" />
          <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-cyan-400" />

          <div className="flex items-start justify-between border-b border-cyan-900/40 pb-4">
            <div>
              <div className="flex items-center gap-2 text-cyan-300 font-orbitron font-bold text-base tracking-wider mb-1 uppercase">
                <Shield className="w-5 h-5 text-cyan-400" />
                <span>MARINETRACE INTELLIGENCE DOSSIER</span>
              </div>
              <div className="text-xs font-mono text-slate-300 font-bold">
                Sentinel-1 SAR Detection & Lagrangian Source Attribution Report
              </div>
              <div className="text-[10px] font-mono text-cyan-400/80 mt-1">
                SECURITY CLASSIFICATION: OFFICIAL // DECISION-SUPPORT // UNCLASSIFIED
              </div>
            </div>
            <div className="text-right text-xs font-mono">
              <div className="font-bold text-cyan-200 text-sm">TARGET #{investigation.investigation_id}</div>
              <div className="text-slate-400 mt-1 flex items-center justify-end gap-1 text-[10px]">
                <Clock className="w-3 h-3 text-cyan-400" />
                <span>{generatedAt}</span>
              </div>
            </div>
          </div>

          {/* Section 0: System Architecture & Provenance */}
          <div className="font-mono">
            <div className="text-xs font-bold text-cyan-300 mb-2.5 flex items-center gap-1.5 uppercase">
              <Cpu className="w-4 h-4 text-cyan-400" />
              <span>Section 0 — System Provenance & Multi-Stage Pipeline</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              {[
                { k: 'SOFTWARE REVISION', v: 'MarineTrace v2.4' },
                { k: 'SAR ML BACKBONE', v: 'U-Net ResNet-34' },
                { k: 'PHYSICS BACKTRACK', v: 'OpenDrift 500-P' },
                { k: 'OCEAN CURRENTS', v: 'Copernicus CMEMS' },
                { k: 'SURFACE WIND', v: 'ECMWF ERA5' },
                { k: 'AIS INGESTION', v: 'Spatio-Temporal' },
                { k: 'ATTRIBUTION SCORER', v: '5D Explainable AI' },
                { k: 'REFERENCE CRS', v: 'EPSG:4326 (WGS84)' },
              ].map(({ k, v }) => (
                <div key={k} className="p-2.5 bg-[#040814] rounded border border-cyan-900/40">
                  <div className="text-slate-500 text-[9px]">{k}</div>
                  <div className="text-cyan-200 font-bold text-[10px] mt-0.5">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Model Validation Benchmarks */}
          <div className="pt-2 border-t border-cyan-900/40 font-mono">
            <div className="text-xs font-bold text-cyan-300 mb-2 flex items-center gap-1.5 uppercase">
              <TrendingUp className="w-4 h-4 text-emerald-400" />
              <span>ML Model Validation Performance (Zenodo 450-Scene Benchmark)</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="border-b border-cyan-900/40 text-[10px] text-cyan-400 uppercase">
                    <th className="py-1.5 px-3 font-bold">Metric</th>
                    <th className="py-1.5 px-3 font-bold">Evaluation Score</th>
                    <th className="py-1.5 px-3 font-bold">Verification Target</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cyan-950/60">
                  {ML_PERF_TABLE.map((r) => (
                    <tr key={r.metric} className="hover:bg-cyan-950/20">
                      <td className="py-1.5 px-3 text-slate-300">{r.metric}</td>
                      <td className="py-1.5 px-3 text-emerald-400 font-bold font-mono">{r.value}</td>
                      <td className="py-1.5 px-3 text-slate-400 text-[10px]">{r.benchmark}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Section 1: SAR Oil Detection Summary */}
        <div className="bg-[#070d1d] border border-cyan-500/25 rounded-lg p-6 shadow-xl space-y-4 font-mono relative">
          <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-cyan-400" />
          <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
            <Satellite className="w-4 h-4 text-cyan-400" />
            <span>SECTION 01 — SATELLITE SAR OIL-SPILL DETECTION</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-[#040814] rounded border border-cyan-900/40">
              <span className="text-[9px] text-slate-500 block">OBSERVATION TIME:</span>
              <span className="font-bold text-cyan-200 text-[11px] mt-0.5 block">
                {new Date(investigation.observation_time).toUTCString()}
              </span>
            </div>
            <div className="p-3 bg-[#040814] rounded border border-cyan-900/40">
              <span className="text-[9px] text-slate-500 block">DETECTION STATUS:</span>
              <span className="font-bold text-rose-400 text-[11px] mt-0.5 block">
                {spill.detected ? 'CONFIRMED SLICK' : 'NEGATIVE'}
              </span>
            </div>
            <div className="p-3 bg-[#040814] rounded border border-cyan-900/40">
              <span className="text-[9px] text-slate-500 block">MODEL CONFIDENCE:</span>
              <span className="font-bold text-emerald-400 text-[11px] mt-0.5 block">
                {(spill.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="p-3 bg-[#040814] rounded border border-cyan-900/40">
              <span className="text-[9px] text-slate-500 block">SURFACE AREA:</span>
              <span className="font-bold text-amber-400 text-[11px] mt-0.5 block">
                {spill.area_km2.toFixed(1)} KM²
              </span>
            </div>
          </div>
        </div>

        {/* Section 2: Drift Physics & Origin Estimation */}
        <div className="bg-[#070d1d] border border-cyan-500/25 rounded-lg p-6 shadow-xl space-y-4 font-mono relative">
          <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-cyan-400" />
          <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>SECTION 02 — HYDRODYNAMIC DRIFT RECONSTRUCTION & ESTIMATED RELEASE</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="p-3 bg-[#040814] rounded border border-cyan-900/40">
              <span className="text-[9px] text-slate-500 block">OBSERVATION TIME:</span>
              <span className="font-bold text-cyan-200 text-[11px] mt-0.5 block">
                {new Date(investigation.observation_time).toUTCString()}
              </span>
            </div>
            <div className="p-3 bg-[#040814] rounded border border-cyan-900/40">
              <span className="text-[9px] text-slate-500 block">ORIGIN COORDINATES:</span>
              <span className="font-bold text-cyan-200 text-[11px] mt-0.5 block">
                {drift.origin.latitude.toFixed(4)}°N, {drift.origin.longitude.toFixed(4)}°E
              </span>
            </div>
            <div className="p-3 bg-[#040814] rounded border border-cyan-900/40">
              <span className="text-[9px] text-slate-500 block">ORIGIN PROBABILITY:</span>
              <span className="font-bold text-emerald-400 text-[11px] mt-0.5 block">
                {(drift.origin.confidence * 100).toFixed(0)}% CONFIDENCE
              </span>
            </div>
            <div className="p-3 bg-[#040814] rounded border border-cyan-900/40">
              <span className="text-[9px] text-slate-500 block">SIMULATION ENSEMBLE:</span>
              <span className="font-bold text-cyan-300 text-[11px] mt-0.5 block">
                500 Particles (OpenDrift)
              </span>
            </div>
          </div>
        </div>

        {/* Section 3: Vessel Attribution Ranking Table */}
        <div className="bg-[#070d1d] border border-cyan-500/25 rounded-lg p-6 shadow-xl space-y-4 font-mono relative">
          <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-cyan-400" />
          <div className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
            <Ship className="w-4 h-4 text-cyan-400" />
            <span>SECTION 03 — AIS TRAJECTORY CORRELATION & SUSPECT PRIORITIZATION</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="border-b border-cyan-900/40 text-[10px] text-cyan-400 uppercase">
                  <th className="py-2 px-3">Rank</th>
                  <th className="py-2 px-3">Vessel Name</th>
                  <th className="py-2 px-3">MMSI</th>
                  <th className="py-2 px-3">Type</th>
                  <th className="py-2 px-3">Flag</th>
                  <th className="py-2 px-3">Score</th>
                  <th className="py-2 px-3">Priority</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-cyan-950/60">
                {vessels.map((v) => (
                  <tr key={v.mmsi} className="hover:bg-cyan-950/20">
                    <td className="py-2 px-3 font-bold text-cyan-400">#{v.rank}</td>
                    <td className="py-2 px-3 font-bold text-slate-100">{v.vessel_name}</td>
                    <td className="py-2 px-3 text-cyan-200">{v.mmsi}</td>
                    <td className="py-2 px-3 text-slate-300">{v.vessel_type}</td>
                    <td className="py-2 px-3 text-slate-400">{v.flag}</td>
                    <td className="py-2 px-3 font-bold text-rose-400">{v.score.toFixed(1)}%</td>
                    <td className="py-2 px-3">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${
                        v.investigative_priority === 'HIGH'
                          ? 'bg-rose-950 text-rose-300 border-rose-500/40'
                          : 'bg-amber-950 text-amber-300 border-amber-500/40'
                      }`}>
                        {v.investigative_priority}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Legal & Regulatory Disclaimer */}
        <div className="p-4 rounded-lg bg-[#040814] border border-cyan-900/40 text-[10px] font-mono text-slate-400 leading-relaxed">
          <strong className="text-cyan-300 block mb-1">LEGAL & REGULATORY ADVISORY:</strong>
          {investigation.disclaimer}
        </div>
      </div>
    </div>
  );
};
