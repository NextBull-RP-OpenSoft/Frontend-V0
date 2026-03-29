import React, { createContext, useContext, useState, useEffect } from 'react';
import * as api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('sb_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      api.getUser().then(u => {
        setUser(u);
        setLoading(false);
      }).catch(() => {
        setToken(null);
        localStorage.removeItem('sb_token');
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, [token]);

  const login = async (username, password) => {
    const res = await api.login(username, password);
    setToken(res.token);
    localStorage.setItem('sb_token', res.token);
    localStorage.setItem('sb_refresh', res.refresh_token);
    const u = await api.getUser();
    setUser(u);
    return u;
  };

  const register = async (username, email, password) => {
    const res = await api.register(username, email, password);
    return res;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('sb_token');
    localStorage.removeItem('sb_refresh');
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, isAuthenticated: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export default AuthContext;
