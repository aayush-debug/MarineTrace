/* SlickTrace — Main Application */

import { useState } from 'react';
import './index.css';
import type { InvestigationResponse } from './types/investigation';
import { runDemoInvestigation } from './services/api';
import InvestigationMap from './components/InvestigationMap';
import InvestigationPanel from './components/InvestigationPanel';
import UploadPanel from './components/UploadPanel';
import MapLegend from './components/MapLegend';

function App() {
  const [investigation, setInvestigation] = useState<InvestigationResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedVessel, setSelectedVessel] = useState<string | null>(null);

  const handleRunDemo = async () => {
    setLoading(true);
    setError(null);
    setSelectedVessel(null);
    try {
      const result = await runDemoInvestigation();
      setInvestigation(result);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to connect to backend. Is it running on :8000?'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleRunInvestigation = async (time: string) => {
    // Placeholder for real investigation with uploaded image
    handleRunDemo();
  };

  const handleReset = () => {
    setInvestigation(null);
    setError(null);
    setSelectedVessel(null);
  };

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header__logo">
          <span className="header__logo-icon">🛢️</span>
          <span className="header__logo-text">SlickTrace</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {investigation && (
            <button
              className="btn btn--secondary"
              style={{ padding: '6px 14px', fontSize: 12 }}
              onClick={handleReset}
            >
              ← New Investigation
            </button>
          )}
          <div className="header__status">
            <span className="header__status-dot" />
            <span>System Online</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="main-content">
        {/* Map (always visible) */}
        <div style={{ flex: 1, position: 'relative' }}>
          <InvestigationMap
            data={investigation}
            selectedVessel={selectedVessel}
            onSelectVessel={setSelectedVessel}
          />
          {investigation && <MapLegend />}
        </div>

        {/* Side Panel */}
        {investigation ? (
          <InvestigationPanel
            data={investigation}
            selectedVessel={selectedVessel}
            onSelectVessel={setSelectedVessel}
          />
        ) : (
          <div className="side-panel">
            <UploadPanel
              onRunDemo={handleRunDemo}
              onRunInvestigation={handleRunInvestigation}
              loading={loading}
              error={error}
            />
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
