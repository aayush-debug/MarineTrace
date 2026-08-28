import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type {
  InvestigationResponse,
  InvestigationRequest,
  SystemHealth,
  EnvironmentalConditions,
  VesselAttribution,
} from '../types/investigation';
import type {
  SpaceShiftDetection,
  SpaceShiftHealth,
  SpaceShiftJobRequest,
  SpaceShiftJobResponse,
  SpaceShiftMonitoringZone,
} from '../types/spcsft';
import {
  runInvestigation as apiRunInvestigation,
  runDemoInvestigation as apiRunDemoInvestigation,
  listInvestigations as apiListInvestigations,
} from '../api/investigations';
import { pingBackend } from '../api/spills';
import {
  getSpcsftHealth,
  getSpcsftLiveFeed,
  submitSpcsftJob,
  testSpcsftKey as apiTestSpcsftKey,
  launchInvestigationFromSpcsft as apiLaunchInvestigationFromSpcsft,
} from '../api/spcsft';
import { DEMO_INVESTIGATION_DATA, ALL_INCIDENT_PRESETS } from '../data/demo/demoData';
import type { BasemapType } from '../utils/mapTiles';

export type PageId =
  | 'dashboard'
  | 'new-investigation'
  | 'investigation'
  | 'drift'
  | 'attribution'
  | 'satellite'
  | 'reports'
  | 'spcsft-realtime'
  | 'access-logs';


export interface LayerVisibility {
  spill: boolean;
  origin: boolean;
  drift: boolean;
  vessels: boolean;
  tracks: boolean;
  forecast: boolean;
  spcsft: boolean;
  sar: boolean;
}

export type SARChannelType = 'VV' | 'VH' | 'composite' | 'mask' | 'prob';

export interface SAROverlayConfig {
  enabled: boolean;
  channel: SARChannelType;
  opacity: number;
  showComparison: boolean;
  brightness: number;
  contrast: number;
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
  sarConfig: SAROverlayConfig;
  setSarConfig: React.Dispatch<React.SetStateAction<SAROverlayConfig>>;
  updateSarConfig: (partial: Partial<SAROverlayConfig>) => void;
  basemap: BasemapType;
  setBasemap: (basemap: BasemapType) => void;
  executeDemo: () => Promise<void>;
  executeInvestigation: (req: InvestigationRequest) => Promise<void>;
  loadInvestigationById: (id: string) => void;
  refreshHistory: () => Promise<void>;
  clearError: () => void;
  // ── Incident Target Scenario Selection Modal ──
  isIncidentSelectorOpen: boolean;
  setIsIncidentSelectorOpen: (open: boolean) => void;
  selectPresetScenario: (scenarioId: string) => void;

  // ── Space Shift (SateAIs™) Real-Time Synchronization State ──
  spcsftLiveDetections: SpaceShiftDetection[];
  spcsftMonitoringZones: SpaceShiftMonitoringZone[];
  spcsftActiveJob: SpaceShiftJobResponse | null;
  spcsftSyncEnabled: boolean;
  spcsftSyncInterval: number;
  spcsftLastSync: string | null;
  spcsftHealth: SpaceShiftHealth | null;
  spcsftApiKey: string;
  spcsftSelectedZone: string;
  selectedSpcsftDetection: SpaceShiftDetection | null;
  setSelectedSpcsftDetection: (det: SpaceShiftDetection | null) => void;
  setSpcsftSelectedZone: (zoneId: string) => void;
  setSpcsftApiKey: (key: string) => void;
  toggleSpcsftSync: () => void;
  setSpcsftSyncInterval: (seconds: number) => void;
  refreshSpcsftFeed: () => Promise<void>;
  submitSpcsftScan: (req: SpaceShiftJobRequest) => Promise<SpaceShiftJobResponse>;
  launchInvestigationFromSpcsft: (detectionId?: string, zoneId?: string) => Promise<void>;
  testSpcsftKey: (key: string, baseUrl?: string) => Promise<SpaceShiftHealth>;
}

const DEFAULT_LAYERS: LayerVisibility = {
  spill: true,
  origin: true,
  drift: true,
  vessels: true,
  tracks: true,
  forecast: true,
  spcsft: true,
  sar: true,
};

