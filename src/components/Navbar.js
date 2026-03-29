import React from 'react';
import './Navbar.css';

const SYMBOLS = ['BTC', 'ETH', 'SOL'];

export default function Navbar({ selectedSymbol, onSymbolChange, assets }) {
  const currentAsset = assets?.find(a => a.symbol === selectedSymbol);
  const priceChange = currentAsset ? ((currentAsset.current_price - (currentAsset.initial_price || currentAsset.current_price)) / (currentAsset.initial_price || currentAsset.current_price) * 100) : 0;
  const isPositive = priceChange >= 0;

  return (
    <header className="navbar" id="main-navbar">
      <div className="navbar-left">
        <div className="symbol-tabs">
          {SYMBOLS.map(sym => (
            <button
              key={sym}
              className={`symbol-tab ${selectedSymbol === sym ? 'active' : ''}`}
              onClick={() => onSymbolChange(sym)}
              id={`symbol-tab-${sym.toLowerCase()}`}
            >
              <span className="symbol-name">{sym}</span>
              <span className="symbol-pair">/USD</span>
            </button>
          ))}
        </div>
      </div>

      <div className="navbar-center">
        {currentAsset && (
          <div className="price-display">
            <span className="current-price mono">
              ${currentAsset.current_price?.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
            <span className={`price-change ${isPositive ? 'positive' : 'negative'}`}>
              {isPositive ? '▲' : '▼'} {Math.abs(priceChange).toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      <div className="navbar-right">
        <div className="navbar-stat">
          <span className="stat-label">Volume</span>
          <span className="stat-value mono">$53.4M</span>
        </div>
        <div className="navbar-stat">
          <span className="stat-label">24h High</span>
          <span className="stat-value mono text-buy">
            ${currentAsset ? (currentAsset.current_price * 1.02).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
          </span>
        </div>
        <div className="navbar-stat">
          <span className="stat-label">24h Low</span>
          <span className="stat-value mono text-sell">
            ${currentAsset ? (currentAsset.current_price * 0.98).toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'}
          </span>
        </div>
        <div className="ws-status" id="ws-status">
          <span className="status-dot active"></span>
          <span>Live</span>
        </div>
      </div>
    </header>
  );
}
