'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import BullLogo from '../components/BullLogo';


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
      <div className="relative w-full max-w-[420px] bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-12 shadow-lg animate-fade-in mx-auto mt-24">
        <div className="text-center mb-8">
          <BullLogo size={48} className="block mx-auto mb-2 text-[var(--accent)]" />
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-[-0.02em]">
            Synthetic<span className="logo-accent">Bull</span>
          </h1>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-[0.15em] mt-[2px]">Trading Terminal</p>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Welcome back</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">Sign in to your trading account</p>

          {error && <div className="px-[14px] py-[10px] bg-[var(--color-sell-bg)] border border-red-500/20 rounded-sm text-[var(--color-sell)] text-sm mb-4 animate-fade-in">{error}</div>}

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
            className="btn btn-primary btn-lg w-full mt-4"
            disabled={loading}
            id="btn-login"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>

          <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
            Don&apos;t have an account? <Link href="/register" className="text-[var(--accent)] font-semibold hover:text-[var(--accent-hover)] transition-colors">Create account</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
