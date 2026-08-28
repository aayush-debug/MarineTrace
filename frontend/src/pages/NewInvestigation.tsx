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
  Radio,
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';

export const NewInvestigation: React.FC = () => {
  const {
    executeInvestigation,
    executeDemo,
    loading,
    loadingStep,
    error,
    spcsftLiveDetections,
    setActivePage,
  } = useInvestigation();

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
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedFile({
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          type: file.type || 'Satellite SAR GeoTIFF/Raster',
          previewUrl: event.target?.result as string,
        });
      };
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        setSelectedFile({
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          type: file.type || 'Satellite SAR GeoTIFF/Raster',
        });
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        setSelectedFile({
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          type: file.type || 'Satellite SAR GeoTIFF/Raster',
          previewUrl: event.target?.result as string,
        });
      };
      if (file.type.startsWith('image/')) {
        reader.readAsDataURL(file);
      } else {
        setSelectedFile({
          name: file.name,
          size: `${(file.size / (1024 * 1024)).toFixed(2)} MB`,
          type: file.type || 'Satellite SAR GeoTIFF/Raster',
        });
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await executeInvestigation({
      observation_time: new Date(acquisitionTime).toISOString(),
      backward_hours: backwardHours,
      forward_hours: 24,
      image: selectedFile?.previewUrl ? selectedFile.previewUrl.split(',')[1] : undefined,
    });
  };

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#090d16] overflow-y-auto p-5 sm:p-6 space-y-6">
      {/* Header */}
      <div className="border-b border-[rgba(255,255,255,0.08)] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-semibold text-slate-100 flex items-center gap-2">
            <Cpu className="w-5 h-5 text-sky-400" />
            <span>Initiate Oil Spill Investigation</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Ingest Sentinel-1 SAR imagery to detect slicks, compute Lagrangian drift back trajectories, and prioritize AIS vessel candidates.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={() => setActivePage('spcsft-realtime')}
            className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 rounded-lg text-xs text-rose-300 font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Radio className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            <span>Import Space Shift Live Slick ({spcsftLiveDetections.length})</span>
          </button>

          <button
            type="button"
            onClick={executeDemo}
            disabled={loading}
            className="px-3.5 py-1.5 bg-sky-500/10 hover:bg-sky-500/20 border border-sky-500/30 rounded-lg text-xs text-sky-300 font-semibold flex items-center gap-2 transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400" />
            <span>Launch Arabian Sea Demo</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: SAR Upload & Acquisition Parameters */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Drag & Drop Upload Container */}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleFileDrop}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-slate-800 hover:border-sky-500/60 bg-[#0c121e] hover:bg-slate-900/60 p-6 rounded-xl text-center cursor-pointer transition-all space-y-3 shadow-sm"
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".tif,.tiff,.geotiff,.png,.jpg,.jpeg"
              className="hidden"
            />
            <div className="w-12 h-12 rounded-full bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center mx-auto">
              <UploadCloud className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-semibold text-slate-200">
                Drop Sentinel-1 SAR Imagery (GeoTIFF / PNG / JPG)
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Supports Sentinel-1 GRD IW, RADARSAT Constellation, ALOS-2 PALSAR
              </p>
            </div>
          </div>

          {/* Selected File Inspection Card */}
          {selectedFile && (
            <div className="p-3 bg-slate-900/80 border border-slate-800 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2.5">
                <FileImage className="w-5 h-5 text-sky-400 shrink-0" />
                <div>
                  <div className="font-semibold text-slate-200 truncate max-w-[280px]">
                    {selectedFile.name}
                  </div>
                  <div className="text-[11px] text-slate-400">
                    {selectedFile.size} · {selectedFile.type}
                  </div>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-medium">
                Ready
              </span>
            </div>
          )}

          {/* Parameters Form */}
          <div className="p-4 bg-[#0c121e] border border-[rgba(255,255,255,0.08)] rounded-xl space-y-3.5 shadow-sm">
            <div className="text-xs font-semibold text-slate-200 border-b border-slate-800 pb-2">
              Surveillance Parameters
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-sky-400" />
                Satellite Acquisition Timestamp (UTC)
              </label>
              <input
                type="datetime-local"
                value={acquisitionTime}
                onChange={(e) => setAcquisitionTime(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 font-mono focus:outline-none focus:border-sky-500"
                required
              />
            </div>

            <div>
              <label className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1.5 font-medium">
                <Compass className="w-3.5 h-3.5 text-blue-400" />
                Backward Drift Simulation Horizon
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[12, 24, 48, 72].map((h) => (
                  <button
                    type="button"
                    key={h}
                    onClick={() => setBackwardHours(h)}
                    className={`py-1.5 rounded-lg text-center text-xs font-medium border transition-colors ${
                      backwardHours === h
                        ? 'bg-sky-500/20 border-sky-500/40 text-sky-300 font-semibold'
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
            className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-lg shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>{loadingStep || 'Processing Investigation Pipeline...'}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>Execute Multi-Stage Investigation</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-xl text-rose-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Right Column: Pre-Execution Preview & SAR Visualizer */}
        <div className="space-y-4">
          <div className="bg-[#0c121e] border border-[rgba(255,255,255,0.08)] rounded-xl p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                <span className="font-semibold text-slate-200 text-xs">
                  SAR Segmentation & Slick Extraction Preview
                </span>
              </div>
              <div className="flex gap-1 bg-slate-950 p-0.5 rounded-lg border border-slate-800 text-xs">
                {(['overlay', 'original', 'mask'] as const).map((mode) => (
                  <button
                    key={mode}
                    onClick={() => setDisplayMode(mode)}
                    className={`px-2.5 py-0.5 rounded-md capitalize text-[11px] font-medium transition-colors ${
                      displayMode === mode
                        ? 'bg-sky-500/20 text-sky-300 font-semibold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {mode}
                  </button>
                ))}
              </div>
            </div>

            {/* Synthetic High-Resolution SAR Display Canvas */}
            <div className="h-64 bg-[#050810] rounded-xl border border-slate-800 relative overflow-hidden flex items-center justify-center p-4">
              {displayMode === 'original' && (
                <div className="w-full h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-lg flex flex-col items-center justify-center text-slate-400 text-xs">
                  <span className="font-medium text-slate-300">Sentinel-1 Raw Backscatter (VV Band)</span>
                  <span className="text-[10px] text-slate-400 mt-1 font-mono">Noise Equivalent Sigma Zero: -22 dB</span>
                </div>
              )}

              {displayMode === 'mask' && (
                <div className="w-full h-full bg-slate-950 rounded-lg flex items-center justify-center relative">
                  <div className="w-32 h-20 bg-rose-500/70 rounded-[40%] blur-[2px] opacity-90 shadow-2xl flex items-center justify-center text-white font-bold text-[10px]">
                    SLICK MASK
                  </div>
                </div>
              )}

              {displayMode === 'overlay' && (
                <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded-lg relative flex items-center justify-center">
                  <div className="w-36 h-24 border-2 border-dashed border-rose-500 bg-rose-500/25 rounded-[45%] flex flex-col items-center justify-center text-rose-300 font-semibold text-xs shadow-xl">
                    <span>Slick Feature Confirmed</span>
                    <span className="text-[10px] text-slate-300 font-mono mt-0.5">18.40 km² · 92.4%</span>
                  </div>
                  <div className="absolute bottom-2 left-2 text-[10px] text-slate-400 font-mono">
                    18.7210°N, 72.9140°E
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800 text-xs space-y-1 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">Segmentation Model:</span>
                <span className="text-sky-300 font-semibold">U-Net (ResNet-34 Backbone)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Verification Engine:</span>
                <span className="text-emerald-400 font-semibold">XGBoost Feature Classifier</span>
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
