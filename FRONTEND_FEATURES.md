# Synthetic-Bull Frontend — Feature List

> **Tech Stack:** React 19 · React Router v7 · Lightweight Charts · WebSocket · Vanilla CSS  
> **API Backend:** Go API Gateway at `http://localhost:4000`  
> **WebSocket:** `ws://localhost:4000/ws`

---

## 1. Authentication & Authorization

| Feature | Details |
|---------|---------|
| **Login Page** | Username/password form with validation, error handling, and loading states |
| **Registration Page** | New user signup with username, email, and password |
| **JWT Auth** | Token stored in `localStorage`, auto-attached to all API requests |
| **Token Refresh** | Transparent 401 retry — auto-refreshes expired JWT using refresh token |
| **Protected Routes** | All app routes wrapped in `ProtectedRoute`; unauthenticated users redirect to `/login` |
| **Auth Context** | Global `AuthContext` provides `isAuthenticated`, `user`, `login`, `logout` across all components |

---

## 2. Trading Dashboard (`/dashboard`)

The main trading view with a 5-panel grid layout:

### 2a. Candlestick Chart
- Interactive candlestick chart using **TradingView Lightweight Charts**
- Switchable time intervals: `1m`, `5m` (extensible)
- **Live candle updates** — new trade ticks update the last candle's OHLCV in real-time via WebSocket
- Auto-polls candle data every 60s from REST API

### 2b. Order Book
- Dual-sided bid/ask depth display
- Color-coded: green (bids) / red (asks)
- Mid-price shown between bid and ask sides
- Auto-refreshes every 3s

### 2c. Order Panel
- **Buy / Sell** toggle
- **Order types:** Limit, Market, Stop
  - Limit: user sets price + quantity
  - Market: quantity only (price auto-filled)
  - Stop: trigger price + limit price + quantity
- **Quick amount buttons** (25%, 50%, 75%, 100% of balance)
- Estimated total calculation
- Submission feedback with success/error messages

### 2d. Trade History
- Live trade feed showing all public trades
- Displays: symbol, price, quantity, aggressor side, timestamp
- WebSocket `TRADE_PRINT` events injected in real-time
- REST poll fallback every 5s

### 2e. Portfolio Widget (Compact)
- Inline summary of cash balance, holdings, and P&L
- Updates on `FILL_CONFIRM` WebSocket events and 10s REST polling

---

## 3. Portfolio Page (`/portfolio`)

| Feature | Details |
|---------|---------|
| **Stats Cards** | Total Value, Cash Balance, Realized P&L, Unrealized P&L — each with trend indicators |
| **Holdings Table** | Full holdings breakdown via `PortfolioWidget` component |
| **Portfolio Reset** | One-click reset to $100,000 with confirmation dialog |
| **Live Updates** | Auto-refreshes every 5s |

---

## 4. Orders Page (`/orders`)

| Feature | Details |
|---------|---------|
| **Status Filter Tabs** | All, Submitted, Partial, Filled, Cancelled — with count badges |
| **Orders Table** | Time, Asset, Type, Side, Price, Quantity, Filled Qty, Status, Actions |
| **Cancel Orders** | Cancel button open orders (submitted/partial) |
| **Color-coded Badges** | Buy/Sell side badges, status badges with distinct colors |
| **Live Polling** | Updates every 5s |

---

## 5. Bots Page (`/bots`)

| Feature | Details |
|---------|---------|
| **Bot Cards** | Grid of trading bot cards with type icon (Market Maker 🏛️ / Alpha Bot 🧠) |
| **Start/Stop Toggle** | Toggle switch to activate/deactivate bots |
| **Live Status** | Active indicator dot + status text |
| **Config Viewer** | Displays bot configuration as key-value grid |
| **Config Editor** | Inline JSON editor with save/cancel — validates JSON before saving |
| **Auto-refresh** | Bot list refreshes every 10s |

---

## 6. Admin Panel (`/admin`)

| Feature | Details |
|---------|---------|
| **Engine Stats** | Orders Submitted, Trades Executed, Avg Order Latency (ms), Uptime |
| **Per-Symbol Stats** | Orders, Trades, and Fill Rate with progress bar — per trading pair |
| **Market Control** | Pause / Resume the synthetic order generation engine |
| **GBM Parameters** | Adjust drift (μ) and volatility (σ) per symbol (BTC, ETH, SOL) for the price simulation |
| **Live Polling** | Stats refresh every 5s |

---

## 7. Navigation & Layout

| Feature | Details |
|---------|---------|
| **Sidebar** | Icon-based navigation: Dashboard, Portfolio, Orders, Bots, Admin |
| **Navbar** | Symbol selector dropdown with live asset data (refreshes every 3s) |
| **Responsive Layout** | CSS grid-based layout with sidebar + main content area |
| **Animations** | Fade-in animations on page transitions |

---

## 8. WebSocket Integration

| Feature | Details |
|---------|---------|
| **Singleton Connection** | Single persistent WebSocket to `ws://localhost:4000/ws` |
| **Auto-Reconnect** | Exponential backoff (1s → 30s max) on disconnect |
| **Symbol Subscriptions** | Subscribe/unsubscribe per symbol; auto-resubscribes on reconnect |
| **Event Types Handled** | `TRADE_PRINT`, `FILL_CONFIRM`, `ORDER_REJECT` |
| **WS Order Submission** | `sendLimitOrder()` and `sendCancelOrder()` for low-latency order routing |

---

## 9. API Endpoints Used

| Category | Endpoints |
|----------|-----------|
| **Auth** | `POST /auth/login`, `POST /auth/register`, `POST /auth/refresh` |
| **User** | `GET /users/me` |
| **Assets** | `GET /assets`, `GET /assets/:symbol`, `GET /assets/:symbol/orderbook`, `GET /assets/:symbol/candles/:interval` |
| **Orders** | `GET /orders`, `POST /orders`, `DELETE /orders/:id`, `PATCH /orders/:id` |
| **Trades** | `GET /trades`, `GET /trades/public` |
| **Portfolio** | `GET /portfolio`, `GET /portfolio/holdings`, `GET /portfolio/pnl`, `POST /portfolio/reset` |
| **Bots** | `GET /bots`, `POST /bots/:id/start`, `POST /bots/:id/stop`, `PATCH /bots/:id/config` |
| **Admin** | `PATCH /admin/market/pause`, `PATCH /admin/market/resume`, `PATCH /admin/market/params/:symbol`, `GET /admin/engine/stats` |

---

## Running the Frontend

```bash
cd Frontend-V0
npm install
npm start
# Opens at http://localhost:3000
```
