import { apiFetch } from './client';

export async function getTrades(): Promise<any> {
  return apiFetch('/api/v1/trades');
}

export async function getPublicTrades(): Promise<any> {
  return apiFetch('/api/v1/trades/public');
}
