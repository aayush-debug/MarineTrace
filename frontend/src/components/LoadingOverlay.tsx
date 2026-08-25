/* Loading overlay — shown during investigation pipeline */

interface LoadingOverlayProps {
  step: string;
}

const PIPELINE_STEPS = [
  { key: 'detecting', label: 'Detecting oil spill...', icon: '🛰️' },
  { key: 'drifting', label: 'Running drift simulation...', icon: '🌊' },
  { key: 'tracking', label: 'Reconstructing AIS traffic...', icon: '🚢' },
  { key: 'attributing', label: 'Scoring attribution...', icon: '🎯' },
  { key: 'complete', label: 'Investigation complete', icon: '✅' },
];

export default function LoadingOverlay({ step }: LoadingOverlayProps) {
  return (
    <div className="loading">
      <div className="loading__spinner" />
      <div className="loading__text">Running Investigation Pipeline</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
        {PIPELINE_STEPS.map((s) => (
          <div
            key={s.key}
            className="loading__step"
            style={{
              opacity: step === s.key ? 1 : 0.3,
              fontWeight: step === s.key ? 600 : 400,
            }}
          >
            {s.icon} {s.label}
          </div>
        ))}
      </div>
    </div>
  );
}
