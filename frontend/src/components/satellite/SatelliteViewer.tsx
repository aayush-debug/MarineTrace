import { useState } from 'react';
import {
  Satellite,
  Sliders,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Crosshair,
} from 'lucide-react';
import { useInvestigation } from '../../context/InvestigationContext';

export const SatelliteViewer: React.FC = () => {
  const { investigation } = useInvestigation();
  const [activeTab, setActiveTab] = useState<'overlay' | 'original' | 'mask'>('overlay');
  const [zoom, setZoom] = useState<number>(100);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(115);
  const [cursorPos, setCursorPos] = useState<{ x: number; y: number } | null>(null);

  const resetControls = () => {
    setZoom(100);
    setBrightness(100);
    setContrast(115);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = Math.round(e.clientX - rect.left);
    const y = Math.round(e.clientY - rect.top);
    setCursorPos({ x, y });
  };

  const centroidLat =
    investigation?.spill?.geometry?.coordinates?.[0]?.[0]?.[1] || 18.721;
  const centroidLon =
    investigation?.spill?.geometry?.coordinates?.[0]?.[0]?.[0] || 72.914;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#060a12] overflow-hidden font-mono select-none">
      {/* Top Command Toolbar */}
      <div className="h-12 bg-[#090e1a] border-b border-slate-800/90 px-4 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Satellite className="w-4 h-4 text-cyan-400" />
            <span className="font-bold text-slate-100 text-xs tracking-wider uppercase">
              SENTINEL-1 SAR IMAGERY VIEWER
            </span>
          </div>

          <div className="flex items-center bg-slate-950 p-0.5 rounded border border-slate-800 text-[10px]">
            {(['original', 'mask', 'overlay'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-2.5 py-1 rounded capitalize font-medium transition-colors ${
                  activeTab === tab
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {tab === 'original'
                  ? 'Raw SAR'
                  : tab === 'mask'
                  ? 'U-Net Mask'
                  : 'Detection Overlay'}
              </button>
            ))}
          </div>
        </div>

        {/* Zoom & Quick Filter Indicators */}
        <div className="flex items-center gap-3 text-xs">
          <div className="flex items-center gap-2 bg-slate-900/90 border border-slate-800 px-2 py-1 rounded text-[11px] text-slate-300">
            <ZoomOut
              className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-cyan-400"
              onClick={() => setZoom((z: number) => Math.max(z - 15, 60))}
            />
            <span className="font-bold text-cyan-300">{zoom}%</span>
            <ZoomIn
              className="w-3.5 h-3.5 text-slate-400 cursor-pointer hover:text-cyan-400"
              onClick={() => setZoom((z: number) => Math.min(z + 15, 200))}
            />
          </div>

          <button
            onClick={resetControls}
            className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-cyan-300 px-2 py-1 bg-slate-900 border border-slate-800 rounded transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Split: Left Telemetry / Controls | Right Canvas */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-0 min-h-0 overflow-hidden">
        {/* Left Telemetry & Controls Panel (4 Cols) */}
        <div className="lg:col-span-4 bg-[#080d18] border-r border-slate-800/90 p-4 space-y-4 overflow-y-auto">
          {/* Metadata Card */}
          <div className="p-3 bg-[#0d1527] border border-slate-800 rounded-lg space-y-2.5 text-xs">
            <div className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider border-b border-slate-800 pb-1.5 flex items-center justify-between">
              <span>ACQUISITION TELEMETRY</span>
              <span className="text-emerald-400 text-[9px] font-semibold">VERIFIED L1 GRD</span>
            </div>

            <div className="space-y-1.5 text-slate-300 text-[11px]">
              <div className="flex justify-between">
                <span className="text-slate-400">Satellite Platform:</span>
                <span className="text-slate-100 font-bold">Sentinel-1A (Copernicus)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sensor Instrument:</span>
                <span className="text-slate-100">C-Band SAR (5.405 GHz)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Acquisition Mode:</span>
                <span className="text-slate-100">Interferometric Wide (IW)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Polarization:</span>
                <span className="text-cyan-300 font-bold">VV Single-Pol (Optimized)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Spatial Resolution:</span>
                <span className="text-slate-100">10m × 10m Ground Pixel</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Centroid Coords:</span>
                <span className="text-slate-100 font-bold">
                  {centroidLat.toFixed(4)}°N, {centroidLon.toFixed(4)}°E
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Acquisition Time:</span>
                <span className="text-slate-100 text-[10px]">
                  {investigation?.observation_time
                    ? new Date(investigation.observation_time).toUTCString()
                    : '2026-08-25 10:32:00 UTC'}
                </span>
              </div>
            </div>
          </div>

          {/* Radiometric Adjustment Controls */}
          <div className="p-3.5 bg-[#0d1527] border border-slate-800 rounded-lg space-y-3 text-xs">
            <div className="text-[10px] font-bold text-slate-300 uppercase tracking-wider border-b border-slate-800 pb-1.5 flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-cyan-400" />
              <span>RADIOMETRIC ADJUSTMENTS</span>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Brightness (Gain)</span>
                  <span className="text-cyan-300 font-bold">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="160"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-1 bg-slate-800 rounded"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Contrast (Backscatter Damping)</span>
                  <span className="text-cyan-300 font-bold">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="60"
                  max="180"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-1 bg-slate-800 rounded"
                />
              </div>
            </div>
          </div>

          {/* Delineation Diagnostics */}
          <div className="p-3 bg-[#0d1527] border border-slate-800 rounded-lg space-y-1.5 text-xs text-slate-300">
            <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-slate-800 pb-1">
              SLICK EXTRACTION SUMMARY
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Estimated Area:</span>
              <span className="text-amber-400 font-bold">
                {investigation?.spill.area_km2.toFixed(2) || '18.40'} km²
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Neural Confidence:</span>
              <span className="text-emerald-400 font-bold">
                {((investigation?.spill.confidence || 0.924) * 100).toFixed(1)}%
              </span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-slate-400">Backscatter Drop:</span>
              <span className="text-slate-100 font-semibold">-4.8 dB (Confirmed Slick)</span>
            </div>
          </div>
        </div>

        {/* Right Interactive SAR Canvas (8 Cols) */}
        <div
          className="lg:col-span-8 bg-[#04070e] relative flex items-center justify-center p-6 overflow-hidden cursor-crosshair"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setCursorPos(null)}
        >
          {/* Grid HUD Overlay */}
          <div className="absolute inset-0 pointer-events-none opacity-20 bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px),linear-gradient(to_bottom,#1e293b_1px,transparent_1px)] bg-[size:32px_32px]" />

          {/* High-Resolution Simulated SAR Canvas Element */}
          <div
            className="relative w-[560px] h-[400px] rounded-lg border border-slate-800/80 shadow-2xl transition-all duration-150 overflow-hidden"
            style={{
              transform: `scale(${zoom / 100})`,
              filter: `brightness(${brightness}%) contrast(${contrast}%)`,
              background:
                activeTab === 'mask'
                  ? '#000000'
                  : 'radial-gradient(ellipse at 48% 52%, #1a2538 0%, #0c1322 55%, #050811 100%)',
            }}
          >
            {/* Speckle Noise Texture for SAR Simulation */}
            {activeTab !== 'mask' && (
              <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:6px_6px]" />
            )}

            {/* Slick Dark Patch (Capillary Wave Damping Zone) */}
            <div
              className={`absolute top-[28%] left-[26%] w-56 h-36 rounded-[46%] transition-all duration-300 ${
                activeTab === 'mask'
                  ? 'bg-white shadow-[0_0_30px_rgba(255,255,255,0.4)]'
                  : activeTab === 'original'
                  ? 'bg-[#02050b] opacity-95 shadow-inner'
                  : 'bg-[#02050b] border-2 border-dashed border-rose-500/90 shadow-[0_0_20px_rgba(244,63,94,0.35)]'
              }`}
            >
              {activeTab === 'overlay' && (
                <div className="w-full h-full bg-rose-500/25 rounded-[46%] flex flex-col items-center justify-center text-rose-300">
                  <span className="text-[10px] font-bold bg-slate-950/80 px-2 py-0.5 rounded border border-rose-500/40">
                    SLICK DETECTED ({(investigation?.spill.confidence ? investigation.spill.confidence * 100 : 92.4).toFixed(1)}%)
                  </span>
                  <span className="text-[9px] text-slate-300 mt-1">
                    {investigation?.spill.area_km2.toFixed(2) || '18.40'} km²
                  </span>
                </div>
              )}
            </div>

            {/* Canvas Telemetry Watermark */}
            <div className="absolute top-3 left-3 text-[10px] text-slate-400 bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
              <div>PLATFORM: S1A_IW_GRDH</div>
              <div>BEARING: DESCENDING (215°)</div>
            </div>

            <div className="absolute bottom-3 right-3 text-[10px] text-slate-400 bg-slate-950/80 px-2 py-1 rounded border border-slate-800">
              <span>EPSG:4326 • 10m PIXEL</span>
            </div>
          </div>

          {/* Dynamic Cursor Coordinates HUD */}
          {cursorPos && (
            <div className="absolute bottom-3 left-3 z-10 bg-slate-900/90 border border-slate-800 px-2.5 py-1 rounded text-[10px] font-mono text-cyan-300 flex items-center gap-1.5 shadow-lg">
              <Crosshair className="w-3 h-3 text-cyan-400" />
              <span>
                PIXEL [{cursorPos.x}, {cursorPos.y}] • COORDS: {(centroidLat + (cursorPos.y - 200) * 0.0005).toFixed(4)}°N, {(centroidLon + (cursorPos.x - 280) * 0.0005).toFixed(4)}°E
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
