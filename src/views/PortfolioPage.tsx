'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, Banknote, TrendingUp, BarChart3, RotateCcw } from 'lucide-react';
import * as api from '../services/api';
import PortfolioWidget from '../components/PortfolioWidget';
import StatsCard from '../components/StatsCard';
import './PortfolioPage.css';

export default function PortfolioPage() {
  const [portfolio, setPortfolio] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [pnl, setPnl] = useState(null);
  const [resetting, setResetting] = useState(false);

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    const [p, h, pl] = await Promise.all([
      api.getPortfolio(),
      api.getHoldings(),
      api.getPnL(),
    ]);
    setPortfolio(p);
    setHoldings(h);
    setPnl(pl);
  };

  const handleReset = async () => {
    if (!window.confirm('Are you sure you want to reset your portfolio? All positions will be closed and balance reset to $100,000.')) return;
    setResetting(true);
    await api.resetPortfolio();
    await loadData();
    setResetting(false);
  };

  const totalHoldingsValue = holdings.reduce((s, h) => s + h.market_value, 0);

  return (
    <div className="portfolio-page animate-fade-in" id="portfolio-page">
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Portfolio</h1>
            <p>Manage your positions and track performance</p>
          </div>
          <button
            className="btn btn-outline"
            onClick={handleReset}
            disabled={resetting}
            id="btn-reset-portfolio"
          >
            <RotateCcw size={14} />
            {resetting ? 'Resetting...' : 'Reset Portfolio'}
          </button>
        </div>
      </div>

      <div className="grid-4 portfolio-stats">
        <StatsCard
          title="Total Value"
          value={`$${((portfolio?.cash_balance || 0) + totalHoldingsValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={<DollarSign size={20} />}
          variant="accent"
          trend={pnl?.total_pnl >= 0 ? 'up' : 'down'}
          trendValue={`${pnl?.total_pnl >= 0 ? '+' : ''}$${(pnl?.total_pnl || 0).toFixed(2)}`}
        />
        <StatsCard
          title="Cash Balance"
          value={`$${(portfolio?.cash_balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}`}
          icon={<Banknote size={20} />}
          variant="accent"
        />
        <StatsCard
          title="Realized P&L"
          value={`${(pnl?.realized_pnl || 0) >= 0 ? '+' : ''}$${(pnl?.realized_pnl || 0).toFixed(2)}`}
          icon={<TrendingUp size={20} />}
          variant={pnl?.realized_pnl >= 0 ? 'buy' : 'sell'}
          trend={pnl?.realized_pnl >= 0 ? 'up' : 'down'}
          trendValue="All time"
        />
        <StatsCard
          title="Unrealized P&L"
          value={`${(pnl?.unrealized_pnl || 0) >= 0 ? '+' : ''}$${(pnl?.unrealized_pnl || 0).toFixed(2)}`}
          icon={<BarChart3 size={20} />}
          variant={pnl?.unrealized_pnl >= 0 ? 'buy' : 'sell'}
          trend={pnl?.unrealized_pnl >= 0 ? 'up' : 'down'}
          trendValue="Current"
        />
      </div>

      <PortfolioWidget portfolio={portfolio} holdings={holdings} pnl={pnl} />
    </div>
  );
}
