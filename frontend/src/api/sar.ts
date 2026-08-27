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
    const res = await request<SARSceneDetails>(`/sar/scenes/${encodeURIComponent(sceneId)}`);
    return res;
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
