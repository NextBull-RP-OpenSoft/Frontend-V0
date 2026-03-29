import React, { useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';
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
  const [interval, setInterval] = useState('1m');
  const [currentPrice, setCurrentPrice] = useState(0);

  const loadData = useCallback(async () => {
    try {
      const [candleData, obData, tradeData, portfolioData, holdingsData, pnlData] = await Promise.all([
        api.getCandles(selectedSymbol, interval),
        api.getOrderBook(selectedSymbol),
        api.getPublicTrades(),
        api.getPortfolio(),
        api.getHoldings(),
        api.getPnL(),
      ]);
      setCandles(candleData);
      setOrderBook(obData);
      setTrades(tradeData);
      setPortfolio(portfolioData);
      setHoldings(holdingsData);
      setPnl(pnlData);
      if (obData?.mid_price) setCurrentPrice(obData.mid_price);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  }, [selectedSymbol, interval]);

  useEffect(() => {
    loadData();
    // Simulate live updates every 2 seconds
    const liveInterval = window.setInterval(() => {
      // Generate new trade
      const trade = api.generateLiveTrade(selectedSymbol);
      setTrades(prev => [{
        id: 'live-' + Date.now(),
        asset_symbol: trade.symbol,
        price: trade.price,
        quantity: trade.qty,
        aggressor_side: trade.side,
        executed_at: Date.now() * 1_000_000,
      }, ...prev].slice(0, 50));

      // Update order book
      api.getOrderBook(selectedSymbol).then(ob => {
        setOrderBook(ob);
        if (ob?.mid_price) setCurrentPrice(ob.mid_price);
      });
    }, 2000);

    return () => window.clearInterval(liveInterval);
  }, [selectedSymbol, loadData]);

  const handleSubmitOrder = async (order) => {
    const result = await api.submitOrder(order);
    // Refresh data after order submission
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
            interval={interval}
            onIntervalChange={setInterval}
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
