import React from 'react';
import './StatsCard.css';

export default function StatsCard({ title, value, subtitle, icon, trend, trendValue, variant = 'default' }) {
  const isPositive = trend === 'up';
  const variantClass = variant === 'teal' ? 'stats-card-teal' :
                       variant === 'magenta' ? 'stats-card-magenta' :
                       variant === 'buy' ? 'stats-card-buy' :
                       variant === 'sell' ? 'stats-card-sell' : '';

  return (
    <div className={`stats-card card ${variantClass}`}>
      <div className="stats-card-top">
        <div className="stats-card-info">
          <span className="stats-card-title">{title}</span>
          <span className="stats-card-value mono">{value}</span>
          {subtitle && <span className="stats-card-subtitle">{subtitle}</span>}
        </div>
        {icon && <div className="stats-card-icon">{icon}</div>}
      </div>
      {trendValue !== undefined && (
        <div className={`stats-card-trend ${isPositive ? 'positive' : 'negative'}`}>
          <span>{isPositive ? '▲' : '▼'}</span>
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  );
}
