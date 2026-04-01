import React from 'react';
import './TradeHistory.css';

export default function TradeHistory({ trades, symbol }) {
  const filteredTrades = symbol
    ? trades?.filter(t => t.asset_symbol === symbol) || []
    : trades || [];

  const displayTrades = filteredTrades.slice(0, 30);

  const formatTime = (nanos) => {
    const date = new Date(Math.floor(nanos / 1_000_000));
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    });
  };

  return (
    <div className="trade-history card" id="trade-history">
      <div className="card-header">
        <h3>Recent Trades</h3>
        <span className="trade-count">{displayTrades.length} trades</span>
      </div>

      <div className="trade-labels">
        <span>Price</span>
        <span>Size</span>
        <span>Time</span>
      </div>

      <div className="trade-list">
        {displayTrades.map((trade, i) => (
          <div
            className={`trade-row ${trade.aggressor_side || trade.side}`}
            key={trade.id || i}
          >
            <span className={`trade-price mono ${trade.aggressor_side === 'buy' || trade.side === 'buy' ? 'text-buy' : 'text-sell'}`}>
              {trade.price.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
            </span>
            <span className="trade-size mono">
              {(trade.quantity || trade.qty)?.toFixed(4)}
            </span>
            <span className="trade-time mono">
              {formatTime(trade.executed_at || Date.now() * 1_000_000)}
            </span>
          </div>
        ))}
        {displayTrades.length === 0 && (
          <div className="trade-empty">No recent trades</div>
        )}
      </div>
    </div>
  );
}
