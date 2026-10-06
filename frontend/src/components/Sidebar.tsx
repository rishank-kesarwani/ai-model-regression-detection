'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Database,
  PlayCircle,
  GitCompare,
  AlertTriangle,
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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-surface-border bg-surface/50 p-4 flex flex-col justify-between shrink-0">
      <div className="space-y-1">
        <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
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
                className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-primary-600/15 text-primary-400 border border-primary-500/20 shadow-sm'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
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

      <div className="rounded-xl border border-surface-border bg-surface-elevated/60 p-3 text-xs text-slate-400">
        <div className="font-semibold text-slate-200 mb-1">Downstream Target</div>
        <p className="text-[11px] leading-relaxed text-slate-400">
          Integrated with <span className="text-primary-400 font-mono">ai-pr-review-platform</span> via <span className="text-slate-300 font-mono">/regression/check</span>.
        </p>
      </div>
    </aside>
  );
}
