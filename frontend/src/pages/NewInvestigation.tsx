import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileImage,
  AlertCircle,
  Play,
  Layers,
  Calendar,
  Compass,
  Cpu,
  Sparkles,
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';

export const NewInvestigation: React.FC = () => {
  const { executeInvestigation, executeDemo, loading, loadingStep, error } =
    useInvestigation();

  const [selectedFile, setSelectedFile] = useState<{
    name: string;
    size: string;
    type: string;
    previewUrl?: string;
  } | null>({
    name: 'S1A_IW_GRDH_1SDV_20260825T103215_ARABIAN_SEA.SAFE',
    size: '14.8 MB',
    type: 'Sentinel-1 SAR C-Band (GeoTIFF)',
  });

  const [acquisitionTime, setAcquisitionTime] = useState<string>(
    '2026-08-25T10:32:00'
  );
  const [backwardHours, setBackwardHours] = useState<number>(24);
  const [displayMode, setDisplayMode] = useState<'overlay' | 'original' | 'mask'>('overlay');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      setSelectedFile({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type: file.type || 'Satellite SAR Imagery',
      });
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile({
        name: file.name,
        size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
        type: file.type || 'Satellite SAR Imagery',
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeInvestigation({
      observation_time: new Date(acquisitionTime).toISOString(),
      backward_hours: backwardHours,
      forward_hours: 24,
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#060a12] overflow-y-auto font-mono p-4 sm:p-6 space-y-6">
      {/* Title */}
      <div className="border-b border-slate-800 pb-3 flex items-center justify-between">
        <div>
          <h1 className="text-lg font-bold text-slate-100 tracking-wide flex items-center gap-2">
            <Cpu className="w-5 h-5 text-cyan-400" />
            INITIATE OIL SPILL INVESTIGATION
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Ingest Sentinel-1 SAR imagery to detect slicks, compute reverse drift vectors, and correlate AIS traffic.
          </p>
        </div>

        <button
          onClick={executeDemo}
          disabled={loading}
          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-700 rounded text-xs text-cyan-300 font-semibold flex items-center gap-1.5"
        >
          <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
          <span>USE REPLAYABLE DEMO SCENARIO</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: SAR Upload & Acquisition Parameters */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drag & Drop Upload Container */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-700 hover:border-cyan-500/80 bg-[#0c1220] hover:bg-slate-900/60 p-6 rounded-lg text-center cursor-pointer transition-all space-y-3"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".tif,.tiff,.geotiff,.png,.jpg,.jpeg"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 flex items-center justify-center mx-auto">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-slate-200">
                DRAG & DROP SATELLITE SAR IMAGERY (GeoTIFF / PNG / JPG)
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Supports Sentinel-1 GRD IW, RADARSAT, ALOS-2 PALSAR
              </p>
            </div>
          </div>

          {/* Selected File Inspection Card */}
          {selectedFile && (
            <div className="p-3 bg-slate-900/90 border border-slate-800 rounded flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <FileImage className="w-5 h-5 text-cyan-400" />
                <div>
                  <div className="font-bold text-slate-200 truncate max-w-[280px]">
                    {selectedFile.name}
                  </div>
                  <div className="text-[10px] text-slate-400">
                    {selectedFile.size} • {selectedFile.type}
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                READY
              </span>
            </div>
          )}

          {/* Parameters Form */}
          <div className="p-4 bg-[#0c1220] border border-slate-800 rounded-lg space-y-3">
            <div className="text-xs font-bold text-slate-300 border-b border-slate-800 pb-2">
              SURVEILLANCE PARAMETERS
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                Satellite Acquisition Timestamp (UTC)
              </label>
              <input
                type="datetime-local"
                value={acquisitionTime}
                onChange={(e) => setAcquisitionTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-cyan-500"
                required
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5 text-blue-400" />
                Backward Drift Simulation Horizon (Hours)
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[12, 24, 48, 72].map((h) => (
                  <button
                    type="button"
                    key={h}
                    onClick={() => setBackwardHours(h)}
                    className={`py-1.5 rounded text-center text-xs font-semibold border ${
                      backwardHours === h
                        ? 'bg-cyan-500/20 border-cyan-500 text-cyan-300'
                        : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
                    }`}
                  >
                    {h} Hours
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Submit Action */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-slate-950 font-bold text-xs uppercase tracking-wider rounded-lg shadow-lg shadow-cyan-950/60 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-slate-950 border-t-transparent animate-spin" />
                <span>{loadingStep || 'PROCESSING INVESTIGATION...'}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-slate-950" />
                <span>EXECUTE MULTI-STAGE INVESTIGATION</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Right Column: Pre-Execution Preview & SAR Visualizer */}
        <div className="space-y-4">
          <div className="bg-[#0c1220] border border-slate-800 rounded-lg p-4 font-mono space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="font-bold text-slate-200 text-xs">
                  SAR SEGMENTATION & SLICK EXTRACTION PREVIEW
                </span>
              </div>
              <div className="flex gap-1 text-[10px]">
                {(['original', 'mask', 'overlay'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setDisplayMode(mode)}
                    className={`px-2 py-0.5 rounded capitalize ${
                      displayMode === mode
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                        : 'text-slate-400 hover:bg-slate-800'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Synthetic High-Resolution SAR Display Canvas */}
            <div className="h-64 bg-[#070c16] rounded border border-slate-800 relative overflow-hidden flex items-center justify-center p-4">
              {displayMode === 'original' && (
                <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded flex flex-col items-center justify-center text-slate-500 text-xs font-mono">
                  <span>🛰️ Sentinel-1 Raw Backscatter (VV Band)</span>
                  <span className="text-[10px] text-slate-600 mt-1">Noise Equivalent Sigma Zero: -22 dB</span>
                </div>
              )}

              {displayMode === 'mask' && (
                <div className="w-full h-full bg-black rounded flex items-center justify-center relative">
                  <div className="w-32 h-20 bg-white rounded-[40%] blur-[2px] opacity-90 shadow-2xl flex items-center justify-center text-black font-bold text-[10px]">
                    SLICK MASK
                  </div>
                </div>
              )}

              {displayMode === 'overlay' && (
                <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded relative flex items-center justify-center">
                  <div className="w-36 h-24 border-2 border-dashed border-rose-500 bg-rose-500/30 rounded-[45%] flex flex-col items-center justify-center text-rose-300 font-bold text-xs shadow-xl animate-pulse">
                    <span>🛢️ SLICK DETECTED</span>
                    <span className="text-[10px] text-slate-200">18.40 km² • 92.4%</span>
                  </div>
                  <div className="absolute bottom-2 left-2 text-[10px] text-slate-400">
                    Coords: 18.7210°N, 72.9140°E
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-950/60 rounded border border-slate-800 text-xs space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Segmentation Model:</span>
                <span className="text-cyan-300 font-bold">U-Net (ResNet-34 Backbone)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Verification Engine:</span>
                <span className="text-emerald-400 font-bold">XGBoost Feature Classifier</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Target EEZ Sector:</span>
                <span className="text-slate-200">Arabian Sea (West Coast / Mumbai High)</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
