import React from 'react';
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
import { AlertCircle, X, Loader2, Compass } from 'lucide-react';

const MainLayout: React.FC = () => {
  const { activePage, loading, loadingStep, error, clearError } = useInvestigation();

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
    <div className="h-screen w-screen flex flex-col overflow-hidden bg-[#060a12] text-slate-100 select-none">
      {/* Top Command Center Header */}
      <TopNav />

      {/* Main Horizontal Split: Sidebar + Page Viewport */}
      <div className="flex-1 flex overflow-hidden relative">
        <Sidebar />

        <main className="flex-1 flex flex-col min-h-0 min-w-0 relative overflow-hidden">
          {renderActivePage()}

          {/* Global Loading Overlay */}
          {loading && (
            <div className="absolute inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center font-mono space-y-4">
              <div className="relative">
                <div className="w-16 h-16 rounded-full border-4 border-slate-800 border-t-cyan-400 animate-spin" />
                <Loader2 className="w-8 h-8 text-cyan-400 absolute inset-0 m-auto animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-slate-100 tracking-wider">
                  MARINETRACE MULTI-STAGE PIPELINE RUNNING
                </h3>
                <p className="text-xs text-cyan-400 font-semibold animate-pulse">
                  {loadingStep || 'Executing analysis pipeline...'}
                </p>
                <p className="text-[10px] text-slate-500 max-w-sm">
                  Correlating Sentinel-1 SAR detections with OpenDrift hydrodynamic backtracking and historical AIS positions.
                </p>
              </div>
            </div>
          )}

          {/* Global Error Toast */}
          {error && (
            <div className="absolute bottom-4 right-4 z-50 bg-rose-950/90 border border-rose-500/50 rounded-lg p-3.5 shadow-2xl max-w-md font-mono text-xs text-rose-200 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-4">
              <AlertCircle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <strong className="block text-rose-300 font-bold mb-0.5">
                  SYSTEM NOTIFICATION
                </strong>
                <p className="text-[11px] leading-relaxed">{error}</p>
              </div>
              <button
                onClick={clearError}
                className="text-rose-400 hover:text-rose-200 transition-colors p-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </main>
      </div>
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


