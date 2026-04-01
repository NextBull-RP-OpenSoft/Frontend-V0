'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useMarket } from '../context/MarketContext';
import * as api from '../services/api';
import * as ws from '../services/websocket';
import CandlestickChart from '../components/CandlestickChart';
import './PortfolioPage.css';


// ── Tiny Sparkline ──────────────────────────────────────────────────
function Sparkline({ data, positive }: { data: number[]; positive: boolean }) {
  const w = 80, h = 36;
  if (!data || data.length < 2) return <svg width={w} height={h} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 6) - 3;
      return `${x},${y}`;
    })
    .join(' ');
  const color = positive ? '#22c55e' : '#ef4444';
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

// ── Mini Wallet Line Chart ──────────────────────────────────────────
function WalletChart({ data }: { data: number[] }) {
  const w = 260, h = 60;
  if (!data || data.length < 2) return <svg width={w} height={h} />;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pts = data
    .map((v, i) => {
      const x = (i / (data.length - 1)) * w;
      const y = h - ((v - min) / range) * (h - 8) - 4;
      return `${x},${y}`;
    })
    .join(' ');
  const areaPoints = `0,${h} ${pts} ${w},${h}`;
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="walletGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#7c3aed" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#7c3aed" stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={areaPoints} fill="url(#walletGrad)" />
      <polyline points={pts} fill="none" stroke="#a78bfa" strokeWidth="2" strokeLinejoin="round" />
    </svg>
  );
}

// ── Donut Chart ──────────────────────────────────────────────────────
function DonutChart({
  segments,
  hoveredIdx,
  onHover,
}: {
  segments: { label: string; value: number; color: string }[];
  hoveredIdx: number | null;
  onHover: (i: number | null) => void;
}) {
  const hovered    = hoveredIdx;
  const setHovered = onHover;
  const size    = 180;
  const cx = size / 2, cy = size / 2;
  const outer = 74, inner = 48;
  const hoverGrow = 8;
  const total = segments.reduce((s, seg) => s + seg.value, 0);

  let cumAngle = -90;
  const segData = segments.map((seg) => {
    const angle = (seg.value / total) * 360;
    const start = cumAngle;
    const end   = cumAngle + angle - 2;
    const mid   = cumAngle + angle / 2;
    cumAngle += angle;
    return { seg, angle, start, end, mid };
  });

  const toRad = (d: number) => (d * Math.PI) / 180;

  const paths = segData.map(({ seg, angle, start, end }, i) => {
    const isHov = hovered === i;
    const r1 = outer + (isHov ? hoverGrow : 0);
    const r2 = inner;
    const x1 = cx + r1 * Math.cos(toRad(start));
    const y1 = cy + r1 * Math.sin(toRad(start));
    const x2 = cx + r1 * Math.cos(toRad(end));
    const y2 = cy + r1 * Math.sin(toRad(end));
    const x3 = cx + r2 * Math.cos(toRad(end));
    const y3 = cy + r2 * Math.sin(toRad(end));
    const x4 = cx + r2 * Math.cos(toRad(start));
    const y4 = cy + r2 * Math.sin(toRad(start));
    const largeArc = angle - 2 > 180 ? 1 : 0;
    return (
      <path
        key={i}
        d={`M ${x1} ${y1} A ${r1} ${r1} 0 ${largeArc} 1 ${x2} ${y2} L ${x3} ${y3} A ${r2} ${r2} 0 ${largeArc} 0 ${x4} ${y4} Z`}
        fill={seg.color}
        opacity={hovered === null ? 0.88 : isHov ? 1 : 0.35}
        style={{
          cursor: 'pointer',
          transition: 'opacity 0.2s ease, filter 0.2s ease',
          filter: isHov ? `drop-shadow(0 0 6px ${seg.color}99)` : 'none',
        }}
        onMouseEnter={() => setHovered(i)}
        onMouseLeave={() => setHovered(null)}
      />
    );
  });

  const hovSeg = hovered !== null ? segData[hovered].seg : null;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} style={{ overflow: 'visible' }}>
      {paths}
      {hovSeg ? (
        <>
          <text x={cx} y={cy - 8} textAnchor="middle" fill={hovSeg.color} fontSize="14" fontWeight="700">
            {hovSeg.value}%
          </text>
          <text x={cx} y={cy + 10} textAnchor="middle" fill="#e2e8f0" fontSize="11" fontWeight="600">
            {hovSeg.label}
          </text>
        </>
      ) : (
        <>
          <text x={cx} y={cy - 6} textAnchor="middle" fill="#e2e8f0" fontSize="13" fontWeight="600">Portfolio</text>
          <text x={cx} y={cy + 12} textAnchor="middle" fill="#94a3b8" fontSize="10">Allocation</text>
        </>
      )}
    </svg>
  );
}

