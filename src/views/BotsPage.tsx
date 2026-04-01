'use client';

import React, { useState, useEffect } from 'react';
import { Landmark, Brain, Pencil } from 'lucide-react';
import * as api from '../services/api';


export default function BotsPage() {
  const [bots, setBots] = useState([]);
  const [editingBot, setEditingBot] = useState(null);
  const [editConfig, setEditConfig] = useState('');

  useEffect(() => {
    api.getBots().then(setBots).catch(() => { });
    const interval = setInterval(() => api.getBots().then(setBots).catch(() => { }), 10000);
    return () => clearInterval(interval);
  }, []);

  const toggleBot = async (bot) => {
    if (bot.is_active) {
      await api.stopBot(bot.id);
    } else {
      await api.startBot(bot.id);
    }
    setBots(prev => prev.map(b =>
      b.id === bot.id ? { ...b, is_active: !b.is_active } : b
    ));
  };

  const startEditConfig = (bot) => {
    setEditingBot(bot.id);
    try {
      setEditConfig(JSON.stringify(JSON.parse(bot.config), null, 2));
    } catch {
      setEditConfig(bot.config);
    }
  };

  const saveConfig = async (botId) => {
    try {
      const parsed = JSON.parse(editConfig);
      await api.updateBotConfig(botId, parsed);
      setBots(prev => prev.map(b =>
        b.id === botId ? { ...b, config: JSON.stringify(parsed) } : b
      ));
      setEditingBot(null);
    } catch {
      alert('Invalid JSON configuration');
    }
  };

  const parseConfig = (configStr) => {
    try {
      return JSON.parse(configStr);
    } catch {
      return {};
    }
  };

  return (
    <div className="max-w-[1200px] animate-fade-in" id="bots-page">
      <div className="page-header">
        <h1>Trading Bots</h1>
        <p>Monitor and control automated trading strategies</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[repeat(auto-fill,minmax(420px,1fr))] gap-6">
        {bots.map(bot => {
          const config = parseConfig(bot.config);
          return (
            <div className={`card relative overflow-hidden before:absolute before:inset-x-0 before:top-0 before:h-[3px] before:bg-[var(--text-muted)] before:transition-colors before:duration-250 ${bot.is_active ? 'before:bg-[var(--accent)]' : ''}`} key={bot.id} id={`bot-${bot.id.slice(0, 8)}`}>
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 flex items-center justify-center bg-[var(--bg-input)] rounded-md text-[var(--text-secondary)]">
                    {bot.bot_type === 'market_maker' ? <Landmark size={24} /> : <Brain size={24} />}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold text-[var(--text-primary)] mb-1">{bot.name}</h3>
                    <span className="badge badge-accent">
                      {bot.bot_type === 'market_maker' ? 'Market Maker' : 'Alpha Bot'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <button
                    className={`w-12 h-[26px] bg-[var(--bg-input)] border-2 border-[var(--border-primary)] rounded-[13px] relative transition-all duration-150 cursor-pointer ${bot.is_active ? 'bg-[var(--accent-muted)] border-[var(--accent)]' : ''}`}
                    onClick={() => toggleBot(bot)}
                    id={`toggle-bot-${bot.id.slice(0, 8)}`}
                  >
                    <span className={`absolute top-[2px] w-[18px] h-[18px] rounded-full transition-all duration-150 ${bot.is_active ? 'left-[24px] bg-[var(--accent)]' : 'left-[2px] bg-[var(--text-muted)]'}`}></span>
                  </button>
                  <span className={`text-xs font-semibold ${bot.is_active ? 'text-[var(--accent)]' : 'text-[var(--text-muted)]'}`}>
                    {bot.is_active ? 'Running' : 'Stopped'}
                  </span>
                </div>
              </div>

              <div className="flex items-center px-4 py-2 bg-[var(--bg-input)] rounded-sm mb-4">
                <span className={`status-dot mr-2 ${bot.is_active ? 'active' : 'inactive'}`}></span>
                <span className="text-xs text-[var(--text-secondary)]">
                  {bot.is_active ? 'Actively trading' : 'Inactive'}
                </span>
              </div>

              <div className="border-t border-[var(--border-primary)] pt-4">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="text-sm font-semibold text-[var(--text-secondary)]">Configuration</h4>
                  {editingBot !== bot.id ? (
                    <button
                      className="btn btn-ghost btn-sm"
                      onClick={() => startEditConfig(bot)}
                    >
                      <Pencil size={12} /> Edit
                    </button>
                  ) : (
                    <div className="flex gap-1">
                      <button className="btn btn-sm btn-primary" onClick={() => saveConfig(bot.id)}>Save</button>
                      <button className="btn btn-sm btn-ghost" onClick={() => setEditingBot(null)}>Cancel</button>
                    </div>
                  )}
                </div>

                {editingBot === bot.id ? (
                  <textarea
                    className="w-full bg-[var(--bg-input)] border border-[var(--border-primary)] rounded-sm p-2 text-[var(--accent)] text-xs resize-y min-h-[120px] focus:border-[var(--accent)] focus:ring-[3px] focus:ring-[var(--accent-muted)] outline-none mono"
                    value={editConfig}
                    onChange={e => setEditConfig(e.target.value)}
                    rows={6}
                  />
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(config).map(([key, value]) => (
                      <div className="flex flex-col p-2 bg-[var(--bg-input)] rounded-sm" key={key}>
                        <span className="text-xs text-[var(--text-muted)] capitalize mb-[2px]">{key.replace(/_/g, ' ')}</span>
                        <span className="text-sm font-semibold text-[var(--accent)] mono">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
