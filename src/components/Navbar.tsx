'use client';

import React from 'react';
import { ChevronUp, ChevronDown, Sun, Moon } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useMarket } from '../context/MarketContext';
import './Navbar.css';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { selectedSymbol, setSelectedSymbol, assets, marketStats } = useMarket();

  const currentAsset = assets?.find(a => a.symbol === selectedSymbol);
  const priceChange = currentAsset
    ? ((currentAsset.current_price - (currentAsset.initial_price || currentAsset.current_price)) /
       (currentAsset.initial_price || currentAsset.current_price) * 100)
    : 0;
  const isPositive = priceChange >= 0;
  const stats = marketStats || {};

  return (
    <header className="navbar" id="main-navbar">
      <div className="navbar-left">
        <div className="symbol-tabs">
          {assets.map(asset => (
            <button
              key={asset.symbol}
              className={`symbol-tab ${selectedSymbol === asset.symbol ? 'active' : ''}`}
              onClick={() => setSelectedSymbol(asset.symbol)}
              id={`symbol-tab-${asset.symbol.toLowerCase()}`}
            >
              <span className="symbol-name">{asset.symbol}</span>
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
              {isPositive ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              {Math.abs(priceChange).toFixed(2)}%
            </span>
          </div>
        )}
      </div>

      <div className="navbar-right">
        <div className="navbar-stat">
          <span className="stat-label">Volume</span>
          <span className="stat-value mono">
            {stats.volume != null ? `$${(stats.volume).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '--'}
          </span>
        </div>
        <div className="navbar-stat">
          <span className="stat-label">24h High</span>
          <span className="stat-value mono text-buy">
            {stats.high24h != null ? `$${stats.high24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '--'}
          </span>
        </div>
        <div className="navbar-stat">
          <span className="stat-label">24h Low</span>
          <span className="stat-value mono text-sell">
            {stats.low24h != null ? `$${stats.low24h.toLocaleString(undefined, { maximumFractionDigits: 2 })}` : '--'}
          </span>
        </div>
        <button className="theme-toggle" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>
        <div className="ws-status" id="ws-status">
          <span className="status-dot active"></span>
          <span>Live</span>
        </div>
      </div>
    </header>
  );
}
