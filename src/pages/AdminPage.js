import React, { useState, useEffect } from 'react';
import * as api from '../services/api';
import StatsCard from '../components/StatsCard';
import './AdminPage.css';

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [marketPaused, setMarketPaused] = useState(false);
  const [gbmParams, setGbmParams] = useState({
    BTC: { mu: 0.0001, sigma: 0.02 },
    ETH: { mu: 0.00008, sigma: 0.025 },
    SOL: { mu: 0.00015, sigma: 0.03 },
  });

  useEffect(() => {
    api.getEngineStats().then(setStats).catch(() => { });
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
    <div className="admin-page animate-fade-in" id="admin-page">
      <div className="page-header">
        <h1>Admin Panel</h1>
        <p>Engine statistics and market controls</p>
      </div>

      {/* Engine Stats */}
      {stats && (
        <div className="grid-4 admin-stats">
          <StatsCard
            title="Orders Submitted"
            value={stats.total_orders_submitted.toLocaleString()}
            icon="📝"
            variant="teal"
            trend="up"
            trendValue="All time"
          />
          <StatsCard
            title="Trades Executed"
            value={stats.total_trades_executed.toLocaleString()}
            icon="⚡"
            variant="magenta"
            trend="up"
            trendValue="All time"
          />
          <StatsCard
            title="Avg Order Latency"
            value={`${stats.avg_order_latency_ms.toFixed(3)}ms`}
            subtitle="Per order processing"
            icon="⏱️"
            variant="teal"
          />
          <StatsCard
            title="Uptime"
            value={formatUptime(stats.uptime_seconds)}
            icon="🟢"
            variant="buy"
          />
        </div>
      )}

      {/* Per-Symbol Stats */}
      {stats && (
        <div className="card admin-symbol-stats">
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
                      <div className="fill-rate">
                        <div className="fill-rate-bar">
                          <div className="fill-rate-fill" style={{ width: `${fillRate}%` }}></div>
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

      <div className="admin-controls-row">
        {/* Market Control */}
        <div className="card admin-market-control">
          <div className="card-header">
            <h2>Market Control</h2>
            <span className={`badge ${marketPaused ? 'badge-sell' : 'badge-buy'}`}>
              {marketPaused ? 'PAUSED' : 'RUNNING'}
            </span>
          </div>
          <p className="admin-description">
            Pause or resume the synthetic order generation engine.
          </p>
          <button
            className={`btn btn-lg ${marketPaused ? 'btn-primary' : 'btn-sell'}`}
            onClick={handlePauseResume}
            id="btn-pause-resume"
          >
            {marketPaused ? '▶ Resume Market' : '⏸ Pause Market'}
          </button>
        </div>

        {/* GBM Parameters */}
        <div className="card admin-gbm-params">
          <div className="card-header">
            <h2>GBM Parameters</h2>
            <span className="badge badge-magenta">Price Simulation</span>
          </div>
          <p className="admin-description">
            Adjust the Geometric Brownian Motion drift (μ) and volatility (σ) for each asset.
          </p>
          <div className="gbm-params-grid">
            {Object.entries(gbmParams).map(([symbol, params]) => (
              <div className="gbm-param-row" key={symbol}>
                <span className="gbm-symbol">{symbol}</span>
                <div className="gbm-inputs">
                  <div className="gbm-input-group">
                    <label>μ (drift)</label>
                    <input
                      type="number"
                      step="0.00001"
                      value={params.mu}
                      onChange={e => setGbmParams(prev => ({
                        ...prev,
                        [symbol]: { ...prev[symbol], mu: parseFloat(e.target.value) || 0 }
                      }))}
                      className="mono"
                      id={`gbm-mu-${symbol.toLowerCase()}`}
                    />
                  </div>
                  <div className="gbm-input-group">
                    <label>σ (volatility)</label>
                    <input
                      type="number"
                      step="0.001"
                      value={params.sigma}
                      onChange={e => setGbmParams(prev => ({
                        ...prev,
                        [symbol]: { ...prev[symbol], sigma: parseFloat(e.target.value) || 0 }
                      }))}
                      className="mono"
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
