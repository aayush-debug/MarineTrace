import React, { useState } from 'react';
import {
  Satellite,
  Sliders,
  ZoomIn,
  ZoomOut,
  Activity,
  RotateCcw,
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';

export const SatelliteImagery: React.FC = () => {
  const { investigation } = useInvestigation();
  const [zoom, setZoom] = useState<number>(100);
  const [brightness, setBrightness] = useState<number>(100);
  const [contrast, setContrast] = useState<number>(115);
  const [showMask, setShowMask] = useState<boolean>(true);
  const [showBoundingBox, setShowBoundingBox] = useState<boolean>(true);

  const resetFilters = () => {
    setZoom(100);
    setBrightness(100);
    setContrast(115);
  };

  const centroidLat =
    investigation?.spill?.geometry?.coordinates?.[0]?.[0]?.[1] || 18.721;
  const centroidLon =
    investigation?.spill?.geometry?.coordinates?.[0]?.[0]?.[0] || 72.914;

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#060a12] overflow-y-auto font-mono p-4 sm:p-6 space-y-4">
      {/* Title */}
      <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Satellite className="w-5 h-5 text-cyan-400" />
            <h1 className="text-base sm:text-lg font-bold text-slate-100 tracking-wide">
              SATELLITE SAR IMAGERY & SEGMENTATION EXPLORER
            </h1>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Synthetic Aperture Radar (SAR) C-Band Level-1 GRD imagery with AI segmentation overlay.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1">
        {/* Left Column: Image Controls & Metadata (4 Cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Metadata Card */}
          <div className="bg-[#0e1626] border border-slate-800 rounded-lg p-4 font-mono space-y-3 text-xs">
            <div className="text-xs font-bold text-slate-200 uppercase border-b border-slate-800 pb-2 flex items-center gap-2">
              <Activity className="w-4 h-4 text-cyan-400" />
              <span>SENSOR ACQUISITION METADATA</span>
            </div>

            <div className="space-y-2 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Satellite Platform:</span>
                <span className="text-slate-100 font-bold">Sentinel-1A (Copernicus)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Sensor Mode:</span>
                <span className="text-slate-100">Interferometric Wide (IW)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Polarization:</span>
                <span className="text-cyan-300 font-bold">VV + VH Dual-Pol</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Spatial Resolution:</span>
                <span className="text-slate-100">10m × 10m Ground Pixel</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target Coordinates:</span>
                <span className="text-slate-100 font-bold">
                  {centroidLat.toFixed(4)}°N, {centroidLon.toFixed(4)}°E
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Pass Direction:</span>
                <span className="text-slate-100">Descending (Track 12)</span>
              </div>
            </div>
          </div>

          {/* Image Adjustment Controls */}
          <div className="bg-[#0e1626] border border-slate-800 rounded-lg p-4 font-mono space-y-3 text-xs">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>IMAGE PROCESSING CONTROLS</span>
              </span>
              <button
                onClick={resetFilters}
                className="text-[10px] text-cyan-400 hover:underline flex items-center gap-1"
              >
                <RotateCcw className="w-3 h-3" /> Reset
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Zoom Level</span>
                  <span className="text-cyan-300 font-bold">{zoom}%</span>
                </div>
                <div className="flex items-center gap-2">
                  <ZoomOut className="w-4 h-4 text-slate-400" />
                  <input
                    type="range"
                    min="50"
                    max="200"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="flex-1 accent-cyan-400 h-1 bg-slate-800 rounded"
                  />
                  <ZoomIn className="w-4 h-4 text-slate-400" />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Brightness</span>
                  <span className="text-cyan-300 font-bold">{brightness}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="150"
                  value={brightness}
                  onChange={(e) => setBrightness(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-1 bg-slate-800 rounded"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-slate-400 mb-1">
                  <span>Backscatter Contrast</span>
                  <span className="text-cyan-300 font-bold">{contrast}%</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={contrast}
                  onChange={(e) => setContrast(Number(e.target.value))}
                  className="w-full accent-cyan-400 h-1 bg-slate-800 rounded"
                />
              </div>

              <div className="pt-2 border-t border-slate-800 space-y-2">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showMask}
                    onChange={(e) => setShowMask(e.target.checked)}
                    className="rounded accent-cyan-400"
                  />
                  <span>Show U-Net Segmentation Mask</span>
                </label>

                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showBoundingBox}
                    onChange={(e) => setShowBoundingBox(e.target.checked)}
                    className="rounded accent-cyan-400"
                  />
                  <span>Show Extracted Polygon Boundary</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: High-Res Interactive Canvas Display (8 Cols) */}
        <div className="lg:col-span-8 bg-[#090e1a] border border-slate-800 rounded-lg overflow-hidden flex flex-col shadow-2xl relative min-h-[500px]">
          <div className="bg-[#0b101f] px-4 py-2.5 border-b border-slate-800 flex items-center justify-between text-xs font-mono">
            <span className="font-bold text-slate-200">
              SAR BACKSCATTER INTENSITY & OIL SLICK DELINEATION
            </span>
            <span className="text-emerald-400 text-[11px]">
              Damping Ratio: 4.8 dB (Confirmed Hydrocarbon)
            </span>
          </div>

          <div className="flex-1 flex items-center justify-center p-6 bg-[#04070d] relative overflow-hidden">
            {/* Visual SAR Canvas Simulation */}
            <div
              className="relative w-[520px] h-[360px] rounded-lg shadow-2xl transition-transform duration-200 border border-slate-800"
              style={{
                transform: `scale(${zoom / 100})`,
                filter: `brightness(${brightness}%) contrast(${contrast}%)`,
                background:
                  'radial-gradient(ellipse at center, #1e293b 0%, #0f172a 60%, #020617 100%)',
              }}
            >
              {/* Radar Specks / Backscatter texture */}
              <div className="absolute inset-0 opacity-25 bg-[radial-gradient(#ffffff_1px,transparent_1px)] [background-size:8px_8px]" />

              {/* Oil Spill Dark Patch (Radar Damping) */}
              <div className="absolute top-[35%] left-[30%] w-44 h-28 bg-[#020408] rounded-[45%] opacity-90 shadow-inner blur-[1px]">
                {showMask && (
                  <div className="w-full h-full border border-cyan-400/40 bg-cyan-400/10 rounded-[45%] flex items-center justify-center">
                    <span className="text-[10px] text-cyan-300 font-bold bg-slate-950/80 px-1.5 py-0.5 rounded border border-cyan-500/30">
                      U-NET MASK (92.4%)
                    </span>
                  </div>
                )}

                {showBoundingBox && (
                  <div className="absolute -inset-2 border-2 border-dashed border-rose-500 rounded-[50%] animate-pulse" />
                )}
              </div>

              {/* Reticle Overlay */}
              <div className="absolute top-4 left-4 text-[10px] text-slate-400 font-mono space-y-0.5">
                <div>SCENE ID: S1A_20260825_ARABIAN</div>
                <div>POLARIZATION: VV</div>
              </div>

              <div className="absolute bottom-4 right-4 text-[10px] text-rose-400 font-mono font-bold bg-slate-950/80 px-2 py-1 rounded border border-rose-500/30">
                SLICK AREA: {investigation?.spill.area_km2.toFixed(2) || '18.40'} km²
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
