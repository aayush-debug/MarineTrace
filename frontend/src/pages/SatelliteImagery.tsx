import React, { useState, useEffect, useCallback } from 'react';
import {
  Satellite,
  Cpu,
  AlertTriangle,
  Layers,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crosshair,
  ChevronDown,
  ChevronUp,
  Sliders,
  Maximize2,
  CheckCircle2,
  RefreshCw,
  Eye,
  EyeOff,
  Globe,
  Columns,
} from 'lucide-react';

import type {
  SARSceneDetails,
  SARMode,
  SARChannel,
  SARMaskType,
  SARImageEnhancement,
} from '../types/sar';
import { getSARSceneDetails } from '../api/sar';
import { DEMO_SAR_SCENE } from '../data/demo/sarData';
import { SARRasterViewer } from '../components/satellite/SARRasterViewer';
import { SARGisMapView } from '../components/satellite/SARGisMapView';
import { SARMetricsBadge } from '../components/satellite/SARMetricsBadge';
import { MLModelCard } from '../components/ml/MLModelCard';

export const SatelliteImagery: React.FC = () => {
  const [scene, setScene] = useState<SARSceneDetails>(DEMO_SAR_SCENE);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingStepIndex, setLoadingStepIndex] = useState<number>(0);
  const [error, setError] = useState<string | null>(null);

  const [workspaceMode, setWorkspaceMode] = useState<'radar' | 'gis-map' | 'split'>('radar');
  const [activeTab, setActiveTab] = useState<SARMode>('overlay');
  const [maskType, setMaskType] = useState<SARMaskType>('binary');
  const [channel, setChannel] = useState<SARChannel>('VV');

  const [selectedCandidateId, setSelectedCandidateId] = useState<number | null>(1);
  const [hoveredCandidateId, setHoveredCandidateId] = useState<number | null>(null);

  const [zoom, setZoom] = useState<number>(100);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [cursorCoords, setCursorCoords] = useState<{
    pixelX: number;
    pixelY: number;
    lat: number;
    lon: number;
  } | null>(null);

  const [enhancements, setEnhancements] = useState<SARImageEnhancement>({
    brightness: 100,
    contrast: 100,
    gamma: 1.0,
  });

  const [showEnhancements, setShowEnhancements] = useState<boolean>(false);
  const [showMLCard, setShowMLCard] = useState<boolean>(false);
  const [showContours, setShowContours] = useState<boolean>(true);
  const [showLabels, setShowLabels] = useState<boolean>(true);

  // Loading Steps
  const loadingSteps = [
    'Verifying Sentinel-1 scene metadata & orbital state vectors...',
    'Loading calibrated Sigma0 (dB) dual-polarization rasters...',
    'Fetching U-Net deep segmentation probability map...',
    'Extracting connected component candidate contours & shape metrics...',
  ];

  // Load SAR Scene
  const loadScene = useCallback(async () => {
    setLoading(true);
    setError(null);
    setLoadingStepIndex(0);

    try {
      setLoadingStepIndex(1);
      await new Promise((r) => setTimeout(r, 200));

      setLoadingStepIndex(2);
      const data = await getSARSceneDetails();

      setLoadingStepIndex(3);
      await new Promise((r) => setTimeout(r, 150));

      setScene(data);
      if (data.candidates.length > 0) {
        setSelectedCandidateId(data.candidates[0].candidate_id);
      }
    } catch (err: any) {
      console.error('Failed to load SAR scene:', err);
      setError('Unable to load requested Sentinel-1 scene from server. Using local authenticated demo scene.');
      setScene(DEMO_SAR_SCENE);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadScene();
  }, [loadScene]);

  // Reset viewport zoom & pan
  const handleResetView = () => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  };

  // Fit image to screen
  const handleFitScreen = () => {
    setZoom(100);
    setPan({ x: 0, y: 0 });
  };

  // Focus on candidate
  const handleSelectCandidate = (id: number | null) => {
    setSelectedCandidateId(id);
    if (id !== null) {
      const target = scene.candidates.find((c) => c.candidate_id === id);
      if (target) {
        const offsetX = (256 - target.centroid.pixel_x) * (zoom / 100) * 0.4;
        const offsetY = (256 - target.centroid.pixel_y) * (zoom / 100) * 0.4;
        setPan({ x: Math.round(offsetX), y: Math.round(offsetY) });
      }
    }
  };

  const selectedCandidate = scene.candidates.find((c) => c.candidate_id === selectedCandidateId) || null;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg-canvas)] text-slate-100 font-sans select-none overflow-hidden">
      {/* ── TOP HEADER ── */}
      <header className="px-4 py-2.5 bg-[#111622] border-b border-[#1e293b] flex items-center justify-between gap-4 shrink-0 z-20">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded bg-blue-600/20 border border-blue-500/40 text-blue-400">
            <Satellite className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-100 tracking-tight">
                Satellite SAR Imagery Analysis Studio
              </h1>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60 font-medium">
                {scene.metadata.scene_id}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-2 font-mono">
              <span>{scene.metadata.satellite}</span>
              <span className="text-slate-600">·</span>
              <span>{scene.metadata.acquisition_mode}</span>
              <span className="text-slate-600">·</span>
              <span>C-Band SAR Sigma0 (dB)</span>
              <span className="text-slate-600">·</span>
              <span className="text-blue-400 font-semibold">{scene.metadata.polarization}</span>
              <span className="text-slate-600">·</span>
              <span>{scene.metadata.spatial_resolution_m}m Resolution</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs px-2.5 py-1 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-medium flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
            <span>AI Segmentation Pass</span>
          </span>

          <button
            onClick={() => setShowMLCard(!showMLCard)}
            className={`flex items-center gap-1.5 px-3 py-1 border rounded text-xs font-medium transition-colors cursor-pointer ${
              showMLCard
                ? 'bg-blue-950 border-blue-700 text-blue-200'
                : 'bg-[#161e2e] hover:bg-[#1c2638] border-[#1e293b] text-slate-200'
            }`}
          >
            <Cpu className="w-3.5 h-3.5 text-blue-400" />
            <span>Architecture Specs</span>
            {showMLCard ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
        </div>
      </header>

      {/* ── EXPANDABLE ML ARCHITECTURE CARD ── */}
      {showMLCard && (
        <div className="px-5 py-3 border-b border-[#1e293b] bg-[#111622] animate-in fade-in slide-in-from-top-2 duration-150 z-20 shrink-0">
          <MLModelCard />
        </div>
      )}

      {/* ── MAIN WORKSPACE SPLIT ── */}
      <div className="flex-1 flex min-h-0 overflow-hidden relative">
        {/* ── LEFT ANALYSIS PANEL ── */}
        <aside className="w-80 max-w-[340px] bg-[#111622] border-r border-[#1e293b] flex flex-col overflow-y-auto shrink-0 p-3 space-y-3 z-10 font-sans">
          {/* Analysis Summary Card */}
          <div className="p-3 rounded bg-[#161e2e] border border-[#1e293b] space-y-2 shadow-sm font-mono">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-200">Analysis Summary</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/60 font-semibold uppercase">
                Oil Slick Detected
              </span>
            </div>

            <div className="flex items-baseline justify-between pt-1 border-t border-[#1e293b]">
              <div>
                <div className="text-2xl font-bold text-rose-400 font-mono tracking-tight tabular-nums">
                  {(scene.metadata.confidence * 100).toFixed(1)}%
                </div>
                <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                  Peak Confidence
                </div>
              </div>
              <div className="text-right text-[11px] text-slate-400 space-y-0.5">
                <div>
                  Model:{' '}
                  <span className="font-mono text-slate-200 font-semibold">
                    {scene.metadata.model_version}
                  </span>
                </div>
                <div>
                  Latency:{' '}
                  <span className="font-mono text-blue-400 font-semibold">
                    {scene.metadata.processing_time_seconds}s
                  </span>
                </div>
                <div>
                  Candidates:{' '}
                  <span className="font-mono text-amber-400 font-bold">
                    {scene.candidates.length} Detected
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Extracted Slicks List */}
          <div className="p-3 bg-[#161e2e] border border-[#1e293b] rounded space-y-2.5 shadow-sm">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-200">
              <div className="flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-blue-400" />
                <span>Extracted Slicks ({scene.candidates.length})</span>
              </div>
              <span className="text-[10px] text-slate-500 font-mono">Click to Inspect</span>
            </div>

            <div className="space-y-2">
              {scene.candidates.map((c) => {
                const isSelected = selectedCandidateId === c.candidate_id;
                const isHighConf = c.oil_probability >= 0.8;

                return (
                  <div
                    key={c.candidate_id}
                    onClick={() => handleSelectCandidate(c.candidate_id)}
                    onMouseEnter={() => setHoveredCandidateId(c.candidate_id)}
                    onMouseLeave={() => setHoveredCandidateId(null)}
                    className={`p-2.5 rounded border text-xs space-y-2 cursor-pointer transition-colors ${
                      isSelected
                        ? isHighConf
                          ? 'bg-[#111622] border-rose-500 shadow-sm'
                          : 'bg-[#111622] border-amber-500 shadow-sm'
                        : 'bg-[#111622] border-[#1e293b] hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            c.candidate_id === 1
                              ? 'bg-rose-500'
                              : c.candidate_id === 2
                              ? 'bg-amber-500'
                              : 'bg-blue-500'
                          }`}
                        />
                        <span className="font-bold text-slate-200">Candidate #{c.candidate_id}</span>
                      </div>
                      <span
                        className={`font-semibold font-mono text-[11px] tabular-nums ${
                          isHighConf ? 'text-rose-400' : 'text-amber-400'
                        }`}
                      >
                        {(c.oil_probability * 100).toFixed(1)}% Match
                      </span>
                    </div>

                    <div className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
                      {c.classification}
                    </div>

                    <SARMetricsBadge
                      vv_db={c.properties.mean_vv_db}
                      vh_db={c.properties.mean_vh_db}
                      contrast_ratio={c.properties.contrast_ratio}
                      className="w-full"
                    />

                    <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px] text-slate-400 pt-1.5 border-t border-[#1e293b] font-mono">
                      <div className="flex justify-between">
                        <span className="text-slate-500">Area:</span>
                        <span className="text-slate-200 font-bold">{c.area_km2} km²</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Perimeter:</span>
                        <span className="text-slate-200">{c.properties.perimeter_km} km</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Aspect:</span>
                        <span className="text-slate-200">{c.properties.aspect_ratio}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-slate-500">Solidity:</span>
                        <span className="text-slate-200">{c.properties.solidity}</span>
                      </div>
                    </div>

                    <div className="text-[10px] text-slate-400 font-mono pt-1 flex justify-between border-t border-[#1e293b]">
                      <span className="text-slate-500">Centroid:</span>
                      <span className="text-slate-300">
                        {c.centroid.latitude.toFixed(4)}°N, {c.centroid.longitude.toFixed(4)}°E
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Selected Candidate Detailed Inspector */}
          {selectedCandidate && (
            <div className="p-3 bg-[#161e2e] border border-[#1e293b] rounded space-y-2 font-mono text-xs">
              <div className="flex items-center justify-between text-slate-300 font-bold border-b border-[#1e293b] pb-1">
                <span>CANDIDATE #{selectedCandidate.candidate_id} INSPECTOR</span>
                <span className="text-[10px] text-blue-400">ACTIVE</span>
              </div>
              <div className="space-y-1 text-[11px] text-slate-400">
                <div className="flex justify-between">
                  <span>Pixel Count:</span>
                  <span className="text-slate-200 font-bold">
                    {selectedCandidate.area_pixels.toLocaleString()} px
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Eccentricity:</span>
                  <span className="text-slate-200">{selectedCandidate.properties.eccentricity}</span>
                </div>
                <div className="flex justify-between">
                  <span>Compactness:</span>
                  <span className="text-slate-200">{selectedCandidate.properties.compactness}</span>
                </div>
                <div className="flex justify-between">
                  <span>Orientation:</span>
                  <span className="text-slate-200">
                    {selectedCandidate.properties.orientation_degrees}°
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* SAR Detection Physics Note */}
          <div className="p-3 bg-amber-950/40 border border-amber-800/60 rounded space-y-1 text-xs text-amber-200">
            <div className="flex items-center gap-1.5 text-[11px] font-bold text-amber-400 uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5" />
              <span>SAR Detection Physics Note</span>
            </div>
            <p className="text-[10px] leading-relaxed text-slate-400">
              Dark SAR backscatter signatures reflect Bragg capillary wave damping. Similar radar
              darkening can be caused by low-wind zones (&lt; 3 m/s), biogenic surface films, rain
              cells, or look-alikes. Detections must be treated as{' '}
              <strong className="text-amber-300 font-bold">POTENTIAL OIL POLLUTION</strong> until
              cross-validated via hydrodynamic drift hindcasting and AIS attribution.
            </p>
          </div>
        </aside>

        {/* ── CENTER WORKSPACE: MAIN SAR VIEWER STUDIO ── */}
        <main className="flex-1 flex flex-col min-h-0 bg-[#0c1017] overflow-hidden relative">
          {/* Studio Command Toolbar */}
          <div className="h-10 bg-[#111622] border-b border-[#1e293b] px-3 flex items-center justify-between gap-2 shrink-0 z-20 overflow-x-auto">
            <div className="flex items-center gap-2">
              {/* Primary Workspace View Switcher (SAR Radar vs Google Maps Satellite vs Split) */}
              <div className="flex items-center gap-1 bg-[#0c1017] p-0.5 rounded border border-[#1e293b] text-xs font-mono">
                <button
                  onClick={() => setWorkspaceMode('radar')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    workspaceMode === 'radar'
                      ? 'bg-blue-950 text-blue-200 border border-blue-800/60 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Sentinel-1 SAR Radar Analysis Canvas"
                >
                  <Satellite className="w-3.5 h-3.5" />
                  <span>SAR Radar Canvas</span>
                </button>
                <button
                  onClick={() => setWorkspaceMode('gis-map')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    workspaceMode === 'gis-map'
                      ? 'bg-blue-950 text-blue-200 border border-blue-800/60 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Google Maps Optical Satellite / Hybrid Basemap"
                >
                  <Globe className="w-3.5 h-3.5" />
                  <span>Google Maps Satellite</span>
                </button>
                <button
                  onClick={() => setWorkspaceMode('split')}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded font-medium transition-colors cursor-pointer ${
                    workspaceMode === 'split'
                      ? 'bg-blue-950 text-blue-200 border border-blue-800/60 font-semibold'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                  title="Side-by-Side Synchronized Radar + Map View"
                >
                  <Columns className="w-3.5 h-3.5" />
                  <span>Split View</span>
                </button>
              </div>

              {/* Sub-mode Tabs (Detection Overlay / Raw / Mask) for Radar View */}
              {workspaceMode !== 'gis-map' && (
                <div className="flex items-center gap-1 bg-[#0c1017] p-0.5 rounded border border-[#1e293b] text-xs">
                  <button
                    onClick={() => setActiveTab('overlay')}
                    className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                      activeTab === 'overlay'
                        ? 'bg-blue-950 text-blue-200 border border-blue-800/60 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Detection Overlay
                  </button>
                  <button
                    onClick={() => setActiveTab('raw')}
                    className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                      activeTab === 'raw'
                        ? 'bg-blue-950 text-blue-200 border border-blue-800/60 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Raw Backscatter
                  </button>
                  <button
                    onClick={() => setActiveTab('mask')}
                    className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                      activeTab === 'mask'
                        ? 'bg-blue-950 text-blue-200 border border-blue-800/60 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    U-Net Mask
                  </button>
                </div>
              )}
            </div>

            {/* Sub-controls based on active tab */}
            <div className="flex items-center gap-2">
              {/* Polarization Selector (when viewing SAR raster) */}
              {activeTab !== 'mask' && (
                <div className="flex items-center gap-1 bg-[#0c1017] p-0.5 rounded border border-[#1e293b] text-xs font-mono">
                  {(['VV', 'VH', 'composite'] as SARChannel[]).map((ch) => (
                    <button
                      key={ch}
                      onClick={() => setChannel(ch)}
                      className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                        channel === ch
                          ? 'bg-blue-950 text-blue-200 border border-blue-800/60 font-semibold'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {ch === 'composite' ? 'Dual-Pol Composite' : `${ch} Pol`}
                    </button>
                  ))}
                </div>
              )}

              {/* Mask Type Selector (when viewing U-Net Mask) */}
              {activeTab === 'mask' && (
                <div className="flex items-center gap-1 bg-[#0c1017] p-0.5 rounded border border-[#1e293b] text-xs font-mono">
                  <button
                    onClick={() => setMaskType('binary')}
                    className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                      maskType === 'binary'
                        ? 'bg-rose-950 text-rose-300 border border-rose-800/60 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Binary Mask
                  </button>
                  <button
                    onClick={() => setMaskType('prob')}
                    className={`px-2 py-0.5 rounded font-medium transition-colors cursor-pointer ${
                      maskType === 'prob'
                        ? 'bg-blue-950 text-blue-200 border border-blue-800/60 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    Probability Heatmap
                  </button>
                </div>
              )}

              {/* Layer Visibility Toggles (Overlay mode) */}
              {activeTab === 'overlay' && (
                <div className="flex items-center gap-1 bg-[#0c1017] p-0.5 rounded border border-[#1e293b] text-xs font-mono">
                  <button
                    onClick={() => setShowContours((prev) => !prev)}
                    title={showContours ? 'Hide Contours' : 'Show Contours'}
                    className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer ${
                      showContours ? 'text-blue-300 bg-blue-950 border border-blue-800/60' : 'text-slate-500'
                    }`}
                  >
                    {showContours ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                    <span>Contours</span>
                  </button>
                  <button
                    onClick={() => setShowLabels((prev) => !prev)}
                    title={showLabels ? 'Hide Labels' : 'Show Labels'}
                    className={`px-2 py-0.5 rounded flex items-center gap-1 transition-colors cursor-pointer ${
                      showLabels ? 'text-blue-300 bg-blue-950 border border-blue-800/60' : 'text-slate-500'
                    }`}
                  >
                    <span>Labels</span>
                  </button>
                </div>
              )}

              {/* Radiometric Enhancement Toggle */}
              <div className="relative">
                <button
                  onClick={() => setShowEnhancements((prev) => !prev)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-medium transition-colors cursor-pointer ${
                    showEnhancements
                      ? 'bg-blue-950 border-blue-700 text-blue-200 font-semibold'
                      : 'bg-[#0c1017] hover:bg-[#161e2e] border-[#1e293b] text-slate-400 hover:text-slate-200'
                  }`}
                  title="Adjust Radiometric Brightness / Contrast"
                >
                  <Sliders className="w-3.5 h-3.5 text-blue-400" />
                  <span>Enhancements</span>
                </button>

                {/* Floating Enhancement Popover */}
                {showEnhancements && (
                  <div className="absolute right-0 top-10 w-64 p-3 bg-[#111622] border border-[#1e293b] rounded shadow-2xl space-y-3 z-50 text-xs font-mono animate-in fade-in">
                    <div className="flex items-center justify-between border-b border-[#1e293b] pb-1.5">
                      <span className="font-bold text-slate-200">Raster Display Controls</span>
                      <button
                        onClick={() =>
                          setEnhancements({
                            brightness: 100,
                            contrast: 100,
                            gamma: 1.0,
                          })
                        }
                        className="text-[10px] text-blue-400 hover:text-blue-300 underline cursor-pointer"
                      >
                        Reset
                      </button>
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Brightness</span>
                        <span className="text-blue-300 font-bold">{enhancements.brightness}%</span>
                      </div>
                      <input
                        type="range"
                        min="50"
                        max="160"
                        value={enhancements.brightness}
                        onChange={(e) =>
                          setEnhancements((prev) => ({
                            ...prev,
                            brightness: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-blue-500 h-1 bg-slate-800 rounded cursor-pointer"
                      />
                    </div>

                    <div>
                      <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                        <span>Contrast</span>
                        <span className="text-blue-300 font-bold">{enhancements.contrast}%</span>
                      </div>
                      <input
                        type="range"
                        min="60"
                        max="180"
                        value={enhancements.contrast}
                        onChange={(e) =>
                          setEnhancements((prev) => ({
                            ...prev,
                            contrast: Number(e.target.value),
                          }))
                        }
                        className="w-full accent-blue-500 h-1 bg-slate-800 rounded cursor-pointer"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Zoom Controls */}
              <div className="flex items-center gap-1 bg-[#0c1017] rounded border border-[#1e293b] px-2 py-0.5 text-xs">
                <button
                  onClick={() => setZoom((z) => Math.max(z - 15, 50))}
                  className="p-1 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-slate-200 font-bold font-mono w-10 text-center">{zoom}%</span>
                <button
                  onClick={() => setZoom((z) => Math.min(z + 15, 400))}
                  className="p-1 text-slate-400 hover:text-blue-400 transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Fit Screen */}
              <button
                onClick={handleFitScreen}
                className="p-1.5 bg-[#0c1017] hover:bg-[#161e2e] border border-[#1e293b] text-slate-400 hover:text-blue-300 rounded transition-colors cursor-pointer"
                title="Fit to Screen (100%)"
              >
                <Maximize2 className="w-3.5 h-3.5" />
              </button>

              {/* Reset View */}
              <button
                onClick={handleResetView}
                className="p-1.5 bg-[#0c1017] hover:bg-[#161e2e] border border-[#1e293b] text-slate-400 hover:text-blue-300 rounded transition-colors cursor-pointer"
                title="Reset View and Enhancements"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* ── CENTRAL VIEWER CANVAS ── */}
          <div className="flex-1 relative overflow-hidden">
            {/* Loading State Overlay */}
            {loading && (
              <div className="absolute inset-0 z-40 bg-[#0c1017]/90 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center font-mono space-y-4">
                <div className="w-10 h-10 rounded-full border-3 border-slate-800 border-t-blue-400 animate-spin" />
                <div className="space-y-2 max-w-md">
                  <h3 className="text-xs font-bold text-slate-200 tracking-wider uppercase">
                    LOADING SENTINEL-1 SAR PRODUCT
                  </h3>
                  <div className="space-y-1 text-left bg-[#111622] p-3 rounded border border-[#1e293b] text-xs">
                    {loadingSteps.map((step, idx) => (
                      <div key={idx} className="flex items-center gap-2">
                        {loadingStepIndex > idx ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        ) : loadingStepIndex === idx ? (
                          <div className="w-3.5 h-3.5 rounded-full border-2 border-blue-400 border-t-transparent animate-spin shrink-0" />
                        ) : (
                          <div className="w-3.5 h-3.5 rounded-full border border-slate-700 shrink-0" />
                        )}
                        <span
                          className={
                            loadingStepIndex >= idx ? 'text-slate-200' : 'text-slate-600'
                          }
                        >
                          {step}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Error State Banner */}
            {error && !loading && (
              <div className="absolute top-4 left-4 right-4 z-30 bg-rose-950/90 border border-rose-500/50 rounded p-3 text-xs font-mono text-rose-200 flex items-center justify-between shadow-xl">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>{error}</span>
                </div>
                <button
                  onClick={loadScene}
                  className="px-2.5 py-1 bg-rose-900 hover:bg-rose-800 border border-rose-500/40 rounded text-[11px] font-bold text-rose-100 flex items-center gap-1 cursor-pointer"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Retry</span>
                </button>
              </div>
            )}

            {/* Workspace View Selector: Radar Canvas, Google Maps GIS, or Split View */}
            {workspaceMode === 'radar' && (
              <>
                <SARRasterViewer
                  scene={scene}
                  activeTab={activeTab}
                  maskType={maskType}
                  channel={channel}
                  selectedCandidateId={selectedCandidateId}
                  hoveredCandidateId={hoveredCandidateId}
                  onSelectCandidate={handleSelectCandidate}
                  onHoverCandidate={setHoveredCandidateId}
                  enhancements={enhancements}
                  showCandidateContours={showContours}
                  showCandidateLabels={showLabels}
                  zoom={zoom}
                  onZoomChange={setZoom}
                  pan={pan}
                  onPanChange={setPan}
                  onCursorCoords={setCursorCoords}
                />

                {/* Active Mode Banner Badge */}
                <div className="absolute top-3 left-3 z-10 pointer-events-none">
                  <div className="flex items-center gap-2 bg-[#111622]/90 backdrop-blur-md border border-[#1e293b] px-3 py-1.5 rounded text-xs font-mono text-slate-200 shadow-md">
                    <span className="w-2 h-2 rounded-full bg-blue-400" />
                    <span className="font-bold">
                      {activeTab === 'overlay'
                        ? 'Detection Overlay Mode'
                        : activeTab === 'raw'
                        ? 'Raw SAR Backscatter Mode'
                        : 'U-Net Model Segmentation Mask'}
                    </span>
                    <span className="text-slate-600">|</span>
                    <span className="text-slate-400">
                      {activeTab === 'mask'
                        ? maskType === 'binary'
                          ? 'Binary Cutoff (0.50)'
                          : 'Sigmoid Probability Map'
                        : channel === 'composite'
                        ? 'Dual-Pol RGB Composite'
                        : `${channel} Polarization`}
                    </span>
                  </div>
                </div>

                {/* Dynamic Telemetry HUD */}
                <div className="absolute bottom-3 left-3 z-10 flex items-center gap-2 pointer-events-none">
                  <div className="flex items-center gap-2.5 bg-[#111622]/90 backdrop-blur-md border border-[#1e293b] rounded px-3 py-1.5 text-xs text-slate-300 font-mono shadow-md">
                    <Crosshair className="w-3.5 h-3.5 text-blue-400 shrink-0" />
                    <span className="font-bold text-slate-100">{scene.metadata.crs}</span>
                    <span className="text-slate-700">|</span>
                    <span>
                      {cursorCoords
                        ? `${cursorCoords.lat.toFixed(4)}°N, ${cursorCoords.lon.toFixed(4)}°E [px ${cursorCoords.pixelX}, ${cursorCoords.pixelY}]`
                        : `${scene.metadata.center_coordinates.latitude.toFixed(4)}°N, ${scene.metadata.center_coordinates.longitude.toFixed(4)}°E (Center)`}
                    </span>
                    <span className="text-slate-700">|</span>
                    <span>{scene.metadata.spatial_resolution_m}m Pixel</span>
                    <span className="text-slate-700">|</span>
                    <span className="text-slate-400">
                      {new Date(scene.metadata.acquisition_time).toUTCString()}
                    </span>
                  </div>
                </div>
              </>
            )}

            {workspaceMode === 'gis-map' && (
              <SARGisMapView
                scene={scene}
                channel={channel}
                selectedCandidateId={selectedCandidateId}
                onSelectCandidate={handleSelectCandidate}
                showCandidateContours={showContours}
                showCandidateLabels={showLabels}
              />
            )}

            {workspaceMode === 'split' && (
              <div className="w-full h-full flex flex-col lg:flex-row min-h-0">
                {/* Left Half: SAR Radar Viewer */}
                <div className="flex-1 relative border-b lg:border-b-0 lg:border-r border-[#1e293b] min-h-0">
                  <div className="absolute top-2 left-2 z-10 bg-[#111622]/90 border border-[#1e293b] px-2 py-1 rounded text-[10px] font-mono text-blue-300 font-bold">
                    SAR Radar Canvas ({channel})
                  </div>
                  <SARRasterViewer
                    scene={scene}
                    activeTab={activeTab}
                    maskType={maskType}
                    channel={channel}
                    selectedCandidateId={selectedCandidateId}
                    hoveredCandidateId={hoveredCandidateId}
                    onSelectCandidate={handleSelectCandidate}
                    onHoverCandidate={setHoveredCandidateId}
                    enhancements={enhancements}
                    showCandidateContours={showContours}
                    showCandidateLabels={showLabels}
                    zoom={zoom}
                    onZoomChange={setZoom}
                    pan={pan}
                    onPanChange={setPan}
                    onCursorCoords={setCursorCoords}
                  />
                </div>

                {/* Right Half: Google Maps GIS Satellite View */}
                <div className="flex-1 relative min-h-0">
                  <div className="absolute top-2 left-2 z-10 bg-[#111622]/90 border border-[#1e293b] px-2 py-1 rounded text-[10px] font-mono text-blue-300 font-bold">
                    Google Maps Satellite + SAR Overlay
                  </div>
                  <SARGisMapView
                    scene={scene}
                    channel={channel}
                    selectedCandidateId={selectedCandidateId}
                    onSelectCandidate={handleSelectCandidate}
                    showCandidateContours={showContours}
                    showCandidateLabels={showLabels}
                  />
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
};
