'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { X, Search, BarChart2, ShoppingCart, Layers, Briefcase, ClipboardList } from 'lucide-react';
import { useMarket } from '../../context/MarketContext';
import MarketTicker from './MarketTicker';
import TerminalChart from './TerminalChart';
import MarketDepth from './MarketDepth';
import TerminalOrderPanel from './TerminalOrderPanel';
import TerminalPositions from './TerminalPositions';
import TerminalOrderHistory from './TerminalOrderHistory';
import './TerminalPage.css';

type SidebarTab = 'depth' | 'orders' | 'holdings' | 'history';

// Stock data for search
const ALL_STOCKS = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd.', color: '#f59e0b' },
  { symbol: 'TCS', name: 'Tata Consultancy Services', color: '#3b82f6' },
  { symbol: 'INFY', name: 'Infosys Limited', color: '#8b5cf6' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.', color: '#22c55e' },
  { symbol: 'WIPRO', name: 'Wipro Limited', color: '#ec4899' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd.', color: '#06b6d4' },
  { symbol: 'SBIN', name: 'State Bank of India', color: '#eab308' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd.', color: '#ef4444' },
];

interface TerminalPageProps {
  stock: {
    symbol: string;
    name: string;
    price: number;
    change: number;
    changePercent: number;
  };
  onClose: () => void;
}

export default function TerminalPage({ stock, onClose }: TerminalPageProps) {
  const { assets } = useMarket();
  const [activeTab, setActiveTab] = useState<SidebarTab>('depth');
  const [currentSymbol, setCurrentSymbol] = useState(stock.symbol);
  const [currentName, setCurrentName] = useState(stock.name);
  const [livePrice, setLivePrice] = useState(stock.price);
  const [priceChange, setPriceChange] = useState(stock.change);
  const [priceChangePct, setPriceChangePct] = useState(stock.changePercent);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Map display symbol to backend symbol
  const CHART_TO_ASSET: Record<string, string> = {
    RELIANCE: assets[0]?.symbol || 'RELIANCE',
    TCS: assets[1]?.symbol || 'TCS',
    INFY: assets[2]?.symbol || 'INFY',
    HDFCBANK: assets[0]?.symbol || 'RELIANCE',
    WIPRO: assets[1]?.symbol || 'TCS',
  };
  const backendSymbol = CHART_TO_ASSET[currentSymbol] || assets[0]?.symbol || 'RELIANCE';

  // Get color for current symbol
  const stockMeta = ALL_STOCKS.find(s => s.symbol === currentSymbol);
  const stockColor = stockMeta?.color || '#6366f1';

  // Escape to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [onClose]);

  // Close search on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setShowSearch(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handlePriceUpdate = useCallback((price: number, change: number, changePct: number) => {
    if (price > 0) setLivePrice(price);
    if (change !== 0) setPriceChange(change);
    if (changePct !== 0) setPriceChangePct(changePct);
  }, []);

  const handleSwitchStock = (s: typeof ALL_STOCKS[0]) => {
    setCurrentSymbol(s.symbol);
    setCurrentName(s.name);
    setShowSearch(false);
    setSearchTerm('');
  };

  const filteredStocks = ALL_STOCKS.filter(s =>
    s.symbol !== currentSymbol &&
    (s.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const isPositive = priceChange >= 0;

  const SIDEBAR_TABS: { key: SidebarTab; label: string; icon: React.ReactNode }[] = [
    { key: 'depth', label: 'Depth', icon: <Layers size={16} /> },
    { key: 'orders', label: 'Order', icon: <ShoppingCart size={16} /> },
    { key: 'holdings', label: 'Holdings', icon: <Briefcase size={16} /> },
    { key: 'history', label: 'History', icon: <ClipboardList size={16} /> },
  ];

  return (
    <div className="terminal-overlay">
      {/* ── Market Ticker ────────────────────────── */}
      <MarketTicker currentStock={{ symbol: currentSymbol, price: livePrice, change: priceChange, changePct: priceChangePct }} />

      {/* ── Header ───────────────────────────────── */}
      <div className="terminal-header">
        <div className="terminal-stock-info">
          <div className="terminal-stock-icon" style={{ background: stockColor }}>
            {currentSymbol[0]}
          </div>
          <div className="terminal-stock-name">
            <span className="symbol">{currentSymbol}</span>
            <span className="fullname">{currentName} · NSE</span>
          </div>
        </div>

        <div className="terminal-price-block">
          <span className="terminal-live-price">
            ₹{livePrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
          <span className={`terminal-price-change ${isPositive ? 'pos' : 'neg'}`}>
            {isPositive ? '▲' : '▼'} ₹{Math.abs(priceChange).toFixed(2)} ({isPositive ? '+' : ''}{priceChangePct.toFixed(2)}%)
          </span>
        </div>

        <div style={{ flex: 1 }} />

        {/* Search */}
        <div className="terminal-search-box" ref={searchRef}>
          <Search size={14} className="search-icon" />
          <input
            placeholder="Search stocks..."
            value={searchTerm}
            onChange={e => { setSearchTerm(e.target.value); setShowSearch(true); }}
            onFocus={() => setShowSearch(true)}
          />
          {showSearch && searchTerm && filteredStocks.length > 0 && (
            <div className="terminal-search-results">
              {filteredStocks.map(s => (
                <div
                  key={s.symbol}
                  className="terminal-search-result"
                  onClick={() => handleSwitchStock(s)}
                >
                  <div>
                    <span className="sr-symbol">{s.symbol}</span>
                    <span className="sr-name">{s.name}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="terminal-close-btn" onClick={onClose} title="Close Terminal (Esc)">
          <X size={18} />
        </button>
      </div>

      {/* ── Body ─────────────────────────────────── */}
      <div className="terminal-body">
        {/* Main Chart Area */}
        <div className="terminal-main">
          <TerminalChart
            symbol={currentSymbol}
            backendSymbol={backendSymbol}
            onPriceUpdate={handlePriceUpdate}
          />
        </div>

        {/* Right Sidebar */}
        <div className="terminal-sidebar">
          <div className="terminal-sidebar-content">
            {activeTab === 'depth' && (
              <MarketDepth symbol={currentSymbol} backendSymbol={backendSymbol} />
            )}
            {activeTab === 'orders' && (
              <TerminalOrderPanel symbol={currentSymbol} currentPrice={livePrice} />
            )}
            {activeTab === 'holdings' && (
              <TerminalPositions focusSymbol={currentSymbol} />
            )}
            {activeTab === 'history' && (
              <TerminalOrderHistory symbol={currentSymbol} />
            )}
          </div>

          {/* Vertical Tab Bar */}
          <div className="terminal-sidebar-tabs">
            {SIDEBAR_TABS.map(tab => (
              <button
                key={tab.key}
                className={`sidebar-tab-btn ${activeTab === tab.key ? 'active' : ''}`}
                onClick={() => setActiveTab(tab.key)}
                title={tab.label}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
