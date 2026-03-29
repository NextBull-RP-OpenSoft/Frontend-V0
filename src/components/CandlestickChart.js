import React, { useEffect, useRef } from 'react';
import { createChart, CandlestickSeries, HistogramSeries } from 'lightweight-charts';
import './CandlestickChart.css';

const INTERVALS = ['1s', '5s', '1m', '5m'];

export default function CandlestickChart({ candles, interval, onIntervalChange, symbol }) {
  const chartRef = useRef(null);
  const chartInstanceRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const volumeSeriesRef = useRef(null);

  useEffect(() => {
    if (!chartRef.current) return;

    // Dispose previous chart
    if (chartInstanceRef.current) {
      chartInstanceRef.current.remove();
    }

    const chart = createChart(chartRef.current, {
      layout: {
        background: { type: 'solid', color: 'transparent' },
        textColor: '#8892a8',
        fontSize: 11,
        fontFamily: "'Inter', sans-serif",
      },
      grid: {
        vertLines: { color: 'rgba(255, 255, 255, 0.03)' },
        horzLines: { color: 'rgba(255, 255, 255, 0.03)' },
      },
      crosshair: {
        mode: 0,
        vertLine: {
          color: 'rgba(0, 212, 170, 0.3)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#00d4aa',
        },
        horzLine: {
          color: 'rgba(0, 212, 170, 0.3)',
          width: 1,
          style: 2,
          labelBackgroundColor: '#00d4aa',
        },
      },
      rightPriceScale: {
        borderColor: 'rgba(255, 255, 255, 0.06)',
        scaleMargins: { top: 0.1, bottom: 0.25 },
      },
      timeScale: {
        borderColor: 'rgba(255, 255, 255, 0.06)',
        timeVisible: true,
        secondsVisible: interval === '1s' || interval === '5s',
      },
      handleScroll: { vertTouchDrag: false },
    });

    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: '#00e676',
      downColor: '#ff5252',
      borderUpColor: '#00e676',
      borderDownColor: '#ff5252',
      wickUpColor: '#00e676',
      wickDownColor: '#ff5252',
    });

    const volumeSeries = chart.addSeries(HistogramSeries, {
      priceFormat: { type: 'volume' },
      priceScaleId: 'volume',
    });

    chart.priceScale('volume').applyOptions({
      scaleMargins: { top: 0.8, bottom: 0 },
    });

    chartInstanceRef.current = chart;
    candleSeriesRef.current = candleSeries;
    volumeSeriesRef.current = volumeSeries;

    const handleResize = () => {
      if (chartRef.current) {
        chart.applyOptions({
          width: chartRef.current.clientWidth,
          height: chartRef.current.clientHeight,
        });
      }
    };

    window.addEventListener('resize', handleResize);
    handleResize();

    return () => {
      window.removeEventListener('resize', handleResize);
      chart.remove();
      chartInstanceRef.current = null;
    };
    // eslint-disable-next-line
  }, [interval]);

  // Update data when candles change
  useEffect(() => {
    if (!candleSeriesRef.current || !volumeSeriesRef.current || !candles?.length) return;

    const formattedCandles = candles.map(c => ({
      time: Math.floor(c.open_time / 1_000_000_000),
      open: c.open,
      high: c.high,
      low: c.low,
      close: c.close,
    }));

    const formattedVolume = candles.map(c => ({
      time: Math.floor(c.open_time / 1_000_000_000),
      value: c.volume,
      color: c.close >= c.open ? 'rgba(0, 230, 118, 0.2)' : 'rgba(255, 82, 82, 0.2)',
    }));

    candleSeriesRef.current.setData(formattedCandles);
    volumeSeriesRef.current.setData(formattedVolume);

    // Scroll to latest
    if (chartInstanceRef.current) {
      chartInstanceRef.current.timeScale().scrollToRealTime();
    }
  }, [candles]);

  return (
    <div className="chart-container card" id="candlestick-chart">
      <div className="chart-header">
        <div className="chart-title">
          <h3>{symbol}/USD</h3>
          <span className="chart-subtitle">Candlestick Chart</span>
        </div>
        <div className="interval-tabs">
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
      <div className="chart-body" ref={chartRef}></div>
    </div>
  );
}
