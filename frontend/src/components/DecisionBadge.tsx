import React from 'react';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

interface DecisionBadgeProps {
  decision: 'PASS' | 'WARN' | 'FAIL' | 'QUEUED' | 'RUNNING' | 'CANCELLED' | string;
  size?: 'sm' | 'md' | 'lg';
}

export function DecisionBadge({ decision, size = 'md' }: DecisionBadgeProps) {
  const norm = String(decision || 'PENDING').toUpperCase();

  const styles = {
    PASS: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30 shadow-emerald-500/10',
    WARN: 'bg-amber-500/10 text-amber-400 border-amber-500/30 shadow-amber-500/10',
    FAIL: 'bg-rose-500/10 text-rose-400 border-rose-500/30 shadow-rose-500/10',
    RUNNING: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30 animate-pulse',
    QUEUED: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
    CANCELLED: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  }[norm] || 'bg-slate-500/10 text-slate-400 border-slate-500/30';

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[10px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
    lg: 'px-3.5 py-1.5 text-sm font-semibold gap-2',
  }[size];

  const renderIcon = () => {
    switch (norm) {
      case 'PASS':
        return <CheckCircle2 className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />;
      case 'WARN':
        return <AlertTriangle className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />;
      case 'FAIL':
        return <XCircle className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />;
      default:
        return <Clock className={size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'} />;
    }
  };

  return (
    <span className={`inline-flex items-center rounded-full font-medium border shadow-sm ${styles} ${sizeClasses}`}>
      {renderIcon()}
      <span>{norm}</span>
    </span>
  );
}