// ── Constants ─────────────────────────────────────────────────────────
// Indian stock colours & initials
const ASSET_COLORS: Record<string, string> = {
  RELIANCE: '#f59e0b',
  TCS:      '#3b82f6',
  INFY:     '#8b5cf6',
  HDFCBANK: '#22c55e',
  WIPRO:    '#ec4899',
};
const ASSET_ICONS: Record<string, string> = {
  RELIANCE: 'R',
  TCS:      'T',
  INFY:     'I',
  HDFCBANK: 'H',
  WIPRO:    'W',
};

// Indian market sectors
const SECTORS = [
  { label: 'IT & Tech',   value: 35, color: '#3b82f6' },
  { label: 'Banking',     value: 30, color: '#8b5cf6' },
  { label: 'FMCG',        value: 20, color: '#22c55e' },
  { label: 'Auto',        value: 15, color: '#f59e0b' },
];

// ── Dummy Indian stocks — always displayed ────────────────────────────
const DUMMY_HOLDINGS = [
  {
    asset_symbol: 'RELIANCE', name: 'Reliance Industries Ltd.',
    exchange: 'NSE',
    quantity: 10, avg_cost_basis: 2510, market_value: 28500,
    mkt_price: 2850, invested: 25100, pnl: 3400, pnl_pct: 13.55,
    trend: [2510,2540,2580,2560,2620,2680,2650,2720,2790,2760,2810,2840,2830,2850],
  },
  {
    asset_symbol: 'TCS', name: 'Tata Consultancy Services',
    exchange: 'NSE',
    quantity: 5, avg_cost_basis: 3280, market_value: 17250,
    mkt_price: 3450, invested: 16400, pnl: 850, pnl_pct: 5.18,
    trend: [3280,3300,3350,3310,3290,3320,3380,3360,3410,3430,3400,3440,3460,3450],
  },
  {
    asset_symbol: 'INFY', name: 'Infosys Limited',
    exchange: 'NSE',
    quantity: 20, avg_cost_basis: 1450, market_value: 31600,
    mkt_price: 1580, invested: 29000, pnl: 2600, pnl_pct: 8.97,
    trend: [1450,1462,1455,1480,1470,1495,1510,1520,1505,1540,1560,1555,1575,1580],
  },
  {
    asset_symbol: 'HDFCBANK', name: 'HDFC Bank Ltd.',
    exchange: 'NSE',
    quantity: 8, avg_cost_basis: 1620, market_value: 12320,
    mkt_price: 1540, invested: 12960, pnl: -640, pnl_pct: -4.94,
    trend: [1620,1610,1635,1625,1600,1590,1610,1580,1565,1555,1545,1538,1542,1540],
  },
];

const WALLET_DATA = Array.from({ length: 40 }, (_, i) =>
  1000000 + Math.sin(i / 5) * 15000 + i * 1200 + (Math.random() - 0.5) * 5000
);

const TIME_RANGES = ['1D', '1W', '1M', '3M', '6M', 'YTD'];

