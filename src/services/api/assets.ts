/* MOCK SERVICE: Converting Crypto to Indian Stocks */
import { apiFetch } from './client';

export const STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', current_price: 2450.85, initial_price: 2445.00 },
  { symbol: 'TCS', name: 'Tata Consultancy Services', current_price: 3680.45, initial_price: 3672.00 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank', current_price: 1642.30, initial_price: 1648.50 },
  { symbol: 'INFY', name: 'Infosys Ltd', current_price: 1543.10, initial_price: 1540.00 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank', current_price: 924.55, initial_price: 926.00 },
];

export async function getAssets(): Promise<any> {
    // Return Indian Stocks instead of remote Crypto
    return STOCKS.map(s => ({
        ...s,
        id: s.symbol,
        asset_type: 'stock'
    }));
}

export async function getAssetDetail(symbol: string): Promise<any> {
  const stock = STOCKS.find(s => s.symbol === symbol) || STOCKS[0];
  return { ...stock, id: stock.symbol, asset_type: 'stock' };
}

export async function getOrderBook(symbol: string): Promise<any> {
  const stock = STOCKS.find(s => s.symbol === symbol) || STOCKS[0];
  const p = stock.current_price;
  
  // Generate mock order book based on current price
  const bids = Array.from({length: 10}, (_, i) => [p - (i * 0.5 + 0.1), Math.random() * 500 + 100]);
  const asks = Array.from({length: 10}, (_, i) => [p + (i * 0.5 + 0.1), Math.random() * 500 + 100]);
  
  return { bids, asks };
}

export async function getCandles(symbol: string, interval: string = '1m'): Promise<any> {
  const stock = STOCKS.find(s => s.symbol === symbol) || STOCKS[0];
  const basePrice = stock.current_price;
  const now = Date.now();
  const count = 100;
  const candles = [];
  
  let lastClose = basePrice - 20;
  for (let i = 0; i < count; i++) {
    const open = lastClose;
    const close = open + (Math.random() - 0.48) * 10; // Slight upward bias
    const high = Math.max(open, close) + Math.random() * 2;
    const low = Math.min(open, close) - Math.random() * 2;
    
    candles.push({
      time: now - (count - i) * 60000,
      open, high, low, close,
      volume: Math.random() * 10000 + 1000
    });
    lastClose = close;
  }
  
  return candles;
}

export async function getAssetStats(symbol: string): Promise<any> {
  const stock = STOCKS.find(s => s.symbol === symbol) || STOCKS[0];
  const candles = await getCandles(symbol);
  
  const high_24h = Math.max(...candles.map((c: any) => c.high));
  const low_24h = Math.min(...candles.map((c: any) => c.low));
  const volume_24h = 49243650; // Mock volume in INR
  const open_24h = stock.initial_price;
  const currentPrice = stock.current_price;
  const change_24h_pct = ((currentPrice - open_24h) / open_24h) * 100;

  return {
    symbol,
    volume_24h,
    high_24h,
    low_24h,
    change_24h_pct,
    open_24h
  };
}
