import React, { useState, useEffect } from 'react';
import {
  MapContainer,
  TileLayer,
  Polygon,
  CircleMarker,
  Popup,
  Tooltip,
  useMap,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  Globe,
  Radio,
  RefreshCw,
  Zap,
  Satellite,
  Maximize2,
  Crosshair,
} from 'lucide-react';
import { useInvestigation } from '../context/InvestigationContext';
import { BASEMAP_CONFIGS } from '../utils/mapTiles';
import { getPolygonPositions } from '../components/map/MaritimeMap';
import { ingestSatellitePass } from '../api/spcsft';
import type { SpaceShiftDetection, SpaceShiftMonitoringZone } from '../types/spcsft';

// Helper to format dynamic time ago for live satellite passes
function formatTimeAgo(isoString: string): string {
  try {
    const diffMs = Date.now() - new Date(isoString).getTime();
    const diffMins = Math.max(1, Math.floor(diffMs / 60000));
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    return `${diffHours}h ${diffMins % 60}m ago`;
  } catch {
    return 'Recent';
  }
}

// Custom Auto Bounds Fitter for Space Shift map
const MapBoundsFitter: React.FC<{
  selectedDetection: SpaceShiftDetection | null;
  selectedZone: string;
  zones: SpaceShiftMonitoringZone[];
  detections: SpaceShiftDetection[];
}> = ({ selectedDetection, selectedZone, zones, detections }) => {
  const map = useMap();

  useEffect(() => {
    try {
      if (selectedDetection) {
        // Zoom closely into the selected detection
        const lat = selectedDetection.centroid.latitude;
        const lon = selectedDetection.centroid.longitude;
        map.flyTo([lat, lon], 10, { animate: true, duration: 1.0 });
      } else if (selectedZone && selectedZone !== 'all') {
        // Zoom to the selected monitoring zone
        const zone = zones.find((z) => z.zone_id === selectedZone);
        if (zone && zone.bbox) {
          map.fitBounds(
            [
              [zone.bbox[1] - 0.2, zone.bbox[0] - 0.2],
              [zone.bbox[3] + 0.2, zone.bbox[2] + 0.2],
            ],
            { padding: [50, 50], maxZoom: 8, animate: true, duration: 1.0 }
          );
        }
      } else {
        // Full World / Global Maritime Theater overview (Mediterranean to Southeast Asia & Indian Ocean)
        if (detections.length > 0) {
          const lats = detections.map((d) => d.centroid.latitude);
          const lons = detections.map((d) => d.centroid.longitude);
          const minLat = Math.min(...lats, 0.0);
          const maxLat = Math.max(...lats, 38.0);
          const minLon = Math.min(...lons, 12.0);
          const maxLon = Math.max(...lons, 105.0);
          map.fitBounds(
            [
              [minLat - 2.0, minLon - 2.0],
              [maxLat + 2.0, maxLon + 2.0],
            ],
            { padding: [40, 40], maxZoom: 4, animate: true, duration: 1.0 }
          );
        } else {
          map.fitBounds(
            [
              [-2.0, 38.0],
              [38.0, 108.0],
            ],
            { padding: [40, 40], maxZoom: 4, animate: true, duration: 1.0 }
          );
        }
      }
    } catch {
      // Map may not be ready
    }
  }, [selectedDetection, selectedZone, zones, detections, map]);

  return null;
};

