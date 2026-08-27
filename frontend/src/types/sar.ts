export type SARMode = 'overlay' | 'raw' | 'mask';
export type SARChannel = 'VV' | 'VH' | 'composite';
export type SARMaskType = 'binary' | 'prob';

export interface SARCandidateProperties {
  perimeter_km: number;
  aspect_ratio: number;
  eccentricity: number;
  solidity: number;
  compactness: number;
  orientation_degrees: number;
  mean_vv_db: number;
  mean_vh_db: number;
  contrast_ratio: number;
}

export interface SARCandidate {
  candidate_id: number;
  oil_probability: number;
  classification: string;
  area_km2: number;
  area_pixels: number;
  centroid: {
    latitude: number;
    longitude: number;
    pixel_x: number;
    pixel_y: number;
  };
  bbox: {
    min_row: number;
    max_row: number;
    min_col: number;
    max_col: number;
  };
  contour_pixels: [number, number][];
  geo_coordinates?: [number, number][];
  properties: SARCandidateProperties;
}

export interface SARSceneMetadata {
  scene_id: string;
  satellite: string;
  instrument: string;
  acquisition_mode: string;
  product_type: string;
  polarization: string;
  acquisition_time: string;
  spatial_resolution_m: number;
  crs: string;
  center_coordinates: {
    latitude: number;
    longitude: number;
  };
  bbox: {
    min_latitude: number;
    max_latitude: number;
    min_longitude: number;
    max_longitude: number;
  };
  dimensions: {
    width: number;
    height: number;
  };
  model_version: string;
  model_architecture: string;
  processing_time_seconds: number;
  confidence: number;
  spill_detected: boolean;
  channels_available: SARChannel[];
  has_segmentation_mask: boolean;
  limitations: string[];
}

export interface SARSceneDetails {
  metadata: SARSceneMetadata;
  candidates: SARCandidate[];
  imagery_urls: {
    vv: string;
    vh: string;
    composite: string;
    mask: string;
    prob: string;
  };
}

export interface SARImageEnhancement {
  brightness: number; // 50 to 150 (default 100)
  contrast: number;   // 50 to 200 (default 100)
  gamma: number;      // 0.5 to 2.0 (default 1.0)
}
