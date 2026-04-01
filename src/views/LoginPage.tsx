'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import BullLogo from '../components/BullLogo';
import './LoginPage.css';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setError('Please fill in all fields');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await login(username, password);
      router.push('/dashboard');
    } catch (err) {
      setError('Invalid credentials. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-layout" id="login-page">
      <div className="auth-card animate-fade-in">
        <div className="auth-logo">
          <BullLogo size={48} className="auth-logo-icon" />
          <h1 className="auth-logo-text">
            Synthetic<span className="logo-accent">Bull</span>
          </h1>
          <p className="auth-logo-sub">Trading Terminal</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2 className="auth-title">Welcome back</h2>
          <p className="auth-subtitle">Sign in to your trading account</p>

          {error && <div className="auth-error">{error}</div>}

          <div className="form-group">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Enter your username"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Enter your password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg auth-submit"
            disabled={loading}
            id="btn-login"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="auth-footer">
            Don&apos;t have an account? <Link href="/register">Create account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
