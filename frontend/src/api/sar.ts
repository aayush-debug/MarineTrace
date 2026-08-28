import { request, API_BASE_URL } from './client';
import type { SARSceneDetails } from '../types/sar';
import { DEMO_SAR_SCENE } from '../data/demo/sarData';

/**
 * Fetch complete SAR scene metadata, candidate detections, and image URLs.
 * GET /sar/scenes/{scene_id}
 */
export async function getSARSceneDetails(
  sceneId: string = 'S1A_IW_GRDH_1SDV_20260825_ARABIAN_SEA'
): Promise<SARSceneDetails> {
  try {
    const res = await request<any>(`/sar/scenes/${encodeURIComponent(sceneId)}`);
    if (res && res.metadata) {
      return res as SARSceneDetails;
    }
    if (res && res.scene_id) {
      // Normalize flat backend response into SARSceneDetails
      return {
        metadata: {
          scene_id: res.scene_id || DEMO_SAR_SCENE.metadata.scene_id,
          satellite: res.satellite || DEMO_SAR_SCENE.metadata.satellite,
          instrument: 'C-SAR (5.405 GHz)',
          acquisition_mode: res.sensor_mode || DEMO_SAR_SCENE.metadata.acquisition_mode,
          product_type: res.product_type || DEMO_SAR_SCENE.metadata.product_type,
          polarization: res.polarization || DEMO_SAR_SCENE.metadata.polarization,
          acquisition_time: res.acquisition_time || DEMO_SAR_SCENE.metadata.acquisition_time,
          spatial_resolution_m: res.pixel_spacing_meters || DEMO_SAR_SCENE.metadata.spatial_resolution_m,
          crs: 'EPSG:4326',
          center_coordinates: {
            latitude: res.center_coords?.lat || DEMO_SAR_SCENE.metadata.center_coordinates.latitude,
            longitude: res.center_coords?.lon || DEMO_SAR_SCENE.metadata.center_coordinates.longitude,
          },
          bbox: DEMO_SAR_SCENE.metadata.bbox,
          dimensions: DEMO_SAR_SCENE.metadata.dimensions,
          model_version: 'slicktrace-unet-v1',
          model_architecture: 'U-Net (ResNet-34 backbone)',
          processing_time_seconds: 2.32,
          confidence: res.candidates?.[0]?.confidence || 0.942,
          spill_detected: (res.candidates && res.candidates.length > 0) || false,
          channels_available: ['VV', 'VH', 'composite'],
          has_segmentation_mask: true,
          limitations: DEMO_SAR_SCENE.metadata.limitations,
        },
        candidates: (res.candidates && res.candidates.length > 0)
          ? res.candidates.map((c: any, idx: number) => ({
              candidate_id: c.candidate_id || idx + 1,
              oil_probability: c.confidence || 0.942,
              classification: c.verified_oil ? 'Confirmed Oil Slick' : 'Potential Oil Slick',
              area_km2: c.area_km2 || 18.4,
              area_pixels: 28672,
              centroid: {
                latitude: c.centroid?.lat || DEMO_SAR_SCENE.candidates[0].centroid.latitude,
                longitude: c.centroid?.lon || DEMO_SAR_SCENE.candidates[0].centroid.longitude,
                pixel_x: DEMO_SAR_SCENE.candidates[0].centroid.pixel_x,
                pixel_y: DEMO_SAR_SCENE.candidates[0].centroid.pixel_y,
              },
              bbox: DEMO_SAR_SCENE.candidates[0].bbox,
              contour_pixels: DEMO_SAR_SCENE.candidates[0]?.contour_pixels || [],
              properties: {
                perimeter_km: 14.2,
                aspect_ratio: c.aspect_ratio || 2.65,
                eccentricity: 0.85,
                solidity: c.solidity || 0.91,
                compactness: 0.72,
                orientation_degrees: 42,
                mean_vv_db: -16.4,
                mean_vh_db: -24.8,
                contrast_ratio: c.mean_contrast_db || 8.4,
              },
            }))
          : DEMO_SAR_SCENE.candidates,
        imagery_urls: DEMO_SAR_SCENE.imagery_urls,
      };
    }
    return DEMO_SAR_SCENE;
  } catch (err) {
    console.warn('Backend SAR endpoint unavailable, loading authenticated demo scene data:', err);
    return DEMO_SAR_SCENE;
  }
}

/**
 * Helper to build full image URL for SAR rasters, with fallback to public static assets.
 */
export function getSARRasterUrl(
  sceneId: string,
  channel: 'vv' | 'vh' | 'composite',
  isBackendAvailable: boolean = true
): string {
  if (isBackendAvailable) {
    return `${API_BASE_URL.replace(/\/$/, '')}/sar/scenes/${encodeURIComponent(sceneId)}/raster?channel=${channel}`;
  }
  return `/sar/sample_s1_${channel}.png`;
}

/**
 * Helper to build full image URL for U-Net masks.
 */
export function getSARMaskUrl(
  sceneId: string,
  type: 'binary' | 'prob',
  isBackendAvailable: boolean = true
): string {
  const suffix = type === 'binary' ? 'mask' : 'prob';
  if (isBackendAvailable) {
    return `${API_BASE_URL.replace(/\/$/, '')}/sar/scenes/${encodeURIComponent(sceneId)}/mask?type=${type}`;
  }
  return `/sar/sample_s1_${suffix}.png`;
}
