'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Maximize, X, LineChart, BarChart4 } from 'lucide-react';
import { createChart, CandlestickSeries, LineSeries, HistogramSeries, CrosshairMode } from 'lightweight-charts';
import { useMarket } from '../context/MarketContext';
import './CandlestickChart.css';

const INTERVALS = ['1s', '5s', '1m', '5m'];

function calculateSMA(data, period) {
  const result = [];
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) continue;
    let sum = 0;
    for (let j = 0; j < period; j++) {
      sum += data[i - j].close;
    }
    result.push({ time: data[i].time, value: sum / period });
  }
  return result;
}

function calculateEMA(data, period) {
  const result = [];
  const k = 2 / (period + 1);
  let ema = null;
  for (let i = 0; i < data.length; i++) {
    if (i < period - 1) continue;
    if (ema === null) {
      let sum = 0;
      for (let j = 0; j < period; j++) {
        sum += data[i - j].close;
      }
      ema = sum / period;
    } else {
      ema = (data[i].close - ema) * k + ema;
    }
    result.push({ time: data[i].time, value: ema });
  }
  return result;
}

function extractVolumeData(data) {
  return data.map(item => ({
    time: item.time,
    value: item.volume,
    color: item.close >= item.open ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'
  }));
}

export default function CandlestickChart({ candles, interval, onIntervalChange, symbol }) {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const seriesRef = useRef(null);

  const smaSeriesRef = useRef(null);
  const emaSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  const [activeChartType, setActiveChartType] = useState('candle');
  const [tooltipData, setTooltipData] = useState(null);
  const [showSMA, setShowSMA] = useState(false);
  const [showEMA, setShowEMA] = useState(false);
  const [showVolume, setShowVolume] = useState(false);
  const [isDrawingMode, setIsDrawingMode] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const { assets, symbolLoading } = useMarket();

  // Get company name for subtitle
  const currentAsset = assets?.find(a => a.symbol === symbol);
  const companyName = currentAsset?.name || '';

  // Fullscreen effect
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    if (isFullscreen) {
      window.addEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'auto';
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'auto';
    };
  }, [isFullscreen]);

  // Handle resize on fullscreen toggle
  useEffect(() => {
    if (chartRef.current) {
      setTimeout(() => {
        if (chartContainerRef.current) {
          chartRef.current.applyOptions({ width: chartContainerRef.current.clientWidth, height: chartContainerRef.current.clientHeight });
        }
      }, 50);
    }
  }, [isFullscreen]);

  const candlesRef = useRef(candles);
  useEffect(() => { candlesRef.current = candles; }, [candles]);

  // Create lightweight-charts instance
  useEffect(() => {
    if (!chartContainerRef.current) return;

    chartRef.current = createChart(chartContainerRef.current, {
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: '#94a3b8',
        attributionLogo: false,
      },
      grid: {
        vertLines: { color: 'rgba(255,255,255,0.04)' },
        horzLines: { color: 'rgba(255,255,255,0.04)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: 'rgba(255,255,255,0.06)',
      },
      timeScale: {
        borderColor: 'rgba(255,255,255,0.06)',
        timeVisible: true,
        secondsVisible: true,
      },
      autoSize: true, // v5 feature to automatically resize
    });

    chartRef.current.subscribeCrosshairMove((param) => {
      if (
        param.point === undefined ||
        !param.time ||
        param.point.x < 0 ||
        param.point.x > chartContainerRef.current.clientWidth ||
        param.point.y < 0 ||
        param.point.y > chartContainerRef.current.clientHeight
      ) {
        setTooltipData(null);
        return;
      }

      const data = param.seriesData.get(seriesRef.current);
      if (data) {
        const originalCandle = candlesRef.current?.find(c => Math.floor(c.open_time / 1000000000) === param.time);

        setTooltipData({
          x: param.point.x,
          y: param.point.y,
          candle: {
            open: data.open ?? data.value,
            high: data.high ?? data.value,
            low: data.low ?? data.value,
            close: data.close ?? data.value,
            volume: originalCandle?.volume || 0,
            open_time: param.time * 1_000_000_000,
          }
        });
      }
    });

    return () => {
      chartRef.current.remove();
      chartRef.current = null;
      seriesRef.current = null;
    };
  }, []);

  // Series swapping logic based on activeChartType
  useEffect(() => {
    if (!chartRef.current) return;

    if (seriesRef.current && chartRef.current) {
      try {
        chartRef.current.removeSeries(seriesRef.current);
      } catch (error) {
        console.warn("Caught Strict Mode ghost series removal");
      }
      seriesRef.current = null;
    }

    if (activeChartType === 'candle') {
      seriesRef.current = chartRef.current.addSeries(CandlestickSeries, {
        upColor: '#22c55e',
        downColor: '#ef4444',
        borderVisible: false,
        wickUpColor: '#22c55e',
        wickDownColor: '#ef4444',
      });
    } else {
      seriesRef.current = chartRef.current.addSeries(LineSeries, {
        color: '#2563eb',
        lineWidth: 2,
      });
    }

    if (candles && candles.length > 0) {
      const data = candles.map(c => {
        const time = Math.floor(c.open_time / 1000000000);
        return activeChartType === 'candle'
          ? { time, open: c.open, high: c.high, low: c.low, close: c.close }
          : { time, value: c.close };
      });

      // Filter out duplicate timestamps
      const uniqueData = Array.from(new Map(data.map(item => [item.time, item])).values());
      uniqueData.sort((a, b) => a.time - b.time);

      seriesRef.current.setData(uniqueData);
    }
  }, [activeChartType, candles]);

  // Handle Indicators visibility
  useEffect(() => {
    if (!chartRef.current || !candles?.length) return;

    const data = candles.map(c => ({
      time: Math.floor(c.open_time / 1000000000),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close
    })).sort((a, b) => a.time - b.time);

    // De-duplicate just in case
    const uniqueData = Array.from(new Map(data.map(i => [i.time, i])).values());

    // SMA
    if (showSMA) {
      if (!smaSeriesRef.current) {
        smaSeriesRef.current = chartRef.current.addSeries(LineSeries, {
          color: '#f97316',
          lineWidth: 2,
          crosshairMarkerVisible: false
        });
      }
      const smaData = calculateSMA(uniqueData, 20);
      smaSeriesRef.current.setData(smaData);
    } else if (smaSeriesRef.current) {
      try {
        chartRef.current.removeSeries(smaSeriesRef.current);
      } catch (err) {
        console.warn("Caught Strict Mode ghost series removal for SMA");
      }
      smaSeriesRef.current = null;
    }

    // EMA
    if (showEMA) {
      if (!emaSeriesRef.current) {
        emaSeriesRef.current = chartRef.current.addSeries(LineSeries, {
          color: '#a855f7',
          lineWidth: 2,
          crosshairMarkerVisible: false
        });
      }
      const emaData = calculateEMA(uniqueData, 50);
      emaSeriesRef.current.setData(emaData);
    } else if (emaSeriesRef.current) {
      try {
        chartRef.current.removeSeries(emaSeriesRef.current);
      } catch (err) {
        console.warn("Caught Strict Mode ghost series removal for EMA");
      }
      emaSeriesRef.current = null;
    }
  }, [candles, showSMA, showEMA]);

  // Handle Volume visibility
  useEffect(() => {
    if (!chartRef.current || !candles?.length) return;

    if (showVolume) {
      if (!volumeSeriesRef.current) {
        volumeSeriesRef.current = chartRef.current.addSeries(HistogramSeries, {
          color: '#26a69a',
          priceFormat: {
            type: 'volume',
          },
          priceScaleId: '',
        });
        chartRef.current.priceScale('').applyOptions({
          scaleMargins: {
            top: 0.8,
            bottom: 0,
          },
        });
      }

      const data = candles.map(c => ({
        time: Math.floor(c.open_time / 1000000000),
        open: c.open,
        close: c.close,
        volume: c.volume
      })).sort((a, b) => a.time - b.time);

      const uniqueData = Array.from(new Map(data.map(i => [i.time, i])).values());
      const volumeData = extractVolumeData(uniqueData);

      volumeSeriesRef.current.setData(volumeData);
    } else if (volumeSeriesRef.current) {
      try {
        chartRef.current.removeSeries(volumeSeriesRef.current);
      } catch (err) {
        console.warn("Caught Strict Mode ghost series removal for Volume");
      }
      volumeSeriesRef.current = null;
    }
  }, [candles, showVolume]);

  // Handle Mark Price Level Interaction Logic
  useEffect(() => {
    if (!chartRef.current) return;

    const myClickHandler = (param) => {
      if (!param.point || !seriesRef.current) return;

      const price = seriesRef.current.coordinateToPrice(param.point.y);
      if (price !== null && typeof price !== 'undefined') {
        seriesRef.current.createPriceLine({
          price: price,
          color: '#3b82f6',
          lineWidth: 2,
          lineStyle: 2,
          axisLabelVisible: true,
          title: 'Level'
        });
        setIsDrawingMode(false);
      }
    };

    if (isDrawingMode) {
      chartRef.current.subscribeClick(myClickHandler);
    }

    return () => {
      if (chartRef.current) {
        chartRef.current.unsubscribeClick(myClickHandler);
      }
    };
  }, [isDrawingMode]);

  const formatPrice = (p) => {
    return '₹' + p.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatTime = (nanos) => {
    const d = new Date(Math.floor(nanos / 1_000_000));
    return d.toLocaleString('en-US', {
      month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit', second: '2-digit',
      hour12: false,
    });
  };

  const formatVolume = (v) => {
    if (v >= 1_000_000) return (v / 1_000_000).toFixed(2) + 'M';
    if (v >= 1_000) return (v / 1_000).toFixed(1) + 'K';
    return v?.toString() ?? '0';
  };

  const tooltipCandle = tooltipData?.candle;
  const isUp = tooltipCandle ? tooltipCandle.close >= tooltipCandle.open : true;

  return (
    <div className={`chart-container card ${isFullscreen ? 'fullscreen-mode' : ''}`} id="candlestick-chart">
      <div className="chart-header flex flex-row items-center justify-between w-full">

        {/* Left Side: Title and Subtitle */}
        <div className="flex flex-row items-center gap-4">
          <div className="flex flex-row items-center gap-2">
            <h3 className="chart-symbol m-0">{symbol}</h3>
            {companyName && <span className="chart-company-name">{companyName}</span>}
          </div>
          <div className="flex flex-row items-center gap-2">
            <span className="chart-subtitle">Candlestick · Stock Chart</span>
            {!symbolLoading && (
              <button
                className="p-1.5 rounded-md text-slate-400 hover:text-slate-100 hover:bg-slate-800 transition-all cursor-pointer border border-transparent hover:border-slate-700"
                onClick={() => setActiveChartType(prev => prev === 'candle' ? 'line' : 'candle')}
                title={`Switch to ${activeChartType === 'candle' ? 'Line' : 'Candles'} View`}
              >
                {activeChartType === 'candle' ? <LineChart size={18} /> : <BarChart4 size={18} />}
              </button>
            )}
          </div>
        </div>

        {/* Right Side: Toolbar and Timeframes */}
        <div className="chart-controls flex flex-row items-center gap-4">

          <div className="flex flex-row items-center gap-3">
            <div
              onClick={() => setShowSMA(!showSMA)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all cursor-pointer select-none ${showSMA
                ? 'bg-blue-600 text-white border border-blue-500 shadow-md shadow-blue-500/50'
                : 'bg-slate-800 text-slate-400 border border-transparent hover:bg-slate-700 hover:text-slate-200'
                }`}
            >
              SMA 20
            </div>

            <div
              onClick={() => setShowEMA(!showEMA)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all cursor-pointer select-none ${showEMA
                ? 'bg-blue-600 text-white border border-blue-500 shadow-md shadow-blue-500/50'
                : 'bg-slate-800 text-slate-400 border border-transparent hover:bg-slate-700 hover:text-slate-200'
                }`}
            >
              EMA 50
            </div>

            <div
              onClick={() => setShowVolume(!showVolume)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all cursor-pointer select-none ${showVolume
                ? 'bg-blue-600 text-white border border-blue-500 shadow-md shadow-blue-500/50'
                : 'bg-slate-800 text-slate-400 border border-transparent hover:bg-slate-700 hover:text-slate-200'
                }`}
            >
              Volume
            </div>

            <div
              onClick={() => setIsDrawingMode(!isDrawingMode)}
              className={`text-xs font-semibold px-3 py-1.5 rounded-full transition-all cursor-pointer select-none ${isDrawingMode
                ? 'bg-blue-600 text-white border border-blue-500 shadow-md shadow-blue-500/50'
                : 'bg-slate-800 text-slate-400 border border-transparent hover:bg-slate-700 hover:text-slate-200'
                }`}
            >
              Mark Level
            </div>
          </div>

          <div className="interval-tabs flex flex-row items-center">
            {INTERVALS.map(iv => (
              <button
                key={iv}
                className={`interval-tab ${interval === iv ? 'active' : ''}`}
                onClick={() => onIntervalChange(iv)}
                id={`interval-${iv}`}
              >
                {iv}
              </button>
            ))}
          </div>

        </div>
      </div>

      <div className={`chart-body ${symbolLoading ? 'chart-loading' : ''}`} style={{ display: 'flex', flexDirection: 'column', position: 'relative' }}>

        {/* Fullscreen Toggle Button */}
        {!symbolLoading && (
          <button
            className={`chart-fullscreen-btn ${isFullscreen ? 'is-fullscreen' : ''}`}
            onClick={() => setIsFullscreen(prev => !prev)}
            aria-label="Toggle Fullscreen"
            title={isFullscreen ? "Exit Fullscreen (Esc)" : "Fullscreen"}
            style={{ zIndex: 10 }}
          >
            {isFullscreen ? <X size={15} /> : <Maximize size={15} />}
          </button>
        )}

        {symbolLoading && (
          <div className="chart-skeleton-overlay">
            <div className="skeleton-bars">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="skeleton-bar"
                  style={{ height: `${30 + Math.random() * 50}%`, animationDelay: `${i * 40}ms` }}
                />
              ))}
            </div>
            <div className="skeleton-label">Loading {symbol}…</div>
          </div>
        )}

        <div ref={chartContainerRef} style={{ flexGrow: 1, position: 'relative', width: '100%', minHeight: '300px' }} />

        {/* Tooltip overlay */}
        {!symbolLoading && tooltipCandle && tooltipData && (
          <div
            className="chart-tooltip"
            style={{
              left: Math.min(tooltipData.x, (chartContainerRef.current?.clientWidth || 400) - 220),
              top: Math.max(8, tooltipData.y - 120),
              zIndex: 20,
              position: 'absolute',
              pointerEvents: 'none'
            }}
          >
            <div className="tooltip-time">{formatTime(tooltipCandle.open_time)}</div>
            <div className="tooltip-grid">
              <div className="tooltip-row">
                <span className="tooltip-dot" style={{ background: isUp ? 'var(--color-buy, #22c55e)' : 'var(--color-sell, #ef4444)' }} />
                <span className="tooltip-label">Open</span>
                <span className="tooltip-value mono">{formatPrice(tooltipCandle.open)}</span>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-dot" style={{ background: 'var(--color-buy, #22c55e)' }} />
                <span className="tooltip-label">High</span>
                <span className="tooltip-value mono">{formatPrice(tooltipCandle.high)}</span>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-dot" style={{ background: 'var(--color-sell, #ef4444)' }} />
                <span className="tooltip-label">Low</span>
                <span className="tooltip-value mono">{formatPrice(tooltipCandle.low)}</span>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-dot" style={{ background: isUp ? 'var(--color-buy, #22c55e)' : 'var(--color-sell, #ef4444)' }} />
                <span className="tooltip-label">Close</span>
                <span className="tooltip-value mono">{formatPrice(tooltipCandle.close)}</span>
              </div>
              <div className="tooltip-row">
                <span className="tooltip-dot" style={{ background: 'var(--accent, #3b82f6)' }} />
                <span className="tooltip-label">Vol</span>
                <span className="tooltip-value mono">{formatVolume(tooltipCandle.volume)}</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
