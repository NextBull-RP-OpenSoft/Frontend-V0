import { apiFetch } from './client';

export async function getPortfolio(): Promise<any> {
  return apiFetch('/api/v1/portfolio');
}

export async function getHoldings(): Promise<any> {
  return apiFetch('/api/v1/portfolio/holdings');
}

export async function getPnL(): Promise<any> {
  return apiFetch('/api/v1/portfolio/pnl');
}

export async function resetPortfolio(): Promise<any> {
  return apiFetch('/api/v1/portfolio/reset', { method: 'POST' });
}
