// ===== SYNTHETIC-BULL DUMMY DATA GENERATORS =====
// All data matches the exact API response schemas from the backend

// ---------- HELPERS ----------
const uuid = () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
  const r = Math.random() * 16 | 0;
  return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
});

const nanoTimestamp = (date = new Date()) => date.getTime() * 1_000_000;
const randomBetween = (min, max) => min + Math.random() * (max - min);
const randomInt = (min, max) => Math.floor(randomBetween(min, max));

// ---------- ASSETS ----------
const ASSETS = [
  { symbol: 'BTC', name: 'Bitcoin', initial_price: 50000, mu: 0.0001, sigma: 0.02 },
  { symbol: 'ETH', name: 'Ethereum', initial_price: 3000, mu: 0.00008, sigma: 0.025 },
  { symbol: 'SOL', name: 'Solana', initial_price: 150, mu: 0.00015, sigma: 0.03 },
];

// Live-like prices that drift over time
const priceState = {};
ASSETS.forEach(a => { priceState[a.symbol] = a.initial_price; });

function getCurrentPrice(symbol) {
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

export function getAssetDetail(symbol) {
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
export function getOrderBook(symbol) {
  const price = priceState[symbol] || 50000;
  const tickSize = price > 10000 ? 5 : price > 100 ? 0.5 : 0.01;
  const bids = [];
  const asks = [];

  for (let i = 0; i < 15; i++) {
    const bidPrice = parseFloat((price - (i + 1) * tickSize * (1 + Math.random())).toFixed(2));
    const askPrice = parseFloat((price + (i + 1) * tickSize * (1 + Math.random())).toFixed(2));
    bids.push({
      price: bidPrice,
      total_quantity: parseFloat(randomBetween(0.1, 5).toFixed(4)),
      order_count: randomInt(1, 8),
    });
    asks.push({
      price: askPrice,
      total_quantity: parseFloat(randomBetween(0.1, 5).toFixed(4)),
      order_count: randomInt(1, 8),
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
export function getCandles(symbol, interval = '1m', count = 100) {
  const basePrice = ASSETS.find(a => a.symbol === symbol)?.initial_price || 50000;
  const intervalMs = { '1s': 1000, '5s': 5000, '1m': 60000, '5m': 300000 }[interval] || 60000;
  const now = Date.now();
  const candles = [];
  let price = basePrice * (0.95 + Math.random() * 0.1);

  for (let i = count; i >= 0; i--) {
    const open = price;
    const change = (Math.random() - 0.48) * basePrice * 0.003;
    const close = open + change;
    const high = Math.max(open, close) + Math.random() * Math.abs(change) * 0.5;
    const low = Math.min(open, close) - Math.random() * Math.abs(change) * 0.5;
    const volume = randomBetween(0.5, 50);
    const openTime = now - i * intervalMs;

    candles.push({
      open: parseFloat(open.toFixed(2)),
      high: parseFloat(high.toFixed(2)),
      low: parseFloat(low.toFixed(2)),
      close: parseFloat(close.toFixed(2)),
      volume: parseFloat(volume.toFixed(2)),
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

let mockOrders = null;

function generateOrders() {
  if (mockOrders) return mockOrders;
  mockOrders = [];
  for (let i = 0; i < 20; i++) {
    const sym = ASSETS[randomInt(0, 3)].symbol;
    const price = priceState[sym] || 50000;
    const qty = parseFloat(randomBetween(0.01, 2).toFixed(4));
    const filledQty = parseFloat((qty * Math.random()).toFixed(4));
    const status = ORDER_STATUSES[randomInt(0, 5)];
    const createdAt = nanoTimestamp(new Date(Date.now() - randomInt(60000, 86400000)));

    mockOrders.push({
      id: uuid(),
      asset_symbol: sym,
      type: ORDER_TYPES[randomInt(0, 3)],
      side: SIDES[randomInt(0, 2)],
      price: parseFloat((price * (0.95 + Math.random() * 0.1)).toFixed(2)),
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

export function getOrderById(orderId) {
  return generateOrders().find(o => o.id === orderId) || null;
}

export function submitOrder(order) {
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

export function cancelOrder(orderId) {
  if (mockOrders) {
    const order = mockOrders.find(o => o.id === orderId);
    if (order) order.status = 'cancelled';
  }
  return { id: orderId, status: 'cancelled' };
}

// ---------- TRADES ----------
let mockTrades = null;

function generateTrades() {
  if (mockTrades) return mockTrades;
  mockTrades = [];
  for (let i = 0; i < 50; i++) {
    const sym = ASSETS[randomInt(0, 3)].symbol;
    const price = priceState[sym] || 50000;
    mockTrades.push({
      id: uuid(),
      asset_symbol: sym,
      price: parseFloat((price * (0.98 + Math.random() * 0.04)).toFixed(2)),
      quantity: parseFloat(randomBetween(0.001, 1).toFixed(4)),
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
    cash_balance: 87432.56,
    realized_pnl: 1245.80,
    unrealized_pnl: -382.15,
  };
}

export function getHoldings() {
  return [
    {
      asset_symbol: 'BTC',
      quantity: 0.5,
      avg_cost_basis: 49200.0,
      market_value: parseFloat((priceState.BTC * 0.5).toFixed(2)),
    },
    {
      asset_symbol: 'ETH',
      quantity: 3.2,
      avg_cost_basis: 2850.0,
      market_value: parseFloat((priceState.ETH * 3.2).toFixed(2)),
    },
    {
      asset_symbol: 'SOL',
      quantity: 15.0,
      avg_cost_basis: 142.50,
      market_value: parseFloat((priceState.SOL * 15.0).toFixed(2)),
    },
  ];
}

export function getPnL() {
  return {
    realized_pnl: 1245.80,
    unrealized_pnl: -382.15,
    total_pnl: 863.65,
  };
}

// ---------- BOTS ----------
export function getBots() {
  return [
    {
      id: 'bot-' + uuid().slice(0, 8),
      name: 'Market Maker',
      bot_type: 'market_maker',
      is_active: true,
      config: JSON.stringify({ spread_pct: 0.002, order_size: 0.1, max_inventory: 2.0, num_levels: 3 }),
    },
    {
      id: 'bot-' + uuid().slice(0, 8),
      name: 'Alpha Bot',
      bot_type: 'alpha',
      is_active: false,
      config: JSON.stringify({ fast_ma: 10, slow_ma: 30, rsi_period: 14, rsi_overbought: 70, rsi_oversold: 30 }),
    },
  ];
}

// ---------- ADMIN / ENGINE STATS ----------
export function getEngineStats() {
  return {
    total_orders_submitted: 15847,
    total_trades_executed: 8923,
    orders_per_symbol: { BTC: 6200, ETH: 5100, SOL: 4547 },
    trades_per_symbol: { BTC: 3700, ETH: 3100, SOL: 2123 },
    avg_order_latency_ms: 0.042,
    avg_match_latency_ms: 0.018,
    uptime_seconds: 7245,
  };
}

// ---------- SIMULATED TRADE STREAM ----------
// Returns a new random trade periodically (for simulating WebSocket TRADE_PRINT)
export function generateLiveTrade(symbol) {
  const price = getCurrentPrice(symbol);
  return {
    type: 'TRADE_PRINT',
    price: parseFloat(price.toFixed(2)),
    qty: parseFloat(randomBetween(0.001, 0.5).toFixed(4)),
    side: Math.random() > 0.5 ? 'buy' : 'sell',
    symbol,
  };
}
