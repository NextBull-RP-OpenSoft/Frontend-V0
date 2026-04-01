'use client';

import React, { useState, useEffect } from 'react';
import { FileText, Zap, Clock, Activity, Play, Pause } from 'lucide-react';
import * as api from '../services/api';
import StatsCard from '../components/StatsCard';


export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [marketPaused, setMarketPaused] = useState(false);
  const [assets, setAssets] = useState([]);
  const [gbmParams, setGbmParams] = useState<Record<string, { mu: number; sigma: number }>>({});

  useEffect(() => {
    api.getEngineStats().then(setStats).catch(() => { });
    api.getAssets().then(data => {
      const list = data || [];
      setAssets(list);
      const params = {};
      list.forEach(a => {
        params[a.symbol] = { mu: 0.0001, sigma: 0.02 };
      });
      setGbmParams(params);
    }).catch(() => { });

    const interval = setInterval(() => api.getEngineStats().then(setStats).catch(() => { }), 5000);
    return () => clearInterval(interval);
  }, []);

  const handlePauseResume = async () => {
    if (marketPaused) {
      await api.resumeMarket();
    } else {
      await api.pauseMarket();
    }
    setMarketPaused(!marketPaused);
  };

  const handleUpdateParams = async (symbol) => {
    await api.updateMarketParams(symbol, gbmParams[symbol]);
    alert(`Updated GBM parameters for ${symbol}`);
  };

  const formatUptime = (seconds) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h}h ${m}m ${s}s`;
  };

  return (
    <div className="max-w-[1200px] animate-fade-in" id="admin-page">
      <div className="page-header">
        <h1>Admin Panel</h1>
        <p>Engine statistics and market controls</p>
      </div>

      {stats && (
        <div className="grid-4 mb-8">
          <StatsCard
            title="Orders Submitted"
            value={stats.total_orders_submitted.toLocaleString()}
            icon={<FileText size={20} />}
            variant="accent"
            trend="up"
            trendValue="All time"
          />
          <StatsCard
            title="Trades Executed"
            value={stats.total_trades_executed.toLocaleString()}
            icon={<Zap size={20} />}
            variant="accent"
            trend="up"
            trendValue="All time"
          />
          <StatsCard
            title="Avg Order Latency"
            value={`${stats.avg_order_latency_ms.toFixed(3)}ms`}
            subtitle="Per order processing"
            icon={<Clock size={20} />}
            variant="accent"
          />
          <StatsCard
            title="Uptime"
            value={formatUptime(stats.uptime_seconds)}
            icon={<Activity size={20} />}
            variant="buy"
          />
        </div>
      )}

      {stats && (
        <div className="card mb-8">
          <div className="card-header">
            <h2>Orders & Trades by Symbol</h2>
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Symbol</th>
                <th>Orders</th>
                <th>Trades</th>
                <th>Fill Rate</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(stats.orders_per_symbol).map(sym => {
                const orders = stats.orders_per_symbol[sym];
                const trades = stats.trades_per_symbol[sym] || 0;
                const fillRate = orders > 0 ? (trades / orders * 100).toFixed(1) : '0.0';
                return (
                  <tr key={sym}>
                    <td><span className="order-symbol">{sym}</span></td>
                    <td className="mono">{orders.toLocaleString()}</td>
                    <td className="mono">{trades.toLocaleString()}</td>
                    <td>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-[6px] bg-[var(--bg-input)] rounded-[3px] overflow-hidden max-w-[120px]">
                          <div className="h-full bg-[var(--accent)] rounded-[3px] transition-[width] duration-250 ease-in-out" style={{ width: `${fillRate}%` }}></div>
                        </div>
                        <span className="mono">{fillRate}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-6">
        <div className="card flex flex-col">
          <div className="card-header">
            <h2>Market Control</h2>
            <span className={`badge ${marketPaused ? 'badge-sell' : 'badge-buy'}`}>
              {marketPaused ? 'PAUSED' : 'RUNNING'}
            </span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-6 leading-[1.6]">
            Pause or resume the synthetic order generation engine.
          </p>
          <button
            className={`btn btn-lg mt-auto ${marketPaused ? 'btn-primary' : 'btn-sell'}`}
            onClick={handlePauseResume}
            id="btn-pause-resume"
          >
            {marketPaused ? <><Play size={16} /> Resume Market</> : <><Pause size={16} /> Pause Market</>}
          </button>
        </div>

        <div className="card admin-gbm-params">
          <div className="card-header">
            <h2>GBM Parameters</h2>
            <span className="badge badge-accent">Price Simulation</span>
          </div>
          <p className="text-sm text-[var(--text-secondary)] mb-6 leading-[1.6]">
            Adjust the Geometric Brownian Motion drift and volatility for each asset.
          </p>
          <div className="flex flex-col gap-4">
            {Object.entries(gbmParams).map(([symbol, params]) => (
              <div className="flex items-center gap-4 p-2 bg-[var(--bg-input)] rounded-sm" key={symbol}>
                <span className="font-bold text-[var(--accent)] text-base min-w-[50px]">{symbol}</span>
                <div className="flex items-end gap-2 flex-1">
                  <div className="flex-1">
                    <label className="block text-xs text-[var(--text-muted)] mb-1 font-medium">Drift</label>
                    <input
                      type="number"
                      step="0.00001"
                      value={params.mu}
                      onChange={e => setGbmParams(prev => ({
                        ...prev,
                        [symbol]: { ...prev[symbol], mu: parseFloat(e.target.value) || 0 }
                      }))}
                      className="mono text-xs px-[10px] py-[8px]"
                      id={`gbm-mu-${symbol.toLowerCase()}`}
                    />
                  </div>
                  <div className="flex-1">
                    <label className="block text-xs text-[var(--text-muted)] mb-1 font-medium">Volatility</label>
                    <input
                      type="number"
                      step="0.001"
                      value={params.sigma}
                      onChange={e => setGbmParams(prev => ({
                        ...prev,
                        [symbol]: { ...prev[symbol], sigma: parseFloat(e.target.value) || 0 }
                      }))}
                      className="mono text-xs px-[10px] py-[8px]"
                      id={`gbm-sigma-${symbol.toLowerCase()}`}
                    />
                  </div>
                  <button
                    className="btn btn-sm btn-outline"
                    onClick={() => handleUpdateParams(symbol)}
                    id={`btn-update-gbm-${symbol.toLowerCase()}`}
                  >
                    Update
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
