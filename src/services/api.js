// ===== API SERVICE LAYER =====
// Real fetch() calls to the Synthetic-Bull Go API gateway at http://localhost:4000

const BASE_URL = 'http://localhost:4000';

// ---------- Core HTTP helper ----------

function getToken() {
  return localStorage.getItem('sb_token');
}

function setToken(token) {
  localStorage.setItem('sb_token', token);
}

async function apiFetch(path, options = {}, _isRetry = false) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  const token = getToken();
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Transparent token refresh on 401
  if (res.status === 401 && !_isRetry) {
    const refreshToken = localStorage.getItem('sb_refresh');
    if (refreshToken) {
      try {
        const refreshed = await refreshToken_(refreshToken);
        if (refreshed?.token) {
          setToken(refreshed.token);
          return apiFetch(path, options, true);
        }
      } catch (_) { /* fall through to throw */ }
    }
    // Refresh failed — clear auth
    localStorage.removeItem('sb_token');
    localStorage.removeItem('sb_refresh');
    window.dispatchEvent(new Event('auth:logout'));
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => 'Unknown error');
    throw new Error(text || `HTTP ${res.status}`);
  }

  // Some endpoints return empty body on success
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/json')) {
    return res.json();
  }
  return null;
}

// Internal helper (avoids circular ref when calling from apiFetch)
async function refreshToken_(refresh_token) {
  const res = await fetch(`${BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token }),
  });
  if (!res.ok) throw new Error('Refresh failed');
  return res.json();
}

// ---------- Auth ----------

export async function login(username, password) {
  return apiFetch('/api/v1/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function register(username, email, password) {
  return apiFetch('/api/v1/auth/register', {
    method: 'POST',
    body: JSON.stringify({ username, email, password }),
  });
}

export async function refreshToken(refresh_token) {
  return refreshToken_(refresh_token);
}

// ---------- User ----------

export async function getUser() {
  return apiFetch('/api/v1/users/me');
}

// ---------- Assets ----------

export async function getAssets() {
  return apiFetch('/api/v1/assets');
}

export async function getAssetDetail(symbol) {
  return apiFetch(`/api/v1/assets/${symbol}`);
}

export async function getOrderBook(symbol) {
  return apiFetch(`/api/v1/assets/${symbol}/orderbook`);
}

export async function getCandles(symbol, interval = '1m') {
  return apiFetch(`/api/v1/assets/${symbol}/candles/${interval}`);
}

// ---------- Orders ----------

export async function getOrders() {
  return apiFetch('/api/v1/orders');
}

export async function getOrderById(orderId) {
  return apiFetch(`/api/v1/orders/${orderId}`);
}

export async function submitOrder(order) {
  return apiFetch('/api/v1/orders', {
    method: 'POST',
    body: JSON.stringify(order),
  });
}

export async function cancelOrder(orderId) {
  return apiFetch(`/api/v1/orders/${orderId}`, { method: 'DELETE' });
}

export async function amendOrder(orderId, updates) {
  return apiFetch(`/api/v1/orders/${orderId}`, {
    method: 'PATCH',
    body: JSON.stringify(updates),
  });
}

// ---------- Trades ----------

export async function getTrades() {
  return apiFetch('/api/v1/trades');
}

export async function getPublicTrades() {
  return apiFetch('/api/v1/trades/public');
}

// ---------- Portfolio ----------

export async function getPortfolio() {
  return apiFetch('/api/v1/portfolio');
}

export async function getHoldings() {
  return apiFetch('/api/v1/portfolio/holdings');
}

export async function getPnL() {
  return apiFetch('/api/v1/portfolio/pnl');
}

export async function resetPortfolio() {
  return apiFetch('/api/v1/portfolio/reset', { method: 'POST' });
}

// ---------- Bots ----------

export async function getBots() {
  return apiFetch('/api/v1/bots');
}

export async function startBot(botId) {
  return apiFetch(`/api/v1/bots/${botId}/start`, { method: 'POST' });
}

export async function stopBot(botId) {
  return apiFetch(`/api/v1/bots/${botId}/stop`, { method: 'POST' });
}

export async function updateBotConfig(botId, config) {
  return apiFetch(`/api/v1/bots/${botId}/config`, {
    method: 'PATCH',
    body: JSON.stringify(config),
  });
}

// ---------- Admin ----------

export async function pauseMarket() {
  return apiFetch('/api/v1/admin/market/pause', { method: 'PATCH' });
}

export async function resumeMarket() {
  return apiFetch('/api/v1/admin/market/resume', { method: 'PATCH' });
}

export async function updateMarketParams(symbol, params) {
  return apiFetch(`/api/v1/admin/market/params/${symbol}`, {
    method: 'PATCH',
    body: JSON.stringify(params),
  });
}

export async function getEngineStats() {
  return apiFetch('/api/v1/admin/engine/stats');
}
