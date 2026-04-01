'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import * as api from '../services/api';

const MarketContext = createContext(null);

export function MarketProvider({ children }) {
  const [selectedSymbol, setSelectedSymbol] = useState(null);
  const [assets, setAssets] = useState([]);
  const [marketStats, setMarketStats] = useState({});

  useEffect(() => {
    const loadAssets = async () => {
      try {
        const data = await api.getAssets();
        setAssets(data || []);
        setSelectedSymbol(prev => {
          if (prev && data?.some(a => a.symbol === prev)) return prev;
          return data?.[0]?.symbol || null;
        });
      } catch {
        // API not available yet
      }
    };
    loadAssets();
    const interval = setInterval(loadAssets, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleMarketStats = useCallback((stats) => {
    setMarketStats(stats);
  }, []);

  return (
    <MarketContext.Provider value={{
      selectedSymbol,
      setSelectedSymbol,
      assets,
      marketStats,
      setMarketStats: handleMarketStats,
    }}>
      {children}
    </MarketContext.Provider>
  );
}

export function useMarket() {
  const ctx = useContext(MarketContext);
  if (!ctx) throw new Error('useMarket must be used within MarketProvider');
  return ctx;
}
