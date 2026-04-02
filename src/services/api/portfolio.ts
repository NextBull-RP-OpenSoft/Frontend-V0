import { apiFetch } from './client';
import * as dummy from '../dummyData';

export async function getPortfolio(): Promise<any> {
  try {
    return await apiFetch('/api/v1/portfolio');
  } catch {
    return dummy.getPortfolio();
  }
}

export async function getHoldings(): Promise<any> {
  try {
    const data = await apiFetch('/api/v1/portfolio/holdings');
    // If holdings contain crypto symbols, return stock dummies
    const cryptoSymbols = new Set(['BTC', 'ETH', 'SOL', 'DOGE', 'BNB', 'XRP']);
    if (Array.isArray(data) && data.some((h: any) => cryptoSymbols.has(h.asset_symbol))) {
      return dummy.getHoldings();
    }
    return data;
  } catch {
    return dummy.getHoldings();
  }
}

export async function getPnL(): Promise<any> {
  try {
    return await apiFetch('/api/v1/portfolio/pnl');
  } catch {
    return dummy.getPnL();
  }
}

export async function resetPortfolio(): Promise<any> {
  try {
    return await apiFetch('/api/v1/portfolio/reset', { method: 'POST' });
  } catch {
    return { status: 'reset' };
  }
}
