// ===== SYNTHETICBULL DUMMY DATA GENERATORS =====
// All data matches the exact API response schemas from the backend

// ---------- HELPERS ----------
const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0;
  return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
});

const nanoTimestamp = (date = new Date()) => date.getTime() * 1_000_000;
const randomBetween = (min, max) => min + Math.random() * (max - min);
const randomInt = (min, max) => Math.floor(randomBetween(min, max));

// ---------- ASSETS (INDIAN STOCKS) ----------
const ASSETS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries', initial_price: 3000.00, mu: 0.00005, sigma: 0.012 },
  { symbol: 'TCS', name: 'Tata Consultancy Svc', initial_price: 4000.00, mu: 0.00006, sigma: 0.011 },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', initial_price: 1480.00, mu: 0.00004, sigma: 0.010 },
  { symbol: 'INFY', name: 'Infosys Ltd', initial_price: 1500.00, mu: 0.00005, sigma: 0.014 },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', initial_price: 950.00, mu: 0.00006, sigma: 0.012 },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', initial_price: 1120.00, mu: 0.00007, sigma: 0.015 },
  { symbol: 'ADANIENT', name: 'Adani Enterprises Ltd', initial_price: 2500.00, mu: 0.00008, sigma: 0.025 },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', initial_price: 1000.00, mu: 0.00006, sigma: 0.018 },
];

// Live-like prices that drift over time
const priceState: Record<string, number> = {};
ASSETS.forEach(a => { priceState[a.symbol] = a.initial_price; });

function getCurrentPrice(symbol: string) {
  const asset = ASSETS.find(a => a.symbol === symbol);
  if (!asset) return 0;
  const drift = (asset.mu - 0.5 * asset.sigma * asset.sigma) * 0.01;
  const diffusion = asset.sigma * (Math.random() - 0.5) * 0.1;
  priceState[symbol] *= Math.exp(drift + diffusion);
  return priceState[symbol];
}

export function getAssets() {
  return ASSETS.map(a => ({
    symbol: a.symbol,
    name: a.name,
    current_price: parseFloat(getCurrentPrice(a.symbol).toFixed(2)),
  }));
}

export function getAssetDetail(symbol: string) {
  const a = ASSETS.find(x => x.symbol === symbol);
  if (!a) return null;
  return {
    symbol: a.symbol,
    name: a.name,
    current_price: parseFloat(getCurrentPrice(a.symbol).toFixed(2)),
    initial_price: a.initial_price,
    mu: a.mu,
    sigma: a.sigma,
  };
}

// ---------- ORDER BOOK ----------
export function getOrderBook(symbol: string) {
  const price = priceState[symbol] || 1000.00;
  // Indian market tick size is typically 0.05
  const tickSize = 0.05;
  const bids: any[] = [];
  const asks: any[] = [];

  for (let i = 0; i < 15; i++) {
    const bidPrice = parseFloat((price - (i * tickSize + Math.random() * tickSize)).toFixed(2));
    const askPrice = parseFloat((price + (i * tickSize + Math.random() * tickSize)).toFixed(2));
    bids.push({
      price: bidPrice,
      total_quantity: randomInt(10, 5000),      // whole shares
      order_count: randomInt(1, 20),
    });
    asks.push({
      price: askPrice,
      total_quantity: randomInt(10, 5000),
      order_count: randomInt(1, 20),
    });
  }

  return {
    symbol,
    bids: bids.sort((a, b) => b.price - a.price),
    asks: asks.sort((a, b) => a.price - b.price),
    mid_price: parseFloat(price.toFixed(2)),
  };
}

// ---------- CANDLES (OHLCV) ----------
export function getCandles(symbol: string, interval = '1m', count = 100) {
  const basePrice = ASSETS.find(a => a.symbol === symbol)?.initial_price || 1000.00;
  const intervalMs = { '1s': 1000, '5s': 5000, '1m': 60000, '5m': 300000 }[interval] || 60000;
  const now = Date.now();
  const candles: any[] = [];
  let price = basePrice * (0.97 + Math.random() * 0.06);

  for (let i = count; i >= 0; i--) {
    const open = price;
    const change = (Math.random() - 0.48) * basePrice * 0.002;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * Math.abs(change) * 0.5;
    const low = Math.min(open, close) - Math.random() * Math.abs(change) * 0.5;
    const volume = randomInt(5000, 1000000); // realistic share volume
    const openTime = now - i * intervalMs;

    candles.push({
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume,
      open_time: nanoTimestamp(new Date(openTime)),
      close_time: nanoTimestamp(new Date(openTime + intervalMs)),
    });

    price = close;
  }

  return candles;
}

// ---------- ORDERS ----------
const ORDER_STATUSES = ['submitted', 'partial', 'filled', 'cancelled', 'rejected'];
const ORDER_TYPES = ['limit', 'market', 'stop'];
const SIDES = ['buy', 'sell'];

let mockOrders: any[] | null = null;

