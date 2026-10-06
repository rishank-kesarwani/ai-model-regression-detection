'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { DecisionBadge } from '@/components/DecisionBadge';
import { MetricCard } from '@/components/MetricCard';
import { RegressionTable } from '@/components/RegressionTable';
import {
  ArrowLeft,
  ShieldCheck,
  Cpu,
  Clock,
  Coins,
  FileCheck,
  AlertTriangle,
  CheckCircle,
  Copy,
  Layers,
  StopCircle,
} from 'lucide-react';

export default function EvaluationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [run, setRun] = useState<any>(null);
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        const [runData, resultsData] = await Promise.all([
          apiClient.get<any>(`/evaluations/${resolvedParams.id}`),
          apiClient.get<any[]>(`/evaluations/${resolvedParams.id}/results`).catch(() => []),
        ]);
        setRun(runData);
        setResults(resultsData || []);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [resolvedParams.id]);

  const handleCancel = async () => {
    setCancelling(true);
    try {
      await apiClient.post(`/evaluations/${resolvedParams.id}/cancel`);
      const updated = await apiClient.get<any>(`/evaluations/${resolvedParams.id}`);
      setRun(updated);
    } catch (err: any) {
      alert(`Failed to cancel: ${err.message}`);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading evaluation report...</div>;
  }

  if (!run) {
    return <div className="p-8 text-center text-rose-400">Evaluation run not found.</div>;
  }

  const isRunning = run.status === 'RUNNING' || run.status === 'QUEUED';
  const metrics = run.metricsSummary || {};

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <Link href="/evaluations" className="hover:text-white flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Evaluations
        </Link>
      </div>

      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Evaluation Run: <span className="font-mono text-primary-400">{(run._id || run.id).slice(-8)}</span>
            </h1>
            <DecisionBadge decision={run.decision || run.status} size="lg" />
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Dataset: <span className="text-slate-200 font-mono">{run.datasetId} (v{run.datasetVersion})</span> | Model:{' '}
            <span className="text-slate-200 font-mono">{run.provider}/{run.model}</span> | Started:{' '}
            <span className="text-slate-200 font-mono">{new Date(run.startedAt).toLocaleString()}</span>
          </p>
        </div>

        {isRunning && (
          <button
            onClick={handleCancel}
            disabled={cancelling}
            className="flex items-center gap-2 rounded-lg bg-rose-600/20 text-rose-400 border border-rose-500/30 px-4 py-2 text-xs font-semibold hover:bg-rose-600/30 transition disabled:opacity-50"
          >
            <StopCircle className="h-4 w-4" />
            <span>{cancelling ? 'Cancelling...' : 'Cancel Run'}</span>
          </button>
        )}
      </div>

      {/* Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(metrics).map(([mName, mData]: [string, any]) => (
          <MetricCard
            key={mName}
            title={mName.replace(/_/g, ' ')}
            value={
              typeof mData.mean === 'number'
                ? mData.unit === 'ratio' || mData.unit === 'score'
                  ? `${(mData.mean * 100).toFixed(1)}%`
                  : mData.mean.toLocaleString(undefined, { maximumFractionDigits: 4 })
                : mData.mean
            }
            unit={mData.unit !== 'ratio' && mData.unit !== 'score' ? mData.unit : ''}
            direction={mData.direction}
            isAiJudge={mData.isAiJudgeBased}
            subtitle={`p95: ${mData.p95?.toFixed(2) || '—'}`}
          />
        ))}
      </div>

      {/* Baseline Regression Analysis Section */}
      {run.regressionSummary && (
        <div className="glass-card rounded-2xl p-6 border border-surface-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary-400" />
              <span>Baseline Regression Analysis</span>
            </h3>
            <span className="text-xs text-slate-400 font-mono">
              Compared to Baseline Run: {run.baselineRunId || 'Active Baseline'}
            </span>
          </div>

          <RegressionTable regressions={run.regressionSummary.regressions || []} />
        </div>
      )}

      {/* Reproducibility Metadata */}
      <div className="glass-card rounded-2xl p-6 border border-surface-border">
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <Layers className="h-4 w-4 text-indigo-400" />
          <span>Reproducibility & Audit Context</span>
        </h3>
        <pre className="rounded-xl bg-surface-elevated/70 p-4 text-[11px] font-mono text-slate-300 overflow-x-auto border border-surface-border">
          {JSON.stringify(run.reproducibility, null, 2)}
        </pre>
      </div>

      {/* Individual Test Case Results Table */}
      <div className="glass-card rounded-2xl p-6 border border-surface-border">
        <h3 className="text-base font-bold text-white mb-4">
          Individual Case Executions ({results.length})
        </h3>

        <div className="space-y-4">
          {results.map((res, i) => (
            <div key={res._id || i} className="rounded-xl border border-surface-border bg-surface-elevated/40 p-4 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-primary-400">Case #{res.caseId}</span>
                <div className="flex items-center gap-3 text-slate-400 font-mono text-[11px]">
                  <span>{res.latencyMs} ms</span>
                  <span>•</span>
                  <span>{res.totalTokens} tokens</span>
                  <span>•</span>
                  <span>${res.estimatedCostUsd?.toFixed(6)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2 text-xs font-mono">
                <div className="rounded-lg bg-surface/80 p-3 border border-surface-border">
                  <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Input Prompt</div>
                  <div className="text-slate-200">{res.input}</div>
                </div>

                <div className="rounded-lg bg-surface/80 p-3 border border-surface-border">
                  <div className="text-[10px] font-bold uppercase text-slate-500 mb-1">Model Output</div>
                  <div className="text-slate-200 whitespace-pre-wrap">{res.actualOutput || '(No output)'}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
