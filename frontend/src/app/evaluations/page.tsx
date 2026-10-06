'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { DecisionBadge } from '@/components/DecisionBadge';
import { PlayCircle, Plus, Filter, ArrowRight, Clock, Cpu } from 'lucide-react';

export default function EvaluationsPage() {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [datasetId, setDatasetId] = useState('customer-support-v1');
  const [model, setModel] = useState('gpt-4o');
  const [provider, setProvider] = useState('openai');
  const [temperature, setTemperature] = useState(0.7);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchRuns = async () => {
    try {
      const data = await apiClient.get<any[]>('/evaluations?limit=50');
      setRuns(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRuns();
  }, []);

  const handleStartRun = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const newRun = await apiClient.post('/evaluations', {
        datasetId,
        model,
        provider,
        temperature: Number(temperature),
        runAsync: false,
      });
      setShowModal(false);
      fetchRuns();
    } catch (err: any) {
      alert(`Failed to execute run: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-surface-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <PlayCircle className="h-6 w-6 text-primary-400" />
            <span>Evaluation Runs</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Execute manual, scheduled, and CI-driven evaluations with regression comparison against baselines.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary-600 hover:bg-primary-500 px-4 py-2 text-xs font-semibold text-white transition shadow-lg shadow-primary-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>New Evaluation Run</span>
        </button>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-surface-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-surface-border text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-3">Run ID</th>
                <th className="py-3 px-3">Dataset</th>
                <th className="py-3 px-3">Model</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Decision</th>
                <th className="py-3 px-3">Accuracy / Quality</th>
                <th className="py-3 px-3">Latency (p50)</th>
                <th className="py-3 px-3">Cost (USD)</th>
                <th className="py-3 px-3">Trigger</th>
                <th className="py-3 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/40 text-slate-300 font-mono">
              {runs.map((run) => {
                const exactMatch = run.metricsSummary?.exact_match?.mean;
                const latency = run.metricsSummary?.latency_ms?.mean;
                const cost = run.metricsSummary?.estimated_cost_usd?.mean;

                return (
                  <tr key={run._id || run.id} className="hover:bg-surface-elevated/40 transition">
                    <td className="py-3.5 px-3">
                      <Link href={`/evaluations/${run._id || run.id}`} className="text-primary-400 hover:underline">
                        {(run._id || run.id).slice(-8)}
                      </Link>
                    </td>
                    <td className="py-3.5 px-3 font-sans font-medium text-white">{run.datasetId}</td>
                    <td className="py-3.5 px-3">
                      <span className="text-slate-200">{run.model}</span>
                      <span className="block text-[10px] text-slate-500 font-sans">{run.provider}</span>
                    </td>
                    <td className="py-3.5 px-3 capitalize font-sans">{run.status?.toLowerCase()}</td>
                    <td className="py-3.5 px-3 font-sans">
                      <DecisionBadge decision={run.decision || 'PASS'} size="sm" />
                    </td>
                    <td className="py-3.5 px-3">
                      {exactMatch !== undefined ? `${(exactMatch * 100).toFixed(1)}%` : '—'}
                    </td>
                    <td className="py-3.5 px-3">
                      {latency !== undefined ? `${Math.round(latency)}ms` : '—'}
                    </td>
                    <td className="py-3.5 px-3">
                      {cost !== undefined ? `$${cost.toFixed(5)}` : '—'}
                    </td>
                    <td className="py-3.5 px-3 capitalize font-sans">{run.triggerType || 'manual'}</td>
                    <td className="py-3.5 px-3 text-right font-sans">
                      <Link
                        href={`/evaluations/${run._id || run.id}`}
                        className="inline-flex items-center gap-1 font-semibold text-primary-400 hover:text-primary-300 transition"
                      >
                        <span>View</span>
                        <ArrowRight className="h-3 w-3" />
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md rounded-2xl p-6 bg-surface border border-surface-border shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Start Evaluation Run</h3>
            <form onSubmit={handleStartRun} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Dataset Identifier</label>
                <input
                  type="text"
                  required
                  value={datasetId}
                  onChange={(e) => setDatasetId(e.target.value)}
                  className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Provider</label>
                  <select
                    value={provider}
                    onChange={(e) => setProvider(e.target.value)}
                    className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                  >
                    <option value="openai">OpenAI</option>
                    <option value="anthropic">Anthropic</option>
                    <option value="google">Google</option>
                    <option value="meta">Meta</option>
                    <option value="deepseek">DeepSeek</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Model</label>
                  <input
                    type="text"
                    required
                    value={model}
                    onChange={(e) => setModel(e.target.value)}
                    className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Temperature: {temperature}</label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={temperature}
                  onChange={(e) => setTemperature(parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              <div className="pt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="rounded-lg border border-surface-border px-4 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-800 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-primary-600 hover:bg-primary-500 px-4 py-2 text-xs font-semibold text-white transition disabled:opacity-50"
                >
                  {isSubmitting ? 'Evaluating...' : 'Start Evaluation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