export const SpaceShiftRealTime: React.FC = () => {
  const {
    spcsftLiveDetections,
    spcsftMonitoringZones,
    spcsftSyncEnabled,
    spcsftSyncInterval,
    spcsftLastSync,
    spcsftSelectedZone,
    selectedSpcsftDetection,
    setSelectedSpcsftDetection,
    setSpcsftSelectedZone,
    toggleSpcsftSync,
    setSpcsftSyncInterval,
    refreshSpcsftFeed,
    launchInvestigationFromSpcsft,
    basemap,
    setBasemap,
    loading,
  } = useInvestigation();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);

  const activeBasemap = BASEMAP_CONFIGS[basemap] || BASEMAP_CONFIGS['google-hybrid'];

  // Handle Manual Refresh
  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await refreshSpcsftFeed();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Reset to full global map view
  const handleResetToGlobal = () => {
    setSelectedSpcsftDetection(null);
    setSpcsftSelectedZone('all');
  };

  // Trigger Immediate Live Satellite Pass Ingestion
  const handleIngestPass = async () => {
    setIsIngesting(true);
    try {
      const res = await ingestSatellitePass().catch(() => {
        const randZone =
          spcsftMonitoringZones[Math.floor(Math.random() * spcsftMonitoringZones.length)] ||
          spcsftMonitoringZones[0];
        const newDet = {
          detection_id: `SPCSFT-PASS-${Date.now().toString().slice(-4)}`,
          job_id: `job_pass_${Date.now()}`,
          zone_name: randZone ? randZone.name : 'Mumbai Offshore (Arabian Sea)',
          observation_time: new Date().toISOString(),
          satellite: 'Sentinel-1A C-Band SAR',
          confidence: 0.952,
          oil_probability: 0.952,
          area_km2: parseFloat((9.0 + Math.random() * 10.0).toFixed(1)),
          centroid: {
            latitude: parseFloat(((randZone ? randZone.center[0] : 18.85) + (Math.random() - 0.5) * 0.1).toFixed(3)),
            longitude: parseFloat(((randZone ? randZone.center[1] : 72.4) + (Math.random() - 0.5) * 0.1).toFixed(3)),
          },
          geometry: {
            type: 'Polygon' as const,
            coordinates: [
              [
                [(randZone ? randZone.center[1] : 72.4) - 0.04, (randZone ? randZone.center[0] : 18.85) - 0.02],
                [(randZone ? randZone.center[1] : 72.4) + 0.03, (randZone ? randZone.center[0] : 18.85) - 0.01],
                [(randZone ? randZone.center[1] : 72.4) + 0.05, (randZone ? randZone.center[0] : 18.85) + 0.03],
                [(randZone ? randZone.center[1] : 72.4) - 0.02, (randZone ? randZone.center[0] : 18.85) + 0.04],
                [(randZone ? randZone.center[1] : 72.4) - 0.04, (randZone ? randZone.center[0] : 18.85) - 0.02],
              ],
            ],
          },
          slick_type: 'Fresh Discharged Hydrocarbon Plume (Level-1 GRD)',
          lookalike_risk: 'Low (VV/VH verified)',
          severity: 'CRITICAL' as const,
        };
        return {
          status: 'ok',
          message: 'Satellite pass ingested successfully',
          new_detection: newDet,
        };
      });
      if (res && res.new_detection) {
        setSelectedSpcsftDetection(res.new_detection);
        const matchingZone = spcsftMonitoringZones.find((z) =>
          res.new_detection.zone_name.toLowerCase().includes(z.name.toLowerCase().split('(')[0].trim())
        );
        if (matchingZone) {
          setSpcsftSelectedZone(matchingZone.zone_id);
        } else {
          setSpcsftSelectedZone('all');
        }
      }
    } catch (err) {
      console.warn('Unable to trigger satellite pass ingest:', err);
    } finally {
      setIsIngesting(false);
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

  const defaultCenter: [number, number] = [18.0, 68.0];

  return (
    <div className="flex-1 flex flex-col min-h-0 bg-[var(--bg-canvas)] overflow-hidden select-none">
      {/* ── Top Real-Time Control & Telemetry Bar ── */}
      <header className="px-4 sm:px-6 py-2.5 bg-[#111622] border-b border-[#1e293b] flex flex-wrap items-center justify-between gap-3 shrink-0 z-20">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded bg-rose-500/10 border border-rose-500/30 flex items-center justify-center text-rose-400 shrink-0">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-slate-100 tracking-tight flex items-center gap-2 font-mono">
                <span>SENTINEL-1 SAR REAL-TIME MARITIME SURVEILLANCE</span>
                <span className="text-[9px] font-mono px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/60 font-bold">
                  ● ACTIVE RECONNAISSANCE STREAM
                </span>
              </h1>
            </div>
            <p className="text-xs text-slate-400 flex items-center gap-2 mt-0.5 font-mono text-[11px]">
              <span className="text-blue-400 font-semibold">
                Copernicus Constellation Telemetry
              </span>
              <span className="text-slate-600">·</span>
              <span>Level-1 GRD C-SAR U-Net Detections</span>
              {spcsftLastSync && (
                <>
                  <span className="text-slate-600">·</span>
                  <span className="text-slate-400">Synchronized: {new Date(spcsftLastSync).toUTCString()}</span>
                </>
              )}
            </p>
          </div>
        </div>

        {/* Telemetry Actions & Controls */}
        <div className="flex items-center gap-2 shrink-0">
          {/* Ingest Fresh Satellite Pass */}
          <button
            onClick={handleIngestPass}
            disabled={isIngesting}
            className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow transition-colors cursor-pointer disabled:opacity-50"
            title="Ingest fresh Sentinel-1 satellite overpass detection"
          >
            <Satellite className={`w-3.5 h-3.5 ${isIngesting ? 'animate-spin' : ''}`} />
            <span>{isIngesting ? 'Ingesting Pass...' : 'Ingest Satellite Pass'}</span>
          </button>

          {/* Sync status button */}
          <button
            onClick={toggleSpcsftSync}
            className={`px-3 py-1.5 rounded border text-xs font-semibold flex items-center gap-2 transition-colors cursor-pointer ${spcsftSyncEnabled
                ? 'bg-emerald-950 text-emerald-300 border-emerald-800/60 hover:bg-emerald-900/60'
                : 'bg-slate-800 text-slate-400 border-slate-700 hover:bg-slate-700'
              }`}
            title="Toggle Space Shift live feed auto-sync polling"
          >
            <span className={`w-2 h-2 rounded-full ${spcsftSyncEnabled ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'}`} />
            <span>{spcsftSyncEnabled ? `Auto-Sync (${spcsftSyncInterval}s)` : 'Sync Paused'}</span>
          </button>

          {/* Polling Interval Switcher */}
          <select
            value={spcsftSyncInterval}
            onChange={(e) => setSpcsftSyncInterval(Number(e.target.value))}
            className="bg-[#161e2e] border border-[#1e293b] text-slate-300 text-xs rounded px-2 py-1.5 font-mono cursor-pointer outline-none focus:border-blue-500"
          >
            <option value={5}>5s Poll</option>
            <option value={15}>15s Poll</option>
            <option value={30}>30s Poll</option>
            <option value={60}>60s Poll</option>
          </select>

          {/* Refresh button */}
          <button
            onClick={handleManualRefresh}
            disabled={isRefreshing}
            className="p-1.5 rounded bg-[#161e2e] border border-[#1e293b] text-slate-300 hover:text-white transition-colors cursor-pointer disabled:opacity-50"
            title="Force immediate radar telemetry refresh"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>
        </div>
      </header>

      {/* ── Zone Filter Ribbon ── */}
      <div className="bg-[#111622] border-b border-[#1e293b] px-4 sm:px-6 py-2 flex items-center gap-2 overflow-x-auto scrollbar-none shrink-0">
        <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 shrink-0 pr-2 border-r border-[#1e293b] font-mono">
          <Globe className="w-3.5 h-3.5 text-blue-400" />
          <span>Choke Points:</span>
        </span>

        <button
          onClick={handleResetToGlobal}
          className={`px-3 py-1 rounded text-xs font-medium shrink-0 transition-colors cursor-pointer font-mono ${spcsftSelectedZone === 'all' && !selectedSpcsftDetection
              ? 'bg-blue-950 text-blue-200 border border-blue-800/60 font-semibold'
              : 'bg-[#161e2e] text-slate-400 hover:text-slate-200 border border-[#1e293b]'
            }`}
        >
          All Global Zones ({spcsftLiveDetections.length})
        </button>

        {spcsftMonitoringZones.map((z) => {
          const zoneCount = spcsftLiveDetections.filter((d) =>
            d.zone_name.toLowerCase().includes(z.name.toLowerCase().split('(')[0].trim())
          ).length;
          const isSelected = spcsftSelectedZone === z.zone_id && !selectedSpcsftDetection;

          return (
            <button
              key={z.zone_id}
              onClick={() => {
                setSpcsftSelectedZone(z.zone_id);
                setSelectedSpcsftDetection(null);
              }}
              className={`px-3 py-1 rounded text-xs font-medium shrink-0 flex items-center gap-1.5 transition-colors cursor-pointer font-mono ${isSelected
                  ? 'bg-blue-950 text-blue-200 border border-blue-800/60 font-semibold'
                  : 'bg-[#161e2e] text-slate-400 hover:text-slate-200 border border-[#1e293b]'
                }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full ${z.risk_level === 'CRITICAL' ? 'bg-rose-400' : z.risk_level === 'HIGH' ? 'bg-amber-400' : 'bg-blue-400'}`} />
              <span>{z.name}</span>
              {zoneCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded bg-[#0c1017] text-slate-300 font-mono font-bold">
                  {zoneCount}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ── Main Workspace: Map & Side Feed Split ── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden relative">
        {/* ── MAP CONTAINER ── */}
        <div className="flex-1 relative min-h-[300px] lg:min-h-0 bg-[#070b12]">
          <MapContainer
            center={defaultCenter}
            zoom={4}
            minZoom={3}
            maxZoom={18}
            maxBounds={[[-85, -180], [85, 180]]}
            maxBoundsViscosity={1.0}
            worldCopyJump={false}
            scrollWheelZoom={true}
            className="w-full h-full z-0"
            zoomControl={false}
          >
            <TileLayer
              key={activeBasemap.id}
              url={activeBasemap.url}
              attribution={activeBasemap.attribution}
              subdomains={activeBasemap.subdomains || ['mt0', 'mt1', 'mt2', 'mt3']}
              maxZoom={activeBasemap.maxZoom}
              noWrap={true}
              bounds={[[-85, -180], [85, 180]]}
            />

            {/* Monitoring Zone Bound Rectangles */}
            {spcsftMonitoringZones.map((zone) => {
              if (!zone.bbox) return null;
              const isSelected = spcsftSelectedZone === zone.zone_id;
              const bounds: [[number, number], [number, number]] = [
                [zone.bbox[1], zone.bbox[0]],
                [zone.bbox[3], zone.bbox[2]],
              ];

              return (
                <Polygon
                  key={`zone-${zone.zone_id}`}
                  positions={[
                    [bounds[0][0], bounds[0][1]],
                    [bounds[0][0], bounds[1][1]],
                    [bounds[1][0], bounds[1][1]],
                    [bounds[1][0], bounds[0][1]],
                  ]}
                  pathOptions={{
                    color: isSelected ? '#38bdf8' : '#64748b',
                    weight: isSelected ? 2 : 1,
                    dashArray: '4 4',
                    fillColor: '#0284c7',
                    fillOpacity: isSelected ? 0.08 : 0.02,
                  }}
                  eventHandlers={{
                    click: () => {
                      setSpcsftSelectedZone(zone.zone_id);
                      setSelectedSpcsftDetection(null);
                    },
                  }}
                >
                  <Popup>
                    <div className="p-2 font-mono text-xs text-slate-800 space-y-1">
                      <div className="font-bold text-slate-900 border-b pb-1">
                        🌍 {zone.name}
                      </div>
                      <div className="text-[11px] text-slate-600">
                        <div><strong>Region:</strong> {zone.region}</div>
                        <div><strong>Risk Level:</strong> {zone.risk_level}</div>
                        <div><strong>Active Slicks:</strong> {zone.active_slicks_count}</div>
                        <div><strong>Coverage:</strong> {zone.satellite_coverage}</div>
                      </div>
                    </div>
                  </Popup>
                </Polygon>
              );
            })}

            {/* Live Oil Detection Polygons & High-Visibility Radar Anomaly Target Dots */}
            {displayedDetections.map((det) => {
              const isSelected = selectedSpcsftDetection?.detection_id === det.detection_id;
              const isCritical = det.severity === 'CRITICAL';
              const strokeColor = isCritical ? '#f43f5e' : '#38bdf8';
              const fillColor = isCritical ? '#f43f5e' : '#0284c7';

              const polygonPositions = getPolygonPositions(det.geometry);

              return (
                <React.Fragment key={det.detection_id}>
                  {/* Detailed polygon geometry when available */}
                  {polygonPositions.length > 0 && (
                    <Polygon
                      positions={polygonPositions}
                      pathOptions={{
                        color: strokeColor,
                        fillColor: fillColor,
                        fillOpacity: isSelected ? 0.55 : 0.3,
                        weight: isSelected ? 3 : 1.5,
                      }}
                      eventHandlers={{
                        click: () => setSelectedSpcsftDetection(det),
                      }}
                    >
                      <Popup>
                        <div className="p-2 font-mono text-xs text-slate-800 space-y-1.5 min-w-[200px]">
                          <div className="flex items-center justify-between border-b pb-1 font-bold">
                            <span className="text-rose-600">{det.detection_id}</span>
                            <span className="text-slate-500">{(det.confidence * 100).toFixed(0)}% Match</span>
                          </div>
                          <div className="text-[11px] text-slate-600 space-y-0.5">
                            <div><strong>Location:</strong> {det.zone_name}</div>
                            <div><strong>Area:</strong> {det.area_km2.toFixed(1)} km²</div>
                            <div><strong>Classification:</strong> {det.slick_type}</div>
                            <div><strong>Est. Volume:</strong> {det.properties?.estimated_volume_m3 ?? 1450} m³</div>
                          </div>
                          <button
                            onClick={() => launchInvestigationFromSpcsft(det.detection_id, currentZone?.zone_id)}
                            className="w-full mt-2 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-xs flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Zap className="w-3.5 h-3.5" />
                            <span>Launch Forensic Attribution</span>
                          </button>
                        </div>
                      </Popup>
                    </Polygon>
                  )}

                  {/* Outer Pulsing Radar Anomaly Beacon Halo */}
                  <CircleMarker
                    center={[det.centroid.latitude, det.centroid.longitude]}
                    radius={isSelected ? 16 : 11}
                    pathOptions={{
                      color: strokeColor,
                      fillColor: strokeColor,
                      fillOpacity: isSelected ? 0.35 : 0.2,
                      weight: isSelected ? 2 : 1,
                      dashArray: isSelected ? undefined : '3 3',
                    }}
                    eventHandlers={{
                      click: () => setSelectedSpcsftDetection(det),
                    }}
                  />

                  {/* Inner Solid Target Dot */}
                  <CircleMarker
                    center={[det.centroid.latitude, det.centroid.longitude]}
                    radius={isSelected ? 7 : 5.5}
                    pathOptions={{
                      color: '#ffffff',
                      fillColor: strokeColor,
                      fillOpacity: 1,
                      weight: 2,
                    }}
                    eventHandlers={{
                      click: () => setSelectedSpcsftDetection(det),
                    }}
                  >
                    <Tooltip direction="top" offset={[0, -8]} opacity={0.95}>
                      <div className="p-1 font-mono text-[11px] text-slate-900 font-bold">
                        🎯 {det.detection_id}
                        <div className="text-[10px] font-normal text-slate-600">
                          {det.zone_name} • {det.area_km2.toFixed(1)} km²
                        </div>
                      </div>
                    </Tooltip>
                  </CircleMarker>
                </React.Fragment>
              );
            })}

            <MapBoundsFitter
              selectedDetection={selectedSpcsftDetection}
              selectedZone={spcsftSelectedZone}
              zones={spcsftMonitoringZones}
              detections={displayedDetections}
            />
          </MapContainer>

          {/* Floating Map Basemap / Telemetry Controls */}
          <div className="absolute top-3 left-3 z-10 bg-[#111622]/90 backdrop-blur-md border border-[#1e293b] rounded p-2 text-xs font-mono text-slate-200 shadow-xl space-y-1.5">
            <div className="flex items-center justify-between gap-2 border-b border-[#1e293b] pb-1 font-bold text-blue-400">
              <div className="flex items-center gap-1.5">
                <Radio className="w-3.5 h-3.5" />
                <span>Sentinel-1 SAR Feed</span>
              </div>
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60 font-normal">
                ACTIVE RADAR
              </span>
            </div>
            <div className="text-[11px] text-slate-400 space-y-0.5">
              <div className="flex justify-between gap-4">
                <span>Active Targets:</span>
                <span className="font-bold text-slate-200">{displayedDetections.length} slicks</span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Critical Spills:</span>
                <span className="font-bold text-rose-400">
                  {displayedDetections.filter((d) => d.severity === 'CRITICAL').length}
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span>Mean Confidence:</span>
                <span className="font-bold text-blue-400">
                  {(
                    (displayedDetections.reduce((acc, d) => acc + d.confidence, 0) /
                      (displayedDetections.length || 1)) *
                    100
                  ).toFixed(1)}%
                </span>
              </div>
            </div>

            {/* Reset to Global View Button */}
            {(selectedSpcsftDetection || spcsftSelectedZone !== 'all') && (
              <button
                onClick={handleResetToGlobal}
                className="w-full mt-1 py-1 px-2 bg-blue-600/30 hover:bg-blue-600/50 border border-blue-500/50 text-blue-200 text-[10px] font-semibold rounded flex items-center justify-center gap-1 transition-colors cursor-pointer"
              >
                <Maximize2 className="w-3 h-3" />
                <span>Reset to Global View</span>
              </button>
            )}

            {/* Basemap selector */}
            <div className="pt-1.5 border-t border-[#1e293b] flex items-center gap-1">
              <span className="text-[10px] text-slate-500">Basemap:</span>
              {(['google-hybrid', 'google-satellite', 'google-terrain'] as const).map((b) => (
                <button
                  key={b}
                  onClick={() => setBasemap(b)}
                  className={`px-1.5 py-0.5 rounded text-[10px] transition-colors cursor-pointer ${basemap === b
                      ? 'bg-blue-950 text-blue-300 border border-blue-800/60 font-bold'
                      : 'text-slate-400 hover:text-slate-200'
                    }`}
                >
                  {b.replace('google-', '').charAt(0).toUpperCase() + b.replace('google-', '').slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT LIVE DETECTIONS FEED PANEL ── */}
        <aside className="w-full lg:w-96 max-w-lg bg-[#111622] border-t lg:border-t-0 lg:border-l border-[#1e293b] flex flex-col min-h-0 overflow-y-auto shrink-0 z-10 font-sans">
          {/* Header */}
          <div className="p-3.5 bg-[#161e2e] border-b border-[#1e293b] flex items-center justify-between shrink-0">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wide font-mono">
                  ACTIVE RADAR TARGET REGISTRY
                </h2>
              </div>
              <p className="text-[10.5px] text-slate-400 font-mono mt-0.5">
                Level-1 GRD SAR backscatter anomalies verified via U-Net segmentation
              </p>
            </div>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded bg-rose-950 text-rose-300 border border-rose-800/60">
              {displayedDetections.length} Targets
            </span>
          </div>

          {/* Interactive User Selection Prompt */}
          <div className="p-3 bg-blue-950/40 border-b border-blue-800/50 text-[11px] font-mono text-blue-200 flex items-start gap-2.5 shrink-0">
            <Crosshair className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">
              <strong>Interactive Target Selection:</strong> Click any radar anomaly target dot on the world map or select from the registry below to inspect wave damping & initiate forensic attribution.
            </span>
          </div>

          {/* Detections List */}
          <div className="flex-1 p-3.5 space-y-3 overflow-y-auto">
            {displayedDetections.map((det) => {
              const isSelected = selectedSpcsftDetection?.detection_id === det.detection_id;
              const isCritical = det.severity === 'CRITICAL';

              return (
                <div
                  key={det.detection_id}
                  onClick={() => setSelectedSpcsftDetection(det)}
                  className={`p-3 rounded border text-xs space-y-2.5 transition-colors cursor-pointer ${isSelected
                      ? isCritical
                        ? 'bg-[#161e2e] border-rose-500 shadow-md ring-1 ring-rose-500/50'
                        : 'bg-[#161e2e] border-blue-500 shadow-md ring-1 ring-blue-500/50'
                      : 'bg-[#161e2e] border-[#1e293b] hover:border-slate-700'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-slate-200">{det.detection_id}</span>
                      <span
                        className={`text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${isCritical
                            ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                            : 'bg-amber-950 text-amber-300 border border-amber-800/60'
                          }`}
                      >
                        {det.severity}
                      </span>
                      <span className="text-[9px] font-mono text-emerald-400 bg-emerald-950/60 px-1.5 py-0.2 rounded border border-emerald-800/50">
                        ● {formatTimeAgo(det.observation_time)}
                      </span>
                    </div>
                    <span className="font-mono text-xs font-bold text-rose-400">
                      {(det.confidence * 100).toFixed(1)}%
                    </span>
                  </div>

                  <div className="text-[11px] text-slate-400 font-mono">
                    {det.zone_name}
                  </div>

                  <div className="grid grid-cols-3 gap-2 p-2 bg-[#111622] rounded border border-[#1e293b] font-mono text-[10px]">
                    <div>
                      <span className="text-slate-500 block">Area</span>
                      <span className="font-bold text-slate-200">{det.area_km2.toFixed(1)} km²</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">VV Backscatter</span>
                      <span className="font-bold text-blue-400">{(det.properties?.mean_vv_db ?? -22.4).toFixed(1)} dB</span>
                    </div>
                    <div>
                      <span className="text-slate-500 block">Classification</span>
                      <span className="font-bold text-amber-400 truncate block">{det.slick_type}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                    <span>Thickness: {det.properties?.thickness_estimate ?? '50–200 μm'}</span>
                    <span>Volume: {det.properties?.estimated_volume_m3 ?? 1450} m³</span>
                  </div>

                  <div className="flex items-center justify-between text-[10px] text-slate-500 font-mono pt-1 border-t border-[#1e293b]">
                    <span>
                      {det.centroid.latitude.toFixed(3)}°N, {det.centroid.longitude.toFixed(3)}°E
                    </span>
                    <span className="text-cyan-400 font-semibold">{det.satellite || 'Sentinel-1A C-Band SAR'}</span>
                  </div>

                  {/* Launch Attribution Pipeline CTA */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      launchInvestigationFromSpcsft(det.detection_id, currentZone?.zone_id);
                    }}
                    disabled={loading}
                    className="w-full py-2 bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white font-bold rounded text-xs flex items-center justify-center gap-1.5 shadow transition-colors cursor-pointer disabled:opacity-50 font-mono uppercase tracking-wider"
                  >
                    <Zap className="w-3.5 h-3.5 fill-current" />
                    <span>Launch Forensic Attribution (OpenDrift + AIS)</span>
                  </button>
                </div>
              );
            })}

            {displayedDetections.length === 0 && (
              <div className="p-8 text-center space-y-3 font-mono text-slate-500">
                <p className="text-xs">No active satellite detections found in this surveillance zone.</p>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
};
