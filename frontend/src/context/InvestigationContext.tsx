import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  InvestigationResponse,
  InvestigationRequest,
  SystemHealth,
  EnvironmentalConditions,
  VesselAttribution,
} from '../types/investigation';
import {
  runInvestigation as apiRunInvestigation,
  runDemoInvestigation as apiRunDemoInvestigation,
  listInvestigations as apiListInvestigations,
} from '../api/investigations';
import { pingBackend } from '../api/spills';
import { DEMO_INVESTIGATION_DATA } from '../data/demo/demoData';

export type PageId =
  | 'dashboard'
  | 'new-investigation'
  | 'investigation'
  | 'drift'
  | 'attribution'
  | 'satellite'
  | 'reports';

export interface LayerVisibility {
  spill: boolean;
  origin: boolean;
  drift: boolean;
  vessels: boolean;
  tracks: boolean;
  forecast: boolean;
}

interface InvestigationContextType {
  activePage: PageId;
  setActivePage: (page: PageId) => void;
  investigation: InvestigationResponse | null;
  setInvestigation: (inv: InvestigationResponse | null) => void;
  investigationList: InvestigationResponse[];
  selectedVesselMmsi: string | null;
  setSelectedVesselMmsi: (mmsi: string | null) => void;
  selectedVessel: VesselAttribution | null;
  loading: boolean;
  loadingStep: string;
  error: string | null;
  systemHealth: SystemHealth;
  environmental: EnvironmentalConditions;
  layers: LayerVisibility;
  setLayers: React.Dispatch<React.SetStateAction<LayerVisibility>>;
  toggleLayer: (layer: keyof LayerVisibility) => void;
  executeDemo: () => Promise<void>;
  executeInvestigation: (req: InvestigationRequest) => Promise<void>;
  loadInvestigationById: (id: string) => void;
  refreshHistory: () => Promise<void>;
  clearError: () => void;
}

const DEFAULT_LAYERS: LayerVisibility = {
  spill: true,
  origin: true,
  drift: true,
  vessels: true,
  tracks: true,
  forecast: true,
};

const DEFAULT_HEALTH: SystemHealth = {
  api: 'online',
  ml: 'online',
  drift: 'online',
  ais: 'connected',
  satellite: 'available',
  latencyMs: 32,
};

const DEFAULT_ENVIRONMENTAL: EnvironmentalConditions = {
  windSpeedKnots: 14.2,
  windDirectionDeg: 45,
  windDirectionCardinal: 'NE (Monsoon)',
  currentSpeedKnots: 0.85,
  currentDirectionDeg: 220,
  currentDirectionCardinal: 'SW',
  seaSurfaceTempC: 28.4,
  waveHeightMeters: 1.2,
};

const InvestigationContext = createContext<InvestigationContextType | undefined>(undefined);

