'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import './Faq.css';

interface FaqAccordionProps {
  question: string;
  answer: string;
}

export default function FaqAccordion({ question, answer }: FaqAccordionProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className={`faq-accordion-item ${isOpen ? 'open' : ''}`}>
      <button className="faq-accordion-header" onClick={() => setIsOpen(!isOpen)} id={`faq-q-${question.toLowerCase().replace(/ /g, '-')}`}>
        <span className="faq-accordion-question">{question}</span>
        <ChevronDown size={18} className={`faq-accordion-icon ${isOpen ? 'rotated' : ''}`} />
      </button>
      <div className={`faq-accordion-content ${isOpen ? 'active' : ''}`}>
        <div className="faq-accordion-answer">
          {answer}
        </div>
      </div>
    </div>
  );
}