// ── INR formatter ─────────────────────────────────────────────────────
function inr(val: number, decimals = 2) {
  return '₹' + val.toLocaleString('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
}

// ═══════════════════════════════════════════════════════════════════════
export default function PortfolioPage() {
  const { assets } = useMarket();

  // Using portal data for chart; we map internal asset symbols to NSE stocks
  const NSE_CHART_STOCKS = ['RELIANCE', 'TCS', 'INFY', 'HDFCBANK'];
  const [portfolio, setPortfolio]           = useState<any>(null);
  const [holdings,  setHoldings]            = useState<any[]>([]);
  const [pnl,       setPnl]                 = useState<any>(null);
  const [candles,   setCandles]             = useState<any[]>([]);
  const [candleInterval, setCandleInterval] = useState('1m');
  const [selectedRange,  setSelectedRange]  = useState('1D');
  const [chartSymbol,    setChartSymbol]    = useState('RELIANCE');
  // Map display stock to a real asset symbol from the backend for candles
  const CHART_TO_ASSET: Record<string, string> = {
    RELIANCE: assets[0]?.symbol || 'BTC',
    TCS:      assets[1]?.symbol || 'ETH',
    INFY:     assets[2]?.symbol || 'SOL',
    HDFCBANK: assets[0]?.symbol || 'BTC',
  };
  const [currentPrice, setCurrentPrice] = useState(0);
  const [priceChange,  setPriceChange]  = useState({ abs: 12.5, pct: 0.44 });
  const [walletCurrency, setWalletCurrency] = useState('INR');
  const [lastUpdated, setLastUpdated]   = useState('10 sec ago');
  const [hoveredSector, setHoveredSector] = useState<number | null>(null);

  const candleIntervalRef = useRef(candleInterval);
  candleIntervalRef.current = candleInterval;

  // Scale factor: treat internal prices as INR by multiplying
  const INR_SCALE = 83.5; // approx USD→INR for demo

  const loadData = useCallback(async () => {
    try {
      const [p, h, pl] = await Promise.all([api.getPortfolio(), api.getHoldings(), api.getPnL()]);
      setPortfolio(p);
      setHoldings(h || []);
      setPnl(pl);
    } catch { /* silent */ }
  }, []);

  const loadCandles = useCallback(async () => {
    try {
      const assetSym = CHART_TO_ASSET[chartSymbol] || assets[0]?.symbol;
      if (!assetSym) return;
      const data = await api.getCandles(assetSym, candleInterval);
      if (data?.length) {
        // Scale to INR for visual realism
        const scaled = data.map((c: any) => ({
          ...c,
          open:  parseFloat((c.open  * INR_SCALE).toFixed(2)),
          high:  parseFloat((c.high  * INR_SCALE).toFixed(2)),
          low:   parseFloat((c.low   * INR_SCALE).toFixed(2)),
          close: parseFloat((c.close * INR_SCALE).toFixed(2)),
        }));
        setCandles(scaled);
        const last = scaled[scaled.length - 1];
        const prev = scaled[scaled.length - 2];
        setCurrentPrice(last.close);
        if (prev) {
          const diff = last.close - prev.close;
          setPriceChange({ abs: Math.abs(diff), pct: Math.abs((diff / prev.close) * 100) });
        }
      }
    } catch { /* silent */ }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartSymbol, candleInterval, assets]);

  useEffect(() => { loadData(); const iv = setInterval(loadData, 5000); return () => clearInterval(iv); }, [loadData]);
  useEffect(() => { loadCandles(); const iv = setInterval(loadCandles, 30000); return () => clearInterval(iv); }, [loadCandles]);

  // WS live price
  useEffect(() => {
    const assetSym = CHART_TO_ASSET[chartSymbol] || assets[0]?.symbol;
    if (!assetSym) return;
    ws.connect();
    ws.subscribe(assetSym);
    const unsub: () => void = ws.onMessage((msg: any) => {
      if (msg.type === 'TRADE_PRINT' && msg.symbol === assetSym) {
        const price = Number(msg.price) * INR_SCALE;
        setCurrentPrice(price);
        if (['1m', '5m'].includes(candleIntervalRef.current)) {
          setCandles(prev => {
            if (!prev?.length) return prev;
            const updated = [...prev];
            const last = { ...updated[updated.length - 1] };
            last.close = price;
            if (price > last.high) last.high = price;
            if (price < last.low)  last.low  = price;
            updated[updated.length - 1] = last;
            return updated;
          });
        }
      }
    });
    return () => unsub();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartSymbol, assets]);

  // ── Derived values ────────────────────────────────────────────────
  const totalCash     = (portfolio?.cash_balance || 100000) * INR_SCALE;
  const totalHoldings = DUMMY_HOLDINGS.reduce((s, h) => s + h.market_value, 0);
  const totalValue    = totalCash + totalHoldings;
  const weeklyRevenue = 56182.30;

  const isChartPositive = priceChange.abs >= 0;
  const chartStockName = DUMMY_HOLDINGS.find(h => h.asset_symbol === chartSymbol)?.name || chartSymbol;

  return (
    <div className="pf-page animate-fade-in" id="portfolio-page">
      {/* ── Page Header ───────────────────────────────────── */}
      <div className="pf-page-header">
        <div>
          <h1 className="pf-title">Portfolio</h1>
          <span className="pf-subtitle">NSE · BSE · Indian Equities</span>
        </div>
        <div className="pf-market-badge">
          <span className="pf-market-dot" />
          Market Open
        </div>
      </div>

      <div className="pf-main-grid">

        {/* ── LEFT COLUMN ─────────────────────────────────── */}
        <div className="pf-left-col">

          {/* Holdings / Assets Overview */}
          <div className="pf-card pf-assets-overview">
            <div className="pf-card-header">
              <span className="pf-card-title">Holdings</span>
              <span className="pf-holdings-count">{DUMMY_HOLDINGS.length} Stocks</span>
            </div>
            <div className="pf-table-wrap">
              <table className="pf-table">
                <thead>
                  <tr>
                    <th>STOCK</th>
                    <th>LTP</th>
                    <th>AVG COST</th>
                    <th>INVESTED</th>
                    <th>7D TREND</th>
                    <th>CURRENT VALUE</th>
                    <th>P&amp;L</th>
                  </tr>
                </thead>
                <tbody>
                  {DUMMY_HOLDINGS.map(h => {
                    const isPos = h.pnl >= 0;
                    return (
                      <tr key={h.asset_symbol} className="pf-table-row">
                        <td>
                          <div className="pf-asset-cell">
                            <div
                              className="pf-asset-icon"
                              style={{ background: ASSET_COLORS[h.asset_symbol] || '#3b82f6' }}
                            >
                              {ASSET_ICONS[h.asset_symbol] || h.asset_symbol[0]}
                            </div>
                            <div className="pf-asset-info">
                              <span className="pf-asset-name">{h.asset_symbol}</span>
                              <span className="pf-asset-symbol">{h.exchange} · {h.quantity} shares</span>
                            </div>
                          </div>
                        </td>
                        <td className="mono pf-td-num">
                          {inr(h.mkt_price)}
                        </td>
                        <td className="mono pf-td-num">
                          {inr(h.avg_cost_basis)}
                        </td>
                        <td className="mono pf-td-num">
                          {inr(h.invested, 0)}
                        </td>
                        <td className="pf-td-spark">
                          <Sparkline data={h.trend} positive={isPos} />
                        </td>
                        <td className="mono pf-td-num">
                          {inr(h.market_value)}
                        </td>
                        <td>
                          <div className={`pf-pnl-cell ${isPos ? 'pnl-pos' : 'pnl-neg'}`}>
                            <span className="mono">
                              {isPos ? '+' : '-'}{inr(Math.abs(h.pnl))}
                            </span>
                            <span className="pf-pnl-pct mono">
                              {isPos ? '+' : ''}{h.pnl_pct.toFixed(2)}%
                            </span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Live Chart — no gap below holdings */}
          <div className="pf-card pf-chart-section">
            <div className="pf-chart-header">
              <div className="pf-chart-left">
                <div className="pf-symbol-sel">
                  {NSE_CHART_STOCKS.map(sym => (
                    <button
                      key={sym}
                      className={`pf-sym-btn ${chartSymbol === sym ? 'active' : ''}`}
                      onClick={() => setChartSymbol(sym)}
                      id={`pf-sym-${sym.toLowerCase()}`}
                    >
                      {sym}
                    </button>
                  ))}
                </div>
                <span className="pf-live-badge">● NSE Live</span>
              </div>
              <div className="pf-time-ranges">
                {TIME_RANGES.map(r => (
                  <button
                    key={r}
                    className={`pf-range-btn ${selectedRange === r ? 'active' : ''}`}
                    onClick={() => setSelectedRange(r)}
                    id={`pf-range-${r.toLowerCase()}`}
                  >{r}</button>
                ))}
              </div>
            </div>

            <div className="pf-price-row">
              <div>
                <div className="pf-stock-full-name">{chartStockName}</div>
                <span className="pf-chart-price mono">
                  {currentPrice > 0 ? inr(currentPrice) : inr(DUMMY_HOLDINGS.find(h => h.asset_symbol === chartSymbol)?.mkt_price || 0)}
                  <span className="pf-price-unit"> NSE</span>
                </span>
              </div>
              <span className={`pf-price-chg ${isChartPositive ? 'pos' : 'neg'}`}>
                {isChartPositive ? '▲' : '▼'} {inr(priceChange.abs)} ({priceChange.pct.toFixed(2)}%)
              </span>
            </div>

            <div className="pf-chart-body">
              <CandlestickChart
                candles={candles}
                interval={candleInterval}
                onIntervalChange={setCandleInterval}
                symbol={chartSymbol}
              />
            </div>
          </div>

        </div>{/* end pf-left-col */}

        {/* ── RIGHT COLUMN ───────────────────────────────── */}
        <div className="pf-right-col">

          {/* Demat Account / Portfolio Value */}
          <div className="pf-card pf-wallet">
            <div className="pf-wallet-top-row">
              <span className="pf-card-title">Demat Account</span>
              <div className="pf-wallet-meta">
                <span className="pf-wallet-updated">{lastUpdated}</span>
                <button
                  className="pf-wallet-refresh"
                  onClick={() => {
                    loadData();
                    setLastUpdated('now');
                    setTimeout(() => setLastUpdated('10 sec ago'), 2000);
                  }}
                  title="Refresh"
                >⟳</button>
              </div>
            </div>

            <div className="pf-currency-sel">
              <button className={`pf-cur-btn ${walletCurrency === 'INR' ? 'active' : ''}`} onClick={() => setWalletCurrency('INR')}>₹ INR</button>
              <button className={`pf-cur-btn ${walletCurrency === 'USD' ? 'active' : ''}`} onClick={() => setWalletCurrency('USD')}>$ USD</button>
            </div>

            <div className="pf-balance-row">
              <span className="pf-balance mono">
                {walletCurrency === 'INR'
                  ? inr(totalHoldings, 0)
                  : '$' + (totalHoldings / INR_SCALE).toLocaleString(undefined, { minimumFractionDigits: 2 })}
              </span>
              <span className={`pf-bal-badge ${(pnl?.total_pnl || 0) >= 0 ? 'badge-pos' : 'badge-neg'}`}>
                ▲ 8.43%
              </span>
            </div>
            <p className="pf-revenue-text">
              Weekly gain: <strong>{inr(weeklyRevenue, 0)}</strong>
            </p>
            <div className="pf-wallet-chart">
              <WalletChart data={WALLET_DATA} />
            </div>

            {/* Quick stats */}
            <div className="pf-demat-stats">
              <div className="pf-demat-stat">
                <span className="pf-ds-label">Invested</span>
                <span className="pf-ds-val mono">{inr(totalHoldings - 6210, 0)}</span>
              </div>
              <div className="pf-demat-stat">
                <span className="pf-ds-label">Total P&amp;L</span>
                <span className="pf-ds-val mono pnl-pos">+{inr(6210, 0)}</span>
              </div>
              <div className="pf-demat-stat">
                <span className="pf-ds-label">Day&apos;s P&amp;L</span>
                <span className="pf-ds-val mono pnl-pos">+{inr(2340, 0)}</span>
              </div>
              <div className="pf-demat-stat">
                <span className="pf-ds-label">Free Margin</span>
                <span className="pf-ds-val mono">{inr(totalCash, 0)}</span>
              </div>
            </div>
          </div>

          {/* Sector Allocation */}
          <div className="pf-card pf-sector">
            <span className="pf-card-title">Sector Allocation</span>
            <div className="pf-donut-wrap">
              <DonutChart segments={SECTORS} hoveredIdx={hoveredSector} onHover={setHoveredSector} />
            </div>
            <div className="pf-sector-legend">
              {SECTORS.map((s, i) => (
                <div
                  key={s.label}
                  className="pf-legend-row"
                  style={{
                    opacity: hoveredSector === null ? 1 : hoveredSector === i ? 1 : 0.35,
                    transition: 'opacity 0.2s ease',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={() => setHoveredSector(i)}
                  onMouseLeave={() => setHoveredSector(null)}
                >
                  <span
                    className="pf-legend-dot"
                    style={{
                      background: s.color,
                      transform: hoveredSector === i ? 'scale(1.4)' : 'scale(1)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                  <span
                    className="pf-legend-label"
                    style={{ color: hoveredSector === i ? s.color : undefined, fontWeight: hoveredSector === i ? 600 : undefined }}
                  >{s.label}</span>
                  <span className="pf-legend-pct mono" style={{ color: hoveredSector === i ? s.color : undefined }}>{s.value}%</span>
                </div>
              ))}
            </div>
          </div>

        </div>{/* end pf-right-col */}

      </div>{/* end pf-main-grid */}
    </div>
  );
}
