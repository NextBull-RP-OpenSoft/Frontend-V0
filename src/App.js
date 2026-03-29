import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import * as api from './services/api';
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import PortfolioPage from './pages/PortfolioPage';
import OrdersPage from './pages/OrdersPage';
import BotsPage from './pages/BotsPage';
import AdminPage from './pages/AdminPage';
import './App.css';

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <div className="app-loading"><div className="spinner"></div></div>;
  return isAuthenticated ? children : <Navigate to="/login" />;
}

function AppLayout() {
  const [selectedSymbol, setSelectedSymbol] = useState('BTC');
  const [assets, setAssets] = useState([]);

  useEffect(() => {
    const loadAssets = async () => {
      const data = await api.getAssets();
      setAssets(data);
    };
    loadAssets();
    const interval = setInterval(async () => {
      const data = await api.getAssets();
      setAssets(data);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="app-layout">
      <Sidebar />
      <div className="app-main">
        <Navbar
          selectedSymbol={selectedSymbol}
          onSymbolChange={setSelectedSymbol}
          assets={assets}
        />
        <div className="app-content">
          <Routes>
            <Route path="/dashboard" element={<DashboardPage selectedSymbol={selectedSymbol} />} />
            <Route path="/portfolio" element={<PortfolioPage />} />
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/bots" element={<BotsPage />} />
            <Route path="/admin" element={<AdminPage />} />
            <Route path="*" element={<Navigate to="/dashboard" />} />
          </Routes>
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route
            path="/*"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
