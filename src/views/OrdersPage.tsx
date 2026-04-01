'use client';

import React, { useState, useEffect } from 'react';
import * as api from '../services/api';


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

  const loadOrders = () => api.getOrders().then(setOrders).catch(() => { });

  useEffect(() => {
    loadOrders();
    const interval = setInterval(loadOrders, 5000);
    return () => clearInterval(interval);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = activeTab === 'all'
    ? orders
    : orders.filter(o => o.status === activeTab);

  const formatDate = (nanos) => {
    const date = new Date(Math.floor(nanos / 1_000_000));
    return date.toLocaleString('en-US', {
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
    <div className="max-w-[1200px] animate-fade-in" id="orders-page">
      <div className="page-header">
        <h1>Orders</h1>
        <p>View and manage your trading orders</p>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-6 flex-wrap">
        {STATUS_TABS.map(tab => (
          <button
            key={tab}
            className={`flex items-center gap-2 px-[18px] py-[10px] rounded-sm text-sm font-semibold text-[var(--text-secondary)] bg-[var(--bg-card)] border border-[var(--border-primary)] transition-all duration-150 hover:border-[var(--border-hover)] hover:text-[var(--text-primary)] ${activeTab === tab ? 'border-[var(--accent)] text-[var(--accent)] bg-[var(--accent-muted)]' : ''}`}
            onClick={() => setActiveTab(tab)}
            id={`orders-tab-${tab}`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
            <span className="text-xs bg-[var(--accent-muted)] px-[7px] py-[1px] rounded-[10px] font-bold">
              {tab === 'all' ? orders.length : orders.filter(o => o.status === tab).length}
            </span>
          </button>
        ))}
      </div>

      {/* Orders Table */}
      <div className="card overflow-x-auto">
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
                  <span className="font-bold text-[var(--accent)]">{order.asset_symbol}</span>
                </td>
                <td>
                  <span className="badge badge-accent">{order.type}</span>
                </td>
                <td>
                  <span className={`badge ${order.side === 'buy' ? 'badge-buy' : 'badge-sell'}`}>
                    {order.side.toUpperCase()}
                  </span>
                </td>
                <td className="mono">${order.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                <td className="mono">{order.quantity.toFixed(4)}</td>
                <td className="mono">{order.filled_quantity.toFixed(4)}</td>
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
                <td colSpan={9} className="text-center py-12 text-[var(--text-muted)] text-sm">
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
