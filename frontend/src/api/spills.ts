import { request } from './client';

/**
 * Health check endpoint for system readiness.
 * GET /ping
 */
export async function pingBackend(): Promise<{ status: string }> {
  return request<{ status: string }>('/ping', {
    method: 'GET',
  });
}
