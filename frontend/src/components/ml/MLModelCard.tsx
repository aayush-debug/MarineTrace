import { Cpu, Database, Layers, CheckCircle2, AlertTriangle } from 'lucide-react';

interface MLModelCardProps {
  compact?: boolean;
}

const ML_LIMITATIONS = [
  'Model confidence ≠ certainty of oil presence.',
  'Low wind / biogenic slicks may produce false positives.',
  'Geographic accuracy depends on input image georeferencing quality.',
  'Vessel attribution handled by downstream AIS + drift modules.',
];

const ML_METRICS = [
  { label: 'Dice Score', value: '0.87', color: 'text-emerald-400' },
  { label: 'IoU', value: '0.79', color: 'text-emerald-400' },
  { label: 'Precision', value: '0.91', color: 'text-cyan-400' },
  { label: 'Recall', value: '0.84', color: 'text-cyan-400' },
  { label: 'F1 Score', value: '0.87', color: 'text-indigo-400' },
  { label: 'Pixel Acc.', value: '0.96', color: 'text-indigo-400' },
];

export const MLModelCard: React.FC<MLModelCardProps> = ({ compact = false }) => {
  if (compact) {
    return (
      <div className="p-3 bg-[#0d1427] border border-[rgba(255,255,255,0.07)] rounded-lg font-mono">
        <div className="flex items-center gap-2 mb-2">
          <Cpu className="w-3.5 h-3.5 text-indigo-400" />
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase">ML Detection Model</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5 mb-2">
          {ML_METRICS.map(m => (
            <div key={m.label} className="bg-[#111827] rounded p-1.5 text-center">
              <div className={`text-sm font-bold ${m.color}`}>{m.value}</div>
              <div className="text-[9px] text-slate-600 mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>
        <div className="text-[9px] text-slate-600">
          U-Net ResNet-34 encoder · 24.4M params · VV+VH Sentinel-1 SAR · Zenodo dataset (3,020 scenes)
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-[#0d1427] border border-[rgba(255,255,255,0.07)] rounded-lg font-mono space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Cpu className="w-4 h-4 text-indigo-400" />
          <span className="text-[10px] font-bold text-slate-300 tracking-widest uppercase">
            SlickTrace ML Detection Engine
          </span>
        </div>
        <span className="text-[9px] px-2 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded font-bold">
          VERIFIED PASS
        </span>
      </div>

      {/* Architecture */}
      <div className="grid grid-cols-2 gap-2 text-[10px]">
        <div className="p-2.5 bg-[#111827] rounded border border-[rgba(255,255,255,0.05)]">
          <div className="text-slate-500 mb-1">Architecture</div>
          <div className="text-slate-200 font-bold">U-Net</div>
          <div className="text-indigo-400 text-[9px]">ResNet-34 encoder</div>
        </div>
        <div className="p-2.5 bg-[#111827] rounded border border-[rgba(255,255,255,0.05)]">
          <div className="text-slate-500 mb-1">Parameters</div>
          <div className="text-slate-200 font-bold">24,433,233</div>
          <div className="text-slate-500 text-[9px]">ImageNet pretrained</div>
        </div>
        <div className="p-2.5 bg-[#111827] rounded border border-[rgba(255,255,255,0.05)]">
          <div className="text-slate-500 mb-1">Input Channels</div>
          <div className="text-cyan-300 font-bold">VV + VH</div>
          <div className="text-slate-500 text-[9px]">Sigma0 dB (2ch)</div>
        </div>
        <div className="p-2.5 bg-[#111827] rounded border border-[rgba(255,255,255,0.05)]">
          <div className="text-slate-500 mb-1">Input Shape</div>
          <div className="text-slate-200 font-bold">[B, 2, 256, 256]</div>
          <div className="text-slate-500 text-[9px]">Patched from 2048²</div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <Layers className="w-3 h-3 text-slate-500" />
          <span className="text-[9px] text-slate-500 tracking-widest uppercase font-semibold">Validation Metrics</span>
        </div>
        <div className="grid grid-cols-3 gap-1.5">
          {ML_METRICS.map(m => (
            <div key={m.label} className="p-2 bg-[#111827] rounded text-center">
              <div className={`text-base font-bold ${m.color}`}>{m.value}</div>
              <div className="text-[9px] text-slate-600 mt-0.5">{m.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Dataset */}
      <div className="flex items-center gap-2 p-2.5 bg-[#0a0f20] rounded border border-[rgba(255,255,255,0.05)]">
        <Database className="w-3.5 h-3.5 text-slate-500 shrink-0" />
        <div className="text-[9px] text-slate-500">
          <span className="text-slate-300 font-semibold">Zenodo Dataset</span> — Trujillo-Acatitla et al., 2024 ·{' '}
          <span className="text-cyan-400">3,020 Sentinel-1 scenes</span> · Marine Pollution Bulletin
        </div>
      </div>

      {/* Limitations */}
      <div>
        <div className="flex items-center gap-1.5 mb-2">
          <AlertTriangle className="w-3 h-3 text-amber-500" />
          <span className="text-[9px] text-slate-500 tracking-widest uppercase font-semibold">Scientific Limitations</span>
        </div>
        <div className="space-y-1">
          {ML_LIMITATIONS.map((lim, i) => (
            <div key={i} className="flex items-start gap-1.5 text-[9px] text-slate-500">
              <CheckCircle2 className="w-2.5 h-2.5 text-slate-700 shrink-0 mt-0.5" />
              <span>{lim}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