function generateOrders() {
  if (mockOrders) return mockOrders;
  mockOrders = [];
  for (let i = 0; i < 20; i++) {
    const sym = ASSETS[randomInt(0, ASSETS.length)].symbol;
    const price = priceState[sym] || 1000.00;
    const qty = randomInt(1, 500); // whole shares
    const filledQty = randomInt(0, qty);
    const status = ORDER_STATUSES[randomInt(0, 5)];
    const createdAt = nanoTimestamp(new Date(Date.now() - randomInt(60000, 86400000)));

    mockOrders.push({
      id: uuid(),
      asset_symbol: sym,
      type: ORDER_TYPES[randomInt(0, 3)],
      side: SIDES[randomInt(0, 2)],
      price: parseFloat((price * (0.97 + Math.random() * 0.06)).toFixed(2)),
      quantity: qty,
      filled_quantity: status === 'filled' ? qty : status === 'partial' ? filledQty : 0,
      status,
      created_at: createdAt,
      updated_at: createdAt + nanoTimestamp(new Date(randomInt(1000, 60000))),
    });
  }
  return mockOrders;
}

export function getOrders() {
  return generateOrders();
}

export function getOrderById(orderId: string) {
  return generateOrders().find(o => o.id === orderId) || null;
}

export function submitOrder(order: any) {
  const newOrder = {
    id: uuid(),
    ...order,
    filled_quantity: 0,
    status: 'submitted',
    created_at: nanoTimestamp(),
    updated_at: nanoTimestamp(),
  };
  if (mockOrders) mockOrders.unshift(newOrder);
  return { id: newOrder.id, status: 'submitted' };
}

export function cancelOrder(orderId: string) {
  if (mockOrders) {
    const order = mockOrders.find(o => o.id === orderId);
    if (order) order.status = 'cancelled';
  }
  return { id: orderId, status: 'cancelled' };
}

// ---------- TRADES ----------
let mockTrades: any[] | null = null;

function generateTrades() {
  if (mockTrades) return mockTrades;
  mockTrades = [];
  for (let i = 0; i < 50; i++) {
    const sym = ASSETS[randomInt(0, ASSETS.length)].symbol;
    const price = priceState[sym] || 1000.00;
    mockTrades.push({
      id: uuid(),
      asset_symbol: sym,
      price: parseFloat((price * (0.99 + Math.random() * 0.02)).toFixed(2)),
      quantity: randomInt(1, 1000), // whole shares
      aggressor_side: SIDES[randomInt(0, 2)],
      buy_order_id: uuid(),
      sell_order_id: uuid(),
      executed_at: nanoTimestamp(new Date(Date.now() - randomInt(1000, 3600000))),
    });
  }
  mockTrades.sort((a, b) => b.executed_at - a.executed_at);
  return mockTrades;
}

export function getTrades() {
  return generateTrades();
}

export function getPublicTrades() {
  return generateTrades().map(({ buy_order_id, sell_order_id, ...rest }) => rest);
}

// ---------- PORTFOLIO ----------
export function getPortfolio() {
  return {
    user_id: 'user-' + uuid().slice(0, 8),
    cash_balance: 574320.56,
    realized_pnl: 12450.80,
    unrealized_pnl: -3820.15,
  };
}

export function getHoldings() {
  return [
    {
      asset_symbol: 'RELIANCE',
      quantity: 100,
      avg_cost_basis: 2420.00,
      market_value: parseFloat((priceState.RELIANCE * 100).toFixed(2)),
    },
    {
      asset_symbol: 'TCS',
      quantity: 50,
      avg_cost_basis: 3580.00,
      market_value: parseFloat((priceState.TCS * 50).toFixed(2)),
    },
    {
      asset_symbol: 'HDFCBANK',
      quantity: 200,
      avg_cost_basis: 1450.00,
      market_value: parseFloat((priceState.HDFCBANK * 200).toFixed(2)),
    },
  ];
}

export function getPnL() {
  return {
    realized_pnl: 12450.80,
    unrealized_pnl: -3820.15,
    total_pnl: 8630.65,
  };
}

// ---------- BOTS ----------
export function getBots() {
  return [
    {
      id: 'bot-' + uuid().slice(0, 8),
      name: 'Nifty Scalper',
      bot_type: 'market_maker',
      is_active: true,
      config: JSON.stringify({ spread_pct: 0.002, order_size: 100, max_inventory: 5000, num_levels: 5 }),
    },
    {
      id: 'bot-' + uuid().slice(0, 8),
      name: 'Trend Follower',
      bot_type: 'alpha',
      is_active: false,
      config: JSON.stringify({ fast_ma: 10, slow_ma: 30, rsi_period: 14, rsi_overbought: 70, rsi_oversold: 30 }),
    },
  ];
}

// ---------- ADMIN / ENGINE STATS ----------
export function getEngineStats() {
  return {
    total_orders_submitted: 45847,
    total_trades_executed: 28923,
    orders_per_symbol: { RELIANCE: 12000, TCS: 11000, HDFCBANK: 8800, INFY: 6100, ICICIBANK: 4900, BHARTIARTL: 3047 },
    trades_per_symbol: { RELIANCE: 8500, TCS: 7800, HDFCBANK: 5600, INFY: 4200, ICICIBANK: 2100, BHARTIARTL: 723 },
    avg_order_latency_ms: 0.038,
    avg_match_latency_ms: 0.015,
    uptime_seconds: 17245,
  };
}

// ---------- SIMULATED TRADE STREAM ----------
export function generateLiveTrade(symbol: string) {
  const price = getCurrentPrice(symbol);
  return {
    type: 'TRADE_PRINT',
    price: parseFloat(price.toFixed(2)),
    qty: randomInt(1, 1000), // whole shares
    side: Math.random() > 0.5 ? 'buy' : 'sell',
    symbol,
  };
}
