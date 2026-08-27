import { request } from './client';
import type { DriftResult, DriftTrajectory, GeoJSONGeometry } from '../types/investigation';

export interface StandaloneDriftRequest {
  centroid_lat: number;
  centroid_lon: number;
  observation_time: string;
  geometry?: GeoJSONGeometry | null;
  hours?: number;
}

/**
 * Execute standalone reverse-drift backtracking.
 * POST /drift/backward
 */
export async function runBackwardDrift(
  payload: StandaloneDriftRequest
): Promise<DriftResult> {
  return request<DriftResult>('/drift/backward', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      hours: payload.hours || 24,
    }),
  });
}

/**
 * Execute standalone forward drift prediction.
 * POST /drift/forward
 */
export async function runForwardDrift(
  payload: StandaloneDriftRequest
): Promise<DriftTrajectory> {
  return request<DriftTrajectory>('/drift/forward', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      hours: payload.hours || 24,
    }),
  });
}
