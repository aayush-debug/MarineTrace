import React, { useState, useRef } from 'react';
import {
  UploadCloud,
  FileImage,
  AlertCircle,
  Play,
  Layers,
  Calendar,
  Compass,
  Radar,
  Satellite,
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';

export const NewInvestigation: React.FC = () => {
  const {
    executeInvestigation,
    executeDemo,
    loading,
    loadingStep,
    error,
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
    <div className="flex-1 flex flex-col min-h-0 bg-[#0c1017] overflow-y-auto p-4 sm:p-6 select-none">
      {/* Header */}
      <div className="max-w-6xl mx-auto w-full mb-6">
        <div className="p-4 sm:p-5 rounded bg-[#111622] border border-[#1e293b] shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded bg-[#161e2e] border border-slate-800 flex items-center justify-center text-blue-400">
                <Satellite className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="text-sm sm:text-base font-semibold text-slate-100">
                    New Investigation // SAR Telemetry Ingestion
                  </h1>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800/60 font-medium">
                    Stage 1
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Sentinel-1 C-Band SAR Ingestion · OpenDrift Reverse Advection · AIS Vessel Correlation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={executeDemo}
                disabled={loading}
                className="flex-1 sm:flex-initial px-3.5 py-1.5 bg-[#161e2e] hover:bg-[#1c2638] border border-[#1e293b] text-slate-200 text-xs font-medium rounded transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-blue-400 text-blue-400" />
                <span>Load Preset Scenario</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Setup Grid */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-5">
          {/* File Drag & Drop Terminal */}
          <div className="p-5 rounded bg-[#111622] border border-[#1e293b] shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase tracking-wide">
                <Radar className="w-4 h-4 text-blue-400" />
                <span>SAR Raster Ingestion</span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">GeoTIFF / GRD / SAFE</span>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border border-dashed border-slate-700 hover:border-blue-500 bg-[#0e131d] rounded p-6 text-center cursor-pointer transition-colors group"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".tif,.tiff,.png,.jpg,.jpeg,.zip,.SAFE"
                className="hidden"
              />
              <div className="w-10 h-10 rounded bg-[#161e2e] border border-slate-800 flex items-center justify-center mx-auto text-blue-400 mb-2.5">
                <UploadCloud className="w-5 h-5" />
              </div>
              <p className="text-xs font-medium text-slate-200 group-hover:text-blue-400 transition-colors">
                Drop Sentinel-1 SAR imagery here or click to browse
              </p>
              <p className="text-[11px] text-slate-500 mt-1">
                Supports Ground Range Detected (GRD) Dual-Pol VV+VH (.tif, .png, .SAFE, .zip)
              </p>
            </div>

            {selectedFile && (
              <div className="p-3 bg-[#161e2e] border border-slate-800 rounded flex items-center justify-between text-xs font-sans">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileImage className="w-4 h-4 text-blue-400 shrink-0" />
                  <div className="truncate">
                    <span className="font-semibold text-slate-100 block truncate">{selectedFile.name}</span>
                    <span className="text-[11px] text-slate-400 font-mono">{selectedFile.size} · {selectedFile.type}</span>
                  </div>
                </div>
                <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 shrink-0">
                  Ready
                </span>
              </div>
            )}
          </div>

          {/* Parameters */}
          <div className="p-5 rounded bg-[#111622] border border-[#1e293b] shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-slate-200 uppercase tracking-wide border-b border-slate-800 pb-2">
              <Compass className="w-4 h-4 text-blue-400" />
              <span>Simulation Horizon & Timing</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                <span>Satellite Observation Timestamp (UTC)</span>
              </label>
              <input
                type="datetime-local"
                value={acquisitionTime}
                onChange={(e) => setAcquisitionTime(e.target.value)}
                className="w-full bg-[#0e131d] border border-slate-700 rounded px-3 py-2 text-xs text-slate-200 font-mono focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 flex items-center gap-1.5 font-medium">
                <Compass className="w-3.5 h-3.5 text-blue-400" />
                <span>Reverse Advection Hindcast Horizon</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[12, 24, 48, 72].map((h) => (
                  <button
                    type="button"
                    key={h}
                    onClick={() => setBackwardHours(h)}
                    className={`py-2 rounded text-center text-xs font-medium font-mono border transition-colors cursor-pointer ${
                      backwardHours === h
                        ? 'bg-blue-950 border-blue-700 text-blue-200 font-semibold'
                        : 'bg-[#0e131d] border-slate-800 text-slate-400 hover:bg-[#161e2e]'
                    }`}
                  >
                    {h} Hours
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Launch Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs uppercase tracking-wide rounded shadow-sm transition-colors flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>{loadingStep || 'Executing Investigation Pipeline...'}</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-white" />
                <span>Run Forensic Pipeline</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-800/60 rounded text-rose-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Right Column: SAR Canvas */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#111622] border border-[#1e293b] rounded p-4 space-y-3 shadow-sm">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-slate-200 text-xs">
                  SAR Preview & Mask
                </span>
              </div>
              <div className="flex gap-1 bg-[#0e131d] p-0.5 rounded border border-slate-800 text-xs">
                {(['overlay', 'original', 'mask'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setDisplayMode(m)}
                    className={`px-2 py-0.5 rounded capitalize text-[11px] font-medium transition-colors cursor-pointer ${
                      displayMode === m
                        ? 'bg-[#161e2e] text-white'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* High-Resolution SAR Canvas */}
            <div className="h-64 bg-[#0b0f17] rounded border border-slate-800 relative overflow-hidden flex items-center justify-center p-4">
              {displayMode === 'original' && (
                <div className="w-full h-full bg-slate-900 rounded flex flex-col items-center justify-center text-slate-400 text-xs font-mono">
                  <span className="font-medium text-slate-200">Sentinel-1 Raw Backscatter (VV Band)</span>
                  <span className="text-[10px] text-slate-500 mt-1">Sigma-0: -16.4 dB · NESZ: -22 dB</span>
                </div>
              )}

              {displayMode === 'mask' && (
                <div className="w-full h-full bg-slate-950 rounded flex items-center justify-center relative">
                  <div className="w-32 h-20 bg-rose-600/80 rounded-[40%] blur-[1px] opacity-90 flex items-center justify-center text-white font-mono font-medium text-[10px]">
                    Slick Mask
                  </div>
                </div>
              )}

              {displayMode === 'overlay' && (
                <div className="w-full h-full bg-slate-900 rounded relative flex items-center justify-center">
                  <div className="w-36 h-24 border border-dashed border-rose-500 bg-rose-500/20 rounded-[45%] flex flex-col items-center justify-center text-rose-300 font-mono font-semibold text-xs">
                    <span>Slick Delineation</span>
                    <span className="text-[10px] text-slate-300 mt-0.5">18.40 km² · 94.2% Conf</span>
                  </div>
                  <div className="absolute bottom-2 left-2 text-[10px] text-slate-500 font-mono">
                    18.7210°N, 72.9140°E
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-[#161e2e] rounded border border-slate-800 text-xs space-y-1.5 text-slate-300 font-sans">
              <div className="flex justify-between">
                <span className="text-slate-400">Segmentation Model:</span>
                <span className="text-slate-100 font-mono font-medium">U-Net (ResNet-34)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Verification Engine:</span>
                <span className="text-slate-100 font-mono font-medium">XGBoost Damping Contrast</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">Monitoring Sector:</span>
                <span className="text-slate-200">Arabian Sea / Sector West</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
