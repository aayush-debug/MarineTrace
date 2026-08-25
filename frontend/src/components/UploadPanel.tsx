/* Upload panel — initial state before investigation */

interface UploadPanelProps {
  onRunDemo: () => void;
  onRunInvestigation: (time: string) => void;
  loading: boolean;
  error: string | null;
}

export default function UploadPanel({ onRunDemo, loading, error }: UploadPanelProps) {
  return (
    <div className="upload-panel">
      <div className="upload-panel__icon">🛢️</div>
      <div className="upload-panel__title">SlickTrace</div>
      <div className="upload-panel__subtitle">
        Intelligent Maritime Oil-Spill Investigation System.
        Upload a SAR image or run the demo scenario.
      </div>

      <div className="upload-panel__actions">
        <button
          className="btn btn--primary"
          onClick={onRunDemo}
          disabled={loading}
        >
          {loading ? (
            <>
              <span className="loading__spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
              Running Investigation...
            </>
          ) : (
            <>🚀 Run Demo Investigation</>
          )}
        </button>

        <button
          className="btn btn--secondary"
          disabled={true}
          title="Upload will be available when ML model is integrated"
        >
          📡 Upload SAR Image (Coming Soon)
        </button>
      </div>

      {error && (
        <div style={{
          marginTop: 20,
          padding: '10px 16px',
          background: 'rgba(239, 68, 68, 0.1)',
          border: '1px solid rgba(239, 68, 68, 0.3)',
          borderRadius: 8,
          color: '#ef4444',
          fontSize: 13,
          maxWidth: 320,
        }}>
          ❌ {error}
        </div>
      )}

      <div style={{ marginTop: 40, fontSize: 11, color: 'var(--text-muted)', lineHeight: 1.6 }}>
        Demo scenario: Arabian Sea, Mumbai–Gujarat coast<br />
        Synthetic data — no real vessels implicated
      </div>
    </div>
  );
}
