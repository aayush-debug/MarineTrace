import { request } from './client';
import type {
  InvestigationRequest,
  InvestigationResponse,
} from '../types/investigation';

/**
 * Execute a live multi-stage investigation pipeline.
 * POST /investigate
 */
export async function runInvestigation(
  payload: InvestigationRequest
): Promise<InvestigationResponse> {
  return request<InvestigationResponse>('/investigate', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Run deterministic pre-cached demo scenario (Arabian Sea).
 * POST /demo/investigation
 */
export async function runDemoInvestigation(): Promise<InvestigationResponse> {
  return request<InvestigationResponse>('/demo/investigation', {
    method: 'POST',
  });
}

/**
 * Retrieve list of recent investigations.
 * GET /investigations?limit=20
 */
export async function listInvestigations(
  limit: number = 20
): Promise<InvestigationResponse[]> {
  return request<InvestigationResponse[]>(`/investigations?limit=${limit}`, {
    method: 'GET',
  });
}

/**
 * Retrieve a specific investigation by ID.
 * GET /investigation/{id}
 */
export async function getInvestigation(
  id: string
): Promise<InvestigationResponse> {
  return request<InvestigationResponse>(`/investigation/${encodeURIComponent(id)}`, {
    method: 'GET',
  });
}
