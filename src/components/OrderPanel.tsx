'use client';

import React, { useState, useEffect, useRef } from 'react';
import { AlertCircle, CheckCircle2, Info, TrendingUp, TrendingDown, Zap, X } from 'lucide-react';
import { useMarket } from '../context/MarketContext';
import './OrderPanel.css';

export default function OrderPanel({ symbol, currentPrice, onSubmitOrder, cashBalance, onClose }) {
  const { isOrderActive, setIsOrderActive } = useMarket();
  const [side, setSide] = useState<'buy' | 'sell'>('buy');
  const [orderType, setOrderType] = useState<'limit' | 'market'>('limit');
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<{ price?: string; quantity?: string }>({});
  const prevSymbol = useRef(symbol);
  const quantityRef = useRef<HTMLInputElement>(null);

  // Auto-focus quantity input when order panel becomes active
  useEffect(() => {
    if (isOrderActive && quantityRef.current) {
      setTimeout(() => quantityRef.current?.focus(), 50);
    }
  }, [isOrderActive]);

  // Seed price from currentPrice when it first becomes available
  useEffect(() => {
    if (currentPrice && !price) {
      setPrice(currentPrice.toFixed(2));
    }
  }, [currentPrice]); // eslint-disable-line

  // Reset on symbol change
  useEffect(() => {
    if (prevSymbol.current !== symbol) {
      setQuantity('');
      setErrors({});
      setFeedback(null);
      setShowConfirm(false);
      prevSymbol.current = symbol;
    }
  }, [symbol]);

  // Derived values
  const parsedPrice = orderType === 'market'
    ? (currentPrice || 0)
    : (price ? parseFloat(price) : 0);
  const parsedQty = quantity ? Math.max(0, parseInt(quantity, 10)) : 0;
  const estimatedTotal = parsedPrice > 0 && parsedQty > 0 ? parsedPrice * parsedQty : 0;
  const buyingPower = cashBalance || 0;
  const maxShares = parsedPrice > 0 ? Math.floor(buyingPower / parsedPrice) : 0;
  const isValidOrder = parsedQty > 0 && (orderType === 'market' || parsedPrice > 0);

  // Real-time validation
  const validate = () => {
    const errs: typeof errors = {};
    if (orderType !== 'market' && (!price || parseFloat(price) <= 0)) {
      errs.price = 'Enter a valid price';
    }
    if (!quantity || parseInt(quantity, 10) <= 0) {
      errs.quantity = 'Enter number of shares';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSideChange = (newSide: 'buy' | 'sell') => {
    setSide(newSide);
    setErrors({});
    setFeedback(null);
    setShowConfirm(false);
    setIsOrderActive(true);
  };

  const handleTypeChange = (t: 'limit' | 'market') => {
    setOrderType(t);
    setErrors({});
    setShowConfirm(false);
    if (t === 'market') setPrice('');
    else if (!price && currentPrice) setPrice(currentPrice.toFixed(2));
  };



  const handleSubmitClick = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setShowConfirm(true);
  };

  const handleConfirm = async () => {
    setShowConfirm(false);
    setSubmitting(true);
    setFeedback(null);
    try {
      const order = {
        asset_symbol: symbol,
        type: orderType,
        side,
        price: orderType === 'market' ? 0 : parseFloat(price),
        quantity: parseInt(quantity, 10),
        stop_price: 0,
      };
      await onSubmitOrder(order);
      setFeedback({
        type: 'success',
        message: `${side === 'buy' ? 'Buy' : 'Sell'} order placed for ${quantity} share${parseInt(quantity) > 1 ? 's' : ''} of ${symbol}!`,
      });
      setQuantity('');
      setIsOrderActive(false); // Revert layout on success
    } catch {
      setFeedback({ type: 'error', message: 'Order failed. Please try again.' });
    }
    setSubmitting(false);
    setTimeout(() => setFeedback(null), 4000);
  };

  const isBuy = side === 'buy';
  const accentColor = isBuy ? 'var(--color-buy)' : 'var(--color-sell)';

  return (
    <div className={`order-panel card op-${side}`} id="order-panel">
      {/* ── Header ── */}
      <div className="op-header">
        <div className="op-header-left">
          <span className="op-title">Place Order</span>
          <span className="op-symbol-badge">{symbol}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          {currentPrice > 0 && (
            <div className="op-live-price mono">
              ₹{currentPrice.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span className="op-live-dot" />
            </div>
          )}
          {(isOrderActive || onClose) && (
            <button 
              className="op-close-btn"
              onClick={() => {
                if (onClose) onClose();
                else setIsOrderActive(false);
              }}
              aria-label="Close Order Panel"
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {/* ── Buy / Sell Toggle ── */}
      <div className="op-side-toggle">
        <button
          className={`op-side-btn op-buy-btn ${isBuy ? 'active' : ''}`}
          onClick={() => handleSideChange('buy')}
          id="btn-side-buy"
          type="button"
        >
          <TrendingUp size={14} />
          Buy
        </button>
        <button
          className={`op-side-btn op-sell-btn ${!isBuy ? 'active' : ''}`}
          onClick={() => handleSideChange('sell')}
          id="btn-side-sell"
          type="button"
        >
          <TrendingDown size={14} />
          Sell
        </button>
      </div>

      {/* ── Order Type Tabs ── */}
      <div className="op-type-tabs">
        {(['limit', 'market'] as const).map(t => (
          <button
            key={t}
            className={`op-type-tab ${orderType === t ? 'active' : ''}`}
            onClick={() => handleTypeChange(t)}
            id={`order-type-${t}`}
            type="button"
          >
            {t === 'market' && <Zap size={11} />}
            {t.charAt(0).toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmitClick} className="op-form" noValidate>

        {/* ── Market notice ── */}
        {orderType === 'market' && (
          <div className="op-market-notice">
            <Info size={13} />
            Executed instantly at best available market price
          </div>
        )}

        {/* ── Price input ── */}
        {orderType !== 'market' && (
          <div className={`op-field ${errors.price ? 'has-error' : ''}`}>
            <label className="op-label">
              Price <span className="op-label-unit">INR</span>
            </label>
            <div className="op-input-wrap">
              <span className="op-input-prefix">₹</span>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={price}
                onChange={e => { setPrice(e.target.value); setErrors(prev => ({ ...prev, price: undefined })); }}
                placeholder="Enter price"
                className="mono op-input"
                id="input-price"
              />
            </div>
            {errors.price && <span className="op-error-msg">{errors.price}</span>}
          </div>
        )}



        {/* ── Shares input ── */}
        <div className={`op-field ${errors.quantity ? 'has-error' : ''}`}>
          <div className="op-label-row">
            <label className="op-label">Shares</label>
            {isBuy && orderType !== 'market' && parsedPrice > 0 && (
              <span className="op-max-hint">Max: {maxShares.toLocaleString('en-IN')} shares</span>
            )}
          </div>
          <input
            ref={quantityRef}
            type="number"
            step="1"
            min="1"
            value={quantity}
            onChange={e => { setQuantity(e.target.value); setErrors(prev => ({ ...prev, quantity: undefined })); }}
            placeholder="Enter shares"
            className="mono op-input"
            id="input-quantity"
          />
          {errors.quantity && <span className="op-error-msg">{errors.quantity}</span>}
        </div>



        {/* ── Order Summary ── */}
        <div className="op-summary">
          <div className="op-summary-row">
            <span className="op-summary-label">Est. Total</span>
            <span className="op-summary-value mono" style={{ color: accentColor }}>
              {estimatedTotal > 0
                ? `₹${estimatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : '—'}
            </span>
          </div>
          <div className="op-summary-row">
            <span className="op-summary-label">Buying Power</span>
            <span className="op-summary-value mono">
              ₹{buyingPower.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          {estimatedTotal > 0 && isBuy && (
            <div className="op-summary-row">
              <span className="op-summary-label">Remaining</span>
              <span className={`op-summary-value mono ${buyingPower - estimatedTotal < 0 ? 'op-insufficient' : ''}`}>
                ₹{Math.max(0, buyingPower - estimatedTotal).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                {buyingPower - estimatedTotal < 0 && <span className="op-insufficient-flag"> ✕ Insufficient</span>}
              </span>
            </div>
          )}
        </div>

        {/* ── Submit ── */}
        <button
          type="submit"
          className={`op-submit-btn ${isBuy ? 'op-submit-buy' : 'op-submit-sell'}`}
          disabled={submitting || !isValidOrder}
          id="btn-submit-order"
        >
          {submitting ? (
            <span className="op-submitting">
              <span className="op-spinner" />
              Placing Order…
            </span>
          ) : (
            <>
              {isBuy ? <TrendingUp size={15} /> : <TrendingDown size={15} />}
              {isBuy ? 'Buy' : 'Sell'} {parsedQty > 0 ? parsedQty : ''} {symbol}
            </>
          )}
        </button>

        {/* ── Feedback ── */}
        {feedback && (
          <div className={`op-feedback op-feedback-${feedback.type}`}>
            {feedback.type === 'success' ? <CheckCircle2 size={14} /> : <AlertCircle size={14} />}
            {feedback.message}
          </div>
        )}
      </form>

      {/* ── Confirmation Overlay ── */}
      {showConfirm && (
        <div className="op-confirm-overlay">
          <div className="op-confirm-box">
            <div className="op-confirm-title">Confirm Order</div>
            <div className="op-confirm-details">
              <div className="op-confirm-row">
                <span>Action</span>
                <span className={isBuy ? 'text-buy' : 'text-sell'} style={{ fontWeight: 700 }}>
                  {isBuy ? 'BUY' : 'SELL'} · {orderType.toUpperCase()}
                </span>
              </div>
              <div className="op-confirm-row">
                <span>Symbol</span>
                <span className="mono">{symbol}</span>
              </div>
              <div className="op-confirm-row">
                <span>Shares</span>
                <span className="mono">{parsedQty.toLocaleString('en-IN')}</span>
              </div>
              {orderType !== 'market' && (
                <div className="op-confirm-row">
                  <span>Price</span>
                  <span className="mono">₹{parseFloat(price).toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                </div>
              )}
              <div className="op-confirm-row op-confirm-total">
                <span>Est. Total</span>
                <span className="mono" style={{ color: accentColor }}>
                  ₹{estimatedTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            </div>
            <div className="op-confirm-actions">
              <button
                type="button"
                className="op-confirm-cancel"
                onClick={() => { setShowConfirm(false); setIsOrderActive(false); }}
              >
                Cancel
              </button>
              <button
                type="button"
                className={`op-confirm-submit ${isBuy ? 'op-submit-buy' : 'op-submit-sell'}`}
                onClick={handleConfirm}
              >
                Confirm {isBuy ? 'Buy' : 'Sell'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
