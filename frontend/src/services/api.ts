/* API client for the SlickTrace backend */

import type { InvestigationResponse } from '../types/investigation';

const API_BASE = 'http://localhost:8000';

export async function runDemoInvestigation(): Promise<InvestigationResponse> {
  const res = await fetch(`${API_BASE}/demo/investigation`, {
    method: 'POST',
  });
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  return res.json();
}

export async function runInvestigation(
  observationTime: string,
  image?: string
): Promise<InvestigationResponse> {
  const res = await fetch(`${API_BASE}/investigate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      observation_time: observationTime,
      image: image || null,
    }),
  });
  if (!res.ok) throw new Error(`Backend error: ${res.status}`);
  return res.json();
}

export async function pingBackend(): Promise<boolean> {
  try {
    const res = await fetch(`${API_BASE}/ping`);
    return res.ok;
  } catch {
    return false;
  }
}
