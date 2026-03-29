// ===== API SERVICE LAYER =====
// Currently returns dummy data. Swap to real fetch() calls when backend is connected.

import * as dummy from './dummyData';

const BASE_URL = 'http://localhost:4000';

// ---------- Auth ----------
export async function login(username, password) {
  // TODO: POST /api/v1/auth/login
  return {
    token: 'dummy-jwt-token-' + Date.now(),
    refresh_token: 'dummy-refresh-token-' + Date.now(),
  };
}

export async function register(username, email, password) {
  // TODO: POST /api/v1/auth/register
  return {
    id: 'user-' + Date.now(),
    username,
    email,
  };
}

export async function refreshToken(refresh_token) {
  // TODO: POST /api/v1/auth/refresh
  return { token: 'dummy-jwt-token-refreshed-' + Date.now() };
}

// ---------- User ----------
export async function getUser() {
  // TODO: GET /api/v1/users/me
  return {
    id: '550e8400-e29b-41d4-a716-446655440000',
    username: 'trader_one',
    email: 'trader@syntheticbull.com',
    created_at: Date.now() * 1_000_000,
  };
}

// ---------- Assets ----------
export async function getAssets() {
  return dummy.getAssets();
}

export async function getAssetDetail(symbol) {
  return dummy.getAssetDetail(symbol);
}

export async function getOrderBook(symbol) {
  return dummy.getOrderBook(symbol);
}

export async function getCandles(symbol, interval) {
  return dummy.getCandles(symbol, interval);
}

// ---------- Orders ----------
export async function getOrders() {
  return dummy.getOrders();
}

export async function getOrderById(orderId) {
  return dummy.getOrderById(orderId);
}

export async function submitOrder(order) {
  return dummy.submitOrder(order);
}

export async function cancelOrder(orderId) {
  return dummy.cancelOrder(orderId);
}

export async function amendOrder(orderId, updates) {
  // TODO: PATCH /api/v1/orders/{orderId}
  return { id: 'new-order-' + Date.now(), status: 'submitted' };
}

// ---------- Trades ----------
export async function getTrades() {
  return dummy.getTrades();
}

export async function getPublicTrades() {
  return dummy.getPublicTrades();
}

// ---------- Portfolio ----------
export async function getPortfolio() {
  return dummy.getPortfolio();
}

export async function getHoldings() {
  return dummy.getHoldings();
}

export async function getPnL() {
  return dummy.getPnL();
}

export async function resetPortfolio() {
  return { success: true };
}

// ---------- Bots ----------
export async function getBots() {
  return dummy.getBots();
}

export async function startBot(botId) {
  return { success: true };
}

export async function stopBot(botId) {
  return { success: true };
}

export async function updateBotConfig(botId, config) {
  return { success: true };
}

// ---------- Admin ----------
export async function pauseMarket() {
  return { success: true };
}

export async function resumeMarket() {
  return { success: true };
}

export async function updateMarketParams(symbol, params) {
  return { success: true };
}

export async function getEngineStats() {
  return dummy.getEngineStats();
}

// ---------- Live data (simulating WebSocket) ----------
export function generateLiveTrade(symbol) {
  return dummy.generateLiveTrade(symbol);
}
