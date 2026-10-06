import React from 'react';
import { DecisionBadge } from './DecisionBadge';
import { ArrowUpRight, ArrowDownRight, Minus, AlertCircle } from 'lucide-react';

interface MetricRegressionItem {
  metricName: string;
  category: string;
  direction: 'HIGHER_IS_BETTER' | 'LOWER_IS_BETTER';
  baselineValue: number;
  candidateValue: number;
  delta: number;
  relativeDeltaPercent: number;
  warnThresholdPercent: number;
  failThresholdPercent: number;
  decision: 'PASS' | 'WARN' | 'FAIL';
  severity: string;
  explanation: string;
  unit: string;
}

interface RegressionTableProps {
  regressions: MetricRegressionItem[];
  emptyMessage?: string;
}

export function RegressionTable({ regressions, emptyMessage = 'No regressions detected.' }: RegressionTableProps) {
  if (!regressions || regressions.length === 0) {
    return (
      <div className="rounded-xl border border-surface-border bg-surface/30 p-8 text-center text-slate-400">
        <AlertCircle className="mx-auto h-8 w-8 text-slate-500 mb-2" />
        <p className="text-sm">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-surface-border glass-card">
      <table className="w-full text-left text-sm">
        <thead className="border-b border-surface-border bg-surface-elevated/50 text-xs font-semibold uppercase text-slate-400">
          <tr>
            <th className="px-4 py-3.5">Metric & Category</th>
            <th className="px-4 py-3.5">Baseline</th>
            <th className="px-4 py-3.5">Candidate</th>
            <th className="px-4 py-3.5">Delta (Change)</th>
            <th className="px-4 py-3.5">Threshold Policy</th>
            <th className="px-4 py-3.5">Decision</th>
            <th className="px-4 py-3.5">Explanation</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-surface-border/50 text-slate-200">
          {regressions.map((reg, idx) => {
            const isHigherBetter = reg.direction === 'HIGHER_IS_BETTER';
            const isRegressed = reg.decision !== 'PASS';

            return (
              <tr
                key={`${reg.metricName}-${idx}`}
                className={`hover:bg-surface-elevated/40 transition ${
                  reg.decision === 'FAIL' ? 'bg-rose-500/5' : reg.decision === 'WARN' ? 'bg-amber-500/5' : ''
                }`}
              >
                <td className="px-4 py-3.5 font-medium">
                  <div className="font-semibold text-white">{reg.metricName}</div>
                  <div className="text-[11px] text-slate-400 font-mono flex items-center gap-1 mt-0.5">
                    <span className="capitalize">{reg.category.toLowerCase()}</span>
                    <span>•</span>
                    <span>{isHigherBetter ? 'Higher is better' : 'Lower is better'}</span>
                  </div>
                </td>

                <td className="px-4 py-3.5 text-slate-300 font-mono">
                  {typeof reg.baselineValue === 'number' ? reg.baselineValue.toLocaleString(undefined, { maximumFractionDigits: 4 }) : reg.baselineValue}{' '}
                  <span className="text-xs text-slate-500">{reg.unit}</span>
                </td>

                <td className="px-4 py-3.5 font-mono font-semibold text-white">
                  {typeof reg.candidateValue === 'number' ? reg.candidateValue.toLocaleString(undefined, { maximumFractionDigits: 4 }) : reg.candidateValue}{' '}
                  <span className="text-xs text-slate-500">{reg.unit}</span>
                </td>

                <td className="px-4 py-3.5">
                  <div
                    className={`inline-flex items-center gap-1 font-mono text-xs font-semibold px-2 py-0.5 rounded ${
                      reg.decision === 'FAIL'
                        ? 'text-rose-400 bg-rose-500/10'
                        : reg.decision === 'WARN'
                        ? 'text-amber-400 bg-amber-500/10'
                        : 'text-emerald-400 bg-emerald-500/10'
                    }`}
                  >
                    {reg.relativeDeltaPercent > 0 ? (
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    ) : reg.relativeDeltaPercent < 0 ? (
                      <ArrowDownRight className="h-3.5 w-3.5" />
                    ) : (
                      <Minus className="h-3 w-3" />
                    )}
                    <span>
                      {reg.delta > 0 ? `+${reg.delta}` : reg.delta} ({reg.relativeDeltaPercent > 0 ? `+${reg.relativeDeltaPercent}%` : `${reg.relativeDeltaPercent}%`})
                    </span>
                  </div>
                </td>

                <td className="px-4 py-3.5 text-xs text-slate-400 font-mono">
                  <div>WARN: {reg.warnThresholdPercent > 0 ? `+${reg.warnThresholdPercent}%` : `${reg.warnThresholdPercent}%`}</div>
                  <div>FAIL: {reg.failThresholdPercent > 0 ? `+${reg.failThresholdPercent}%` : `${reg.failThresholdPercent}%`}</div>
                </td>

                <td className="px-4 py-3.5">
                  <DecisionBadge decision={reg.decision} size="sm" />
                </td>

                <td className="px-4 py-3.5 text-xs text-slate-300 max-w-xs leading-relaxed">
                  {reg.explanation}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
