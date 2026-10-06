'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/lib/auth-context';
import { LogIn, LogOut, Terminal, Activity, Bell } from 'lucide-react';

export function Navbar() {
  const { user, openLoginModal, logout } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-border bg-surface/80 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-primary-500/20 ring-1 ring-primary-500/30 group-hover:ring-primary-400 transition">
              <Image
                src="/logo.svg"
                alt="AI Model Regression Logo"
                width={40}
                height={40}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                priority
              />
            </div>
            <div>
              <span className="font-bold tracking-tight text-white flex items-center gap-2 text-base">
                AI Regression Detection
                <span className="rounded bg-primary-500/10 px-2 py-0.5 text-[10px] font-semibold text-primary-400 border border-primary-500/20">
                  PROD
                </span>
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 text-xs text-slate-400 bg-surface-elevated/70 px-3 py-1.5 rounded-full border border-surface-border">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </span>
            <span>Regression Engine Active</span>
          </div>

          <a
            href="http://localhost:4000/api/docs"
            target="_blank"
            rel="noreferrer"
            className="hidden sm:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-2.5 py-1.5 rounded-md hover:bg-slate-800 transition"
          >
            <Terminal className="h-3.5 w-3.5" />
            <span>Swagger API</span>
          </a>

          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 text-sm text-slate-200 bg-surface-elevated px-3 py-1 rounded-full border border-surface-border">
                <div className="h-5 w-5 rounded-full bg-primary-500 flex items-center justify-center text-xs font-bold text-white">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-xs">{user.username}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={openLoginModal}
              className="flex items-center gap-1.5 text-xs font-medium bg-primary-600 hover:bg-primary-500 text-white px-3.5 py-1.5 rounded-lg transition shadow-md shadow-primary-600/20"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
