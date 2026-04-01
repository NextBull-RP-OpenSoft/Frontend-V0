'use client';

import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp } from 'lucide-react';
import StatsCard from '../components/StatsCard';
import * as api from '../services/api';
import './OrdersPage.css';

const STATUS_TABS = ['all', 'submitted', 'partial', 'filled', 'cancelled'];

const statusBadgeClass = (status) => {
  switch (status) {
    case 'submitted': return 'badge-info';
    case 'partial': return 'badge-warning';
    case 'filled': return 'badge-buy';
    case 'cancelled': return 'badge-sell';
    case 'rejected': return 'badge-sell';
    default: return '';
  }
};

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('all');
  const [pnl, setPnl] = useState(null);

  const loadData = async () => {
    try {
      const [o, p] = await Promise.all([
        api.getOrders(),
        api.getPnL()
      ]);
      setOrders(o || []);
      setPnl(p);
    } catch (err) {
      console.error('Failed to load orders data', err);
    }
  };

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = activeTab === 'all'
    ? orders
    : orders.filter(o => o.status === activeTab);

  const formatDate = (nanos) => {
    const date = new Date(Math.floor(nanos / 1_000_000));
    return date.toLocaleString('en-IN', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    });
  };

  const handleCancel = async (orderId) => {
    await api.cancelOrder(orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'cancelled' } : o));
  };

  return (
    <div className="orders-page animate-fade-in" id="orders-page">
      <div className="page-header">
        <h1>Orders</h1>
        <p>View and manage your trading orders</p>
      </div>

      <div className="stats-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
        <StatsCard
          title="Unrealized P&L"
          value={`${(pnl?.unrealized_pnl || 0) >= 0 ? '+' : ''}₹${(pnl?.unrealized_pnl || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="Open Positions"
          icon={<BarChart3 size={20} />}
          variant={(pnl?.unrealized_pnl || 0) >= 0 ? 'buy' : 'sell'}
          trend={(pnl?.unrealized_pnl || 0) >= 0 ? 'up' : 'down'}
          trendValue="Current"
        />
        <StatsCard
          title="Realized P&L"
          value={`${(pnl?.realized_pnl || 0) >= 0 ? '+' : ''}₹${(pnl?.realized_pnl || 0).toLocaleString('en-IN', { minimumFractionDigits: 2 })}`}
          subtitle="Closed Positions"
          icon={<TrendingUp size={20} />}
          variant={(pnl?.realized_pnl || 0) >= 0 ? 'buy' : 'sell'}
          trend={(pnl?.realized_pnl || 0) >= 0 ? 'up' : 'down'}
          trendValue="All time"
        />
      </div>

      {/* Filter Tabs */}
      <div className="orders-tabs">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            className={`orders-tab ${activeTab === tab ? 'active' : ''}`}
            onClick={() => setActiveTab(tab)}
            id={`orders-tab-${tab}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className="tab-count">
              {tab === 'all' ? orders.length : orders.filter(o => o.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="card orders-table-container">
        <table className="data-table" id="orders-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Asset</th>
              <th>Type</th>
              <th>Side</th>
              <th>Price</th>
              <th>Quantity</th>
              <th>Filled</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(order => (
              <tr key={order.id} className="animate-fade-in">
                <td className="mono" style={{ fontSize: 'var(--text-xs)' }}>
                  {formatDate(order.created_at)}
                </td>
                <td>
                  <span className="order-symbol">{order.asset_symbol}</span>
                </td>
                <td>
                  <span className="badge badge-accent">{order.type}</span>
                </td>
                <td>
                  <span className={`badge ${order.side === 'buy' ? 'badge-buy' : 'badge-sell'}`}>
                    {order.side.toUpperCase()}
                  </span>
                </td>
                <td className="mono">₹{order.price?.toLocaleString('en-IN', { minimumFractionDigits: 2 }) ?? '0.00'}</td>
                <td className="mono">{order.quantity?.toLocaleString('en-IN') ?? '0'}</td>
                <td className="mono">{order.filled_quantity?.toLocaleString('en-IN') ?? '0'}</td>
                <td>
                  <span className={`badge ${statusBadgeClass(order.status)}`}>
                    {order.status}
                  </span>
                </td>
                <td>
                  {(order.status === 'submitted' || order.status === 'partial') && (
                    <button
                      className="btn btn-sm btn-outline cancel-btn"
                      onClick={() => handleCancel(order.id)}
                      id={`cancel-order-${order.id.slice(0, 8)}`}
                    >
                      Cancel
                    </button>
                  )}
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr>
                <td colSpan={9} className="empty-state">
                  No orders found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
