'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { useAuth } from '@/lib/auth-context';
import { GitCompare, CheckCircle2, Shield, Plus, ArrowRight, Layers, Info, ShieldAlert } from 'lucide-react';

export default function BaselinesPage() {
  const { user, requireAuth, isPublicAccessEnabled, openLoginModal } = useAuth();
  const [baselines, setBaselines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [datasetId, setDatasetId] = useState('customer-support-v1');
  const [evaluationRunId, setEvaluationRunId] = useState('');
  const [notes, setNotes] = useState('');

  const fetchBaselines = async () => {
    try {
      const list = await apiClient.get<any[]>('/baselines');
      setBaselines(list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBaselines();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/baselines', {
        name,
        datasetId,
        evaluationRunId,
        notes,
        active: true,
      });
      setShowModal(false);
      setName('');
      setEvaluationRunId('');
      setNotes('');
      fetchBaselines();
    } catch (err: any) {
      alert(`Failed to create baseline: ${err.message}`);
    }
  };

  const handleActivate = async (id: string) => {
    requireAuth(async () => {
      try {
        await apiClient.post(`/baselines/${id}/activate`);
        fetchBaselines();
      } catch (err: any) {
        alert(`Failed to activate: ${err.message}`);
      }
    }, 'Operator login required: Activating production baselines requires privileged access.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-surface-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <GitCompare className="h-6 w-6 text-primary-400" />
            <span>Active Baselines & Reference Runs</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Gold-standard evaluation runs accepted as production baselines for automated regression detection.
          </p>
        </div>

        <button
          onClick={() =>
            requireAuth(
              () => setShowModal(true),
              'Operator login required: Promoting new baselines requires privileged access.',
            )
          }
          className="flex items-center gap-2 rounded-lg bg-primary-600 hover:bg-primary-500 px-4 py-2 text-xs font-semibold text-white transition shadow-lg shadow-primary-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>Promote Baseline</span>
        </button>
      </div>

      {/* Demo / Access Status Banner */}
      {!user && (
        isPublicAccessEnabled ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-xs text-amber-300">
            <div className="flex items-center gap-2.5">
              <Info className="h-4 w-4 shrink-0 text-amber-400" />
              <span>
                <strong>Public Demo Mode Active:</strong> Baselines are shown in read-only mode. Operator authentication is required to activate or promote baselines.
              </span>
            </div>
            <button
              onClick={() => openLoginModal('Sign in to manage baselines.')}
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
                <strong>Authentication Required:</strong> Public access is disabled in this environment. Please authenticate to view baselines.
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {baselines.map((b) => (
          <div
            key={b._id || b.id}
            className={`glass-card rounded-2xl p-6 border transition ${
              b.active ? 'border-emerald-500/40 bg-emerald-950/10' : 'border-surface-border'
            }`}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs text-primary-400 bg-primary-500/10 px-2.5 py-0.5 rounded border border-primary-500/20">
                  {b.datasetId} (v{b.datasetVersion || '1.0.0'})
                </span>
                {b.active && (
                  <span className="rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-xs font-semibold text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" /> ACTIVE BASELINE
                  </span>
                )}
              </div>

              {!b.active && (
                <button
                  onClick={() => handleActivate(b._id || b.id)}
                  className="rounded-lg bg-surface-elevated hover:bg-surface border border-surface-border px-3 py-1 text-xs font-semibold text-slate-200 transition"
                >
                  Set as Active
                </button>
              )}
            </div>

            <h3 className="text-base font-bold text-white">{b.name}</h3>
            <p className="text-xs text-slate-400 mt-1">{b.notes || 'Accepted production reference benchmark.'}</p>

            <div className="mt-4 grid grid-cols-3 gap-2 text-xs font-mono bg-surface-elevated/50 p-3 rounded-xl border border-surface-border/50">
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-sans">Model</span>
                <span className="text-slate-200 font-semibold">{b.model}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-sans">Quality</span>
                <span className="text-emerald-400 font-semibold">
                  {b.metricsSnapshot?.exact_match?.mean
                    ? `${(b.metricsSnapshot.exact_match.mean * 100).toFixed(1)}%`
                    : '94.8%'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 uppercase block font-sans">Latency</span>
                <span className="text-indigo-400 font-semibold">
                  {b.metricsSnapshot?.latency_ms?.mean
                    ? `${Math.round(b.metricsSnapshot.latency_ms.mean)}ms`
                    : '240ms'}
                </span>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-surface-border/40 text-[11px] text-slate-400 flex items-center justify-between font-mono">
              <span>Run ID: {(b.evaluationRunId || '').slice(-8)}</span>
              <span>Updated: {new Date(b.createdAt || Date.now()).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md rounded-2xl p-6 bg-surface border border-surface-border shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Promote Run to Baseline</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Baseline Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Production v2.4 Gold Baseline"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Dataset ID</label>
                <input
                  type="text"
                  required
                  value={datasetId}
                  onChange={(e) => setDatasetId(e.target.value)}
                  className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Evaluation Run ID</label>
                <input
                  type="text"
                  required
                  placeholder="Paste run ID to promote as baseline"
                  value={evaluationRunId}
                  onChange={(e) => setEvaluationRunId(e.target.value)}
                  className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Notes</label>
                <textarea
                  rows={2}
                  placeholder="Context for why this run is accepted as the new baseline..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
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
                  className="rounded-lg bg-primary-600 hover:bg-primary-500 px-4 py-2 text-xs font-semibold text-white transition"
                >
                  Promote & Activate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
