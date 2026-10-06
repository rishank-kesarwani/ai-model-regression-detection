'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { RegressionTable } from '@/components/RegressionTable';
import { AlertTriangle, ShieldAlert, Filter, Activity, CheckCircle2 } from 'lucide-react';

export default function RegressionsPage() {
  const [regressions, setRegressions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [severityFilter, setSeverityFilter] = useState('ALL');

  useEffect(() => {
    async function loadRegressions() {
      try {
        const data = await apiClient.get<any[]>('/regression/history?limit=100');
        setRegressions(data || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadRegressions();
  }, []);

  const filtered = regressions.filter((r) => {
    if (severityFilter === 'ALL') return true;
    return r.severity === severityFilter || r.decision === severityFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-rose-400" />
            <span>Regression Incidents & Triage</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Detected regressions across Quality, Latency, Cost, Reliability, and Safety metrics exceeding policy thresholds.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-xs text-slate-400">Filter:</span>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="rounded-lg border border-surface-border bg-surface-elevated px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary-500 font-mono"
          >
            <option value="ALL">All Incidents</option>
            <option value="FAIL">FAIL Only</option>
            <option value="WARN">WARN Only</option>
            <option value="CRITICAL">CRITICAL</option>
            <option value="HIGH">HIGH</option>
            <option value="MEDIUM">MEDIUM</option>
          </select>
        </div>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-surface-border space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <ShieldAlert className="h-5 w-5 text-rose-400" />
            <span>Active Incidents ({filtered.length})</span>
          </h3>
        </div>

        <RegressionTable
          regressions={filtered}
          emptyMessage="No regressions matching the selected filter criteria."
        />
      </div>
    </div>
  );
}
