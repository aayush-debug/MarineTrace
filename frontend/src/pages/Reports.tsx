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
  { metric: 'Dice Score', value: '0.87', benchmark: 'Primary metric' },
  { metric: 'IoU', value: '0.79', benchmark: 'Primary metric' },
  { metric: 'Precision', value: '0.91', benchmark: '—' },
  { metric: 'Recall', value: '0.84', benchmark: '—' },
  { metric: 'F1 Score', value: '0.87', benchmark: '—' },
  { metric: 'Pixel Accuracy', value: '0.96', benchmark: '—' },
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
    a.download = `MarineTrace_Report_${investigation.investigation_id}.json`;
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
    a.download = `MarineTrace_Vessels_${investigation.investigation_id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!investigation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#05080f] font-mono">
        <div className="text-center space-y-3">
          <FileText className="w-10 h-10 text-slate-700 mx-auto" />
          <p className="text-[11px] text-slate-500">No active investigation. Run demo scenario to generate a report.</p>
        </div>
      </div>
    );
  }

  const { spill, drift, vessels } = investigation;
  const centroidLat = spill.geometry?.coordinates?.[0]?.[0]?.[1] ?? 18.721;
  const generatedAt = new Date().toUTCString();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#05080f] overflow-y-auto font-mono">

      {/* Action Bar — no-print */}
      <div className="px-5 py-3 bg-[#080d18] border-b border-[rgba(255,255,255,0.07)] flex items-center justify-between gap-4 no-print shrink-0 sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <FileText className="w-4 h-4 text-cyan-400" />
          <div>
            <h1 className="text-[12px] font-bold text-slate-100 tracking-wider">
              MARITIME INCIDENT INTELLIGENCE DOSSIER
            </h1>
            <p className="text-[9px] text-slate-600 mt-0.5">
              Official decision-support report for maritime enforcement and pollution response.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0d1427] hover:bg-[#111e35] border border-[rgba(255,255,255,0.08)] text-slate-300 text-[9px] font-semibold tracking-wider transition-colors"
          >
            <Download className="w-3 h-3 text-indigo-400" />
            <span>EXPORT CSV</span>
          </button>

          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-[#0d1427] hover:bg-[#111e35] border border-[rgba(255,255,255,0.08)] text-slate-300 text-[9px] font-semibold tracking-wider transition-colors"
          >
            <Download className="w-3 h-3 text-cyan-400" />
            <span>EXPORT JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-[9px] shadow-md tracking-wider transition-colors"
          >
            <Printer className="w-3 h-3" />
            <span>PRINT DOSSIER</span>
          </button>
        </div>
      </div>

      {/* Report Canvas */}
      <div className="p-6 max-w-5xl mx-auto w-full space-y-6">

        {/* ─── Document Header ─── */}
        <div className="bg-[#0d1427] border border-[rgba(255,255,255,0.08)] rounded-xl p-6 shadow-2xl">
          <div className="flex items-start justify-between border-b border-[rgba(255,255,255,0.07)] pb-4 mb-4">
            <div>
              <div className="flex items-center gap-2.5 text-cyan-400 font-bold text-sm tracking-widest mb-1">
                <Shield className="w-5 h-5" />
                <span>MARINETRACE INTELLIGENCE DOSSIER</span>
              </div>
              <div className="text-[9px] text-slate-500 tracking-widest">
                MARITIME OIL POLLUTION INVESTIGATION & SOURCE ATTRIBUTION REPORT
              </div>
              <div className="text-[9px] text-slate-600 mt-1">
                Classification: RESTRICTED — For Authorised Enforcement Use Only
              </div>
            </div>
            <div className="text-right text-[9px] font-mono">
              <div className="font-bold text-slate-200 text-xs">{investigation.investigation_id}</div>
              <div className="text-slate-500 mt-0.5">
                <Clock className="w-2.5 h-2.5 inline mr-1" />
                Generated: {generatedAt}
              </div>
              <div className="text-slate-600 mt-0.5">
                Observation: {new Date(investigation.observation_time).toUTCString()}
              </div>
            </div>
          </div>

          {/* § 0: System Provenance */}
          <div className="mb-4">
            <div className="text-[9px] font-bold text-slate-500 tracking-widest uppercase mb-2 flex items-center gap-1.5">
              <Cpu className="w-3 h-3 text-indigo-400" />
              SECTION 0 — SYSTEM PROVENANCE & PIPELINE
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[9px] font-mono">
              {[
                { k: 'System', v: 'MarineTrace v2.4' },
                { k: 'ML Model', v: 'marinetrace-unet-v1' },
                { k: 'Architecture', v: 'U-Net ResNet-34' },
                { k: 'Input', v: 'VV+VH SAR (2ch)' },
                { k: 'Drift Engine', v: 'OpenDrift' },
                { k: 'Current Data', v: 'Copernicus CMEMS' },
                { k: 'Wind Data', v: 'ECMWF ERA-5' },
                { k: 'AIS Source', v: 'MarineTraffic' },
              ].map(({ k, v }) => (
                <div key={k} className="p-2 bg-[#111827] rounded border border-[rgba(255,255,255,0.05)]">
                  <div className="text-slate-600 text-[8px]">{k}</div>
                  <div className="text-slate-300 font-semibold">{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* ML Performance */}
          <div>
            <div className="text-[9px] font-bold text-slate-500 tracking-widest uppercase mb-2 flex items-center gap-1.5">
              <TrendingUp className="w-3 h-3 text-emerald-400" />
              ML MODEL VALIDATION PERFORMANCE — Zenodo Test Set (450 Scenes)
            </div>
            <table className="w-full text-[9px] font-mono border-collapse">
              <thead>
                <tr className="border-b border-[rgba(255,255,255,0.07)]">
                  {['Metric', 'Value', 'Notes'].map((h) => (
                    <th key={h} className="text-left py-1.5 px-2 text-slate-500 font-semibold tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ML_PERF_TABLE.map((r, i) => (
                  <tr key={r.metric} className={`border-b border-[rgba(255,255,255,0.04)] ${i % 2 === 0 ? 'bg-[rgba(255,255,255,0.01)]' : ''}`}>
                    <td className="py-1.5 px-2 text-slate-400">{r.metric}</td>
                    <td className="py-1.5 px-2 text-emerald-400 font-bold">{r.value}</td>
                    <td className="py-1.5 px-2 text-slate-600">{r.benchmark}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* ─── Section 1: SAR Detection ─── */}
        <div className="bg-[#0d1427] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 shadow-xl">
          <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest border-b border-[rgba(255,255,255,0.07)] pb-2 mb-3 flex items-center gap-1.5">
            <Satellite className="w-3.5 h-3.5" />
            1. SATELLITE SAR DETECTION — SPILL CHARACTERIZATION
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Detection Confidence', value: `${(spill.confidence * 100).toFixed(1)}%`, color: 'text-emerald-400' },
              { label: 'Slick Area', value: `${spill.area_km2.toFixed(2)} km²`, color: 'text-amber-400' },
              { label: 'Centroid', value: `${centroidLat.toFixed(4)}°N`, color: 'text-slate-200' },
              { label: 'Sensor', value: 'Sentinel-1 IW', color: 'text-slate-200' },
            ].map((item) => (
              <div key={item.label} className="p-3 bg-[#111827] rounded border border-[rgba(255,255,255,0.05)]">
                <div className="text-[8px] text-slate-500 mb-1 tracking-widest">{item.label.toUpperCase()}</div>
                <div className={`text-sm font-bold ${item.color} kpi-value`}>{item.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── Section 2: Drift Reconstruction ─── */}
        <div className="bg-[#0d1427] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 shadow-xl">
          <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest border-b border-[rgba(255,255,255,0.07)] pb-2 mb-3 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            2. HYDRODYNAMIC BACKTRACKING & ORIGIN ZONE ESTIMATION
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-3">
            {[
              { label: 'Estimated Origin', value: `${drift.origin.latitude.toFixed(4)}°N, ${drift.origin.longitude.toFixed(4)}°E`, color: 'text-amber-300' },
              { label: 'Origin Confidence', value: `${(drift.origin.confidence * 100).toFixed(0)}% (68% Envelope)`, color: 'text-emerald-400' },
              { label: 'Discharge Window', value: `${new Date(drift.origin_time_window.start).toLocaleTimeString()} – ${new Date(drift.origin_time_window.end).toLocaleTimeString()} UTC`, color: 'text-slate-200' },
            ].map((item) => (
              <div key={item.label} className="p-3 bg-[#111827] rounded border border-[rgba(255,255,255,0.05)]">
                <div className="text-[8px] text-slate-500 mb-1 tracking-widest">{item.label.toUpperCase()}</div>
                <div className={`text-xs font-bold ${item.color}`}>{item.value}</div>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-2 gap-2 text-[9px] font-mono bg-[#111827] p-2.5 rounded border border-[rgba(255,255,255,0.04)]">
            <div><span className="text-slate-600">Surface Current:</span> <span className="text-slate-300">{environmental.currentSpeedKnots.toFixed(2)} kn at {environmental.currentDirectionDeg}° ({environmental.currentDirectionCardinal})</span></div>
            <div><span className="text-slate-600">Surface Wind:</span> <span className="text-slate-300">{environmental.windSpeedKnots.toFixed(1)} kn ({environmental.windDirectionCardinal})</span></div>
            <div><span className="text-slate-600">SST:</span> <span className="text-slate-300">{environmental.seaSurfaceTempC.toFixed(1)}°C</span></div>
            <div><span className="text-slate-600">Wave Height:</span> <span className="text-slate-300">{environmental.waveHeightMeters.toFixed(1)} m</span></div>
          </div>
        </div>

        {/* ─── Section 3: Vessel Attribution ─── */}
        <div className="bg-[#0d1427] border border-[rgba(255,255,255,0.08)] rounded-xl p-5 shadow-xl">
          <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest border-b border-[rgba(255,255,255,0.07)] pb-2 mb-3 flex items-center gap-1.5">
            <Ship className="w-3.5 h-3.5" />
            3. CANDIDATE VESSEL ATTRIBUTION & INVESTIGATIVE RANKING
          </div>

          <div className="space-y-3">
            {vessels.map((vessel) => (
              <div
                key={vessel.mmsi}
                className={`p-4 border rounded-lg print-avoid-break ${
                  vessel.rank === 1
                    ? 'bg-rose-500/5 border-rose-500/20'
                    : 'bg-[#111827] border-[rgba(255,255,255,0.06)]'
                }`}
              >
                {/* Vessel Header */}
                <div className="flex items-center justify-between border-b border-[rgba(255,255,255,0.06)] pb-2.5 mb-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className={`w-7 h-7 rounded flex items-center justify-center font-bold text-[10px] font-mono ${
                      vessel.rank === 1
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : vessel.rank === 2
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-slate-700/50 text-slate-400 border border-slate-700'
                    }`}>
                      #{vessel.rank}
                    </span>
                    <div>
                      <div className="font-bold text-slate-100 text-sm">{vessel.vessel_name}</div>
                      <div className="text-[9px] text-slate-500 font-mono">
                        MMSI: {vessel.mmsi} · {vessel.vessel_type} · Flag: {vessel.flag}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] text-slate-500 tracking-widest">ATTRIBUTION SCORE</div>
                    <div className={`text-xl font-bold kpi-value ${
                      vessel.rank === 1 ? 'text-rose-400' : vessel.rank === 2 ? 'text-amber-400' : 'text-slate-400'
                    }`}>
                      {vessel.score.toFixed(1)}%
                    </div>
                    <div className={`text-[8px] font-bold tracking-widest ${
                      vessel.investigative_priority === 'HIGH' ? 'text-rose-400' :
                      vessel.investigative_priority === 'MEDIUM' ? 'text-amber-400' : 'text-slate-500'
                    }`}>
                      {vessel.investigative_priority} PRIORITY
                    </div>
                  </div>
                </div>

                {/* Feature Score Grid */}
                <div className="grid grid-cols-5 gap-1.5 mb-2.5">
                  {[
                    { k: 'Spatial', v: vessel.feature_scores.spatial, w: '30%' },
                    { k: 'Temporal', v: vessel.feature_scores.temporal, w: '25%' },
                    { k: 'Trajectory', v: vessel.feature_scores.trajectory, w: '20%' },
                    { k: 'Behaviour', v: vessel.feature_scores.behaviour, w: '15%' },
                    { k: 'Relevance', v: vessel.feature_scores.vessel_relevance, w: '10%' },
                  ].map(({ k, v, w }) => (
                    <div key={k} className="p-1.5 bg-[rgba(255,255,255,0.03)] rounded text-center">
                      <div className="text-[8px] text-slate-500">{k}</div>
                      <div className="text-[9px] font-bold text-slate-200 font-mono">{v.toFixed(0)}%</div>
                      <div className="text-[7px] text-slate-700">wt: {w}</div>
                    </div>
                  ))}
                </div>

                {/* Evidence */}
                {vessel.reasons && vessel.reasons.length > 0 && (
                  <div className="space-y-1">
                    {vessel.reasons.map((reason, i) => (
                      <div key={i} className="flex items-start gap-1.5 text-[9px] text-slate-400">
                        <CheckCircle2 className="w-3 h-3 text-cyan-500/60 shrink-0 mt-0.5" />
                        <span>{reason}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* ─── Legal Disclaimer ─── */}
        <div className="p-4 bg-amber-500/5 border border-amber-500/20 rounded-xl print-avoid-break">
          <div className="font-bold flex items-center gap-1.5 text-amber-400 text-[10px] mb-2 tracking-widest">
            <AlertTriangle className="w-3.5 h-3.5" />
            STATUTORY NOTICE & LEGAL LIMITATION OF ATTRIBUTION
          </div>
          <p className="text-[9px] text-amber-300/60 leading-relaxed">
            {investigation.disclaimer} This document serves as preliminary intelligence to guide maritime law enforcement,
            port state control inspections, and aerial surveillance operations. All attribution scores represent
            computational evidence ranking only. Final enforcement action requires independent legal verification
            under applicable maritime law and MARPOL Annex I provisions.
          </p>
          <div className="mt-2 text-[8px] text-amber-700 font-mono">
            Report generated by MarineTrace v2.4 — marinetrace-unet-v1 — Smart India Hackathon 2026
          </div>
        </div>

      </div>
    </div>
  );
};
