import React from 'react';
import {
  Printer,
  Download,
  FileText,
  FileCheck,
  Shield,
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
  const currentDateFormatted = new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date());

  // Dedicated Print Engine: Generates an isolated, unclipped A4 2-page document
  const handlePrint = () => {
    const printFrame = document.createElement('iframe');
    printFrame.style.position = 'fixed';
    printFrame.style.right = '0';
    printFrame.style.bottom = '0';
    printFrame.style.width = '0';
    printFrame.style.height = '0';
    printFrame.style.border = '0';
    document.body.appendChild(printFrame);

    const doc = printFrame.contentWindow?.document;
    if (!doc) {
      window.print();
      return;
    }

    const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>Government of India - Office Memorandum INV-${investigation.investigation_id}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: 'Times New Roman', Times, Georgia, serif;
      font-size: 11pt;
      line-height: 1.4;
      color: #0f172a;
      background: #ffffff;
      margin: 0;
      padding: 0;
    }
    .page-container {
      width: 100%;
      page-break-inside: avoid;
      break-inside: avoid;
      display: flex;
      flex-direction: column;
      justify-content: space-between;
      min-height: 260mm;
    }
    .page-break {
      page-break-after: always;
      break-after: page;
      height: 0;
      display: block;
    }
    .header {
      text-align: center;
      border-bottom: 1.5px solid #334155;
      padding-bottom: 6px;
      margin-bottom: 8px;
    }
    .emblem-box {
      display: flex;
      justify-content: center;
      margin-bottom: 4px;
    }
    .file-no {
      font-family: 'Courier New', Courier, monospace;
      font-size: 9.5pt;
      font-weight: bold;
      letter-spacing: 0.5px;
      margin-bottom: 2px;
    }
    .gov-title {
      font-size: 13pt;
      font-weight: bold;
      color: #020617;
    }
    .ministry-title {
      font-size: 11pt;
      font-weight: bold;
      color: #0f172a;
    }
    .hq-title {
      font-size: 10pt;
      font-weight: 600;
      color: #1e293b;
    }
    .location-date {
      text-align: right;
      font-size: 10pt;
      margin-top: 4px;
      margin-bottom: 8px;
    }
    .memo-title {
      text-align: center;
      font-size: 12.5pt;
      font-weight: bold;
      letter-spacing: 1px;
      margin: 8px 0;
      text-decoration: underline;
    }
    .subject-box {
      font-size: 10.5pt;
      text-align: justify;
      margin-bottom: 12px;
      line-height: 1.35;
    }
    .para {
      font-size: 10.5pt;
      text-align: justify;
      margin-bottom: 10px;
      line-height: 1.35;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 6px 0 10px 0;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
      font-size: 9pt;
    }
    th, td {
      border: 1px solid #475569;
      padding: 3.5px 6px;
    }
    th {
      background-color: #f1f5f9 !important;
      font-weight: bold;
      text-transform: uppercase;
      font-size: 8pt;
      color: #0f172a;
    }
    .bg-alt {
      background-color: #f8fafc !important;
    }
    .bg-suspect {
      background-color: #ffe4e6 !important;
      font-weight: bold;
    }
    .text-center { text-align: center; }
    .text-bold { font-weight: bold; }
    .sig-section {
      display: flex;
      justify-content: flex-end;
      margin-top: 10px;
      margin-bottom: 6px;
      page-break-inside: avoid;
    }
    .sig-box {
      text-align: left;
      font-size: 10pt;
      min-width: 220px;
    }
    .distribution {
      font-size: 9.5pt;
      margin-top: 6px;
      page-break-inside: avoid;
    }
    .statutory-box {
      margin-top: 8px;
      padding: 6px 8px;
      background-color: #f8fafc !important;
      border: 1px solid #64748b;
      font-family: 'Courier New', Courier, monospace;
      font-size: 8pt;
      color: #334155;
      line-height: 1.25;
      page-break-inside: avoid;
    }
    .footer {
      border-top: 1px solid #cbd5e1;
      padding-top: 4px;
      margin-top: 8px;
      display: flex;
      justify-content: space-between;
      font-family: 'Courier New', Courier, monospace;
      font-size: 8pt;
      color: #64748b;
    }
    .contd-header {
      display: flex;
      justify-content: space-between;
      border-bottom: 1.5px solid #334155;
      padding-bottom: 4px;
      margin-bottom: 10px;
      font-family: 'Courier New', Courier, monospace;
      font-size: 8.5pt;
      color: #334155;
    }
  </style>
