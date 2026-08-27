import { request } from './client';
import type { VesselTrack } from '../types/investigation';

export interface VesselSearchParams {
  min_lat: number;
  max_lat: number;
  min_lon: number;
  max_lon: number;
  start_time: string;
  end_time: string;
}

/**
 * Query historical AIS tracks within a bounding box and temporal window.
 * GET /vessels/search
 */
export async function searchVessels(
  params: VesselSearchParams
): Promise<VesselTrack[]> {
  const query = new URLSearchParams({
    min_lat: params.min_lat.toString(),
    max_lat: params.max_lat.toString(),
    min_lon: params.min_lon.toString(),
    max_lon: params.max_lon.toString(),
    start_time: params.start_time,
    end_time: params.end_time,
  });

  return request<VesselTrack[]>(`/vessels/search?${query.toString()}`, {
    method: 'GET',
  });
}

/**
 * Fetch vessel track by MMSI identifier.
 * GET /vessels/{mmsi}
 */
export async function getVesselByMmsi(
  mmsi: string
): Promise<VesselTrack | null> {
  return request<VesselTrack | null>(`/vessels/${encodeURIComponent(mmsi)}`, {
    method: 'GET',
  });
}
