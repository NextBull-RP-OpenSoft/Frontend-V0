'use client';

import React, { useState, useMemo } from 'react';
import { Search, Rocket, BarChart2, Bot, Wallet } from 'lucide-react';
import { FAQ_DATA, FAQ_CATEGORIES } from '../../../data/faqData';
import FaqAccordion from '../../../components/FaqAccordion';
import '../../../components/Faq.css';

const ICON_MAP = {
  Rocket: Rocket,
  BarChart2: BarChart2,
  Bot: Bot,
  Wallet: Wallet,
};

export default function FaqPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const filteredFaqs = useMemo(() => {
    return FAQ_DATA.filter(item => {
      const matchesSearch = 
        item.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
        item.answer.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCategory = activeCategory ? item.category === activeCategory : true;
      
      return matchesSearch && matchesCategory;
    });
  }, [searchQuery, activeCategory]);

  const toggleCategory = (categoryId: string) => {
    setActiveCategory(activeCategory === categoryId ? null : categoryId);
  };

  return (
    <div className="faq-container animate-fade-in">
      <header className="faq-header">
        <h1 className="faq-title">FAQs</h1>
        <p className="faq-subtitle">Find answers to common questions about SyntheticBull terminal.</p>
      </header>

      <div className="faq-search-container">
        <Search size={20} className="faq-search-icon" />
        <input
          type="text"
          className="faq-search-input"
          placeholder="Search for articles, features, or troubleshooting..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          id="faq-search-input"
        />
      </div>

      <div className="faq-categories">
        {FAQ_CATEGORIES.map(category => {
          const IconComponent = ICON_MAP[category.icon as keyof typeof ICON_MAP];
          return (
            <div
              key={category.id}
              className={`faq-category-card ${activeCategory === category.id ? 'active' : ''}`}
              onClick={() => toggleCategory(category.id)}
              id={`cat-${category.id}`}
            >
              <IconComponent size={24} className="faq-category-icon" />
              <span className="faq-category-label">{category.label}</span>
            </div>
          );
        })}
      </div>

      <div className="faq-list">
        {filteredFaqs.length > 0 ? (
          filteredFaqs.map(faq => (
            <FaqAccordion
              key={faq.id}
              question={faq.question}
              answer={faq.answer}
            />
          ))
        ) : (
          <div className="faq-no-results">
            No results found for "{searchQuery}". Try different keywords or browse categories.
          </div>
        )}
      </div>
    </div>
  );
}
