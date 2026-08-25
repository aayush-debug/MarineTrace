/**
 * TypeScript types matching backend schemas exactly.
 */

export interface GeoJSONGeometry {
  type: 'Polygon' | 'LineString' | 'Point' | string;
  coordinates: any;
}

export interface SpillCentroid {
  latitude: number;
  longitude: number;
}

export interface SpillDetection {
  spill_detected: boolean;
  confidence: number;
  area_km2: number;
  centroid: SpillCentroid | null;
  geometry: GeoJSONGeometry | null;
  observation_time: string | null;
}

export interface SpillSummary {
  detected: boolean;
  confidence: number;
  area_km2: number;
  geometry: GeoJSONGeometry | null;
}

export interface DriftOrigin {
  latitude: number;
  longitude: number;
  confidence: number;
  geometry: GeoJSONGeometry | null;
}

export interface DriftTimeWindow {
  start: string;
  end: string;
}

export interface DriftTrajectory {
  direction: 'backward' | 'forward' | string;
  geometry: GeoJSONGeometry | null;
  timestamps: string[];
  points: number[][]; // [lon, lat]
}

export interface DriftResult {
  origin: DriftOrigin;
  origin_time_window: DriftTimeWindow;
  backward_trajectory: DriftTrajectory;
  forward_trajectory?: DriftTrajectory | null;
}

export interface VesselPosition {
  timestamp: string;
  latitude: number;
  longitude: number;
  speed: number | null;
  heading: number | null;
  course: number | null;
}

export interface VesselTrack {
  mmsi: string;
  name: string;
  vessel_type: string;
  imo?: string | null;
  flag?: string | null;
  positions: VesselPosition[];
  trajectory?: GeoJSONGeometry | null;
}

export interface FeatureScores {
  spatial: number;
  temporal: number;
  trajectory: number;
  behaviour: number;
  vessel_relevance: number;
}

export interface VesselAttribution {
  rank: number;
  vessel_name: string;
  mmsi: string;
  score: number;
  confidence: 'high' | 'medium' | 'low' | string;
  feature_scores: FeatureScores;
  reasons: string[];
  investigative_priority: 'HIGH' | 'MEDIUM' | 'LOW' | string;
  vessel_type: string;
  flag?: string | null;
  trajectory?: GeoJSONGeometry | null;
}

export type InvestigationStatus =
  | 'PENDING'
  | 'DETECTING'
  | 'DRIFTING'
  | 'TRACKING'
  | 'ATTRIBUTING'
  | 'COMPLETE'
  | 'FAILED';

export interface InvestigationRequest {
  image?: string | null;
  observation_time: string;
  backward_hours?: number;
  forward_hours?: number;
}

export interface InvestigationResponse {
  investigation_id: string;
  status: InvestigationStatus;
  created_at: string;
  observation_time: string;
  spill: SpillSummary;
  drift: DriftResult;
  vessels: VesselAttribution[];
  pipeline_duration_seconds?: number | null;
  is_demo?: boolean;
  disclaimer: string;
}

export interface SystemHealth {
  api: 'online' | 'degraded' | 'offline';
  ml: 'online' | 'degraded' | 'offline';
  drift: 'online' | 'degraded' | 'offline';
  ais: 'connected' | 'degraded' | 'disconnected';
  satellite: 'available' | 'delayed' | 'offline';
  latencyMs: number;
}

export interface EnvironmentalConditions {
  windSpeedKnots: number;
  windDirectionDeg: number;
  windDirectionCardinal: string;
  currentSpeedKnots: number;
  currentDirectionDeg: number;
  currentDirectionCardinal: string;
  seaSurfaceTempC: number;
  waveHeightMeters: number;
}
