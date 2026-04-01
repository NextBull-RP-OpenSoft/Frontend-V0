'use client';

import React from 'react';
import { Search, Zap, Sun, Moon, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useMarket } from '../context/MarketContext';
import './Navbar.css';

export default function Navbar() {
  const { theme, toggleTheme } = useTheme();
  const { selectedSymbol, setSelectedSymbol, assets, marketStats } = useMarket();

  const currentAsset = assets?.find(a => a.symbol === selectedSymbol);
  const stats = marketStats || {};

  const calculateChange = (asset) => {
    if (!asset) return 0;
    const initial = asset.initial_price || asset.current_price;
    return ((asset.current_price - initial) / initial) * 100;
  };

  const formatCurrency = (val, dec = 2) => {
    if (val == null) return '--';
    return `₹${val.toLocaleString('en-IN', { minimumFractionDigits: dec, maximumFractionDigits: dec })}`;
  };

  return (
    <header className="navbar-v2" id="main-navbar">
      {/* Left: Search */}
      <div className="nav-section nav-search">
        <div className="search-box">
          <Search size={16} className="search-icon" />
          <input type="text" placeholder="Search stocks..." />
        </div>
      </div>

      {/* Middle-Left: Ticker Tabs */}
      <div className="nav-section nav-ticker">
        <button className="ticker-nav-btn"><ChevronLeft size={16} /></button>
        <div className="ticker-scroll">
          {assets.map(asset => {
            const change = calculateChange(asset);
            const isPos = change >= 0;
            return (
              <button
                key={asset.symbol}
                className={`ticker-tab ${selectedSymbol === asset.symbol ? 'active' : ''}`}
                onClick={() => setSelectedSymbol(asset.symbol)}
              >
                <span className="ticker-symbol">{asset.symbol}</span>
                <span className="ticker-price">{formatCurrency(asset.current_price)}</span>
                <span className={`ticker-change ${isPos ? 'pos' : 'neg'}`}>
                  {isPos ? '+' : ''}{change.toFixed(2)}%
                </span>
              </button>
            );
          })}
        </div>
        <button className="ticker-nav-btn"><ChevronRight size={16} /></button>
      </div>

      {/* Middle-Right: Quick Stats / Order */}
      <div className="nav-section nav-asset-detail">
        <button 
          className="nav-place-order-btn"
          onClick={() => {
            const el = document.getElementById('order-panel');
            el?.scrollIntoView({ behavior: 'smooth' });
          }}
        >
          <Zap size={14} fill="currentColor" />
          Place Order
        </button>

        {currentAsset && (
          <div className="asset-quick-info">
            <div className="info-main">
              <span className="info-price">{formatCurrency(currentAsset.current_price)}</span>
              <span className={`info-change ${calculateChange(currentAsset) >= 0 ? 'pos' : 'neg'}`}>
                {calculateChange(currentAsset) >= 0 ? '▲' : '▼'} {Math.abs(calculateChange(currentAsset)).toFixed(2)}%
              </span>
            </div>
            <div className="info-stats">
              <div className="stat-item">
                <span className="stat-label">VOL</span>
                <span className="stat-value">2K</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">HI</span>
                <span className="stat-value">{formatCurrency(stats.high24h)}</span>
              </div>
              <div className="stat-item">
                <span className="stat-label">LO</span>
                <span className="stat-value">{formatCurrency(stats.low24h)}</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Right: Actions */}
      <div className="nav-section nav-actions">
        <button className="theme-toggle" onClick={toggleTheme}>
          {theme === 'dark' ? <Moon size={18} /> : <Sun size={18} />}
        </button>
        <div className="nav-status">
          <span className="status-dot"></span>
          Live
        </div>
      </div>
    </header>
  );
}
