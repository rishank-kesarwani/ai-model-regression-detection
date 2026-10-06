'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { DecisionBadge } from '@/components/DecisionBadge';
import { RegressionTable } from '@/components/RegressionTable';
import { FlaskConical, Plus, ArrowRight, GitCompare, CheckCircle2 } from 'lucide-react';

export default function ExperimentsPage() {
  const [experiments, setExperiments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('GPT-4o vs Claude-3.5-Sonnet');
  const [datasetId, setDatasetId] = useState('customer-support-v1');
  const [controlModel, setControlModel] = useState('gpt-4o');
  const [candidateModel, setCandidateModel] = useState('claude-3-5-sonnet');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchExperiments = async () => {
    try {
      const list = await apiClient.get<any[]>('/experiments');
      setExperiments(list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExperiments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await apiClient.post('/experiments', {
        name,
        datasetId,
        controlConfig: { model: controlModel, provider: 'openai' },
        candidateConfig: { model: candidateModel, provider: 'anthropic' },
      });
      setShowModal(false);
      fetchExperiments();
    } catch (err: any) {
      alert(`Failed to run experiment: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-surface-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <FlaskConical className="h-6 w-6 text-primary-400" />
            <span>A/B Evaluation Experiments</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Compare model vs model, prompt version vs prompt version, and calculate side-by-side metric diffs.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary-600 hover:bg-primary-500 px-4 py-2 text-xs font-semibold text-white transition shadow-lg shadow-primary-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>New A/B Experiment</span>
        </button>
      </div>

      <div className="space-y-6">
        {experiments.map((exp) => (
          <div key={exp._id || exp.id} className="glass-card rounded-2xl p-6 border border-surface-border space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <span className="font-mono text-xs text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20">
                  {exp.datasetId}
                </span>
                <h3 className="text-base font-bold text-white mt-1">{exp.name}</h3>
              </div>
              <DecisionBadge decision={exp.comparisonSummary?.overallDecision || exp.status} size="md" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-xl border border-surface-border bg-surface-elevated/40 p-4 font-mono text-xs">
                <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold">Control Variant (A)</span>
                <div className="text-white font-semibold text-sm mt-1">{exp.controlConfig?.model}</div>
                <div className="text-slate-400 mt-0.5">Run: {exp.controlConfig?.evaluationRunId?.slice(-8) || 'N/A'}</div>
              </div>

              <div className="rounded-xl border border-surface-border bg-surface-elevated/40 p-4 font-mono text-xs">
                <span className="text-[10px] text-slate-500 uppercase block font-sans font-bold">Candidate Variant (B)</span>
                <div className="text-white font-semibold text-sm mt-1">{exp.candidateConfig?.model}</div>
                <div className="text-slate-400 mt-0.5">Run: {exp.candidateConfig?.evaluationRunId?.slice(-8) || 'N/A'}</div>
              </div>
            </div>

            {exp.comparisonSummary?.regressions && (
              <div className="pt-2">
                <RegressionTable regressions={exp.comparisonSummary.regressions} />
              </div>
            )}
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md rounded-2xl p-6 bg-surface border border-surface-border shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Run A/B Comparison Experiment</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Experiment Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Benchmark Dataset</label>
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
                  <label className="block text-xs font-medium text-slate-300 mb-1">Control Model (A)</label>
                  <input
                    type="text"
                    required
                    value={controlModel}
                    onChange={(e) => setControlModel(e.target.value)}
                    className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Candidate Model (B)</label>
                  <input
                    type="text"
                    required
                    value={candidateModel}
                    onChange={(e) => setCandidateModel(e.target.value)}
                    className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 font-mono"
                  />
                </div>
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
                  {isSubmitting ? 'Running Experiment...' : 'Execute A/B Test'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
