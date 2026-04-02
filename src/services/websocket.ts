// ===== WEBSOCKET SERVICE =====
// Handles connect, reconnect, subscribe, and message routing.
import { mapSymbols, SYMBOL_MAP } from './api/client';

// Create a reverse map for outbound messages
const REVERSE_SYMBOL_MAP = Object.entries(SYMBOL_MAP).reduce((acc, [crypto, stock]) => {
    acc[stock] = crypto;
    return acc;
}, {} as Record<string, string>);

function mapToBackend(symbol: string): string {
    return REVERSE_SYMBOL_MAP[symbol] || symbol;
}

const WS_URL = 'ws://localhost:4000/ws';
const MAX_BACKOFF_MS = 30_000;

let ws = null;
let backoffMs = 1_000;
let reconnectTimer = null;
let activeSubscriptions = new Set();
const listeners = new Set();
let intentionalClose = false;

function notifyListeners(msg) {
    listeners.forEach(fn => {
        try { fn(msg); } catch (_) { }
    });
}

function resubscribeAll() {
    activeSubscriptions.forEach(symbol => {
        // Map symbol back to crypto for backend subscription
        sendRaw({ type: 'SUBSCRIBE', symbol: mapToBackend(symbol) });
    });
}

function sendRaw(payload) {
    if (ws && ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(payload));
        return true;
    }
    return false;
}

function scheduleReconnect() {
    if (reconnectTimer) return;
    reconnectTimer = setTimeout(() => {
        reconnectTimer = null;
        if (!intentionalClose) connect();
    }, backoffMs);
    backoffMs = Math.min(backoffMs * 2, MAX_BACKOFF_MS);
}

export function connect() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        return;
    }
    intentionalClose = false;

    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        backoffMs = 1_000; // reset backoff on successful connect
        resubscribeAll();
    };

    ws.onmessage = (event) => {
        try {
            const raw = JSON.parse(event.data);
            // Map crypto symbols (BTC) to safe UI symbols (RELIANCE)
            const data = mapSymbols(raw);
            notifyListeners(data);
        } catch (_) { }
    };

    ws.onclose = () => {
        if (!intentionalClose) {
            scheduleReconnect();
        }
    };

    ws.onerror = () => {
        // onclose will fire after onerror — reconnect handled there
    };
}

export function disconnect() {
    intentionalClose = true;
    if (reconnectTimer) {
        clearTimeout(reconnectTimer);
        reconnectTimer = null;
    }
    if (ws) {
        ws.close();
        ws = null;
    }
}

/** Subscribe to a symbol channel. Will map Indian stock back to crypto for backend. */
export function subscribe(symbol = '') {
    activeSubscriptions.add(symbol);
    sendRaw({ type: 'SUBSCRIBE', symbol: mapToBackend(symbol) });
}

/** Remove a symbol from active subscriptions (won't resubscribe on reconnect). */
export function unsubscribe(symbol = '') {
    activeSubscriptions.delete(symbol);
}

/** Register a callback that receives every parsed server message. Returns an unsubscribe fn. */
export function onMessage(handler) {
    listeners.add(handler);
    return () => listeners.delete(handler);
}

/** Send a LIMIT_ORDER via WebSocket. Automatically maps symbol to backend crypto code. */
export function sendLimitOrder({ symbol, side, price, size, clientOrderId }) {
    return sendRaw({
        type: 'LIMIT_ORDER',
        symbol: mapToBackend(symbol),
        side,
        price,
        size,
        client_order_id: clientOrderId,
    });
}

/** Send a CANCEL_ORDER via WebSocket. Returns false if not connected. */
export function sendCancelOrder(clientOrderId) {
    return sendRaw({ type: 'CANCEL_ORDER', client_order_id: clientOrderId });
}