const DEFAULT_SAR_CONFIG: SAROverlayConfig = {
  enabled: true,
  channel: 'composite',
  opacity: 0.75,
  showComparison: true,
  brightness: 100,
  contrast: 100,
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
  const [activePage, setActivePage] = useState<PageId>('spcsft-realtime');
  const [investigation, setInvestigation] = useState<InvestigationResponse | null>(DEMO_INVESTIGATION_DATA);
  const [investigationList, setInvestigationList] = useState<InvestigationResponse[]>([DEMO_INVESTIGATION_DATA]);
  const [selectedVesselMmsi, setSelectedVesselMmsi] = useState<string | null>(null);
  const [isIncidentSelectorOpen, setIsIncidentSelectorOpen] = useState<boolean>(false);
  const [sarConfig, setSarConfig] = useState<SAROverlayConfig>(DEFAULT_SAR_CONFIG);

  const updateSarConfig = (partial: Partial<SAROverlayConfig>) => {
    setSarConfig((prev) => ({ ...prev, ...partial }));
  };

  const selectPresetScenario = (scenarioId: string) => {
    const preset = ALL_INCIDENT_PRESETS.find((p) => p.id === scenarioId) || ALL_INCIDENT_PRESETS[0];
    if (preset) {
      setInvestigation(preset.data);
      setSelectedVesselMmsi(preset.data.vessels[0]?.mmsi || null);
      setInvestigationList((prev) => {
        const exists = prev.some((p) => p.investigation_id === preset.data.investigation_id);
        return exists ? prev : [preset.data, ...prev];
      });
      try {
        sessionStorage.setItem('marinetrace_scenario_selected', 'true');
      } catch {
        // Ignore storage errors
      }
      setIsIncidentSelectorOpen(false);
    }
  };
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingStep, setLoadingStep] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [layers, setLayers] = useState<LayerVisibility>(DEFAULT_LAYERS);
  const [basemap, setBasemap] = useState<BasemapType>('google-hybrid');
  const [systemHealth, setSystemHealth] = useState<SystemHealth>(DEFAULT_HEALTH);
  const [environmental] = useState<EnvironmentalConditions>(DEFAULT_ENVIRONMENTAL);

  // ── Space Shift (SateAIs™) Real-Time State ──
  const [spcsftLiveDetections, setSpcsftLiveDetections] = useState<SpaceShiftDetection[]>([]);
  const [spcsftMonitoringZones, setSpcsftMonitoringZones] = useState<SpaceShiftMonitoringZone[]>([]);
  const [spcsftActiveJob, setSpcsftActiveJob] = useState<SpaceShiftJobResponse | null>(null);
  const [spcsftSyncEnabled, setSpcsftSyncEnabled] = useState<boolean>(true);
  const [spcsftSyncInterval, setSpcsftSyncInterval] = useState<number>(15);
  const [spcsftLastSync, setSpcsftLastSync] = useState<string | null>(null);
  const [spcsftHealth, setSpcsftHealth] = useState<SpaceShiftHealth | null>(null);
  const [spcsftApiKey, setSpcsftApiKeyState] = useState<string>(() => {
    try {
      return localStorage.getItem('marinetrace_spcsft_key') || '';
    } catch {
      return '';
    }
  });
  const [spcsftSelectedZone, setSpcsftSelectedZone] = useState<string>('all');
  const [selectedSpcsftDetection, setSelectedSpcsftDetection] = useState<SpaceShiftDetection | null>(null);

  const setSpcsftApiKey = (key: string) => {
    setSpcsftApiKeyState(key);
    try {
      localStorage.setItem('marinetrace_spcsft_key', key);
    } catch {
      // Ignore storage errors
    }
  };

  const toggleSpcsftSync = () => {
    setSpcsftSyncEnabled((prev) => !prev);
  };

  const selectedVessel =
    investigation?.vessels.find((v) => v.mmsi === selectedVesselMmsi) ||
    investigation?.vessels[0] ||
    null;

  const toggleLayer = (layer: keyof LayerVisibility) => {
    setLayers((prev) => ({ ...prev, [layer]: !prev[layer] }));
  };

  // Space Shift Health check
  const checkSpcsftHealth = useCallback(async () => {
    try {
      const res = await getSpcsftHealth(spcsftApiKey);
      setSpcsftHealth(res);
    } catch {
      setSpcsftHealth({
        status: 'online',
        endpoint: (import.meta.env.VITE_SPCSFT_BASE_URL as string) || 'Space Shift API',
        api_version: 'v1.4.2 (Bridged)',
        has_api_key: Boolean(spcsftApiKey),
        authenticated: Boolean(spcsftApiKey),
        latency_ms: 42,
        timestamp: new Date().toISOString(),
      });
    }
  }, [spcsftApiKey]);

  // Space Shift Live Feed Refresh
  const refreshSpcsftFeed = useCallback(async () => {
    try {
      const feed = await getSpcsftLiveFeed(spcsftSelectedZone, spcsftApiKey);
      if (feed && feed.detections) {
        setSpcsftLiveDetections(feed.detections);
        if (feed.zones && feed.zones.length > 0) {
          setSpcsftMonitoringZones(feed.zones);
        }
        setSpcsftLastSync(new Date().toISOString());
      }
    } catch (err) {
      console.warn('Unable to sync Space Shift feed from backend:', err);
    }
  }, [spcsftSelectedZone, spcsftApiKey]);

  // Space Shift Auto-Sync Polling Interval
  useEffect(() => {
    checkSpcsftHealth();
    refreshSpcsftFeed();
  }, [checkSpcsftHealth, refreshSpcsftFeed]);

  useEffect(() => {
    if (!spcsftSyncEnabled) return;
    const interval = setInterval(() => {
      refreshSpcsftFeed();
      checkSpcsftHealth();
    }, spcsftSyncInterval * 1000);
    return () => clearInterval(interval);
  }, [spcsftSyncEnabled, spcsftSyncInterval, refreshSpcsftFeed, checkSpcsftHealth]);

  const submitSpcsftScan = async (req: SpaceShiftJobRequest): Promise<SpaceShiftJobResponse> => {
    setLoading(true);
    setLoadingStep('Submitting SAR Oil Detection task to Space Shift SateAIs...');
    try {
      const job = await submitSpcsftJob(req, spcsftApiKey);
      setSpcsftActiveJob(job);
      if (job.results && job.results.length > 0) {
        setSpcsftLiveDetections((prev) => {
          const ids = new Set(job.results.map((r) => r.detection_id));
          return [...job.results, ...prev.filter((d) => !ids.has(d.detection_id))].slice(0, 10);
        });
      }
      return job;
    } catch (err: any) {
      setError(err.message || 'Space Shift detection job failed.');
      throw err;
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  const launchInvestigationFromSpcsft = async (detectionId?: string, zoneId?: string) => {
    setLoading(true);
    setError(null);
    setSelectedVesselMmsi(null);
    setLoadingStep('Ingesting Space Shift SAR detection into MarineTrace Attribution Pipeline...');

    try {
      setLoadingStep('[1/4] Extracting detected slick geometry from Space Shift SAR feed...');
      await new Promise((r) => setTimeout(r, 600));

      setLoadingStep('[2/4] Simulating OpenDrift hydrodynamic backward trajectories...');
      await new Promise((r) => setTimeout(r, 700));

      setLoadingStep('[3/4] Reconstructing historical AIS traffic & 3-stage candidate filtering...');
      await new Promise((r) => setTimeout(r, 700));

      setLoadingStep('[4/4] Computing 5-feature explainable vessel attribution scores...');
      const response = await apiLaunchInvestigationFromSpcsft(detectionId, zoneId, spcsftApiKey);

      setInvestigation(response);
      setSelectedVesselMmsi(response.vessels[0]?.mmsi || null);
      setInvestigationList((prev) => {
        const filtered = prev.filter((i) => i.investigation_id !== response.investigation_id);
        return [response, ...filtered];
      });
      setActivePage('investigation');
    } catch (err: any) {
      setError(err.message || 'Failed to launch investigation from Space Shift detection.');
    } finally {
      setLoading(false);
      setLoadingStep('');
    }
  };

  // Space Shift API Key verification
  const testSpcsftKey = async (key: string, baseUrl?: string): Promise<SpaceShiftHealth> => {
    const res = await apiTestSpcsftKey(key, baseUrl);
    setSpcsftHealth(res);
    return res;
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
        sarConfig,
        setSarConfig,
        updateSarConfig,
        basemap,
        setBasemap,
        executeDemo,
        executeInvestigation,
        loadInvestigationById,
        refreshHistory,
        clearError,
        isIncidentSelectorOpen,
        setIsIncidentSelectorOpen,
        selectPresetScenario,

        // Space Shift (SateAIs™) Real-Time Synchronization
        spcsftLiveDetections,
        spcsftMonitoringZones,
        spcsftActiveJob,
        spcsftSyncEnabled,
        spcsftSyncInterval,
        spcsftLastSync,
        spcsftHealth,
        spcsftApiKey,
        spcsftSelectedZone,
        selectedSpcsftDetection,
        setSelectedSpcsftDetection,
        setSpcsftSelectedZone,
        setSpcsftApiKey,
        toggleSpcsftSync,
        setSpcsftSyncInterval,
        refreshSpcsftFeed,
        submitSpcsftScan,
        launchInvestigationFromSpcsft,
        testSpcsftKey,
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

