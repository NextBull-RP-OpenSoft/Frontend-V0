'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../context/AuthContext';
import BullLogo from '../components/BullLogo';
import './LoginPage.css';

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
    if (!email.match((/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/))) {
      setError('Invalid email id');
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
      <div className="auth-card animate-fade-in">
        <div className="auth-logo">
          <BullLogo size={48} className="auth-logo-icon" />
          <h1 className="auth-logo-text">
            Synthetic<span className="logo-accent">Bull</span>
          </h1>
          <p className="auth-logo-sub">Trading Terminal</p>
        </div>

        <form onSubmit={handleSubmit} className="auth-form">
          <h2 className="auth-title">Create Account</h2>
          <p className="auth-subtitle">Start trading with $100,000 simulated capital</p>

          {error && <div className="auth-error">{error}</div>}

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
            className="btn btn-primary btn-lg auth-submit"
            disabled={loading}
            id="btn-register"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>

          <p className="auth-footer">
            Already have an account? <Link href="/login">Sign in</Link>
          </p>
        </form>
      </div>
    </div>
  );
}
