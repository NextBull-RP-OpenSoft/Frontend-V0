'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import BullLogo from '../components/BullLogo';


export default function RegisterPage() {
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { register, login } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !email || !password || !confirmPassword) {
      setError('Please fill in all fields');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await register(username, email, password);
      await login(username, password);
      router.push('/dashboard');
    } catch (err) {
      setError('Registration failed. Please try again.');
    }
    setLoading(false);
  };

  return (
    <div className="auth-layout" id="register-page">
      <div className="relative w-full max-w-[420px] bg-[var(--bg-card)] border border-[var(--border-primary)] rounded-xl p-12 shadow-lg animate-fade-in mx-auto mt-24">
        <div className="text-center mb-8">
          <BullLogo size={48} className="block mx-auto mb-2 text-[var(--accent)]" />
          <h1 className="text-2xl font-extrabold text-[var(--text-primary)] tracking-[-0.02em]">
            Synthetic<span className="logo-accent">Bull</span>
          </h1>
          <p className="text-xs text-[var(--text-muted)] uppercase tracking-[0.15em] mt-[2px]">Trading Terminal</p>
        </div>

        <form onSubmit={handleSubmit} className="relative">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-1">Create Account</h2>
          <p className="text-sm text-[var(--text-secondary)] mb-6">Start trading with $100,000 simulated capital</p>

          {error && <div className="px-[14px] py-[10px] bg-[var(--color-sell-bg)] border border-red-500/20 rounded-sm text-[var(--color-sell)] text-sm mb-4 animate-fade-in">{error}</div>}

          <div className="form-group">
            <label htmlFor="register-username">Username</label>
            <input
              id="register-username"
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="Choose a username"
              autoFocus
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-email">Email</label>
            <input
              id="register-email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="Enter your email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-password">Password</label>
            <input
              id="register-password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Create a password"
            />
          </div>

          <div className="form-group">
            <label htmlFor="register-confirm">Confirm Password</label>
            <input
              id="register-confirm"
              type="password"
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              placeholder="Confirm your password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-lg w-full mt-4"
            disabled={loading}
            id="btn-register"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="text-center text-sm text-[var(--text-secondary)] mt-6">
            Already have an account? <Link href="/login" className="text-[var(--accent)] font-semibold hover:text-[var(--accent-hover)] transition-colors">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
