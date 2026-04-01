'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useMarket } from '../context/MarketContext';
import * as api from '../services/api';
import * as ws from '../services/websocket';
import CandlestickChart from '../components/CandlestickChart';
import OrderBook from '../components/OrderBook';
import OrderPanel from '../components/OrderPanel';
import TradeHistory from '../components/TradeHistory';
import PortfolioWidget from '../components/PortfolioWidget';


export default function DashboardPage() {
  const { selectedSymbol, setMarketStats } = useMarket();
  const [candles, setCandles] = useState([]);
  const [orderBook, setOrderBook] = useState(null);
  const [trades, setTrades] = useState([]);
  const [portfolio, setPortfolio] = useState(null);
  const [holdings, setHoldings] = useState([]);
  const [pnl, setPnl] = useState(null);
  const [candleInterval, setCandleInterval] = useState('1m');
  const [currentPrice, setCurrentPrice] = useState(0);

  const selectedSymbolRef = useRef(selectedSymbol);
  selectedSymbolRef.current = selectedSymbol;
  const candleIntervalRef = useRef(candleInterval);
  candleIntervalRef.current = candleInterval;

  // Compute and lift market stats from candle data
  useEffect(() => {
    if (!candles?.length) return;
    const high24h = Math.max(...candles.map(c => c.high));
    const low24h = Math.min(...candles.map(c => c.low));
    const volume = candles.reduce((s, c) => s + (c.volume || 0), 0);
    setMarketStats({ high24h, low24h, volume });
  }, [candles, setMarketStats]);

  const loadData = useCallback(async () => {
    if (!selectedSymbol) return;
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

  useEffect(() => {
    if (!selectedSymbol) return;

    ws.connect();
    ws.subscribe(selectedSymbol);

    const unsub = ws.onMessage((msg) => {
      switch (msg.type) {
        case 'TRADE_PRINT': {
          const sym = msg.symbol;
          const price = Number(msg.price);
          const qty = Number(msg.qty);

          if (sym === selectedSymbolRef.current) {
            setCurrentPrice(price);

            if (candleIntervalRef.current === '1m' || candleIntervalRef.current === '5m') {
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

    const obPoll = setInterval(() => {
      api.getOrderBook(selectedSymbolRef.current)
        .then(ob => {
          setOrderBook(ob);
          if (ob?.mid_price) setCurrentPrice(ob.mid_price);
        })
        .catch(() => { });
    }, 3000);

    const pnlPoll = setInterval(() => {
      api.getPortfolio().then(setPortfolio).catch(() => { });
      api.getPnL().then(setPnl).catch(() => { });
      api.getHoldings().then(setHoldings).catch(() => { });
    }, 10000);

    const candlePoll = setInterval(() => {
      api.getCandles(selectedSymbolRef.current, candleIntervalRef.current)
        .then(data => { if (data?.length) setCandles(data); })
        .catch(() => { });
    }, 60000);

    const tradePoll = setInterval(() => {
      api.getPublicTrades()
        .then(data => { if (data?.length) setTrades(data); })
        .catch(() => { });
    }, 5000);

    return () => {
      unsub();
      clearInterval(obPoll);
      clearInterval(pnlPoll);
      clearInterval(candlePoll);
      clearInterval(tradePoll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSymbol]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSubmitOrder = async (order) => {
    const result = await api.submitOrder(order);
    loadData();
    return result;
  };

  if (!selectedSymbol) return null;

  return (
    <div className="animate-fade-in" id="dashboard-page">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* Main Column */}
        <div className="flex-[1_1_100%] flex flex-col gap-4">
          <div className="min-h-[450px]">
            <CandlestickChart
              candles={candles}
              interval={candleInterval}
              onIntervalChange={setCandleInterval}
              symbol={selectedSymbol}
            />
          </div>
          <div>
            <TradeHistory trades={trades} symbol={selectedSymbol} />
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="w-full lg:w-[320px] 2xl:w-[280px] flex flex-col gap-4">
          <div className="max-h-[450px] lg:max-h-[400px] overflow-hidden">
            <OrderBook orderBook={orderBook} />
          </div>
          <div>
            <OrderPanel
              symbol={selectedSymbol}
              currentPrice={currentPrice}
              onSubmitOrder={handleSubmitOrder}
              cashBalance={portfolio?.cash_balance}
            />
          </div>
          <div>
            <PortfolioWidget
              portfolio={portfolio}
              holdings={holdings}
              pnl={pnl}
              compact={true}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
