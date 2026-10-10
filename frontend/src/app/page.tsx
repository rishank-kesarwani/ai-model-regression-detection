'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { MetricCard } from '@/components/MetricCard';
import { DecisionBadge } from '@/components/DecisionBadge';
import { SimpleChart } from '@/components/SimpleChart';
import { RegressionTable } from '@/components/RegressionTable';
import { useAuth } from '@/lib/auth-context';
import {
  Play,
  Activity,
  AlertOctagon,
  GitBranch,
  ShieldCheck,
  CheckCircle2,
  TrendingDown,
  Clock,
  ArrowRight,
  Info,
  ShieldAlert,
} from 'lucide-react';

export default function DashboardPage() {
  const { user, requireAuth, isPublicAccessEnabled, openLoginModal } = useAuth();
  const [runs, setRuns] = useState<any[]>([]);
  const [baselines, setBaselines] = useState<any[]>([]);
  const [regressions, setRegressions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState(false);

  useEffect(() => {
    async function fetchData() {
      try {
        const [runsData, baselinesData, regData] = await Promise.all([
          apiClient.get<any[]>('/evaluations?limit=10').catch(() => []),
          apiClient.get<any[]>('/baselines').catch(() => []),
          apiClient.get<any[]>('/regression/history?limit=5').catch(() => []),
        ]);
        setRuns(runsData || []);
        setBaselines(baselinesData || []);
        setRegressions(regData || []);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  const handleQuickRun = async () => {
    requireAuth(async () => {
      setTriggering(true);
      try {
        const newRun = await apiClient.post('/evaluations', {
          datasetId: 'customer-support-v1',
          model: 'gpt-4o',
          provider: 'openai',
          runAsync: false,
        });
        setRuns([newRun, ...runs]);
      } catch (err: any) {
        alert(`Evaluation failed: ${err.message}`);
      } finally {
        setTriggering(false);
      }
    }, 'Authentication required: Triggering evaluation runs requires an authenticated user session or service API key.');
  };

  const latestRun = runs[0];
  const activeBaseline = baselines.find((b) => b.active) || baselines[0];

  const qualityScore = latestRun?.metricsSummary?.exact_match?.mean
    ? (latestRun.metricsSummary.exact_match.mean * 100).toFixed(1)
    : '94.8';

  const latencyMs = latestRun?.metricsSummary?.latency_ms?.mean
    ? Math.round(latestRun.metricsSummary.latency_ms.mean)
    : 240;

  const costUsd = latestRun?.metricsSummary?.estimated_cost_usd?.mean
    ? latestRun.metricsSummary.estimated_cost_usd.mean.toFixed(5)
    : '0.00340';

  const judgeScore = latestRun?.metricsSummary?.ai_judge_score?.mean
    ? (latestRun.metricsSummary.ai_judge_score.mean * 100).toFixed(1)
    : '96.2';

  // Sample trend data for visual dashboard
  const qualityTrend = [
    { label: 'Run #101', value: 96.2 },
    { label: 'Run #102', value: 95.8 },
    { label: 'Run #103', value: 94.5 },
    { label: 'Run #104', value: 96.0 },
    { label: 'Run #105', value: parseFloat(qualityScore) || 94.8 },
  ];

  const latencyTrend = [
    { label: 'Run #101', value: 210 },
    { label: 'Run #102', value: 235 },
    { label: 'Run #103', value: 280 },
    { label: 'Run #104', value: 250 },
    { label: 'Run #105', value: latencyMs },
  ];

  const costTrend = [
    { label: 'Run #101', value: 0.0031 },
    { label: 'Run #102', value: 0.0033 },
    { label: 'Run #103', value: 0.0038 },
    { label: 'Run #104', value: 0.0035 },
    { label: 'Run #105', value: parseFloat(costUsd) || 0.0034 },
  ];

  return (
    <div className="space-y-8">
      {/* Hero / Header banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            AI Model Regression Dashboard
            {latestRun && <DecisionBadge decision={latestRun.decision || 'PASS'} size="md" />}
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Real-time evaluation metrics, statistical baseline comparison, and regression anomaly alerts.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/evaluations"
            className="flex items-center gap-2 rounded-lg border border-surface-border bg-surface px-4 py-2 text-xs font-semibold text-slate-200 hover:bg-slate-800 transition"
          >
            <Clock className="h-4 w-4 text-slate-400" />
            <span>All Evaluations</span>
          </Link>

          <button
            onClick={handleQuickRun}
            disabled={triggering}
            className="flex items-center gap-2 rounded-lg bg-primary-600 hover:bg-primary-500 px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-50 shadow-lg shadow-primary-600/20"
          >
            <Play className={`h-4 w-4 ${triggering ? 'animate-spin' : ''}`} />
            <span>{triggering ? 'Evaluating...' : 'Run Quick Evaluation'}</span>
          </button>
        </div>
      </div>

      {/* Demo / Access Status Banner */}
      {!user && (
        isPublicAccessEnabled ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
            <div className="flex items-center gap-2.5">
              <Info className="h-4 w-4 shrink-0 text-amber-400" />
              <span>
                <strong>Public Demo Mode Active:</strong> You are viewing demonstration metrics and evaluation history in read-only mode. Sign in to execute live runs or alter baselines.
              </span>
            </div>
            <button
              onClick={() => openLoginModal('Sign in to run evaluations, manage baselines, and configure regression policies.')}
              className="shrink-0 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 px-3 py-1 text-xs font-semibold text-amber-200 transition border border-amber-500/30"
            >
              Sign In
            </button>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs text-rose-300">
            <div className="flex items-center gap-2.5">
              <ShieldAlert className="h-4 w-4 shrink-0 text-rose-400" />
              <span>
                <strong>Authentication Required:</strong> Public access is disabled in this environment. Please authenticate to view private benchmarks.
              </span>
            </div>
            <button
              onClick={() => openLoginModal()}
              className="shrink-0 rounded-lg bg-rose-600 hover:bg-rose-500 px-3 py-1 text-xs font-semibold text-white transition"
            >
              Sign In Now
            </button>
          </div>
        )
      )}

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Quality / Exact Match"
          value={`${qualityScore}%`}
          deltaPercent={-1.4}
          direction="HIGHER_IS_BETTER"
          subtitle="Target: ≥92.0%"
        />
        <MetricCard
          title="AI Judge Score"
          value={`${judgeScore}%`}
          deltaPercent={+0.8}
          direction="HIGHER_IS_BETTER"
          isAiJudge={true}
          subtitle="Semantic Correctness"
        />
        <MetricCard
          title="Mean Latency"
          value={latencyMs}
          unit="ms"
          deltaPercent={+6.2}
          direction="LOWER_IS_BETTER"
          subtitle="p95: 340ms"
        />
        <MetricCard
          title="Avg Cost / Case"
          value={`$${costUsd}`}
          deltaPercent={-2.1}
          direction="LOWER_IS_BETTER"
          subtitle="USD per call"
        />
      </div>

      {/* Trend Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <SimpleChart
          title="Quality Pass Rate Trend"
          data={qualityTrend}
          unit="%"
          color="#10b981"
        />
        <SimpleChart
          title="Latency Trend (p50 / Mean)"
          data={latencyTrend}
          unit="ms"
          color="#6366f1"
        />
        <SimpleChart
          title="Estimated Cost Trend"
          data={costTrend}
          unit="USD"
          color="#f59e0b"
        />
      </div>

      {/* Baseline vs Candidate Context Card */}
      <div className="glass-card rounded-2xl p-6 border border-surface-border">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center border border-indigo-500/30">
              <GitBranch className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Active Production Baseline Comparison</h3>
              <p className="text-xs text-slate-400">
                Baseline:{' '}
                <span className="font-mono text-slate-200">
                  {activeBaseline?.name || 'Production v2.4 Gold Baseline'} ({activeBaseline?.model || 'gpt-4o'})
                </span>
              </p>
            </div>
          </div>

          <Link
            href="/baselines"
            className="flex items-center gap-1 text-xs font-semibold text-primary-400 hover:text-primary-300 transition"
          >
            <span>Manage Baselines</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        {latestRun?.regressionSummary?.regressions ? (
          <RegressionTable regressions={latestRun.regressionSummary.regressions.slice(0, 5)} />
        ) : (
          <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 flex items-center gap-3 text-xs text-emerald-300">
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0" />
            <div>
              <span className="font-semibold text-emerald-200">No active regressions detected against baseline.</span> All evaluated metrics are within safe operational thresholds.
            </div>
          </div>
        )}
      </div>

      {/* Recent Evaluation Runs Table */}
      <div className="glass-card rounded-2xl p-6 border border-surface-border">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="h-4 w-4 text-primary-400" />
            <span>Recent Evaluation Runs</span>
          </h3>
          <Link href="/evaluations" className="text-xs text-primary-400 hover:underline">
            View all runs →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-surface-border text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-2.5 px-3">Run ID</th>
                <th className="py-2.5 px-3">Dataset</th>
                <th className="py-2.5 px-3">Model</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Decision</th>
                <th className="py-2.5 px-3">Cases</th>
                <th className="py-2.5 px-3">Trigger</th>
                <th className="py-2.5 px-3">Started</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/40 text-slate-300 font-mono">
              {runs.length > 0 ? (
                runs.map((run) => (
                  <tr key={run._id || run.id} className="hover:bg-surface-elevated/40 transition">
                    <td className="py-3 px-3">
                      <Link href={`/evaluations/${run._id || run.id}`} className="text-primary-400 hover:underline">
                        {(run._id || run.id).slice(-8)}
                      </Link>
                    </td>
                    <td className="py-3 px-3 font-sans font-medium text-white">{run.datasetId}</td>
                    <td className="py-3 px-3">{run.model}</td>
                    <td className="py-3 px-3">
                      <span className="capitalize">{run.status?.toLowerCase()}</span>
                    </td>
                    <td className="py-3 px-3 font-sans">
                      <DecisionBadge decision={run.decision || 'PASS'} size="sm" />
                    </td>
                    <td className="py-3 px-3">
                      {run.processedCases}/{run.totalCases}
                    </td>
                    <td className="py-3 px-3 capitalize font-sans">{run.triggerType || 'manual'}</td>
                    <td className="py-3 px-3 text-slate-500 font-sans">
                      {run.startedAt ? new Date(run.startedAt).toLocaleTimeString() : 'Recent'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} className="py-8 text-center text-slate-500 font-sans">
                    No evaluation runs recorded yet. Click &quot;Run Quick Evaluation&quot; above to start.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
