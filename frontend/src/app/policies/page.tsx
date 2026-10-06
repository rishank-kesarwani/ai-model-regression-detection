'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Sliders, CheckCircle2, AlertCircle, Plus, Shield } from 'lucide-react';

export default function PoliciesPage() {
  const [policies, setPolicies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadPolicies() {
      try {
        const list = await apiClient.get<any[]>('/policies');
        setPolicies(list || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadPolicies();
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-surface-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Sliders className="h-6 w-6 text-primary-400" />
            <span>Regression Policies & Thresholds</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configurable evaluation threshold rules for PASS, WARN, and FAIL decisions across quality, latency, and cost.
          </p>
        </div>
      </div>

      <div className="space-y-6">
        {policies.map((p) => (
          <div key={p._id || p.id} className="glass-card rounded-2xl p-6 border border-surface-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-bold text-white">{p.name}</h3>
                  {p.isDefault && (
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                      DEFAULT POLICY
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mt-1">{p.description}</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-surface-border bg-surface-elevated/50 text-slate-400 uppercase font-semibold">
                  <tr>
                    <th className="py-2.5 px-3">Metric</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Direction</th>
                    <th className="py-2.5 px-3 text-amber-400">WARN Threshold</th>
                    <th className="py-2.5 px-3 text-rose-400">FAIL Threshold</th>
                    <th className="py-2.5 px-3">Min Sample Size</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-surface-border/40 text-slate-300 font-mono">
                  {p.rules?.map((r: any, idx: number) => (
                    <tr key={idx} className="hover:bg-surface-elevated/40 transition">
                      <td className="py-3 px-3 font-semibold text-white">{r.metricName}</td>
                      <td className="py-3 px-3 capitalize font-sans">{r.category?.toLowerCase()}</td>
                      <td className="py-3 px-3 font-sans text-slate-400">
                        {r.direction === 'HIGHER_IS_BETTER' ? 'Higher is better' : 'Lower is better'}
                      </td>
                      <td className="py-3 px-3 text-amber-400 font-bold">
                        {r.warnThresholdPercent > 0 ? `+${r.warnThresholdPercent}%` : `${r.warnThresholdPercent}%`}
                      </td>
                      <td className="py-3 px-3 text-rose-400 font-bold">
                        {r.failThresholdPercent > 0 ? `+${r.failThresholdPercent}%` : `${r.failThresholdPercent}%`}
                      </td>
                      <td className="py-3 px-3 text-slate-400 font-sans">{r.minSampleSize || 5} cases</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
