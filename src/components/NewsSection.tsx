'use client';

import React, { useState, useEffect } from 'react';
import { Newspaper, Clock } from 'lucide-react';
import * as api from '../services/api';
import './NewsSection.css';

interface NewsItem {
  title: string;
  source: string;
  time: string;
  url: string;
  description?: string;
}

interface NewsSectionProps {
  stock: string;
}

export default function NewsSection({ stock }: NewsSectionProps) {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!stock) return;
    setLoading(true);
    api.getNews(stock)
      .then(res => setNews(res.data || []))
      .catch(err => console.error('Failed to fetch news:', err))
      .finally(() => setLoading(false));
  }, [stock]);

  return (
    <div className="news-section card" id="news-section">
      <div className="news-header">
        <Newspaper size={16} className="text-secondary" />
        <h2 className="news-title">News</h2>
      </div>

      <div className="news-list">
        {loading ? (
          <div className="news-loading">
            {[1, 2, 3].map(i => (
              <div key={i} className="news-skeleton">
                <div className="skeleton-line title" />
                <div className="skeleton-line meta" />
              </div>
            ))}
          </div>
        ) : news.length === 0 ? (
          <div className="news-empty">No recent news available for {stock}</div>
        ) : (
          news.map((item, i) => (
            <a 
              key={i} 
              href={item.url} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="news-item"
            >
              <div className="news-item-content">
                <h3 className="news-headline">{item.title}</h3>
                <div className="news-meta">
                  <span className="news-source">{item.source}</span>
                  <span className="news-divider">•</span>
                  <span className="news-time">
                    <Clock size={10} style={{ marginRight: '4px' }} />
                    {item.time}
                  </span>
                </div>
              </div>
            </a>
          ))
        )}
      </div>
    </div>
  );
}
