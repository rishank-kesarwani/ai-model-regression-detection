'use client';

import React, { useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { X, Lock, User, ShieldCheck } from 'lucide-react';

export function LoginModal() {
  const { isLoginModalOpen, closeLoginModal, login } = useAuth();
  const [username, setUsername] = useState('admin@rishankkesharwani.com');
  const [password, setPassword] = useState('password123');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isLoginModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await login(username, password);
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="glass-card w-full max-w-md rounded-2xl p-6 relative border border-surface-border shadow-2xl bg-surface">
        <button
          onClick={closeLoginModal}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-primary-600/20 text-primary-400 flex items-center justify-center border border-primary-500/30">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-white">Sign In to Platform</h3>
            <p className="text-xs text-slate-400">Authenticate for admin operations and baseline locks</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-lg bg-rose-500/10 p-3 text-xs text-rose-400 border border-rose-500/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Email / Username</label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full rounded-lg border border-surface-border bg-surface-elevated pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
                placeholder="admin@rishankkesharwani.com"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Password</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-surface-border bg-surface-elevated pl-9 pr-3 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-primary-500"
                placeholder="••••••••"
              />
            </div>
          </div>

          <div className="pt-2 flex flex-col gap-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-lg bg-primary-600 hover:bg-primary-500 py-2.5 text-sm font-semibold text-white transition disabled:opacity-50 shadow-lg shadow-primary-600/25"
            >
              {loading ? 'Authenticating...' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={closeLoginModal}
              className="w-full rounded-lg border border-surface-border bg-surface-elevated/50 py-2 text-xs text-slate-300 hover:bg-slate-800 transition"
            >
              Continue as Guest (Public Mode)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
