'use client';

import React, { useState } from 'react';
import './OrderPanel.css';

export default function OrderPanel({ symbol, currentPrice, onSubmitOrder, cashBalance }) {
  const [side, setSide] = useState('buy');
  const [orderType, setOrderType] = useState('market');
  const [price, setPrice] = useState(currentPrice?.toFixed(2) || '');
  const [quantity, setQuantity] = useState('');
  const [stopPrice, setStopPrice] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);

  // Sync price when symbol/currentPrice changes from external navbar
  React.useEffect(() => {
    setPrice(currentPrice?.toFixed(2) || '');
    setQuantity('');
    setStopPrice('');
  }, [symbol, currentPrice]);

  const total = price && quantity ? (parseFloat(price) * parseFloat(quantity)).toFixed(2) : '0.00';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quantity) return;
    if (orderType === 'stop' && (!price || !stopPrice)) return;
    if (orderType === 'limit' && !price) return; // For future-proofing although limit is hidden now

    setSubmitting(true);
    setFeedback(null);

    try {
      const order = {
        asset_symbol: symbol,
        type: orderType,
        side,
        price: orderType === 'market' ? 0 : parseFloat(price),
        quantity: parseFloat(quantity),
        stop_price: orderType === 'stop' ? parseFloat(stopPrice) : 0,
      };
      await onSubmitOrder(order);
      setFeedback({ type: 'success', message: `${side.toUpperCase()} order submitted!` });
      setQuantity('');
    } catch (err) {
      setFeedback({ type: 'error', message: 'Order failed. Try again.' });
    }
    setSubmitting(false);
    setTimeout(() => setFeedback(null), 3000);
  };



  return (
    <div className="order-panel card" id="order-panel">
      <div className="card-header">
        <h3>Place Order</h3>
        <span className="badge badge-accent">{symbol}</span>
      </div>

      {/* Side Toggle */}
      <div className="side-toggle">
        <button
          className={`side-btn buy-btn ${side === 'buy' ? 'active' : ''}`}
          onClick={() => setSide('buy')}
          id="btn-side-buy"
        >
          Buy
        </button>
        <button
          className={`side-btn sell-btn ${side === 'sell' ? 'active' : ''}`}
          onClick={() => setSide('sell')}
          id="btn-side-sell"
        >
          Sell
        </button>
      </div>

      {/* Order Type */}
      <div className="order-type-tabs">
        {['market', 'stop'].map(t => (
          <button
            key={t}
            className={`order-type-tab ${orderType === t ? 'active' : ''}`}
            onClick={() => setOrderType(t)}
            id={`order-type-${t}`}
          >
            {t === 'stop' ? 'Limit' : t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="order-form">
        {/* Price (not for market orders) */}


        {/* Stop Price */}
        {orderType === 'stop' && (
          <>
            <div className="form-group">
              <label>Limit Price (INR)</label>
              <div className="input-with-icon">
                <span className="input-icon">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={price}
                  onChange={e => setPrice(e.target.value)}
                  placeholder="0.00"
                  className="mono"
                  id="input-price"
                />
              </div>
            </div>
            <div className="form-group">
              <label>Stop Loss (INR)</label>
              <div className="input-with-icon">
                <span className="input-icon">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={stopPrice}
                  onChange={e => setStopPrice(e.target.value)}
                  placeholder="0.00"
                  className="mono"
                  id="input-stop-price"
                />
              </div>
            </div>
          </>
        )}

        {/* Quantity */}
        <div className="form-group">
          <label>Shares</label>
          <input
            type="number"
            step="1"
            min="1"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            placeholder="0"
            className="mono"
            id="input-quantity"
          />
        </div>



        {/* Total */}
        <div className="order-total">
          <span className="total-label">Estimated Total</span>
          <span className="total-value mono">₹{parseFloat(total).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
        </div>

        {/* Submit */}
        <button
          type="submit"
          className={`btn btn-lg order-submit-btn ${side === 'buy' ? 'btn-buy' : 'btn-sell'}`}
          disabled={submitting || !quantity}
          id="btn-submit-order"
        >
          {submitting ? 'Submitting...' : `${side === 'buy' ? 'Buy' : 'Sell'} ${symbol}`}
        </button>

        {/* Feedback */}
        {feedback && (
          <div className={`order-feedback ${feedback.type}`}>
            {feedback.message}
          </div>
        )}
      </form>
    </div>
  );
}
