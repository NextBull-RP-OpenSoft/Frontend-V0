/* MOCK SERVICE: Converting Crypto to Indian Stocks */
import { apiFetch } from './client';
import * as dummy from '../dummyData';

// ===== STOCK ASSETS — with dummy fallback =====
// The backend runs crypto (BTC/ETH/SOL). This layer intercepts that and
// returns our stock-market dummy data instead so the frontend always shows stocks.

const STOCK_SYMBOLS = new Set(['RELIANCE', 'TCS', 'INFY', 'HDFCBANK', 'ICICIBANK', 'BHARTIARTL', 'ADANIENT', 'TATAMOTORS']);

export async function getAssets(): Promise<any> {
  try {
    const data = await apiFetch('/api/v1/assets');
    if (!data || (Array.isArray(data) && data.length === 0)) return dummy.getAssets();
    return data;
  } catch {
    return dummy.getAssets();
  }
}

export async function getAssetDetail(symbol: string): Promise<any> {
  if (STOCK_SYMBOLS.has(symbol)) return dummy.getAssetDetail(symbol);
  try {
    return await apiFetch(`/api/v1/assets/${symbol}`);
  } catch {
    return dummy.getAssetDetail(symbol);
  }
}

export async function getOrderBook(symbol: string): Promise<any> {
  if (STOCK_SYMBOLS.has(symbol)) return dummy.getOrderBook(symbol);
  try {
    return await apiFetch(`/api/v1/assets/${symbol}/orderbook`);
  } catch {
    return dummy.getOrderBook(symbol);
  }
}

export async function getCandles(symbol: string, interval: string = '1m'): Promise<any> {
  if (STOCK_SYMBOLS.has(symbol)) return dummy.getCandles(symbol, interval);
  try {
    const data = await apiFetch(`/api/v1/assets/${symbol}/candles/${interval}`);
    return data;
  } catch {
    return dummy.getCandles(symbol, interval);
  }
}

// Workaround for missing GET /api/v1/assets/{symbol}/stats
export async function getAssetStats(symbol: string): Promise<any> {
  const candles = await getCandles(symbol, '1m');
  if (!candles || candles.length === 0) {
    return { symbol, volume_24h: 0, high_24h: 0, low_24h: 0, change_24h_pct: 0, open_24h: 0 };
  }

  const high_24h = Math.max(...candles.map((c: any) => c.high));
  const low_24h = Math.min(...candles.map((c: any) => c.low));
  const volume_24h = candles.reduce((sum: number, c: any) => sum + (c.volume || 0), 0);
  const open_24h = candles[0].open;
  const currentPrice = candles[candles.length - 1].close;
  const change_24h_pct = open_24h > 0 ? ((currentPrice - open_24h) / open_24h) * 100 : 0;

  return { symbol, volume_24h, high_24h, low_24h, change_24h_pct, open_24h };
}
