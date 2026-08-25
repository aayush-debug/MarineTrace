/* TypeScript interfaces mirroring backend Pydantic models */

export interface GeoJSONGeometry {
  type: string;
  coordinates: number[] | number[][] | number[][][] | number[][][][];
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
  direction: string;
  geometry: GeoJSONGeometry | null;
  timestamps: string[];
  points: number[][];
}

export interface DriftResult {
  origin: DriftOrigin;
  origin_time_window: DriftTimeWindow;
  backward_trajectory: DriftTrajectory;
  forward_trajectory: DriftTrajectory | null;
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
  confidence: string;
  feature_scores: FeatureScores;
  reasons: string[];
  investigative_priority: string;
  vessel_type: string;
  flag: string | null;
  trajectory: GeoJSONGeometry | null;
}

export interface InvestigationResponse {
  investigation_id: string;
  status: string;
  created_at: string;
  observation_time: string;
  spill: SpillSummary;
  drift: DriftResult;
  vessels: VesselAttribution[];
  pipeline_duration_seconds: number | null;
  is_demo: boolean;
  disclaimer: string;
}
