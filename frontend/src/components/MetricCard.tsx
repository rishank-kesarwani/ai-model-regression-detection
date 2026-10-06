import React from 'react';
import { ArrowUpRight, ArrowDownRight, Minus } from 'lucide-react';

interface MetricCardProps {
  title: string;
  value: string | number;
  unit?: string;
  deltaPercent?: number;
  direction?: 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER';
  subtitle?: string;
  isAiJudge?: boolean;
}

export function MetricCard({
  title,
  value,
  unit,
  deltaPercent,
  direction = 'HIGHER_IS_BETTER',
  subtitle,
  isAiJudge,
}: MetricCardProps) {
  let isGood = false;
  let isBad = false;

  if (deltaPercent !== undefined && deltaPercent !== 0) {
    if (direction === 'HIGHER_IS_BETTER') {
      isGood = deltaPercent > 0;
      isBad = deltaPercent < 0;
    } else {
      isGood = deltaPercent < 0;
      isBad = deltaPercent > 0;
    }
  }

  return (
    <div className="glass-card rounded-xl p-5 relative overflow-hidden transition hover:border-slate-600">
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">{title}</span>
        {isAiJudge && (
          <span className="rounded bg-indigo-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-indigo-400 border border-indigo-500/20">
            AI JUDGE
          </span>
        )}
      </div>

      <div className="flex items-baseline gap-2 mt-1">
        <span className="text-2xl font-bold tracking-tight text-white">{value}</span>
        {unit && <span className="text-xs font-normal text-slate-400">{unit}</span>}
      </div>

      <div className="mt-3 flex items-center justify-between">
        {deltaPercent !== undefined ? (
          <div
            className={`flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${
              isGood
                ? 'text-emerald-400 bg-emerald-500/10'
                : isBad
                ? 'text-rose-400 bg-rose-500/10'
                : 'text-slate-400 bg-slate-800'
            }`}
          >
            {deltaPercent > 0 ? (
              <ArrowUpRight className="h-3.5 w-3.5" />
            ) : deltaPercent < 0 ? (
              <ArrowDownRight className="h-3.5 w-3.5" />
            ) : (
              <Minus className="h-3 w-3" />
            )}
            <span>
              {deltaPercent > 0 ? `+${deltaPercent.toFixed(1)}%` : `${deltaPercent.toFixed(1)}%`}
            </span>
          </div>
        ) : (
          <span className="text-xs text-slate-500">Baseline sync</span>
        )}

        {subtitle && <span className="text-[11px] text-slate-400 truncate max-w-[150px]">{subtitle}</span>}
      </div>
    </div>
  );
}
