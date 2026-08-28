import React, { useEffect } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { InvestigationProvider, useInvestigation } from './context/InvestigationContext';

import { TopNav } from './components/layout/TopNav';
import { Sidebar } from './components/layout/Sidebar';
import { Dashboard } from './pages/Dashboard';
import { NewInvestigation } from './pages/NewInvestigation';
import { Investigation } from './pages/Investigation';
import { DriftAnalysis } from './pages/DriftAnalysis';
import { VesselAttribution } from './pages/VesselAttribution';
import { SatelliteImagery } from './pages/SatelliteImagery';
import { SpaceShiftRealTime } from './pages/SpaceShiftRealTime';
import { Reports } from './pages/Reports';
import { AccessLogs } from './pages/AccessLogs';
import { LoginPage } from './pages/LoginPage';
import { AlertCircle, X, Compass } from 'lucide-react';
import { PipelineProgressModal } from './components/ui/PipelineProgressModal';

const MainLayout: React.FC = () => {
  const { activePage, loading, loadingStep, error, clearError } = useInvestigation();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        clearError();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, clearError]);

  const renderActivePage = () => {
    switch (activePage) {
      case 'dashboard':
        return <Dashboard />;
      case 'spcsft-realtime':
        return <SpaceShiftRealTime />;
      case 'new-investigation':
        return <NewInvestigation />;
      case 'investigation':
        return <Investigation />;
      case 'drift':
        return <DriftAnalysis />;
      case 'attribution':
        return <VesselAttribution />;
      case 'satellite':
        return <SatelliteImagery />;
      case 'reports':
        return <Reports />;
      case 'access-logs':
        return <AccessLogs />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[var(--bg-canvas)] text-[var(--text-primary)] select-none relative">
      {/* Top Command Center Header */}
      <TopNav />

      {/* Main Horizontal Split: Sidebar + Page Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 relative overflow-hidden">
          {renderActivePage()}
        </main>
      </div>

      {/* Global High-Priority Multi-Stage Pipeline Progress Modal */}
      <PipelineProgressModal isOpen={loading} currentStepMessage={loadingStep} />

      {/* Global Error Toast */}
      {error && (
        <div className="fixed bottom-5 right-5 z-[9999] bg-rose-950/95 border border-rose-500/60 rounded-xl p-4 shadow-2xl max-w-md font-mono text-xs text-rose-200 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4 backdrop-blur-md">
          <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="block text-rose-300 font-bold mb-0.5">
              SYSTEM NOTIFICATION
            </strong>
            <p className="text-[11px] leading-relaxed">{error}</p>
          </div>
          <button
            onClick={clearError}
            className="text-rose-400 hover:text-rose-200 transition-colors p-0.5 rounded hover:bg-rose-900/40"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};

const RootApp: React.FC = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="h-screen w-screen bg-[#050811] flex flex-col items-center justify-center space-y-4 text-cyan-400 font-mono text-xs">
        <div className="w-12 h-12 rounded-xl bg-slate-900 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/10">
          <Compass className="w-6 h-6 animate-spin text-cyan-400" />
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
          <span>CONNECTING TO DOCKER BACKEND...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return (
    <InvestigationProvider>
      <MainLayout />
    </InvestigationProvider>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <RootApp />
      </AuthProvider>
    </ThemeProvider>
  );
}


