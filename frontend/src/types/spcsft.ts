/**
 * TypeScript definitions for Space Shift (SateAIs™) Real-Time Oil Detection API.
 */

import type { GeoJSONGeometry } from './investigation';

export interface SpaceShiftDetectionProperties {
  perimeter_km: number;
  aspect_ratio: number;
  eccentricity: number;
  solidity: number;
  compactness: number;
  orientation_degrees: number;
  mean_vv_db: number;
  mean_vh_db: number;
  contrast_ratio: number;
  thickness_estimate?: string;
  estimated_volume_m3?: number;
  wind_speed_knots?: number;
  wave_height_m?: number;
}

export interface SpaceShiftDetection {
  detection_id: string;
  job_id?: string;
  zone_name: string;
  observation_time: string;
  satellite: string;
  confidence: number;
  oil_probability: number;
  area_km2: number;
  centroid: {
    latitude: number;
    longitude: number;
  };
  geometry: GeoJSONGeometry;
  core_geometry?: GeoJSONGeometry | null;
  sheen_geometry?: GeoJSONGeometry[] | null;
  slick_type: string;
  lookalike_risk: string;
  severity: 'CRITICAL' | 'HIGH' | 'MODERATE' | 'LOW';
  properties?: SpaceShiftDetectionProperties;
}

export interface SpaceShiftJobRequest {
  polygon?: any;
  date_start?: string;
  date_end?: string;
  satellite_id?: string;
  zone_id?: string;
  name?: string;
  threshold?: number;
  polarization?: string[];
}

export interface SpaceShiftJobResponse {
  job_id: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  message?: string;
  created_at: string;
  completed_at?: string;
  results: SpaceShiftDetection[];
  raw_geojson?: any;
}

export interface SpaceShiftMonitoringZone {
  zone_id: string;
  name: string;
  region: string;
  bbox: [number, number, number, number]; // [min_lon, min_lat, max_lon, max_lat]
  center: [number, number]; // [lat, lon]
  risk_level: 'CRITICAL' | 'HIGH' | 'MODERATE';
  last_scan: string;
  active_slicks_count: number;
  satellite_coverage: string;
}

export interface SpaceShiftLiveFeedResponse {
  status: string;
  api_endpoint: string;
  sync_timestamp: string;
  total_detections: number;
  active_critical_alerts: number;
  zones: SpaceShiftMonitoringZone[];
  detections: SpaceShiftDetection[];
  system_status: Record<string, any>;
}

export interface SpaceShiftHealth {
  status: 'online' | 'degraded' | 'offline';
  endpoint: string;
  api_version: string;
  has_api_key: boolean;
  authenticated: boolean;
  latency_ms: number;
  timestamp: string;
  quota_remaining?: number;
}
