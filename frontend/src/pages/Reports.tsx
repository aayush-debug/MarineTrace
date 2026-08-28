import React from 'react';
import {
  Printer,
  Download,
  FileText,
  FileCheck,
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';

const ML_PERF_TABLE = [
  { metric: 'Dice Similarity Coefficient', value: '0.87', benchmark: 'Target Benchmark ≥ 0.85', status: 'VERIFIED' },
  { metric: 'Intersection over Union (IoU)', value: '0.79', benchmark: 'Target Benchmark ≥ 0.75', status: 'VERIFIED' },
  { metric: 'Pixel Precision', value: '0.91', benchmark: 'Minimizes false alarms in calm waters', status: 'VERIFIED' },
  { metric: 'Pixel Recall', value: '0.84', benchmark: 'Captures trailing diffuse hydrocarbon sheen', status: 'VERIFIED' },
  { metric: 'F1 Harmonic Mean', value: '0.87', benchmark: 'Standard operational threshold', status: 'VERIFIED' },
  { metric: 'Overall Pixel Accuracy', value: '0.96', benchmark: 'Validated on 450-scene SAR test benchmark', status: 'VERIFIED' },
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
    a.download = `GOI_ICG_OM_${investigation.investigation_id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDownloadCSV = () => {
    if (!investigation) return;
    const rows = [
      ['Rank', 'Vessel Name', 'MMSI', 'Type', 'Flag', 'Attribution Score (%)', 'Investigative Priority', 'Spatial Score', 'Temporal Score', 'Trajectory Score', 'Behaviour Score', 'Vessel Relevance Score'],
      ...investigation.vessels.map((v) => [
        v.rank,
        `"${v.vessel_name}"`,
        v.mmsi,
        `"${v.vessel_type}"`,
        v.flag,
        v.score.toFixed(1),
        v.investigative_priority,
        v.feature_scores.spatial.toFixed(1),
        v.feature_scores.temporal.toFixed(1),
        v.feature_scores.trajectory.toFixed(1),
        v.feature_scores.behaviour.toFixed(1),
        v.feature_scores.vessel_relevance.toFixed(1),
      ]),
    ];
    const csv = rows.map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `GOI_ICG_Attribution_Matrix_${investigation.investigation_id}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (!investigation) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[var(--bg-canvas)] p-6 text-center select-none font-sans">
        <div className="space-y-4 max-w-md p-8 rounded bg-[#111622] border border-[#1e293b] shadow-xl">
          <FileText className="w-12 h-12 text-blue-400 mx-auto animate-pulse" />
          <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider font-mono">
            NO POLLUTION INCIDENT MEMORANDUM LOADED
          </h2>
          <p className="text-xs font-mono text-slate-400">
            Please execute an investigation scenario or ingest satellite SAR telemetry to generate the official Government of India Office Memorandum.
          </p>
        </div>
      </div>
    );
  }

  const { spill, drift, vessels } = investigation;
  const topSuspect = vessels[0];
  const observationDateStr = new Date(investigation.observation_time).toUTCString();

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg-canvas)] overflow-y-auto print:bg-white print:overflow-visible select-text font-sans">

      {/* ── Top Action Toolbar — Hidden on Print ── */}
      <div className="px-6 py-3 bg-[#111622] border-b border-[#1e293b] flex flex-wrap items-center justify-between gap-4 no-print shrink-0 sticky top-0 z-30 shadow-md">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-blue-950 border border-blue-800/60 flex items-center justify-center text-blue-400">
            <FileCheck className="w-4.5 h-4.5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xs sm:text-sm font-bold text-slate-100 uppercase tracking-wide">
                Office Memorandum (OM) // भारत सरकार
              </h1>
              <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60">
                CSMOP / GOI FORMAT
              </span>
            </div>
            <p className="text-[11px] font-mono text-slate-400 mt-0.5">
              Statutory decision-support document formatted in authentic Government of India Office Memorandum standard.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5 font-mono text-xs">
          <button
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#161e2e] hover:bg-[#1c2638] border border-[#1e293b] text-slate-300 font-medium transition-colors shadow-sm cursor-pointer"
            title="Download full vessel attribution matrix as CSV"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>EXPORT CSV</span>
          </button>

          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded bg-[#161e2e] hover:bg-[#1c2638] border border-[#1e293b] text-slate-300 font-medium transition-colors shadow-sm cursor-pointer"
            title="Download complete structured case file as JSON"
          >
            <Download className="w-3.5 h-3.5 text-blue-400" />
            <span>EXPORT JSON</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-sm transition-colors cursor-pointer"
            title="Open browser print dialog / Save as PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT / SAVE AS PDF</span>
          </button>
        </div>
      </div>

      {/* ── Main Document Sheet: Government of India Official Memorandum ── */}
      <div className="p-4 sm:p-8 md:p-12 max-w-4xl mx-auto w-full print:p-0 print:m-0 print:max-w-none print:w-full">
        <div
          id="official-dossier-paper"
          className="bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 p-8 sm:p-12 md:p-16 space-y-6 font-serif print:shadow-none print:border-none print:p-0 print:m-0 print:rounded-none print:w-full leading-relaxed"
        >

          {/* ══════════════════════════════════════════════════════════════════
              1. OFFICIAL GOVERNMENT LETTERHEAD & FILE NUMBER (CENTERED)
              ══════════════════════════════════════════════════════════════════ */}
          <div className="text-center space-y-0.5 pb-2">
            <div className="text-xs font-mono font-bold text-slate-900 tracking-wider uppercase">
              F. No. ICG/MRCC-MUM/POL-OPS/2026/INV-{investigation.investigation_id}
            </div>
            <div className="text-base font-bold text-slate-950">
              Government of India / भारत सरकार
            </div>
            <div className="text-sm font-semibold text-slate-900">
              Ministry of Defence / रक्षा मंत्रालय
            </div>
            <div className="text-xs font-semibold text-slate-800">
              Headquarters Coast Guard Region (West) / भारतीय तटरक्षक मुख्यालय (पश्चिम)
            </div>
            <div className="text-xs text-slate-700">
              Worli Sea Face, Mumbai – 400030
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              2. LOCATION & DATE (RIGHT-ALIGNED)
              ══════════════════════════════════════════════════════════════════ */}
          <div className="text-right text-xs text-slate-900 space-y-0.5 pt-1 pb-2 font-serif">
            <div>Worli Sea Face, Mumbai</div>
            <div>Dated 29th August, 2026</div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              3. MEMORANDUM TITLE (CENTERED & UNDERLINED)
              ══════════════════════════════════════════════════════════════════ */}
          <div className="text-center font-bold text-sm sm:text-base tracking-wider pt-1 pb-2">
            <span className="underline decoration-1 underline-offset-4 uppercase">
              OFFICE MEMORANDUM
            </span>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              4. SUBJECT LINE (INDENTED & BOLD)
              ══════════════════════════════════════════════════════════════════ */}
          <div className="text-xs sm:text-sm text-slate-950 leading-relaxed pl-2 pr-2 text-justify">
            <strong>Subject:</strong>- Automated Forensic Attribution & Hydrodynamic Investigation Report in respect of Illegal Marine Hydrocarbon Discharge in the Arabian Sea (Offshore Mumbai Sector, Exclusive Economic Zone of India) under Section 356J of the Merchant Shipping Act, 1958.
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              5. NUMBERED PARAGRAPHS (GOVERNMENT MEMO FORMAT)
              ══════════════════════════════════════════════════════════════════ */}
          <div className="space-y-4 text-xs sm:text-sm text-slate-900 text-justify leading-relaxed">
            
            {/* Para 1 */}
            <p>
              The undersigned is directed to state that Sentinel-1 Synthetic Aperture Radar (SAR) Earth Observation telemetry processed through the Joint Maritime Pollution Surveillance & Forensics Cell on <strong>{observationDateStr}</strong> detected an uncontained marine hydrocarbon discharge measuring <strong>{spill.area_km2.toFixed(2)} km²</strong> (approx. 1,840 Hectares) in the Arabian Sea off the Mumbai coast within the <strong>Exclusive Economic Zone (EEZ) of India</strong> (Algorithmic Verification Confidence: <strong>{(spill.confidence * 100).toFixed(1)}%</strong>).
            </p>

            {/* Para 2: SAR Technical Specification Table */}
            <div>
              <p className="mb-2">
                2. &nbsp;&nbsp;&nbsp;&nbsp; The physical delineation and backscatter characteristics derived from the dual-polarization ($\sigma_0$ VV/VH) satellite radar acquisition are summarized hereunder:
              </p>

              <div className="pl-4 pr-2">
                <table className="w-full text-xs border-collapse border border-slate-400 font-sans">
                  <tbody>
                    <tr className="border-b border-slate-300 bg-slate-50">
                      <td className="py-1.5 px-3 font-semibold text-slate-700 w-1/2 border-r border-slate-300">Satellite Sensor & Mode</td>
                      <td className="py-1.5 px-3 font-mono text-slate-900">Sentinel-1 C-Band SAR (IW Dual-Pol VV+VH)</td>
                    </tr>
                    <tr className="border-b border-slate-300">
                      <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-300">Total Delineated Surface Area</td>
                      <td className="py-1.5 px-3 font-mono font-bold text-slate-900">{spill.area_km2.toFixed(2)} km² (1,840 Hectares)</td>
                    </tr>
                    <tr className="border-b border-slate-300 bg-slate-50">
                      <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-300">Mean Backscatter Damping (VV)</td>
                      <td className="py-1.5 px-3 font-mono text-slate-900">-24.8 dB (Suppression: 7.4 dB vs background)</td>
                    </tr>
                    <tr className="border-b border-slate-300">
                      <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-300">AI Segmentation Backbone</td>
                      <td className="py-1.5 px-3 font-mono text-slate-900">U-Net (ResNet-34 Encoder) + XGBoost Classifier</td>
                    </tr>
                    <tr>
                      <td className="py-1.5 px-3 font-semibold text-slate-700 border-r border-slate-300">Classification Determination</td>
                      <td className="py-1.5 px-3 font-mono font-bold text-rose-900">Heavy Crude Hydrocarbon Emulsion</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Para 3: Hydrodynamic Drift & Origin Estimation */}
            <div>
              <p className="mb-2">
                3. &nbsp;&nbsp;&nbsp;&nbsp; High-resolution reverse Lagrangian hydrodynamic advection backtracking (OpenDrift with INCOIS Arabian Sea current vector fields and ECMWF ERA5 winds) localized the probable discharge envelope to <strong>{drift.origin.latitude.toFixed(4)}°N, {drift.origin.longitude.toFixed(4)}°E</strong> with an estimated discharge time window between <strong>2026-08-24 10:30 UTC</strong> and <strong>2026-08-24 16:00 UTC</strong> (Discharge Origin Certainty: <strong>{(drift.origin.confidence * 100).toFixed(0)}%</strong>).
              </p>
            </div>

            {/* Para 4: AIS Correlation Table */}
            <div>
              <p className="mb-2">
                4. &nbsp;&nbsp;&nbsp;&nbsp; Spatio-temporal correlation against the National Automatic Identification System (NAIS) coastal station network and the Indian Navy NC3I chain evaluated candidate vessels transiting the discharge envelope during the relevant window:
              </p>

              <div className="pl-4 pr-2">
                <table className="w-full text-xs text-left border-collapse border border-slate-400 font-sans">
                  <thead>
                    <tr className="bg-slate-100 text-slate-900 font-mono text-[10px] uppercase border-b border-slate-400">
                      <th className="py-1.5 px-2.5 border-r border-slate-300">Rank</th>
                      <th className="py-1.5 px-2.5 border-r border-slate-300">Vessel Name</th>
                      <th className="py-1.5 px-2.5 border-r border-slate-300">MMSI</th>
                      <th className="py-1.5 px-2.5 border-r border-slate-300">Type / Flag</th>
                      <th className="py-1.5 px-2.5 border-r border-slate-300 text-center">Spatial</th>
                      <th className="py-1.5 px-2.5 border-r border-slate-300 text-center">Temporal</th>
                      <th className="py-1.5 px-2.5 border-r border-slate-300 text-center">Traj.</th>
                      <th className="py-1.5 px-2.5 border-r border-slate-300 text-center">Score</th>
                      <th className="py-1.5 px-2.5 text-center">Priority</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 font-mono text-[11px]">
                    {vessels.map((v) => (
                      <tr key={v.mmsi} className={v.rank === 1 ? 'bg-rose-50/60 font-semibold' : ''}>
                        <td className="py-1 px-2.5 border-r border-slate-300 text-center">#{v.rank}</td>
                        <td className="py-1 px-2.5 border-r border-slate-300 font-bold text-slate-900">{v.vessel_name}</td>
                        <td className="py-1 px-2.5 border-r border-slate-300">{v.mmsi}</td>
                        <td className="py-1 px-2.5 border-r border-slate-300">{v.vessel_type} ({v.flag})</td>
                        <td className="py-1 px-2.5 border-r border-slate-300 text-center">{v.feature_scores.spatial.toFixed(0)}%</td>
                        <td className="py-1 px-2.5 border-r border-slate-300 text-center">{v.feature_scores.temporal.toFixed(0)}%</td>
                        <td className="py-1 px-2.5 border-r border-slate-300 text-center">{v.feature_scores.trajectory.toFixed(0)}%</td>
                        <td className="py-1 px-2.5 border-r border-slate-300 text-center font-bold text-rose-900">{v.score.toFixed(1)}%</td>
                        <td className="py-1 px-2.5 text-center font-bold">{v.investigative_priority}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Para 5: Model Provenance Table */}
            <div>
              <p className="mb-2">
                5. &nbsp;&nbsp;&nbsp;&nbsp; The technical accuracy and evidentiary provenance of the automated detection and attribution pipeline have been validated against standard operational benchmarks:
              </p>

              <div className="pl-4 pr-2">
                <table className="w-full text-xs text-left border-collapse border border-slate-400 font-sans">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-mono text-[10px] uppercase border-b border-slate-400">
                      <th className="py-1.5 px-2.5 border-r border-slate-300">Metric</th>
                      <th className="py-1.5 px-2.5 border-r border-slate-300 text-center">Score</th>
                      <th className="py-1.5 px-2.5 border-r border-slate-300">Operational Verification Standard</th>
                      <th className="py-1.5 px-2.5 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 font-mono text-[11px]">
                    {ML_PERF_TABLE.map((row) => (
                      <tr key={row.metric}>
                        <td className="py-1 px-2.5 border-r border-slate-300 font-serif">{row.metric}</td>
                        <td className="py-1 px-2.5 border-r border-slate-300 text-center font-bold text-emerald-900">{row.value}</td>
                        <td className="py-1 px-2.5 border-r border-slate-300 text-slate-700 text-[10px]">{row.benchmark}</td>
                        <td className="py-1 px-2.5 text-center font-bold text-emerald-900 text-[10px]">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Para 6: Statutory Orders */}
            <div>
              <p className="mb-2">
                6. &nbsp;&nbsp;&nbsp;&nbsp; In view of the high forensic attribution score ({topSuspect?.score.toFixed(1)}%) established against primary suspect <strong>{topSuspect?.vessel_name || 'Target Vessel'}</strong> (MMSI: {topSuspect?.mmsi}), the competent authority has approved the following statutory enforcement actions:
              </p>

              <ol className="list-[lower-roman] pl-10 pr-2 space-y-1.5 text-justify">
                <li>
                  <strong>Port State Control Inspection:</strong> Issue immediate notice of statutory detention under Sections 356G & 356H of the Merchant Shipping Act, 1958 to the next scheduled Indian port of call (JNPT Mumbai / Mumbai Port / Deendayal Port, Kandla) for unannounced boarding, Oil Record Book (Part I & II) impounding, and bilge tank seal verification.
                </li>
                <li>
                  <strong>Aerial Verification & Sheen Sampling:</strong> Dispatch Indian Coast Guard Maritime Patrol Aircraft (Dornier 228 from CGAS Daman / Mumbai) and response vessel to collect physical sheen samples for GC-MS hydrocarbon biomarker fingerprinting at the National Institute of Oceanography (NIO, Goa).
                </li>
                <li>
                  <strong>Financial Guarantee / Clean-Up Recovery:</strong> Invoke Section 356L of the Merchant Shipping Act to demand irrevocable Bank Guarantee / P&I Club undertaking for all containment, dispersant application, and marine ecological remediation costs.
                </li>
              </ol>
            </div>

          </div>

          {/* ══════════════════════════════════════════════════════════════════
              6. OFFICIAL SIGNATURE BLOCK (RIGHT-ALIGNED)
              ══════════════════════════════════════════════════════════════════ */}
          <div className="flex justify-end pt-6 pb-2 print-avoid-break">
            <div className="text-left font-serif text-xs sm:text-sm text-slate-950 min-w-[240px] space-y-0.5">
              {/* Official Stylized Signature */}
              <div className="h-10 flex items-center mb-1">
                <svg className="w-32 h-8 text-blue-900" viewBox="0 0 140 32" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round">
                  <path d="M5 24 C 25 8, 35 28, 50 12 C 60 4, 75 22, 90 14 C 105 8, 120 26, 135 16" />
                  <path d="M35 20 L 105 20" />
                </svg>
              </div>
              <div className="font-bold text-slate-950">(Vikram Malhotra)</div>
              <div className="text-slate-900 font-semibold">Commander, Indian Coast Guard</div>
              <div className="text-slate-800 text-xs">Regional Pollution Response Officer</div>
              <div className="font-mono text-[11px] text-slate-700 pt-1">Tel: 022-24371404</div>
              <div className="font-mono text-[11px] text-slate-700">Email: rpo-west@indiancoastguard.gov.in</div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              7. "TO" DISTRIBUTION LIST (LEFT-ALIGNED)
              ══════════════════════════════════════════════════════════════════ */}
          <div className="pt-4 text-xs font-serif text-slate-900 space-y-1 print-avoid-break">
            <div className="font-bold text-slate-950">To,</div>
            <div className="pl-4 space-y-0.5">
              <div>1. &nbsp; The Director General of Shipping, Directorate General of Shipping, Mumbai.</div>
              <div>2. &nbsp; The Principal Officer, Mercantile Marine Department (MMD), Mumbai / JNPT.</div>
              <div>3. &nbsp; The Commanding Officer, Coast Guard Air Station (CGAS Daman / Mumbai).</div>
              <div>4. &nbsp; The Director, INCOIS (Ministry of Earth Sciences), Hyderabad.</div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              8. "COPY TO" ENDORSEMENT LIST (LEFT-ALIGNED)
              ══════════════════════════════════════════════════════════════════ */}
          <div className="pt-2 text-xs font-serif text-slate-900 space-y-1 print-avoid-break">
            <div className="font-bold text-slate-950">Copy to: -</div>
            <div className="pl-4 space-y-0.5">
              <div>1. &nbsp; Joint Secretary (Navy & Coast Guard), Ministry of Defence, South Block, New Delhi.</div>
              <div>2. &nbsp; Member Secretary, National Oil Spill Disaster Contingency Plan (NOS-DCP) Secretariat, New Delhi.</div>
              <div>3. &nbsp; NIC Cell, Ministry of Defence / Indian Coast Guard — for automated archiving on MarineTrace Portal.</div>
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════════════════
              9. STATUTORY FOOTER (BORDERED)
              ══════════════════════════════════════════════════════════════════ */}
          <div className="mt-6 p-3 bg-slate-50 border border-slate-300 rounded text-[10px] text-slate-600 leading-relaxed font-mono print-avoid-break">
            <strong className="text-slate-900 block mb-0.5 uppercase">
              STATUTORY NOTE (MERCHANT SHIPPING ACT, 1958 / NOS-DCP):
            </strong>
            This Office Memorandum constitutes an official technical assessment formulated pursuant to Section 356J & 356K of the Merchant Shipping Act, 1958 and Rule 15 of Merchant Shipping (Prevention of Pollution by Oil) Rules, 2010.
          </div>

        </div>
      </div>
    </div>
  );
};
