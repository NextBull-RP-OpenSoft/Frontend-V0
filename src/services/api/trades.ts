import { apiFetch } from './client';
import * as dummy from '../dummyData';

const CRYPTO_SYMBOLS = new Set(['BTC', 'ETH', 'SOL', 'DOGE', 'BNB', 'XRP']);

function hasCryptoTrades(data: any[]): boolean {
  return Array.isArray(data) && data.some(t => CRYPTO_SYMBOLS.has(t.asset_symbol));
}

export async function getTrades(): Promise<any> {
  try {
    const data = await apiFetch('/api/v1/trades');
    if (hasCryptoTrades(data)) return dummy.getTrades();
    return data;
  } catch {
    return dummy.getTrades();
  }
}

export async function getPublicTrades(): Promise<any> {
  try {
    const data = await apiFetch('/api/v1/trades/public');
    if (hasCryptoTrades(data)) return dummy.getPublicTrades();
    return data;
  } catch {
    return dummy.getPublicTrades();
  }
}
