export interface FaqItem {
  id: string;
  question: string;
  answer: string;
  category: string;
}

export const FAQ_CATEGORIES = [
  { id: 'getting-started', label: 'Getting Started', icon: 'Rocket' },
  { id: 'trading', label: 'Trading & Orders', icon: 'BarChart2' },
  { id: 'bots', label: 'Trading Bots', icon: 'Bot' },
  { id: 'portfolio', label: 'Portfolio & Funds', icon: 'Wallet' },
];

export const FAQ_DATA: FaqItem[] = [
  // Getting Started
  {
    id: 'gs-1',
    category: 'getting-started',
    question: 'How do I open a trading account with SyntheticBull?',
    answer: 'Opening an account is simple. Click on the "Register" button on the home page, fill in your details, and submit. You can then log in to your dashboard and start trading.',
  },
  {
    id: 'gs-2',
    category: 'getting-started',
    question: 'Is there a minimum deposit required?',
    answer: 'No, there is no minimum deposit to start exploring the SyntheticBull terminal. However, to execute trades, you will need to add funds to your wallet.',
  },

  // Trading & Orders
  {
    id: 'tr-1',
    category: 'trading',
    question: 'How do I place a Buy order?',
    answer: 'Navigate to the Dashboard, select a stock from the Watchlist, and use the Order Panel on the right. Enter the quantity, select "Buy", and click "Place Order".',
  },
  {
    id: 'tr-2',
    category: 'trading',
    question: 'What is the difference between Market and Limit orders?',
    answer: 'A Market order executes immediately at the current best available price. A Limit order allows you to set a specific price at which you want to buy or sell, and it will only execute if the market reaches that price.',
  },
  {
    id: 'tr-3',
    category: 'trading',
    question: 'What are the market trading hours?',
    answer: 'SyntheticBull operates 24/7 for synthetic assets. However, for traditional stock-linked assets, trading follows standard market hours (9:15 AM to 3:30 PM EST).',
  },

  // Trading Bots
  {
    id: 'bt-1',
    category: 'bots',
    question: 'How do I activate a Trading Bot?',
    answer: 'Go to the "Bots" section from the sidebar. Choose a bot type (Market Maker or Alpha Bot), and toggle the switch to "Running".',
  },
  {
    id: 'bt-2',
    category: 'bots',
    question: 'Can I run multiple bots at once?',
    answer: 'Yes, you can run multiple bots simultaneously across different symbols, provided you have sufficient margin available in your account.',
  },

  // Portfolio & Funds
  {
    id: 'pf-2',
    category: 'portfolio',
    question: 'Where can I see my trade history?',
    answer: 'Your complete trade history is available in the "Orders" section. You can filter by date, asset type, and order status.',
  },
  {
    id: 'pf-3',
    category: 'portfolio',
    question: 'Are there any trading fees?',
    answer: 'In the current testing phase, we are working on this.',
  },
];