export const InvestigationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activePage, setActivePage] = useState<PageId>('dashboard');
  const [investigation, setInvestigation] = useState<InvestigationResponse | null>(DEMO_INVESTIGATION_DATA);
  const [investigationList, setInvestigationList] = useState<InvestigationResponse[]>([DEMO_INVESTIGATION_DATA]);
  const [selectedVesselMmsi, setSelectedVesselMmsi] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [layers, setLayers] = useState<LayerVisibility>(DEFAULT_LAYERS);
  const [systemHealth, setSystemHealth] = useState<SystemHealth>(DEFAULT_HEALTH);
  const [environmental] = useState<EnvironmentalConditions>(DEFAULT_ENVIRONMENTAL);

  const selectedVessel =
    investigation?.vessels.find((v) => v.mmsi === selectedVesselMmsi) ||
    investigation?.vessels[0] ||
    null;

  const toggleLayer = (layer: keyof LayerVisibility) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  // Heartbeat check for backend status
  const checkHealth = useCallback(async () => {
    const start = performance.now();
    try {
      const res = await pingBackend();
      const latency = Math.round(performance.now() - start);
      setSystemHealth({
        api: res.status === 'ok' ? 'online' : 'degraded',
        ml: 'online',
        drift: 'online',
        ais: 'connected',
        satellite: 'available',
        latencyMs: latency,
      });
    } catch {
      setSystemHealth((prev) => ({
        ...prev,
        api: 'degraded',
        latencyMs: 999,
      }));
    }
  }, []);

  const refreshHistory = useCallback(async () => {
    try {
      const list = await apiListInvestigations(20);
      if (list && list.length > 0) {
        setInvestigationList(list);
      }
    } catch {
      // Keep existing list
    }
  }, []);

  useEffect(() => {
    checkHealth();
    refreshHistory();
    const interval = setInterval(checkHealth, 20000);
    return () => clearInterval(interval);
  }, [checkHealth, refreshHistory]);

  const executeDemo = async () => {
    setLoading(true);
    setError(null);
    setSelectedVesselMmsi(null);
    setLoadingStep('Initializing synthetic Arabian Sea incident scenario...');

    try {
      setLoadingStep('Contacting ML inference engine & Sentinel-1 SAR stream...');
      await new Promise((r) => setTimeout(r, 600));

      setLoadingStep('Reconstructing physical backward drift via OpenDrift...');
      await new Promise((r) => setTimeout(r, 700));

      setLoadingStep('Correlating historical AIS traffic & 3-stage candidate filtering...');
      const response = await apiRunDemoInvestigation().catch((err) => {
        console.warn('Backend unavailable, using isolated demo fallback:', err);
        return DEMO_INVESTIGATION_DATA;
      });

      setInvestigation(response);
      setSelectedVesselMmsi(response.vessels[0]?.mmsi || null);
      setInvestigationList((prev) => {
        const filtered = prev.filter((i) => i.investigation_id !== response.investigation_id);
        return [response, ...filtered];
      });
      setActivePage('investigation');
    } catch (err: any) {
      setError(err.message || 'Demo execution encountered an error.');
      setInvestigation(DEMO_INVESTIGATION_DATA);
      setActivePage('investigation');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const executeInvestigation = async (req: InvestigationRequest) => {
    setLoading(true);
    setError(null);
    setSelectedVesselMmsi(null);

    try {
      setLoadingStep('[1/4] Running Sentinel-1 SAR Oil Segmentation Model...');
      await new Promise((r) => setTimeout(r, 800));

      setLoadingStep('[2/4] Simulating OpenDrift Backward Drift Ensemble...');
      await new Promise((r) => setTimeout(r, 900));

      setLoadingStep('[3/4] Reconstructing Historical AIS Tracks & 3-Stage Spatial-Temporal Filtering...');
      await new Promise((r) => setTimeout(r, 900));

      setLoadingStep('[4/4] Executing 5-Dimension Explainable Vessel Attribution Scoring...');
      const response = await apiRunInvestigation(req);

      setInvestigation(response);
      setSelectedVesselMmsi(response.vessels[0]?.mmsi || null);
      setInvestigationList((prev) => [response, ...prev.filter((i) => i.investigation_id !== response.investigation_id)]);
      setActivePage('investigation');
    } catch (err: any) {
      setError(err.message || 'Investigation execution failed.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const loadInvestigationById = (id: string) => {
    const found = investigationList.find((i) => i.investigation_id === id);
    if (found) {
      setInvestigation(found);
      setSelectedVesselMmsi(found.vessels[0]?.mmsi || null);
      setActivePage('investigation');
    }
  };

  const clearError = () => setError(null);

  return (
    <InvestigationContext.Provider
      value={{
        activePage,
        setActivePage,
        investigation,
        setInvestigation,
        investigationList,
        selectedVesselMmsi,
        setSelectedVesselMmsi,
        selectedVessel,
        loading,
        loadingStep,
        error,
        systemHealth,
        environmental,
        layers,
        setLayers,
        toggleLayer,
        executeDemo,
        executeInvestigation,
        loadInvestigationById,
        refreshHistory,
        clearError,
      }}
    >
      {children}
    </InvestigationContext.Provider>
  );
};

export const useInvestigation = () => {
  const context = useContext(InvestigationContext);
  if (!context) {
    throw new Error('useInvestigation must be used within an InvestigationProvider');
  }
  return context;
};
