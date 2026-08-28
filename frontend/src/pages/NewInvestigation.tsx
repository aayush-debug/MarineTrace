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
    <div className="flex-1 flex flex-col min-h-0 bg-[#040814] overflow-y-auto p-4 sm:p-6 select-none">
      {/* NASA Mission Target Initialization Header */}
      <div className="max-w-6xl mx-auto w-full mb-6">
        <div className="p-4 sm:p-5 rounded-lg bg-[#070d1d] border border-[rgba(0,240,255,0.22)] shadow-xl relative overflow-hidden">
          {/* Tactical corner accents */}
          <div className="absolute top-1 right-1 w-2 h-2 border-t border-r border-cyan-400" />
          <div className="absolute bottom-1 left-1 w-2 h-2 border-b border-l border-cyan-400" />

          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-cyan-950/80 border border-cyan-400/40 flex items-center justify-center text-cyan-400 shadow-[0_0_12px_rgba(0,240,255,0.25)]">
                <Satellite className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-orbitron text-sm sm:text-base font-bold text-slate-100 uppercase tracking-wider">
                    Orbital Mission Initialization // Target Ingestion
                  </h1>
                  <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-500/40">
                    STAGE-01
                  </span>
                </div>
                <p className="text-xs font-mono text-cyan-400/80 mt-0.5">
                  Sentinel-1 C-Band SAR Ingestion · OpenDrift Reverse Hydrodynamics · Historical AIS Correlation
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={executeDemo}
                disabled={loading}
                className="flex-1 sm:flex-initial px-4 py-2 bg-[#091124] hover:bg-cyan-950/60 border border-cyan-500/30 text-cyan-300 text-xs font-mono font-bold rounded-md transition-all shadow-sm flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                <Play className="w-3.5 h-3.5 fill-cyan-400 text-cyan-400" />
                <span>LOAD PRESET DEMO SCENARIO</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Mission Setup Grid */}
      <div className="max-w-6xl mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: SAR Telemetry Ingestion Form */}
        <form onSubmit={handleSubmit} className="lg:col-span-7 space-y-5">
          {/* File Drag & Drop Terminal */}
          <div className="p-5 rounded-lg bg-[#070d1d] border border-cyan-500/20 shadow-md space-y-3 relative">
            <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2">
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-300 uppercase tracking-wider">
                <Radar className="w-4 h-4 text-cyan-400" />
                <span>SAR RASTER GRANULE INGESTION</span>
              </div>
              <span className="text-[9px] font-mono text-slate-400">GEO-TIFF / GRD / SAFE</span>
            </div>

            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleFileDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-cyan-500/30 hover:border-cyan-400/60 bg-[#040814]/80 rounded-lg p-6 text-center cursor-pointer transition-all hover:bg-cyan-950/20 group relative overflow-hidden"
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileSelect}
                accept=".tif,.tiff,.png,.jpg,.jpeg,.zip,.SAFE"
                className="hidden"
              />
              <div className="w-12 h-12 rounded-md bg-cyan-950/80 border border-cyan-500/40 flex items-center justify-center mx-auto text-cyan-400 group-hover:scale-105 transition-transform mb-3 shadow-[0_0_10px_rgba(0,240,255,0.2)]">
                <UploadCloud className="w-6 h-6" />
              </div>
              <p className="text-xs font-mono font-bold text-slate-200 group-hover:text-cyan-300 transition-colors">
                DROP SATELLITE SAR GRANULE HERE OR CLICK TO BROWSE
              </p>
              <p className="text-[10px] font-mono text-slate-500 mt-1">
                Supports Sentinel-1 Ground Range Detected (GRD) Dual-Pol VV+VH (.tif, .png, .SAFE)
              </p>
            </div>

            {selectedFile && (
              <div className="p-3 bg-[#081024] border border-cyan-500/25 rounded-md flex items-center justify-between text-xs font-mono">
                <div className="flex items-center gap-2.5 min-w-0">
                  <FileImage className="w-4 h-4 text-cyan-400 shrink-0" />
                  <div className="truncate">
                    <span className="font-bold text-slate-100 block truncate">{selectedFile.name}</span>
                    <span className="text-[10px] text-cyan-400/80">{selectedFile.size} · {selectedFile.type}</span>
                  </div>
                </div>
                <span className="text-[9px] font-bold px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/40 shrink-0">
                  READY FOR INGEST
                </span>
              </div>
            )}
          </div>

          {/* Temporal & Simulation Configuration */}
          <div className="p-5 rounded-lg bg-[#070d1d] border border-cyan-500/20 shadow-md space-y-4 font-mono">
            <div className="flex items-center gap-2 text-xs font-bold text-cyan-300 uppercase tracking-wider border-b border-cyan-900/40 pb-2">
              <Compass className="w-4 h-4 text-cyan-400" />
              <span>MISSION PARAMETERS & SIMULATION HORIZON</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 flex items-center gap-1.5 font-bold">
                <Calendar className="w-3.5 h-3.5 text-cyan-400" />
                <span>SATELLITE ACQUISITION TIMESTAMP (UTC)</span>
              </label>
              <input
                type="datetime-local"
                value={acquisitionTime}
                onChange={(e) => setAcquisitionTime(e.target.value)}
                className="w-full bg-[#040814] border border-cyan-500/30 rounded-md px-3 py-2 text-xs text-cyan-200 font-mono focus:outline-none focus:border-cyan-400"
                required
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs text-slate-300 flex items-center gap-1.5 font-bold">
                <Compass className="w-3.5 h-3.5 text-cyan-400" />
                <span>REVERSE DRIFT SIMULATION HORIZON</span>
              </label>
              <div className="grid grid-cols-4 gap-2">
                {[12, 24, 48, 72].map((h) => (
                  <button
                    type="button"
                    key={h}
                    onClick={() => setBackwardHours(h)}
                    className={`py-2 rounded-md text-center text-xs font-bold font-mono border transition-all cursor-pointer ${
                      backwardHours === h
                        ? 'bg-cyan-950 border-cyan-400 text-cyan-200 shadow-[0_0_8px_rgba(0,240,255,0.25)]'
                        : 'bg-[#040814] border-cyan-900/40 text-slate-400 hover:bg-cyan-950/30'
                    }`}
                  >
                    [{h} HOURS]
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Launch Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-sky-600 to-cyan-500 hover:from-sky-500 hover:to-cyan-400 text-white font-mono font-bold text-xs uppercase tracking-wider rounded-md shadow-[0_0_15px_rgba(0,240,255,0.35)] transition-all flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                <span>{loadingStep || 'PROCESSING INVESTIGATION PIPELINE...'}</span>
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-white" />
                <span>LAUNCH MULTI-STAGE FORENSIC PIPELINE</span>
              </>
            )}
          </button>

          {error && (
            <div className="p-3 bg-rose-950/80 border border-rose-500/40 rounded-md text-rose-200 text-xs font-mono flex items-center gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </form>

        {/* Right Column: Pre-Execution SAR Radar Canvas & Telemetry */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#070d1d] border border-cyan-500/20 rounded-lg p-4 space-y-3 shadow-md">
            <div className="flex items-center justify-between border-b border-cyan-900/40 pb-2">
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4 text-cyan-400" />
                <span className="font-mono font-bold text-cyan-200 text-xs uppercase">
                  SAR SEGMENTATION & SLICK RETICLE
                </span>
              </div>
              <div className="flex gap-1 bg-[#040814] p-0.5 rounded border border-cyan-900/40 text-xs font-mono">
                {(['overlay', 'original', 'mask'] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setDisplayMode(m)}
                    className={`px-2 py-0.5 rounded capitalize text-[10px] font-bold transition-colors cursor-pointer ${
                      displayMode === m
                        ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>

            {/* Synthetic High-Resolution SAR Display Canvas */}
            <div className="h-64 bg-[#030610] rounded-md border border-cyan-500/25 relative overflow-hidden flex items-center justify-center p-4">
              {displayMode === 'original' && (
                <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded flex flex-col items-center justify-center text-slate-400 text-xs font-mono">
                  <span className="font-bold text-slate-200">Sentinel-1 Raw Backscatter (VV Band)</span>
                  <span className="text-[10px] text-cyan-400/80 mt-1">Sigma Zero: -16.4 dB · NESZ: -22 dB</span>
                </div>
              )}

              {displayMode === 'mask' && (
                <div className="w-full h-full bg-slate-950 rounded flex items-center justify-center relative">
                  <div className="w-32 h-20 bg-rose-500/80 rounded-[40%] blur-[2px] opacity-90 shadow-[0_0_20px_#ff0055] flex items-center justify-center text-white font-mono font-bold text-[10px]">
                    SLICK TARGET MASK
                  </div>
                </div>
              )}

              {displayMode === 'overlay' && (
                <div className="w-full h-full bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 rounded relative flex items-center justify-center">
                  <div className="w-36 h-24 border-2 border-dashed border-rose-500 bg-rose-500/25 rounded-[45%] flex flex-col items-center justify-center text-rose-300 font-mono font-bold text-xs shadow-[0_0_15px_rgba(255,0,85,0.35)]">
                    <span>SLICK VERIFIED</span>
                    <span className="text-[10px] text-slate-200 mt-0.5">18.40 KM² · 94.2%</span>
                  </div>
                  <div className="absolute bottom-2 left-2 text-[9px] text-cyan-400/80 font-mono">
                    18.7210°N, 72.9140°E
                  </div>
                </div>
              )}
            </div>

            <div className="p-3 bg-[#081024] rounded-md border border-cyan-500/20 text-xs font-mono space-y-1.5 text-slate-300">
              <div className="flex justify-between">
                <span className="text-slate-400">SEGMENTATION MODEL:</span>
                <span className="text-cyan-300 font-bold">U-Net (ResNet-34)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">VERIFICATION ENGINE:</span>
                <span className="text-emerald-300 font-bold">XGBoost Radar Cross-Section</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-400">EEZ MONITORING SECTOR:</span>
                <span className="text-slate-200">Arabian Sea / Sector West</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
