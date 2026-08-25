import { useState } from 'react';
import {
  Satellite,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Database,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crosshair,
  Sliders,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

import { SARMetricsBadge } from '../components/satellite/SARMetricsBadge';
import { MLModelCard } from '../components/ml/MLModelCard';

// Real data from mock_result.json
const ML_MOCK_RESULT = {
  spill_detected: true,
  confidence: 0.92,
  model_version: 'slicktrace-unet-v1',
  processing_time_seconds: 2.34,
  metadata: {
    model_architecture: 'U-Net (ResNet34 encoder)',
    input_channels: ['VV', 'VH'],
    input_representation: 'Sigma0 (dB)',
    threshold_used: 0.5,
    georeferenced: true,
    crs: 'EPSG:4326',
  },
  candidates: [
    {
      candidate_id: 1,
      oil_probability: 0.92,
      area_km2: 18.4,
      area_pixels: 28672,
      centroid: { latitude: 18.721, longitude: 72.914 },
      properties: {
        perimeter_km: 12.3,
        aspect_ratio: 1.45,
        eccentricity: 0.67,
        solidity: 0.88,
        compactness: 0.72,
        orientation_degrees: 35.2,
        mean_vv_db: -18.5,
        mean_vh_db: -25.3,
        contrast_ratio: 3.2,
      },
    },
    {
      candidate_id: 2,
      oil_probability: 0.71,
      area_km2: 3.2,
      area_pixels: 4992,
      centroid: { latitude: 18.680, longitude: 72.950 },
      properties: {
        perimeter_km: 5.8,
        aspect_ratio: 2.10,
        eccentricity: 0.82,
        solidity: 0.75,
        compactness: 0.55,
        orientation_degrees: 120.5,
        mean_vv_db: -16.2,
        mean_vh_db: -23.8,
        contrast_ratio: 2.1,
      },
    },
  ],
  limitations: [
    'Model confidence is not a guarantee of oil presence.',
    'Dark SAR features from low wind, biogenic slicks, or rain cells may produce false positives.',
    'Geographic geometry accuracy depends on input image georeferencing quality.',
    'This system does not perform vessel attribution — downstream modules handle that.',
  ],
};

type SARMode = 'overlay' | 'original' | 'mask';
type Channel = 'VV' | 'VH' | 'composite';

export const SatelliteImagery: React.FC = () => {
  const [activeTab, setActiveTab] = useState<SARMode>('overlay');
  const [channel, setChannel] = useState<Channel>('composite');
  const [zoom, setZoom] = useState<number>(100);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(115);
  const [showMLCard, setShowMLCard] = useState(false);

  const tabs: { id: SARMode; label: string }[] = [
    { id: 'overlay', label: 'Detection Overlay' },
    { id: 'original', label: 'Raw SAR' },
    { id: 'mask', label: 'U-Net Mask' },
  ];

  const channels: { id: Channel; label: string; desc: string }[] = [
    { id: 'VV', label: 'VV', desc: 'Vertical-Vertical' },
    { id: 'VH', label: 'VH', desc: 'Vertical-Horizontal' },
    { id: 'composite', label: 'Composite', desc: 'VV+VH combined' },
  ];

  // SAR placeholder visualization (pseudo-scientific color ramp)
  const getGradient = () => {
    if (activeTab === 'mask') {
      return 'radial-gradient(ellipse 60% 35% at 42% 48%, rgba(239,68,68,0.7) 0%, rgba(239,68,68,0.2) 60%, transparent 100%)';
    }
    if (activeTab === 'original') {
      return channel === 'VH'
        ? 'radial-gradient(ellipse 55% 40% at 45% 52%, rgba(30,58,138,0.8) 0%, rgba(15,23,42,0.6) 80%)'
        : 'radial-gradient(ellipse 55% 40% at 45% 52%, rgba(6,78,99,0.7) 0%, rgba(5,15,35,0.6) 80%)';
    }
    return `
      radial-gradient(ellipse 60% 35% at 42% 48%, rgba(239,68,68,0.55) 0%, transparent 70%),
      radial-gradient(ellipse 25% 20% at 68% 60%, rgba(245,158,11,0.35) 0%, transparent 60%)
    `;
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#05080f] overflow-hidden font-mono">

      {/* Header */}
      <div className="px-5 py-3 bg-[#080d18] border-b border-[rgba(255,255,255,0.07)] flex items-center justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <Satellite className="w-4 h-4 text-cyan-400" />
          <div>
            <h1 className="text-[12px] font-bold text-slate-100 tracking-wider">
              SATELLITE SAR IMAGERY — ML DETECTION ANALYSIS
            </h1>
            <p className="text-[9px] text-slate-600 mt-0.5">
              Sentinel-1 IW · C-Band · Sigma0 (dB) · Dual Polarization VV+VH · U-Net ResNet-34 Segmentation
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* ML PASS badge */}
          <span className="text-[9px] px-2.5 py-1 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold tracking-widest">
            ALL SYSTEMS PASS
          </span>
          <button
            onClick={() => setShowMLCard(!showMLCard)}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 rounded text-[9px] font-semibold transition-colors hover:bg-indigo-500/15"
          >
            <Cpu className="w-3 h-3" />
            <span>MODEL INFO</span>
            {showMLCard ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </div>

      {/* Expandable ML Model Card */}
      {showMLCard && (
        <div className="px-5 py-4 border-b border-[rgba(255,255,255,0.05)] bg-[#080d18] animate-fade-up">
          <MLModelCard />
        </div>
      )}

      {/* Main Layout */}
      <div className="flex-1 flex min-h-0 overflow-hidden">

        {/* LEFT PANEL: ML Detection Metadata */}
        <div className="w-72 bg-[#080d18] border-r border-[rgba(255,255,255,0.07)] flex flex-col overflow-y-auto shrink-0 p-3 space-y-3">

          {/* Detection Result */}
          <div className={`p-3 rounded-lg border ${
            ML_MOCK_RESULT.spill_detected
              ? 'bg-rose-500/5 border-rose-500/20'
              : 'bg-emerald-500/5 border-emerald-500/20'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[9px] font-bold text-slate-500 tracking-widest uppercase">Detection Result</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                ML_MOCK_RESULT.spill_detected
                  ? 'bg-rose-500/15 text-rose-400 border border-rose-500/25'
                  : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/25'
              }`}>
                {ML_MOCK_RESULT.spill_detected ? 'SPILL DETECTED' : 'CLEAN'}
              </span>
            </div>
            <div className="flex items-end gap-2">
              <div className="text-3xl font-bold text-rose-400 kpi-value">
                {(ML_MOCK_RESULT.confidence * 100).toFixed(0)}%
              </div>
              <div className="text-[9px] text-slate-600 mb-1">confidence</div>
            </div>
            <div className="text-[9px] text-slate-600 mt-1 flex justify-between">
              <span>Model: <span className="text-slate-400">{ML_MOCK_RESULT.model_version}</span></span>
              <span>Time: <span className="text-cyan-400">{ML_MOCK_RESULT.processing_time_seconds}s</span></span>
            </div>
          </div>

          {/* Model Metadata */}
          <div className="p-3 bg-[#0d1427] border border-[rgba(255,255,255,0.07)] rounded-lg">
            <div className="flex items-center gap-1.5 mb-2">
              <Database className="w-3 h-3 text-indigo-400" />
              <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">Model Metadata</span>
            </div>
            <div className="space-y-1.5 text-[9px] font-mono">
              {[
                { k: 'Architecture', v: ML_MOCK_RESULT.metadata.model_architecture },
                { k: 'Input Channels', v: ML_MOCK_RESULT.metadata.input_channels.join(' + ') },
                { k: 'Representation', v: ML_MOCK_RESULT.metadata.input_representation },
                { k: 'Threshold', v: ML_MOCK_RESULT.metadata.threshold_used.toString() },
                { k: 'Georeferenced', v: ML_MOCK_RESULT.metadata.georeferenced ? 'Yes' : 'No' },
                { k: 'CRS', v: ML_MOCK_RESULT.metadata.crs },
              ].map(({ k, v }) => (
                <div key={k} className="flex justify-between gap-2">
                  <span className="text-slate-600 shrink-0">{k}:</span>
                  <span className="text-slate-300 text-right">{v}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Candidates */}
          <div className="p-3 bg-[#0d1427] border border-[rgba(255,255,255,0.07)] rounded-lg">
            <div className="flex items-center gap-1.5 mb-3">
              <Layers className="w-3 h-3 text-cyan-400" />
              <span className="text-[9px] font-bold text-slate-400 tracking-widest uppercase">Detected Candidates</span>
            </div>
            <div className="space-y-3">
              {ML_MOCK_RESULT.candidates.map((c) => (
                <div key={c.candidate_id} className={`p-2.5 rounded border ${
                  c.candidate_id === 1
                    ? 'bg-rose-500/5 border-rose-500/15'
                    : 'bg-[#111827] border-[rgba(255,255,255,0.05)]'
                }`}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-[9px] font-bold text-slate-300">CANDIDATE #{c.candidate_id}</span>
                    <span className={`text-[9px] font-bold ${
                      c.oil_probability >= 0.8 ? 'text-rose-400' : 'text-amber-400'
                    }`}>
                      {(c.oil_probability * 100).toFixed(0)}% oil
                    </span>
                  </div>

                  {/* SAR Metrics Badge */}
                  <SARMetricsBadge
                    vv_db={c.properties.mean_vv_db}
                    vh_db={c.properties.mean_vh_db}
                    contrast_ratio={c.properties.contrast_ratio}
                    className="mb-2 w-full"
                  />

                  <div className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-[8px] font-mono">
                    <div className="flex justify-between">
                      <span className="text-slate-600">Area:</span>
                      <span className="text-slate-300">{c.area_km2} km²</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Pixels:</span>
                      <span className="text-slate-300">{c.area_pixels.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Perim.:</span>
                      <span className="text-slate-300">{c.properties.perimeter_km} km</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Aspect R.:</span>
                      <span className="text-slate-300">{c.properties.aspect_ratio}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Eccentric.:</span>
                      <span className="text-slate-300">{c.properties.eccentricity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Solidity:</span>
                      <span className="text-slate-300">{c.properties.solidity}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Compact.:</span>
                      <span className="text-slate-300">{c.properties.compactness}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-600">Orient.:</span>
                      <span className="text-slate-300">{c.properties.orientation_degrees}°</span>
                    </div>
                  </div>

                  <div className="mt-1.5 text-[8px] font-mono text-slate-600">
                    Centroid: {c.centroid.latitude.toFixed(4)}°N {c.centroid.longitude.toFixed(4)}°E
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Limitations */}
          <div className="p-3 bg-amber-500/5 border border-amber-500/15 rounded-lg">
            <div className="flex items-center gap-1.5 mb-2">
              <AlertTriangle className="w-3 h-3 text-amber-500" />
              <span className="text-[9px] font-bold text-amber-500/70 tracking-widest uppercase">Model Limitations</span>
            </div>
            <div className="space-y-1.5">
              {ML_MOCK_RESULT.limitations.map((lim, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <CheckCircle2 className="w-2.5 h-2.5 text-amber-700 shrink-0 mt-0.5" />
                  <span className="text-[8px] text-amber-400/60 leading-relaxed">{lim}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* MAIN: SAR Viewer */}
        <div className="flex-1 flex flex-col min-h-0">

          {/* Viewer Toolbar */}
          <div className="h-10 bg-[#0a0f1d] border-b border-[rgba(255,255,255,0.06)] px-3 flex items-center justify-between gap-3 shrink-0">
            {/* Mode Tabs */}
            <div className="flex items-center gap-0.5 bg-[#060a12] rounded-md p-0.5 border border-[rgba(255,255,255,0.06)]">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1 rounded text-[9px] font-mono font-semibold transition-all ${
                    activeTab === tab.id
                      ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/25'
                      : 'text-slate-600 hover:text-slate-400'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Channel Selector */}
            <div className="flex items-center gap-0.5 bg-[#060a12] rounded-md p-0.5 border border-[rgba(255,255,255,0.06)]">
              {channels.map((ch) => (
                <button
                  key={ch.id}
                  onClick={() => setChannel(ch.id)}
                  className={`px-2.5 py-1 rounded text-[9px] font-mono font-semibold transition-all ${
                    channel === ch.id
                      ? 'bg-indigo-500/15 text-indigo-300 border border-indigo-500/25'
                      : 'text-slate-600 hover:text-slate-400'
                  }`}
                  title={ch.desc}
                >
                  {ch.label}
                </button>
              ))}
            </div>

            {/* Controls */}
            <div className="flex items-center gap-2">
              {/* Zoom */}
              <div className="flex items-center gap-1.5 bg-[#060a12] rounded border border-[rgba(255,255,255,0.06)] px-2 py-1 text-[9px] font-mono">
                <ZoomOut
                  className="w-3 h-3 text-slate-500 cursor-pointer hover:text-cyan-400 transition-colors"
                  onClick={() => setZoom((z: number) => Math.max(z - 15, 50))}
                />
                <span className="text-cyan-300 font-bold w-8 text-center">{zoom}%</span>
                <ZoomIn
                  className="w-3 h-3 text-slate-500 cursor-pointer hover:text-cyan-400 transition-colors"
                  onClick={() => setZoom((z: number) => Math.min(z + 15, 200))}
                />
              </div>

              {/* Brightness */}
              <div className="flex items-center gap-1 text-[8px] font-mono text-slate-600">
                <Sliders className="w-3 h-3" />
                <span>Gain</span>
                <input
                  type="range"
                  min={50}
                  max={200}
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-16 accent-cyan-400"
                />
              </div>

              {/* Reset */}
              <button
                onClick={() => { setZoom(100); setBrightness(100); setContrast(115); }}
                className="text-slate-600 hover:text-cyan-400 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* SAR Image Canvas */}
          <div className="flex-1 relative bg-[#030507] overflow-hidden">
            {/* Synthetic SAR backdrop */}
            <div
              className="absolute inset-0 transition-all duration-300"
              style={{
                background: `
                  linear-gradient(
                    ${channel === 'VH' ? '195deg' : '180deg'},
                    #020508 0%,
                    #03080f 40%,
                    #050c18 70%,
                    #030609 100%
                  )
                `,
                filter: `brightness(${brightness / 100}) contrast(${contrast / 100})`,
                transform: `scale(${zoom / 100})`,
                transformOrigin: 'center center',
              }}
            >
              {/* SAR texture noise simulation */}
              <div className="absolute inset-0 opacity-30"
                style={{
                  backgroundImage: `
                    radial-gradient(circle at 20% 30%, rgba(255,255,255,0.03) 1px, transparent 1px),
                    radial-gradient(circle at 60% 70%, rgba(255,255,255,0.02) 1px, transparent 1px),
                    radial-gradient(circle at 80% 20%, rgba(255,255,255,0.03) 1px, transparent 1px)
                  `,
                  backgroundSize: '8px 8px, 12px 12px, 6px 6px',
                }}
              />

              {/* Main spill visualization */}
              <div className="absolute inset-0" style={{ background: getGradient() }} />

              {/* Grid overlay */}
              <div className="absolute inset-0 opacity-5"
                style={{
                  backgroundImage: 'linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)',
                  backgroundSize: '64px 64px',
                }}
              />
            </div>

            {/* Mode Label */}
            <div className="absolute top-3 left-3 z-10">
              <span className={`text-[9px] font-mono font-bold px-2 py-1 rounded border ${
                activeTab === 'mask'
                  ? 'bg-rose-500/15 border-rose-500/25 text-rose-400'
                  : activeTab === 'original'
                  ? 'bg-slate-900/80 border-slate-700 text-slate-400'
                  : 'bg-cyan-500/15 border-cyan-500/25 text-cyan-400'
              }`}>
                {activeTab === 'overlay' ? '🎯 DETECTION OVERLAY' : activeTab === 'original' ? '📡 RAW SAR' : '🔴 U-NET MASK'}
                {' '}{channel !== 'composite' ? `· ${channel}` : '· COMPOSITE'}
              </span>
            </div>

            {/* Candidate Labels */}
            {activeTab !== 'original' && (
              <>
                <div className="absolute z-10" style={{ top: '44%', left: '38%' }}>
                  <div className="border border-rose-500/40 rounded px-1.5 py-0.5 bg-rose-900/30 text-[8px] font-mono text-rose-400 whitespace-nowrap">
                    C1 · 18.4 km² · 92%
                  </div>
                </div>
                <div className="absolute z-10" style={{ top: '56%', left: '64%' }}>
                  <div className="border border-amber-500/40 rounded px-1.5 py-0.5 bg-amber-900/20 text-[8px] font-mono text-amber-400 whitespace-nowrap">
                    C2 · 3.2 km² · 71%
                  </div>
                </div>
              </>
            )}

            {/* Cursor crosshair bottom info */}
            <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#080d18]/90 border border-[rgba(255,255,255,0.08)] rounded px-2 py-1 text-[8px] font-mono text-slate-500">
                <Crosshair className="w-2.5 h-2.5 text-cyan-500" />
                <span>EPSG:4326</span>
                <span className="text-slate-700">|</span>
                <span>18.721°N 72.914°E</span>
                <span className="text-slate-700">|</span>
                <span>2048×2048 px</span>
                <span className="text-slate-700">|</span>
                <span>10m GSD</span>
              </div>
            </div>

            {/* Top-right: detection summary */}
            <div className="absolute top-3 right-3 z-10">
              <div className="bg-[#080d18]/90 border border-[rgba(255,255,255,0.08)] rounded p-2.5 space-y-1.5 text-[8px] font-mono min-w-[140px]">
                <div className="text-slate-500 tracking-widest uppercase mb-1">Detection Summary</div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Spill:</span>
                  <span className="text-rose-400 font-bold">DETECTED</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Confidence:</span>
                  <span className="text-emerald-400 font-bold">92.0%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Candidates:</span>
                  <span className="text-slate-300">2</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Total area:</span>
                  <span className="text-amber-400">21.6 km²</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Proc. time:</span>
                  <span className="text-cyan-400">2.34s</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
