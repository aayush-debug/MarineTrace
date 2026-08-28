import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  CircleMarker,
  Popup,
  useMap,
  Tooltip,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  AlertOctagon,
  CheckCircle2,
  Compass,
  Globe,
  Key,
  Loader2,
  Play,
  Radio,
  RefreshCw,
  Satellite,
  Zap,
  X,
  ExternalLink,
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import { BASEMAP_CONFIGS, type BasemapType } from '../utils/mapTiles';
import type { SpaceShiftJobRequest } from '../types/spcsft';
import { getPolygonPositions } from '../components/map/MaritimeMap';

// Custom Auto Bounds Fitter for Space Shift map
const MapBoundsFitter: React.FC<{
  coords: [number, number][];
}> = ({ coords }) => {
  const map = useMap();

  useEffect(() => {
    if (!coords || coords.length === 0) return;
    try {
      const lats = coords.map((c) => c[0]);
      const lons = coords.map((c) => c[1]);
      const minLat = Math.min(...lats);
      const maxLat = Math.max(...lats);
      const minLon = Math.min(...lons);
      const maxLon = Math.max(...lons);

      map.fitBounds(
        [
          [minLat - 0.12, minLon - 0.12],
          [maxLat + 0.12, maxLon + 0.12],
        ],
        { padding: [40, 40], maxZoom: 12, animate: true }
      );
    } catch {
      // Map may not be ready
    }
  }, [coords, map]);

  return null;
};