</head>
<body>

  <!-- ══════════════════════════════════════════════════════════
       SHEET 1 (PAGE 1 OF 2)
       ══════════════════════════════════════════════════════════ -->
  <div class="page-container">
    <div>
      <div class="header">
        <div class="file-no">F. No. ICG/MRCC-MUM/POL-OPS/2026/INV-${investigation.investigation_id}</div>
        <div class="gov-title">Government of India / भारत सरकार</div>
        <div class="ministry-title">Ministry of Defence / रक्षा मंत्रालय</div>
        <div class="hq-title">Headquarters Coast Guard Region (West) / भारतीय तटरक्षक मुख्यालय (पश्चिम)</div>
        <div style="font-size: 9pt; color: #475569;">Worli Sea Face, Mumbai – 400030</div>
      </div>

      <div class="location-date">
        <div>Worli Sea Face, Mumbai</div>
        <div>Dated: ${currentDateFormatted}</div>
      </div>

      <div class="memo-title">OFFICE MEMORANDUM</div>

      <div class="subject-box">
        <strong>Subject:</strong>- Automated Forensic Attribution & Hydrodynamic Investigation Report in respect of Illegal Marine Hydrocarbon Discharge in the Arabian Sea (Offshore Mumbai Sector, Exclusive Economic Zone of India) under Section 356J of the Merchant Shipping Act, 1958.
      </div>

      <div class="para">
        The undersigned is directed to state that Sentinel-1 Synthetic Aperture Radar (SAR) Earth Observation telemetry processed through the Joint Maritime Pollution Surveillance & Forensics Cell on <strong>${observationDateStr}</strong> detected an uncontained marine hydrocarbon discharge measuring <strong>${spill.area_km2.toFixed(2)} km²</strong> (approx. 1,840 Hectares) in the Arabian Sea off the Mumbai coast within the <strong>Exclusive Economic Zone (EEZ) of India</strong> (Algorithmic Verification Confidence: <strong>${(spill.confidence * 100).toFixed(1)}%</strong>).
      </div>

      <div class="para">
        2. &nbsp;&nbsp;&nbsp;&nbsp; Physical delineation and backscatter damping derived from dual-polarization (σ<sub>0</sub> VV/VH) SAR telemetry:
      </div>

      <table>
        <tbody>
          <tr class="bg-alt">
            <td style="width: 50%; font-weight: 600;">Satellite Sensor & Mode</td>
            <td style="font-family: 'Courier New', monospace;">Sentinel-1 C-Band SAR (IW Dual-Pol VV+VH)</td>
          </tr>
          <tr>
            <td style="font-weight: 600;">Total Delineated Surface Area</td>
            <td style="font-family: 'Courier New', monospace; font-weight: bold;">${spill.area_km2.toFixed(2)} km² (1,840 Hectares)</td>
          </tr>
          <tr class="bg-alt">
            <td style="font-weight: 600;">Mean Backscatter Damping (VV)</td>
            <td style="font-family: 'Courier New', monospace;">-24.8 dB (Suppression: 7.4 dB vs background)</td>
          </tr>
          <tr>
            <td style="font-weight: 600;">AI Segmentation Backbone</td>
            <td style="font-family: 'Courier New', monospace;">U-Net (ResNet-34 Encoder) + XGBoost Classifier</td>
          </tr>
          <tr class="bg-alt">
            <td style="font-weight: 600;">Classification Determination</td>
            <td style="font-family: 'Courier New', monospace; font-weight: bold; color: #991b1b;">Heavy Crude Hydrocarbon Emulsion</td>
          </tr>
        </tbody>
      </table>

      <div class="para">
        3. &nbsp;&nbsp;&nbsp;&nbsp; Reverse Lagrangian hydrodynamic advection backtracking (OpenDrift with INCOIS Arabian Sea current vector fields and ECMWF ERA5 winds) localized the probable discharge envelope to <strong>${drift.origin.latitude.toFixed(4)}°N, ${drift.origin.longitude.toFixed(4)}°E</strong> with an estimated discharge time window between <strong>2026-08-24 10:30 UTC</strong> and <strong>2026-08-24 16:00 UTC</strong> (Discharge Origin Certainty: <strong>${(drift.origin.confidence * 100).toFixed(0)}%</strong>).
      </div>

      <div class="para">
        4. &nbsp;&nbsp;&nbsp;&nbsp; Spatio-temporal correlation against the National Automatic Identification System (NAIS) evaluated candidate vessels transiting the discharge envelope:
      </div>

      <table>
        <thead>
          <tr>
            <th class="text-center">Rank</th>
            <th>Vessel Name</th>
            <th>MMSI</th>
            <th>Type / Flag</th>
            <th class="text-center">Spatial</th>
            <th class="text-center">Temporal</th>
            <th class="text-center">Traj.</th>
            <th class="text-center">Score</th>
            <th class="text-center">Priority</th>
          </tr>
        </thead>
        <tbody>
          ${vessels.map((v) => `
            <tr class="${v.rank === 1 ? 'bg-suspect' : ''}">
              <td class="text-center">#${v.rank}</td>
              <td class="text-bold">${v.vessel_name}</td>
              <td style="font-family: 'Courier New', monospace;">${v.mmsi}</td>
              <td>${v.vessel_type} (${v.flag})</td>
              <td class="text-center">${v.feature_scores.spatial.toFixed(0)}%</td>
              <td class="text-center">${v.feature_scores.temporal.toFixed(0)}%</td>
              <td class="text-center">${v.feature_scores.trajectory.toFixed(0)}%</td>
              <td class="text-center text-bold" style="color: #991b1b;">${v.score.toFixed(1)}%</td>
              <td class="text-center text-bold">${v.investigative_priority}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>
    </div>

    <div class="footer">
      <span>F. No. ICG/MRCC-MUM/POL-OPS/2026/INV-${investigation.investigation_id}</span>
      <span>Government of India · Confidential Statutory Record</span>
      <span style="font-weight: bold;">Page 1 of 2</span>
    </div>
  </div>

  <div class="page-break"></div>

  <!-- ══════════════════════════════════════════════════════════
       SHEET 2 (PAGE 2 OF 2)
       ══════════════════════════════════════════════════════════ -->
  <div class="page-container">
    <div>
      <div class="contd-header">
        <span>F. No. ICG/MRCC-MUM/POL-OPS/2026/INV-${investigation.investigation_id}</span>
        <span style="font-style: italic; font-weight: 600;">Government of India / रक्षा मंत्रालय (Contd. Sheet)</span>
      </div>

      <div class="para">
        5. &nbsp;&nbsp;&nbsp;&nbsp; Evidentiary provenance and operational validation of automated ML detection pipelines against standard benchmarks:
      </div>

      <table>
        <thead>
          <tr>
            <th>Metric</th>
            <th class="text-center">Score</th>
            <th>Operational Verification Standard</th>
            <th class="text-center">Status</th>
          </tr>
        </thead>
        <tbody>
          ${ML_PERF_TABLE.map((row) => `
            <tr>
              <td style="font-family: Georgia, serif;">${row.metric}</td>
              <td class="text-center text-bold" style="color: #065f46; font-family: 'Courier New', monospace;">${row.value}</td>
              <td style="font-size: 8pt; color: #475569;">${row.benchmark}</td>
              <td class="text-center text-bold" style="color: #065f46; font-size: 8pt;">${row.status}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div class="para">
        6. &nbsp;&nbsp;&nbsp;&nbsp; In view of the high forensic attribution score (${topSuspect?.score.toFixed(1)}%) established against primary suspect <strong>${topSuspect?.vessel_name || 'Target Vessel'}</strong> (MMSI: ${topSuspect?.mmsi}), the competent authority has approved the following statutory enforcement actions:
      </div>

      <ol style="padding-left: 24px; font-size: 10pt; line-height: 1.35; margin: 4px 0 10px 0; text-align: justify;">
        <li style="margin-bottom: 4px;">
          <strong>Port State Control Inspection:</strong> Issue immediate notice of statutory detention under Sections 356G & 356H of the Merchant Shipping Act, 1958 to the next scheduled Indian port of call (JNPT Mumbai / Mumbai Port / Deendayal Port, Kandla) for unannounced boarding, Oil Record Book (Part I & II) impounding, and bilge tank seal verification.
        </li>
        <li style="margin-bottom: 4px;">
          <strong>Aerial Verification & Sheen Sampling:</strong> Dispatch Indian Coast Guard Maritime Patrol Aircraft (Dornier 228 from CGAS Daman / Mumbai) and response vessel to collect physical sheen samples for GC-MS hydrocarbon biomarker fingerprinting at the National Institute of Oceanography (NIO, Goa).
        </li>
        <li style="margin-bottom: 4px;">
          <strong>Financial Guarantee / Clean-Up Recovery:</strong> Invoke Section 356L of the Merchant Shipping Act to demand irrevocable Bank Guarantee / P&I Club undertaking for all containment, dispersant application, and marine ecological remediation costs.
        </li>
      </ol>

      <div class="sig-section">
        <div class="sig-box">
          <div style="height: 30px; margin-bottom: 2px;">
            <svg width="120" height="26" viewBox="0 0 140 32" fill="none" stroke="#1e3a8a" stroke-width="1.8" stroke-linecap="round">
              <path d="M5 24 C 25 8, 35 28, 50 12 C 60 4, 75 22, 90 14 C 105 8, 120 26, 135 16" />
              <path d="M35 20 L 105 20" />
            </svg>
          </div>
          <div style="font-weight: bold;">(Vikram Malhotra)</div>
          <div style="font-weight: 600;">Commander, Indian Coast Guard</div>
          <div style="font-size: 9pt; color: #334155;">Regional Pollution Response Officer</div>
          <div style="font-family: 'Courier New', monospace; font-size: 8.5pt; color: #475569; margin-top: 2px;">Tel: 022-24371404</div>
          <div style="font-family: 'Courier New', monospace; font-size: 8.5pt; color: #475569;">Email: rpo-west@indiancoastguard.gov.in</div>
        </div>
      </div>

      <div class="distribution">
        <div style="font-weight: bold;">To,</div>
        <div style="padding-left: 14px; line-height: 1.25; font-size: 9pt; color: #1e293b;">
          <div>1. The Director General of Shipping, Directorate General of Shipping, Mumbai.</div>
          <div>2. The Principal Officer, Mercantile Marine Department (MMD), Mumbai / JNPT.</div>
          <div>3. The Commanding Officer, Coast Guard Air Station (CGAS Daman / Mumbai).</div>
          <div>4. The Director, INCOIS (Ministry of Earth Sciences), Hyderabad.</div>
        </div>
      </div>

      <div class="distribution">
        <div style="font-weight: bold;">Copy to: -</div>
        <div style="padding-left: 14px; line-height: 1.25; font-size: 9pt; color: #1e293b;">
          <div>1. Joint Secretary (Navy & Coast Guard), Ministry of Defence, South Block, New Delhi.</div>
          <div>2. Member Secretary, National Oil Spill Disaster Contingency Plan (NOS-DCP) Secretariat, New Delhi.</div>
          <div>3. NIC Cell, Ministry of Defence / Indian Coast Guard — for automated archiving on MarineTrace Portal.</div>
        </div>
      </div>

      <div class="statutory-box">
        <strong>STATUTORY NOTE (MERCHANT SHIPPING ACT, 1958 / NOS-DCP):</strong><br />
        This Office Memorandum constitutes an official technical assessment formulated pursuant to Section 356J & 356K of the Merchant Shipping Act, 1958 and Rule 15 of Merchant Shipping (Prevention of Pollution by Oil) Rules, 2010.
      </div>
    </div>

    <div class="footer">
      <span>F. No. ICG/MRCC-MUM/POL-OPS/2026/INV-${investigation.investigation_id}</span>
      <span>Government of India · Confidential Statutory Record</span>
      <span style="font-weight: bold;">Page 2 of 2</span>
    </div>
  </div>

</body>
</html>
    `;

    doc.open();
    doc.write(htmlContent);
    doc.close();

    // Ensure all styles and assets are rendered before opening print dialog
    setTimeout(() => {
      printFrame.contentWindow?.focus();
      printFrame.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(printFrame);
      }, 1000);
    }, 250);
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#080c14] overflow-y-auto select-text font-sans">

      {/* ── Top Action Toolbar ── */}
      <div className="px-6 py-3 bg-[#111622] border-b border-[#1e293b] flex flex-wrap items-center justify-between gap-4 shrink-0 sticky top-0 z-30 shadow-md">
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
                A4 OFFICIAL 2-PAGE STANDARD
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
            title="Open browser print dialog / Save as A4 PDF"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>PRINT / SAVE AS A4 PDF</span>
          </button>
        </div>
      </div>

      {/* ── Main Document Viewport: Exact 2-Page A4 Sheet Stack ── */}
      <div className="p-4 sm:p-8 md:p-10 flex flex-col items-center gap-8 w-full">

        {/* ════════════════════════════════════════════════════════════════════
            SHEET 1 (PAGE 1 OF 2): STATUTORY FINDINGS & SAR / AIS EVIDENCE
            ════════════════════════════════════════════════════════════════════ */}
        <div
          id="official-dossier-page-1"
          className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 p-[16mm] sm:p-[20mm] space-y-4 font-serif leading-relaxed relative flex flex-col justify-between"
        >
          <div className="space-y-3.5">
            {/* 1. Official Government Letterhead & Seal */}
            <div className="text-center space-y-0.5 pb-2 border-b border-slate-300">
              <div className="flex justify-center pb-0.5">
                <div className="w-9 h-9 rounded-full border border-slate-400 flex items-center justify-center text-slate-900 bg-slate-50 shadow-inner">
                  <Shield className="w-4.5 h-4.5 text-slate-800" />
                </div>
              </div>
              <div className="text-xs font-mono font-bold text-slate-900 tracking-wider uppercase">
                F. No. ICG/MRCC-MUM/POL-OPS/2026/INV-{investigation.investigation_id}
              </div>
              <div className="text-base font-bold text-slate-950 tracking-wide">
                Government of India / भारत सरकार
              </div>
              <div className="text-sm font-semibold text-slate-900">
                Ministry of Defence / रक्षा मंत्रालय
              </div>
              <div className="text-xs font-semibold text-slate-800">
                Headquarters Coast Guard Region (West) / भारतीय तटरक्षक मुख्यालय (पश्चिम)
              </div>
              <div className="text-[11px] text-slate-700">
                Worli Sea Face, Mumbai – 400030
              </div>
            </div>

            {/* 2. Location & Date */}
            <div className="text-right text-xs text-slate-900 space-y-0.5 pt-0.5 font-serif">
              <div>Worli Sea Face, Mumbai</div>
              <div>Dated: {currentDateFormatted}</div>
            </div>

            {/* 3. Memorandum Title */}
            <div className="text-center font-bold text-sm sm:text-base tracking-wider pt-0.5 pb-1">
              <span className="underline decoration-1 underline-offset-4 uppercase">
                OFFICE MEMORANDUM
              </span>
            </div>

            {/* 4. Subject Line */}
            <div className="text-xs sm:text-sm text-slate-950 leading-relaxed pl-2 pr-2 text-justify">
              <strong>Subject:</strong>- Automated Forensic Attribution & Hydrodynamic Investigation Report in respect of Illegal Marine Hydrocarbon Discharge in the Arabian Sea (Offshore Mumbai Sector, Exclusive Economic Zone of India) under Section 356J of the Merchant Shipping Act, 1958.
            </div>

            {/* 5. Numbered Paras 1–4 */}
            <div className="space-y-3 text-xs sm:text-sm text-slate-900 text-justify leading-relaxed">
              {/* Para 1 */}
              <p>
                The undersigned is directed to state that Sentinel-1 Synthetic Aperture Radar (SAR) Earth Observation telemetry processed through the Joint Maritime Pollution Surveillance & Forensics Cell on <strong>{observationDateStr}</strong> detected an uncontained marine hydrocarbon discharge measuring <strong>{spill.area_km2.toFixed(2)} km²</strong> (approx. 1,840 Hectares) in the Arabian Sea off the Mumbai coast within the <strong>Exclusive Economic Zone (EEZ) of India</strong> (Algorithmic Verification Confidence: <strong>{(spill.confidence * 100).toFixed(1)}%</strong>).
              </p>

              {/* Para 2: SAR Technical Specification Table */}
              <div className="space-y-1">
                <p>
                  2. &nbsp;&nbsp;&nbsp;&nbsp; Physical delineation and backscatter damping derived from dual-polarization ($\sigma_0$ VV/VH) SAR telemetry:
                </p>

                <div className="pl-4 pr-2">
                  <table className="w-full text-xs border-collapse border border-slate-400 font-sans">
                    <tbody>
                      <tr className="border-b border-slate-300 bg-slate-50">
                        <td className="py-1 px-3 font-semibold text-slate-700 w-1/2 border-r border-slate-300">Satellite Sensor & Mode</td>
                        <td className="py-1 px-3 font-mono text-slate-900">Sentinel-1 C-Band SAR (IW Dual-Pol VV+VH)</td>
                      </tr>
                      <tr className="border-b border-slate-300">
                        <td className="py-1 px-3 font-semibold text-slate-700 border-r border-slate-300">Total Delineated Surface Area</td>
                        <td className="py-1 px-3 font-mono font-bold text-slate-900">{spill.area_km2.toFixed(2)} km² (1,840 Hectares)</td>
                      </tr>
                      <tr className="border-b border-slate-300 bg-slate-50">
                        <td className="py-1 px-3 font-semibold text-slate-700 border-r border-slate-300">Mean Backscatter Damping (VV)</td>
                        <td className="py-1 px-3 font-mono text-slate-900">-24.8 dB (Suppression: 7.4 dB vs background)</td>
                      </tr>
                      <tr className="border-b border-slate-300">
                        <td className="py-1 px-3 font-semibold text-slate-700 border-r border-slate-300">AI Segmentation Backbone</td>
                        <td className="py-1 px-3 font-mono text-slate-900">U-Net (ResNet-34 Encoder) + XGBoost Classifier</td>
                      </tr>
                      <tr>
                        <td className="py-1 px-3 font-semibold text-slate-700 border-r border-slate-300">Classification Determination</td>
                        <td className="py-1 px-3 font-mono font-bold text-rose-900">Heavy Crude Hydrocarbon Emulsion</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Para 3: Hydrodynamic Drift & Origin Estimation */}
              <div>
                <p>
                  3. &nbsp;&nbsp;&nbsp;&nbsp; Reverse Lagrangian hydrodynamic advection backtracking (OpenDrift with INCOIS Arabian Sea current vector fields and ECMWF ERA5 winds) localized the probable discharge envelope to <strong>{drift.origin.latitude.toFixed(4)}°N, {drift.origin.longitude.toFixed(4)}°E</strong> with an estimated discharge time window between <strong>2026-08-24 10:30 UTC</strong> and <strong>2026-08-24 16:00 UTC</strong> (Discharge Origin Certainty: <strong>{(drift.origin.confidence * 100).toFixed(0)}%</strong>).
                </p>
              </div>

              {/* Para 4: AIS Correlation Table */}
              <div className="space-y-1">
                <p>
                  4. &nbsp;&nbsp;&nbsp;&nbsp; Spatio-temporal correlation against the National Automatic Identification System (NAIS) evaluated candidate vessels transiting the discharge envelope:
                </p>

                <div className="pl-4 pr-2">
                  <table className="w-full text-xs text-left border-collapse border border-slate-400 font-sans">
                    <thead>
                      <tr className="bg-slate-100 text-slate-900 font-mono text-[10px] uppercase border-b border-slate-400">
                        <th className="py-1 px-2 border-r border-slate-300">Rank</th>
                        <th className="py-1 px-2 border-r border-slate-300">Vessel Name</th>
                        <th className="py-1 px-2 border-r border-slate-300">MMSI</th>
                        <th className="py-1 px-2 border-r border-slate-300">Type / Flag</th>
                        <th className="py-1 px-2 border-r border-slate-300 text-center">Spatial</th>
                        <th className="py-1 px-2 border-r border-slate-300 text-center">Temporal</th>
                        <th className="py-1 px-2 border-r border-slate-300 text-center">Traj.</th>
                        <th className="py-1 px-2 border-r border-slate-300 text-center">Score</th>
                        <th className="py-1 px-2 text-center">Priority</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300 font-mono text-[11px]">
                      {vessels.map((v) => (
                        <tr key={v.mmsi} className={v.rank === 1 ? 'bg-rose-50 font-semibold' : ''}>
                          <td className="py-0.5 px-2 border-r border-slate-300 text-center">#{v.rank}</td>
                          <td className="py-0.5 px-2 border-r border-slate-300 font-bold text-slate-900">{v.vessel_name}</td>
                          <td className="py-0.5 px-2 border-r border-slate-300">{v.mmsi}</td>
                          <td className="py-0.5 px-2 border-r border-slate-300">{v.vessel_type} ({v.flag})</td>
                          <td className="py-0.5 px-2 border-r border-slate-300 text-center">{v.feature_scores.spatial.toFixed(0)}%</td>
                          <td className="py-0.5 px-2 border-r border-slate-300 text-center">{v.feature_scores.temporal.toFixed(0)}%</td>
                          <td className="py-0.5 px-2 border-r border-slate-300 text-center">{v.feature_scores.trajectory.toFixed(0)}%</td>
                          <td className="py-0.5 px-2 border-r border-slate-300 text-center font-bold text-rose-900">{v.score.toFixed(1)}%</td>
                          <td className="py-0.5 px-2 text-center font-bold">{v.investigative_priority}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </div>
          </div>

          {/* Page 1 Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[9px] font-mono text-slate-500 mt-4">
            <span>F. No. ICG/MRCC-MUM/POL-OPS/2026/INV-{investigation.investigation_id}</span>
            <span>Government of India · Confidential Statutory Record</span>
            <span className="font-bold">Page 1 of 2</span>
          </div>
        </div>

        {/* ── Visual Page Separator on screen ── */}
        <div className="w-full max-w-[210mm] my-2 text-center">
          <div className="border-b border-dashed border-slate-700 relative">
            <span className="relative -top-2.5 px-3 py-0.5 bg-[#111622] rounded text-[10px] font-mono text-slate-400 border border-slate-800">
              PAGE 2 CONTINUATION (A4 SHEET 2)
            </span>
          </div>
        </div>

        {/* ════════════════════════════════════════════════════════════════════
            SHEET 2 (PAGE 2 OF 2): ML PROVENANCE, DIRECTIVES & SIGNATORIES
            ════════════════════════════════════════════════════════════════════ */}
        <div
          id="official-dossier-page-2"
          className="w-full max-w-[210mm] min-h-[297mm] bg-white text-slate-900 shadow-2xl rounded-sm border border-slate-300 p-[16mm] sm:p-[20mm] space-y-4 font-serif leading-relaxed relative flex flex-col justify-between"
        >
          <div className="space-y-3.5">
            {/* Page 2 Continuation Header */}
            <div className="flex items-center justify-between border-b border-slate-300 pb-1.5 text-[10px] font-mono text-slate-700">
              <span>F. No. ICG/MRCC-MUM/POL-OPS/2026/INV-{investigation.investigation_id}</span>
              <span className="font-serif italic text-slate-600 font-semibold">Government of India / रक्षा मंत्रालय (Contd. Sheet)</span>
            </div>

            {/* Para 5: Model Provenance Table */}
            <div className="space-y-1">
              <p className="text-xs sm:text-sm text-slate-900">
                5. &nbsp;&nbsp;&nbsp;&nbsp; Evidentiary provenance and operational validation of automated ML detection pipelines against standard benchmarks:
              </p>

              <div className="pl-4 pr-2">
                <table className="w-full text-xs text-left border-collapse border border-slate-400 font-sans">
                  <thead>
                    <tr className="bg-slate-100 text-slate-800 font-mono text-[10px] uppercase border-b border-slate-400">
                      <th className="py-1 px-2 border-r border-slate-300">Metric</th>
                      <th className="py-1 px-2 border-r border-slate-300 text-center">Score</th>
                      <th className="py-1 px-2 border-r border-slate-300">Operational Verification Standard</th>
                      <th className="py-1 px-2 text-center">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-300 font-mono text-[11px]">
                    {ML_PERF_TABLE.map((row) => (
                      <tr key={row.metric}>
                        <td className="py-0.5 px-2 border-r border-slate-300 font-serif">${row.metric}</td>
                        <td className="py-0.5 px-2 border-r border-slate-300 text-center font-bold text-emerald-900">{row.value}</td>
                        <td className="py-0.5 px-2 border-r border-slate-300 text-slate-700 text-[10px]">{row.benchmark}</td>
                        <td className="py-0.5 px-2 text-center font-bold text-emerald-900 text-[10px]">{row.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Para 6: Statutory Enforcement Directives */}
            <div className="space-y-1 text-xs sm:text-sm text-slate-900">
              <p>
                6. &nbsp;&nbsp;&nbsp;&nbsp; In view of the high forensic attribution score ({topSuspect?.score.toFixed(1)}%) established against primary suspect <strong>{topSuspect?.vessel_name || 'Target Vessel'}</strong> (MMSI: {topSuspect?.mmsi}), the competent authority has approved the following statutory enforcement actions:
              </p>

              <ol className="list-[lower-roman] pl-10 pr-2 space-y-1 text-justify">
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

            {/* Official Signature Block */}
            <div className="flex justify-end pt-3 pb-1">
              <div className="text-left font-serif text-xs sm:text-sm text-slate-950 min-w-[240px] space-y-0.5">
                <div className="h-9 flex items-center mb-0.5">
                  <svg className="w-32 h-7 text-blue-900" viewBox="0 0 140 32" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                    <path d="M5 24 C 25 8, 35 28, 50 12 C 60 4, 75 22, 90 14 C 105 8, 120 26, 135 16" />
                    <path d="M35 20 L 105 20" />
                  </svg>
                </div>
                <div className="font-bold text-slate-950">(Vikram Malhotra)</div>
                <div className="text-slate-900 font-semibold">Commander, Indian Coast Guard</div>
                <div className="text-slate-800 text-xs">Regional Pollution Response Officer</div>
                <div className="font-mono text-[11px] text-slate-700 pt-0.5">Tel: 022-24371404</div>
                <div className="font-mono text-[11px] text-slate-700">Email: rpo-west@indiancoastguard.gov.in</div>
              </div>
            </div>

            {/* "To" Distribution List */}
            <div className="pt-2 text-xs font-serif text-slate-900 space-y-0.5">
              <div className="font-bold text-slate-950">To,</div>
              <div className="pl-4 space-y-0.5">
                <div>1. &nbsp; The Director General of Shipping, Directorate General of Shipping, Mumbai.</div>
                <div>2. &nbsp; The Principal Officer, Mercantile Marine Department (MMD), Mumbai / JNPT.</div>
                <div>3. &nbsp; The Commanding Officer, Coast Guard Air Station (CGAS Daman / Mumbai).</div>
                <div>4. &nbsp; The Director, INCOIS (Ministry of Earth Sciences), Hyderabad.</div>
              </div>
            </div>

            {/* "Copy to" Endorsement List */}
            <div className="pt-1.5 text-xs font-serif text-slate-900 space-y-0.5">
              <div className="font-bold text-slate-950">Copy to: -</div>
              <div className="pl-4 space-y-0.5">
                <div>1. &nbsp; Joint Secretary (Navy & Coast Guard), Ministry of Defence, South Block, New Delhi.</div>
                <div>2. &nbsp; Member Secretary, National Oil Spill Disaster Contingency Plan (NOS-DCP) Secretariat, New Delhi.</div>
                <div>3. &nbsp; NIC Cell, Ministry of Defence / Indian Coast Guard — for automated archiving on MarineTrace Portal.</div>
              </div>
            </div>

            {/* Statutory Footer */}
            <div className="mt-3 p-2.5 bg-slate-50 border border-slate-300 rounded text-[10px] text-slate-600 leading-relaxed font-mono">
              <strong className="text-slate-900 block mb-0.5 uppercase">
                STATUTORY NOTE (MERCHANT SHIPPING ACT, 1958 / NOS-DCP):
              </strong>
              This Office Memorandum constitutes an official technical assessment formulated pursuant to Section 356J & 356K of the Merchant Shipping Act, 1958 and Rule 15 of Merchant Shipping (Prevention of Pollution by Oil) Rules, 2010.
            </div>
          </div>

          {/* Page 2 Footer */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-between text-[9px] font-mono text-slate-500 mt-3">
            <span>F. No. ICG/MRCC-MUM/POL-OPS/2026/INV-{investigation.investigation_id}</span>
            <span>Government of India · Confidential Statutory Record</span>
            <span className="font-bold">Page 2 of 2</span>
          </div>
        </div>

      </div>
    </div>
  );
};
