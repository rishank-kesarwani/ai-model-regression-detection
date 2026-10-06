'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  LogIn,
  LogOut,
  Terminal,
  Menu,
  X,
  LayoutDashboard,
  PlayCircle,
  AlertTriangle,
  GitCompare,
  Database,
  FlaskConical,
  FileCode,
  Cpu,
  Sliders,
  Settings,
} from 'lucide-react';

const navItems = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/evaluations', label: 'Evaluations', icon: PlayCircle },
  { href: '/regressions', label: 'Regressions', icon: AlertTriangle, badge: 'Active' },
  { href: '/baselines', label: 'Baselines', icon: GitCompare },
  { href: '/datasets', label: 'Datasets', icon: Database },
  { href: '/experiments', label: 'A/B Experiments', icon: FlaskConical },
  { href: '/prompts', label: 'Prompts & Hashes', icon: FileCode },
  { href: '/models', label: 'Models & Pricing', icon: Cpu },
  { href: '/policies', label: 'Regression Policies', icon: Sliders },
  { href: '/settings', label: 'Settings', icon: Settings },
];

export function Navbar() {
  const { user, openLoginModal, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-border bg-surface/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-3.5 sm:px-6">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex md:hidden items-center justify-center h-9 w-9 rounded-lg border border-surface-border bg-surface-elevated text-slate-300 hover:text-white shrink-0"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>

          <Link href="/" className="flex items-center gap-2.5 sm:gap-3 group min-w-0">
            <div className="relative flex h-9 w-9 sm:h-10 sm:w-10 min-w-[36px] min-h-[36px] shrink-0 aspect-square items-center justify-center rounded-xl overflow-hidden shadow-lg shadow-primary-500/20 ring-1 ring-primary-500/30 group-hover:ring-primary-400 transition bg-slate-950">
              <Image
                src="/logo.svg"
                alt="AI Model Regression Logo"
                width={40}
                height={40}
                className="h-full w-full object-contain aspect-square p-0.5"
                priority
              />
            </div>
            <div className="min-w-0 truncate">
              <span className="font-bold tracking-tight text-white flex items-center gap-1.5 sm:gap-2 text-sm sm:text-base truncate">
                <span className="truncate">AI Regression</span>
                <span className="hidden xs:inline-block truncate">Detection</span>
                <span className="hidden sm:inline-flex rounded bg-primary-500/10 px-2 py-0.5 text-[10px] font-semibold text-primary-400 border border-primary-500/20 shrink-0">
                  PROD
                </span>
              </span>
            </div>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-4 shrink-0">
          <div className="hidden lg:flex items-center gap-2 text-xs text-slate-400 bg-surface-elevated/70 px-3 py-1.5 rounded-full border border-surface-border">
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
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-200 bg-surface-elevated px-2.5 sm:px-3 py-1 rounded-full border border-surface-border max-w-[120px] sm:max-w-none truncate">
                <div className="h-5 w-5 rounded-full bg-primary-500 flex items-center justify-center text-[10px] sm:text-xs font-bold text-white shrink-0">
                  {user.username.charAt(0).toUpperCase()}
                </div>
                <span className="font-medium text-xs truncate">{user.username}</span>
              </div>
              <button
                onClick={logout}
                className="flex items-center gap-1 text-xs text-slate-400 hover:text-rose-400 transition p-1"
                title="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={openLoginModal}
              className="flex items-center gap-1.5 text-xs font-medium bg-primary-600 hover:bg-primary-500 text-white px-3 sm:px-3.5 py-1.5 rounded-lg transition shadow-md shadow-primary-600/20 shrink-0"
            >
              <LogIn className="h-3.5 w-3.5" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-surface-border bg-surface px-4 py-3 space-y-2 shadow-2xl animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="px-2 py-1 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Platform Navigation
          </div>
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                    isActive
                      ? 'bg-primary-600/15 text-primary-400 border border-primary-500/20'
                      : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className={`h-4 w-4 ${isActive ? 'text-primary-400' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && (
                    <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-semibold text-rose-400 border border-rose-500/20">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      )}
    </header>
  );
}
