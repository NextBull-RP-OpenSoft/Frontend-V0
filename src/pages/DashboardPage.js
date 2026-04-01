import React, { useState, useEffect, useCallback, useRef } from 'react';
import * as api from '../services/api';
import * as ws from '../services/websocket';
import CandlestickChart from '../components/CandlestickChart';
import OrderBook from '../components/OrderBook';
import OrderPanel from '../components/OrderPanel';
import TradeHistory from '../components/TradeHistory';
import PortfolioWidget from '../components/PortfolioWidget';
import './DashboardPage.css';

export default function DashboardPage({ selectedSymbol }) {
  const [candles, setCandles] = useState([]);
  const [orderBook, setOrderBook] = useState(null);
  const [trades, setTrades] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [pnl, setPnl] = useState(null);
  const [candleInterval, setCandleInterval] = useState('1m');
  const [currentPrice, setCurrentPrice] = useState(0);

  // Keep refs so WS handler / intervals always have fresh values
  const selectedSymbolRef = useRef(selectedSymbol);
  selectedSymbolRef.current = selectedSymbol;
  const candleIntervalRef = useRef(candleInterval);
  candleIntervalRef.current = candleInterval;

  // ---------- Load initial REST data ----------
  const loadData = useCallback(async () => {
    try {
      const [candleData, obData, tradeData, portfolioData, holdingsData, pnlData] = await Promise.all([
        api.getCandles(selectedSymbol, candleInterval),
        api.getOrderBook(selectedSymbol),
        api.getPublicTrades(),
        api.getPortfolio(),
        api.getHoldings(),
        api.getPnL(),
      ]);
      setCandles(candleData || []);
      setOrderBook(obData);
      setTrades(tradeData || []);
      setPortfolio(portfolioData);
      setHoldings(holdingsData || []);
      setPnl(pnlData);
      if (obData?.mid_price) setCurrentPrice(obData.mid_price);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  }, [selectedSymbol, candleInterval]);

  // ---------- WebSocket live feed ----------
  useEffect(() => {
    ws.connect();
    ws.subscribe(selectedSymbol);

    const unsub = ws.onMessage((msg) => {
      switch (msg.type) {
        case 'TRADE_PRINT': {
          const sym = msg.symbol;
          const price = Number(msg.price);
          const qty = Number(msg.qty);

          // Update price ticker for the currently viewed symbol
          if (sym === selectedSymbolRef.current) {
            setCurrentPrice(price);

            // ── Live candle update ──────────────────────────────────
            // Push the new tick price into the last candle so the chart
            // shows real-time price movement without waiting for REST poll.
            if (['1s', '5s', '1m', '5m'].includes(candleIntervalRef.current)) {
              setCandles(prev => {
                if (!prev || prev.length === 0) return prev;
                const updated = [...prev];
                const last = { ...updated[updated.length - 1] };
                last.close = price;
                if (price > last.high) last.high = price;
                if (price < last.low) last.low = price;
                last.volume = (last.volume || 0) + qty;
                updated[updated.length - 1] = last;
                return updated;
              });
            }
          }

          // Add to the live trade feed regardless of symbol
          setTrades(prev => [{
            id: 'live-' + Date.now() + Math.random(),
            asset_symbol: sym,
            price,
            quantity: qty,
            aggressor_side: msg.side,
            executed_at: Date.now() * 1_000_000,
          }, ...prev].slice(0, 100));
          break;
        }

        case 'FILL_CONFIRM':
          // Re-fetch portfolio after a fill
          api.getPortfolio().then(setPortfolio).catch(() => { });
          api.getHoldings().then(setHoldings).catch(() => { });
          api.getPnL().then(setPnl).catch(() => { });
          break;

        case 'ORDER_REJECT':
          console.warn('Order rejected:', msg.error, msg.client_order_id);
          break;

        default:
          break;
      }
    });

    // Poll order book every 3s
    const obPoll = setInterval(() => {
      api.getOrderBook(selectedSymbolRef.current)
        .then(ob => {
          setOrderBook(ob);
          if (ob?.mid_price) setCurrentPrice(ob.mid_price);
        })
        .catch(() => { });
    }, 3000);

    // Poll portfolio/pnl every 10s so unrealized P&L stays fresh
    const pnlPoll = setInterval(() => {
      api.getPortfolio().then(setPortfolio).catch(() => { });
      api.getPnL().then(setPnl).catch(() => { });
      api.getHoldings().then(setHoldings).catch(() => { });
    }, 10000);

    // Poll candles every 60s to pick up freshly flushed candles from the backend
    // DISABLED for C++ engine integration: fetching REST candles overwrites the live WebSocket
    // chart. The live chart now draws tick-by-tick from TRADE_PRINT events.
    /*
    const candlePoll = setInterval(() => {
      api.getCandles(selectedSymbolRef.current, candleIntervalRef.current)
        .then(data => { if (data?.length) setCandles(data); })
        .catch(() => { });
    }, 60000);
    */

    // Poll recent public trades every 5s for the trade feed
    const tradePoll = setInterval(() => {
      api.getPublicTrades()
        .then(data => { if (data?.length) setTrades(data); })
        .catch(() => { });
    }, 5000);

    return () => {
      unsub();
      clearInterval(obPoll);
      clearInterval(pnlPoll);
      // clearInterval(candlePoll);
      clearInterval(tradePoll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // singleton WS — symbol/interval accessed via refs

  // Re-subscribe when symbol changes
  useEffect(() => {
    ws.subscribe(selectedSymbol);
  }, [selectedSymbol]);

  // Reload REST data when symbol or interval changes
  useEffect(() => {
    loadData();
  }, [loadData]);

  // ---------- Order submission ----------
  const handleSubmitOrder = async (order) => {
    const result = await api.submitOrder(order);
    loadData();
    return result;
  };

  return (
    <div className="dashboard-page" id="dashboard-page">
      <div className="dashboard-grid">
        {/* Main Chart Area */}
        <div className="dashboard-chart">
          <CandlestickChart
            candles={candles}
            interval={candleInterval}
            onIntervalChange={setCandleInterval}
            symbol={selectedSymbol}
          />
        </div>

        {/* Order Book */}
        <div className="dashboard-orderbook">
          <OrderBook orderBook={orderBook} />
        </div>

        {/* Trade History */}
        <div className="dashboard-trades">
          <TradeHistory trades={trades} symbol={selectedSymbol} />
        </div>

        {/* Order Panel */}
        <div className="dashboard-order-panel">
          <OrderPanel
            symbol={selectedSymbol}
            currentPrice={currentPrice}
            onSubmitOrder={handleSubmitOrder}
          />
        </div>

        {/* Portfolio Widget */}
        <div className="dashboard-portfolio">
          <PortfolioWidget
            portfolio={portfolio}
            holdings={holdings}
            pnl={pnl}
            compact={true}
          />
        </div>
      </div>
    </div>
  );
}
