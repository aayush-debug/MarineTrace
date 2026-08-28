import { request } from './client';
import type {
  SpaceShiftHealth,
  SpaceShiftJobRequest,
  SpaceShiftJobResponse,
  SpaceShiftLiveFeedResponse,
} from '../types/spcsft';
import type { InvestigationResponse } from '../types/investigation';

/**
 * Check Space Shift API connectivity and status.
 * GET /spcsft/health
 */
export async function getSpcsftHealth(apiKey?: string): Promise<SpaceShiftHealth> {
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  return request<SpaceShiftHealth>('/spcsft/health', {
    method: 'GET',
    headers,
  });
}

/**
 * Validate a Space Shift API key.
 * POST /spcsft/test-key
 */
export async function testSpcsftKey(
  apiKey: string,
  baseUrl?: string
): Promise<SpaceShiftHealth> {
  return request<SpaceShiftHealth>('/spcsft/test-key', {
    method: 'POST',
    body: JSON.stringify({ api_key: apiKey, base_url: baseUrl }),
  });
}

/**
 * Retrieve real-time synchronized oil spill surveillance feed from Space Shift.
 * GET /spcsft/live-feed
 */
export async function getSpcsftLiveFeed(
  zoneId?: string,
  apiKey?: string
): Promise<SpaceShiftLiveFeedResponse> {
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  const query = zoneId ? `?zone_id=${encodeURIComponent(zoneId)}` : '';
  return request<SpaceShiftLiveFeedResponse>(`/spcsft/live-feed${query}`, {
    method: 'GET',
    headers,
  });
}

/**
 * Submit a direct SAR oil slick detection job to Space Shift SateAIs.
 * POST /spcsft/detect
 */
export async function submitSpcsftJob(
  payload: SpaceShiftJobRequest,
  apiKey?: string
): Promise<SpaceShiftJobResponse> {
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  return request<SpaceShiftJobResponse>('/spcsft/detect', {
    method: 'POST',
    body: JSON.stringify(payload),
    headers,
  });
}

/**
 * Poll detection job status from Space Shift.
 * GET /spcsft/jobs/{id}
 */
export async function getSpcsftJobStatus(
  jobId: string,
  apiKey?: string
): Promise<SpaceShiftJobResponse> {
  const headers: Record<string, string> = {};
  if (apiKey) {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }
  return request<SpaceShiftJobResponse>(`/spcsft/jobs/${encodeURIComponent(jobId)}`, {
    method: 'GET',
    headers,
  });
}

/**
 * 1-Click Bridge: Launch full MarineTrace backward drift & AIS attribution
 * investigation from a Space Shift detected slick.
 * POST /spcsft/investigate
 */
export async function launchInvestigationFromSpcsft(
  detectionId?: string,
  zoneId?: string,
  apiKey?: string
): Promise<InvestigationResponse> {
  return request<InvestigationResponse>('/spcsft/investigate', {
    method: 'POST',
    body: JSON.stringify({
      detection_id: detectionId,
      zone_id: zoneId,
      custom_key: apiKey,
      backward_hours: 24,
      forward_hours: 24,
    }),
  });
}

/**
 * Trigger immediate real-time Sentinel-1 satellite pass ingestion.
 * POST /spcsft/ingest-pass
 */
export async function ingestSatellitePass(): Promise<{ status: string; message: string; new_detection: any }> {
  return request<{ status: string; message: string; new_detection: any }>('/spcsft/ingest-pass', {
    method: 'POST',
  });
}