export const SpaceShiftRealTime: React.FC = () => {
  const {
    spcsftLiveDetections,
    spcsftMonitoringZones,
    spcsftSyncEnabled,
    spcsftSyncInterval,
    spcsftLastSync,
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
    basemap,
    setBasemap,
    loading,
  } = useInvestigation();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showScanModal, setShowScanModal] = useState(false);
  const [keyInput, setKeyInput] = useState(spcsftApiKey);
  const [baseUrlInput, setBaseUrlInput] = useState(
    (import.meta.env.VITE_SPCSFT_BASE_URL as string) || ''
  );
  const [testingKey, setTestingKey] = useState(false);
  const [testSuccess, setTestSuccess] = useState<string | null>(null);

  // Scan modal inputs
  const [scanZoneId, setScanZoneId] = useState(spcsftSelectedZone === 'all' ? 'arabian-sea-mumbai' : spcsftSelectedZone);
  const [scanSatellite, setScanSatellite] = useState('sentinel-1');
  const [scanThreshold, setScanThreshold] = useState(0.5);
  const [submittingJob, setSubmittingJob] = useState(false);

  const activeBasemap = BASEMAP_CONFIGS[basemap] || BASEMAP_CONFIGS['google-hybrid'];

  // Handle Manual Refresh
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshSpcsftFeed();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Handle API Key Test & Save
  const handleSaveKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setTestingKey(true);
    setTestSuccess(null);
    try {
      const res = await testSpcsftKey(keyInput, baseUrlInput);
      setSpcsftApiKey(keyInput);
      setTestSuccess(`Connected to ${res.endpoint} (${res.latency_ms}ms latency, quota: ${res.quota_remaining ?? 500})`);
      setTimeout(() => setShowSettingsModal(false), 1500);
    } catch (err: any) {
      setTestSuccess(`Connection test warning: ${err.message || 'Key saved in sandbox mode'}`);
      setSpcsftApiKey(keyInput);
    } finally {
      setTestingKey(false);
    }
  };

  // Handle Scan Submission
  const handleStartScan = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittingJob(true);
    try {
      const req: SpaceShiftJobRequest = {
        zone_id: scanZoneId,
        satellite_id: scanSatellite,
        threshold: scanThreshold,
        polarization: ['VV', 'VH'],
      };
      await submitSpcsftScan(req);
      setShowScanModal(false);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmittingJob(false);
    }
  };

  // Active zone data
  const currentZone = spcsftMonitoringZones.find((z) => z.zone_id === spcsftSelectedZone);

  // Filter detections based on selected zone tab
  const displayedDetections =
    spcsftSelectedZone === 'all'
      ? spcsftLiveDetections
      : spcsftLiveDetections.filter((d) => {
          if (!currentZone) return true;
          const zoneKey = currentZone.name.toLowerCase().split('(')[0].trim();
          const detZone = d.zone_name.toLowerCase();
          return (
            detZone.includes(zoneKey) ||
            (currentZone.bbox &&
              d.centroid.longitude >= currentZone.bbox[0] - 0.5 &&
              d.centroid.latitude >= currentZone.bbox[1] - 0.5 &&
              d.centroid.longitude <= currentZone.bbox[2] + 0.5 &&
              d.centroid.latitude <= currentZone.bbox[3] + 0.5)
          );
        });

  // Collect map coordinates for auto-fit based on selection
  const mapCoords: [number, number][] = [];
  if (selectedSpcsftDetection) {
    mapCoords.push([selectedSpcsftDetection.centroid.latitude, selectedSpcsftDetection.centroid.longitude]);
    const geomCoords = getPolygonPositions(selectedSpcsftDetection.geometry);
    geomCoords.forEach((pt) => mapCoords.push(pt));
  } else if (displayedDetections.length > 0) {
    displayedDetections.forEach((det) => {
      mapCoords.push([det.centroid.latitude, det.centroid.longitude]);
      const geomCoords = getPolygonPositions(det.geometry);
      geomCoords.forEach((pt) => mapCoords.push(pt));
    });
  } else if (currentZone) {
    mapCoords.push(currentZone.center);
  }

  const defaultCenter: [number, number] = currentZone ? currentZone.center : [18.85, 72.40];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[#060a12] overflow-hidden select-none">
      {/* ── Top Real-Time Control & Telemetry Bar ── */}
      <header className="px-4 sm:px-6 py-3 bg-[#0c121e] border-b border-[rgba(255,255,255,0.08)] flex flex-wrap items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <Radio className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-2">
                <span>Space Shift SateAIs™ Real-Time Oil Surveillance</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold animate-pulse">
                  ● LIVE API
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5">
              <span className="font-mono text-cyan-400">
                {(import.meta.env.VITE_SPCSFT_API_URL as string) || (import.meta.env.VITE_SPCSFT_BASE_URL as string) || 'Space Shift SateAIs'}
              </span>
              <span className="text-slate-600">·</span>
              <span>Sentinel-1 SAR C-Band AI Segmentation</span>
              {spcsftLastSync && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400">Last Synced: {new Date(spcsftLastSync).toLocaleTimeString()}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Telemetry Actions & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Sync status button */}
          <button
            onClick={toggleSpcsftSync}
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-2 transition-all ${
              spcsftSyncEnabled
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'
            }`}
            title="Toggle background polling sync"
          >
            <span className={`w-2 h-2 rounded-full ${spcsftSyncEnabled ? 'bg-emerald-400 animate-ping' : 'bg-slate-500'}`} />
            <span>{spcsftSyncEnabled ? `Auto-Sync (${spcsftSyncInterval}s)` : 'Sync Paused'}</span>
          </button>

          {/* Sync Interval Selector */}
          <select
            value={spcsftSyncInterval}
            onChange={(e) => setSpcsftSyncInterval(Number(e.target.value))}
            className="bg-slate-900 border border-slate-700/80 rounded-lg text-xs text-slate-300 px-2.5 py-1.5 focus:outline-none focus:border-cyan-500"
            title="Auto-sync interval frequency"
          >
            <option value={5}>5s Poll</option>
            <option value={10}>10s Poll</option>
            <option value={15}>15s Poll</option>
            <option value={30}>30s Poll</option>
            <option value={60}>60s Poll</option>
          </select>

          {/* Manual Refresh */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-1.5 bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg text-slate-300 hover:text-white transition-colors"
            title="Force immediate refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-cyan-400' : ''}`} />
          </button>

          {/* Trigger Scan Job */}
          <button
            onClick={() => setShowScanModal(true)}
            className="px-3.5 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 border border-cyan-500/40 rounded-lg text-xs text-cyan-300 font-semibold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Satellite className="w-3.5 h-3.5" />
            <span>Initiate SAR Scan</span>
          </button>

          {/* API Key / Config Modal */}
          <button
            onClick={() => setShowSettingsModal(true)}
            className="px-3 py-1.5 bg-slate-800/90 hover:bg-slate-800 border border-slate-700 rounded-lg text-xs text-slate-300 hover:text-white flex items-center gap-1.5 transition-colors"
            title="Space Shift API Key & Connection Settings"
          >
            <Key className={`w-3.5 h-3.5 ${spcsftApiKey ? 'text-emerald-400' : 'text-amber-400'}`} />
            <span>{spcsftApiKey ? 'API Key Active' : 'Configure API Key'}</span>
          </button>
        </div>
      </header>

      {/* ── Zone Filter Ribbon ── */}
      <div className="bg-[#0a0f1a] border-b border-[rgba(255,255,255,0.06)] px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0 pr-2 border-r border-slate-800">
          <Globe className="w-3.5 h-3.5 text-cyan-400" />
          <span>Choke Points:</span>
        </span>

        <button
          onClick={() => setSpcsftSelectedZone('all')}
          className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 transition-all ${
            spcsftSelectedZone === 'all'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-semibold shadow-sm'
              : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
          }`}
        >
          All Global Zones ({spcsftLiveDetections.length})
        </button>

        {spcsftMonitoringZones.map((zone) => {
          const isActive = spcsftSelectedZone === zone.zone_id;
          const zoneDetections = spcsftLiveDetections.filter((d) =>
            d.zone_name.toLowerCase().includes(zone.name.toLowerCase().split('(')[0].trim())
          );

          return (
            <button
              key={zone.zone_id}
              onClick={() => setSpcsftSelectedZone(zone.zone_id)}
              className={`px-3 py-1 rounded-full text-xs font-medium shrink-0 flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40 font-semibold shadow-sm'
                  : 'bg-slate-900/60 text-slate-400 hover:text-slate-200 border border-slate-800'
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  zone.risk_level === 'CRITICAL'
                    ? 'bg-rose-500 animate-pulse'
                    : zone.risk_level === 'HIGH'
                    ? 'bg-amber-400'
                    : 'bg-emerald-400'
                }`}
              />
              <span>{zone.name.split('(')[0]}</span>
              {zoneDetections.length > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-rose-500/30 text-rose-200 font-bold">
                  {zoneDetections.length}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Main Split View: Tactical Interactive Map + Live Real-Time Feed ── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 relative overflow-hidden">
        {/* LEFT: Tactical Map */}
        <div className="flex-1 relative bg-[#070b12] min-h-[350px]">
          <MapContainer
            center={defaultCenter}
            zoom={9}
            scrollWheelZoom={true}
            style={{ width: '100%', height: '100%' }}
            zoomControl={false}
          >
            <TileLayer
              key={activeBasemap.id}
              attribution={activeBasemap.attribution}
              url={activeBasemap.url}
              subdomains={activeBasemap.subdomains || ['a', 'b', 'c']}
              maxZoom={activeBasemap.maxZoom}
            />

            {mapCoords.length > 0 && <MapBoundsFitter coords={mapCoords} />}

            {/* Render Space Shift Detected Oil Slicks */}
            {displayedDetections.map((det) => {
              const isSelected = selectedSpcsftDetection?.detection_id === det.detection_id;
              const mainPositions = getPolygonPositions(det.geometry);
              const corePositions = getPolygonPositions(det.core_geometry);

              return (
                <React.Fragment key={det.detection_id}>
                  {/* Sheen Filaments */}
                  {det.sheen_geometry?.map((sheen, sIdx) => {
                    const sheenPositions = getPolygonPositions(sheen);
                    if (sheenPositions.length === 0) return null;
                    return (
                      <Polygon
                        key={`${det.detection_id}-sheen-${sIdx}`}
                        positions={sheenPositions}
                        pathOptions={{
                          color: '#fb7185',
                          fillColor: '#e11d48',
                          fillOpacity: 0.25,
                          weight: 1.5,
                          dashArray: '3 4',
                        }}
                      />
                    );
                  })}

                  {/* Main Slick Body */}
                  {mainPositions.length > 0 && (
                    <Polygon
                      positions={mainPositions}
                      pathOptions={{
                        color: isSelected ? '#38bdf8' : det.severity === 'CRITICAL' ? '#f43f5e' : '#f59e0b',
                        fillColor: det.severity === 'CRITICAL' ? '#be123c' : '#d97706',
                        fillOpacity: isSelected ? 0.6 : 0.4,
                        weight: isSelected ? 3 : 2,
                      }}
                      eventHandlers={{
                        click: () => setSelectedSpcsftDetection(det),
                      }}
                    >
                      <Tooltip direction="top" offset={[0, -10]} opacity={0.95}>
                        <div className="p-1 font-mono text-xs text-slate-900 font-bold">
                          <div>{det.zone_name}</div>
                          <div className="text-rose-600">
                            Confidence: {(det.confidence * 100).toFixed(1)}% · Area: {det.area_km2.toFixed(1)} km²
                          </div>
                        </div>
                      </Tooltip>
                    </Polygon>
                  )}

                  {/* Heavy Crude Mousse Core */}
                  {corePositions.length > 0 && (
                    <Polygon
                      positions={corePositions}
                      pathOptions={{
                        color: '#fda4af',
                        fillColor: '#881337',
                        fillOpacity: 0.75,
                        weight: 2,
                      }}
                    />
                  )}

                  {/* Centroid Marker with Radar Ping */}
                  <CircleMarker
                    center={[det.centroid.latitude, det.centroid.longitude]}
                    radius={isSelected ? 10 : 7}
                    pathOptions={{
                      color: isSelected ? '#38bdf8' : '#f43f5e',
                      fillColor: '#ffffff',
                      fillOpacity: 0.9,
                      weight: 2,
                    }}
                    eventHandlers={{
                      click: () => setSelectedSpcsftDetection(det),
                    }}
                  >
                    <Popup>
                      <div className="p-2 space-y-2 font-mono text-xs min-w-[250px]">
                        <div className="flex items-center justify-between border-b pb-1.5">
                          <span className="font-bold text-rose-600">{det.detection_id}</span>
                          <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[10px] font-bold">
                            {(det.confidence * 100).toFixed(1)}% Confidence
                          </span>
                        </div>
                        <div className="space-y-1 text-slate-700 text-[11px]">
                          <div><span className="font-semibold">Type:</span> {det.slick_type}</div>
                          <div><span className="font-semibold">Area:</span> {det.area_km2.toFixed(1)} km²</div>
                          {det.properties?.thickness_estimate && (
                            <div><span className="font-semibold">Thickness:</span> {det.properties.thickness_estimate}</div>
                          )}
                          {det.properties?.estimated_volume_m3 && (
                            <div><span className="font-semibold">Est. Volume:</span> {det.properties.estimated_volume_m3} m³</div>
                          )}
                          <div><span className="font-semibold">Satellite:</span> {det.satellite}</div>
                          <div><span className="font-semibold">Backscatter:</span> VV: {det.properties?.mean_vv_db ?? -19.4} dB</div>
                        </div>
                        <button
                          onClick={() => launchInvestigationFromSpcsft(det.detection_id, spcsftSelectedZone)}
                          className="w-full mt-2 py-1.5 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded text-xs flex items-center justify-center gap-1.5 shadow transition-colors"
                        >
                          <Zap className="w-3.5 h-3.5" />
                          <span>Investigate with MarineTrace</span>
                        </button>
                      </div>
                    </Popup>
                  </CircleMarker>
                </React.Fragment>
              );
            })}
          </MapContainer>

          {/* Floating Map Overlay HUD */}
          <div className="absolute top-4 left-4 z-[400] bg-slate-950/85 backdrop-blur-md border border-slate-800 rounded-xl p-3.5 shadow-2xl max-w-xs space-y-2.5 font-mono text-xs text-slate-200">
            <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
              <span className="font-bold text-slate-100 flex items-center gap-1.5">
                <Satellite className="w-4 h-4 text-cyan-400" />
                <span>Sentinel-1 SAR Feed</span>
              </span>
              <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                ACTIVE RADAR
              </span>
            </div>

            <div className="space-y-1.5 text-[11px] text-slate-400">
              <div className="flex justify-between">
                <span>Active Detections:</span>
                <span className="text-slate-100 font-bold">{displayedDetections.length} slicks</span>
              </div>
              <div className="flex justify-between">
                <span>Critical Spills:</span>
                <span className="text-rose-400 font-bold">
                  {displayedDetections.filter((d) => d.severity === 'CRITICAL').length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Mean Confidence:</span>
                <span className="text-cyan-400 font-bold">
                  {displayedDetections.length > 0
                    ? `${(
                        (displayedDetections.reduce((acc, d) => acc + d.confidence, 0) /
                          displayedDetections.length) *
                        100
                      ).toFixed(1)}%`
                    : 'N/A'}
                </span>
              </div>
            </div>

            {/* Basemap Switcher */}
            <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px]">
              <span>Basemap:</span>
              <div className="flex gap-1">
                {(['google-hybrid', 'google-satellite', 'google-terrain'] as const).map((b: BasemapType) => (
                  <button
                    key={b}
                    onClick={() => setBasemap(b)}
                    className={`px-2 py-0.5 rounded text-[10px] font-semibold transition-all ${
                      basemap === b
                        ? 'bg-cyan-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {b === 'google-hybrid' ? 'Hybrid' : b === 'google-satellite' ? 'Satellite' : 'Terrain'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* RIGHT: Real-Time Detections Feed & Tactical Inspector */}
        <aside className="w-full lg:w-[460px] bg-[#090e18] border-l border-[rgba(255,255,255,0.08)] flex flex-col min-h-0 shrink-0 overflow-hidden">
          <div className="p-4 border-b border-[rgba(255,255,255,0.08)] bg-[#0c121e] flex items-center justify-between shrink-0">
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <AlertOctagon className="w-4 h-4 text-rose-400" />
                <span>Live Oil Detections Feed</span>
              </h2>
              <p className="text-[11px] text-slate-400 mt-0.5">
                Real-time SAR backscatter signatures from Space Shift SateAIs
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/30">
              {displayedDetections.length} Target{displayedDetections.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Detections List */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {displayedDetections.map((det) => {
              const isSelected = selectedSpcsftDetection?.detection_id === det.detection_id;

              return (
                <div
                  key={det.detection_id}
                  onClick={() => setSelectedSpcsftDetection(det)}
                  className={`p-3.5 rounded-xl border transition-all cursor-pointer font-mono space-y-2.5 ${
                    isSelected
                      ? 'bg-sky-950/40 border-sky-400/60 shadow-lg shadow-sky-950/50'
                      : 'bg-[#0c121e] border-slate-800/80 hover:border-slate-700 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs text-slate-100">{det.detection_id}</span>
                        <span
                          className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase tracking-wider ${
                            det.severity === 'CRITICAL'
                              ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : det.severity === 'HIGH'
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                              : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                          }`}
                        >
                          {det.severity}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-400 mt-0.5 truncate">{det.zone_name}</p>
                    </div>

                    <div className="text-right shrink-0">
                      <span className="text-xs font-bold text-rose-400">
                        {(det.confidence * 100).toFixed(1)}%
                      </span>
                      <span className="block text-[10px] text-slate-500">Confidence</span>
                    </div>
                  </div>

                  {/* Slick Specs Grid */}
                  <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2 rounded-lg text-[10px] text-slate-300 border border-slate-900">
                    <div>
                      <span className="text-slate-500 block">Area</span>
                      <strong className="text-slate-200">{det.area_km2.toFixed(1)} km²</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">VV Backscatter</span>
                      <strong className="text-cyan-400">{det.properties?.mean_vv_db ?? -19.4} dB</strong>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Classification</span>
                      <strong className="text-amber-300 truncate block">{det.slick_type.split('(')[0]}</strong>
                    </div>
                  </div>

                  {/* Additional Marine Metrics (Volume, Thickness, Wind) */}
                  {(det.properties?.estimated_volume_m3 || det.properties?.thickness_estimate) && (
                    <div className="flex items-center justify-between text-[10px] text-slate-400 bg-slate-900/40 px-2 py-1 rounded border border-slate-800/60">
                      {det.properties.thickness_estimate && (
                        <span><strong className="text-slate-300">Thickness:</strong> {det.properties.thickness_estimate.split('(')[0]}</span>
                      )}
                      {det.properties.estimated_volume_m3 && (
                        <span><strong className="text-slate-300">Volume:</strong> {det.properties.estimated_volume_m3} m³</span>
                      )}
                    </div>
                  )}

                  {/* Coordinate and Satellite details */}
                  <div className="flex items-center justify-between text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Compass className="w-3 h-3 text-slate-500" />
                      <span>
                        {det.centroid.latitude.toFixed(3)}°N, {det.centroid.longitude.toFixed(3)}°E
                      </span>
                    </span>
                    <span className="text-slate-500">{det.satellite.split('(')[0]}</span>
                  </div>

                  {/* 1-Click Investigation Trigger Button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      launchInvestigationFromSpcsft(det.detection_id, spcsftSelectedZone);
                    }}
                    disabled={loading}
                    className="w-full mt-1 py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-rose-900/30 transition-all"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-300 animate-bounce" />
                    <span>Launch MarineTrace Attribution (OpenDrift + AIS)</span>
                  </button>
                </div>
              );
            })}

            {displayedDetections.length === 0 && (
              <div className="p-8 text-center text-slate-500 space-y-3 font-mono">
                <Satellite className="w-10 h-10 mx-auto text-slate-600 animate-pulse" />
                <p className="text-xs">No active oil slicks detected in current surveillance window.</p>
                <button
                  onClick={() => setShowScanModal(true)}
                  className="px-3.5 py-1.5 bg-cyan-500/20 text-cyan-300 rounded-lg text-xs font-semibold hover:bg-cyan-500/30 transition-colors"
                >
                  Initiate New SAR Scan
                </button>
              </div>
            )}
          </div>
        </aside>
      </div>

      {/* ── Modal 1: New SAR Scan Job Submission ── */}
      {showScanModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c121e] border border-slate-700 rounded-2xl w-full max-w-lg shadow-2xl p-6 space-y-5 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Satellite className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Submit Space Shift SAR Scan</h3>
                  <p className="text-[11px] text-slate-400">Sentinel-1 Dual-Pol Oil Slick Segmentation Job</p>
                </div>
              </div>
              <button
                onClick={() => setShowScanModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleStartScan} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Surveillance Zone / AOI</label>
                <select
                  value={scanZoneId}
                  onChange={(e) => setScanZoneId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                >
                  {spcsftMonitoringZones.map((z) => (
                    <option key={z.zone_id} value={z.zone_id}>
                      {z.name} ({z.region})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Satellite Constellation</label>
                  <select
                    value={scanSatellite}
                    onChange={(e) => setScanSatellite(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500"
                  >
                    <option value="sentinel-1">Sentinel-1 (Dual-Pol VV+VH)</option>
                    <option value="sentinel-1a">Sentinel-1A IW GRD</option>
                    <option value="sentinel-1b">Sentinel-1B IW GRD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Confidence Threshold</label>
                  <div className="flex items-center gap-2 bg-slate-900 border border-slate-700 rounded-lg p-2">
                    <input
                      type="range"
                      min="0.3"
                      max="0.9"
                      step="0.05"
                      value={scanThreshold}
                      onChange={(e) => setScanThreshold(parseFloat(e.target.value))}
                      className="flex-1 accent-cyan-400 cursor-pointer"
                    />
                    <span className="text-cyan-400 font-bold font-mono">{(scanThreshold * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>

              <div className="p-3 bg-cyan-950/30 border border-cyan-500/20 rounded-lg text-[11px] text-cyan-200 space-y-1">
                <strong className="block text-cyan-300 font-bold">Space Shift SateAIs™ Processing:</strong>
                <p className="text-slate-400">
                  Performs automatic dual-polarization ($\sigma_0$ VV/VH) radiometric calibration, biogenic lookalike filtering, and U-Net slick boundary segmentation.
                </p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowScanModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingJob}
                  className="px-5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-cyan-500/20 transition-all"
                >
                  {submittingJob ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting Job...</span>
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4" />
                      <span>Start SAR Analysis</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal 2: API Key & Endpoint Configuration ── */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0c121e] border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-5 font-mono">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-100">Space Shift API Credentials</h3>
                  <p className="text-[11px] text-slate-400">Configure endpoint & authorization</p>
                </div>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveKey} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">
                  API Key (Bearer Token)
                </label>
                <input
                  type="password"
                  value={keyInput}
                  onChange={(e) => setKeyInput(e.target.value)}
                  placeholder="e.g. spcsft_live_sk_..."
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono"
                />
                <div className="flex justify-between items-center mt-1.5 text-[10px]">
                  <span className="text-slate-500">Obtain free key from console</span>
                  <a
                    href="https://console.spcsft.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-cyan-400 hover:underline flex items-center gap-1"
                  >
                    <span>console.spcsft.com</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">API Base URL</label>
                <input
                  type="text"
                  value={baseUrlInput}
                  onChange={(e) => setBaseUrlInput(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2.5 text-slate-200 focus:outline-none focus:border-cyan-500 font-mono text-xs"
                />
              </div>

              {testSuccess && (
                <div className="p-3 bg-emerald-950/40 border border-emerald-500/30 rounded-lg text-[11px] text-emerald-300 flex items-start gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                  <span>{testSuccess}</span>
                </div>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowSettingsModal(false)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-lg font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={testingKey}
                  className="px-5 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg flex items-center gap-2 shadow-lg shadow-emerald-500/20 transition-all"
                >
                  {testingKey ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Testing & Saving...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Test & Save Key</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
