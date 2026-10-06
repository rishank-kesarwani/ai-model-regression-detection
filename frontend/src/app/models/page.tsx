'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { Cpu, Coins, Plus, Edit2, CheckCircle2 } from 'lucide-react';

export default function ModelsPage() {
  const [pricingList, setPricingList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [provider, setProvider] = useState('openai');
  const [model, setModel] = useState('');
  const [inputCost, setInputCost] = useState(2.50);
  const [outputCost, setOutputCost] = useState(10.00);

  const fetchPricing = async () => {
    try {
      const list = await apiClient.get<any[]>('/models/pricing');
      setPricingList(list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPricing();
  }, []);

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/models/pricing', {
        provider,
        model,
        inputTokenCostPerMillion: Number(inputCost),
        outputTokenCostPerMillion: Number(outputCost),
      });
      setShowModal(false);
      setModel('');
      fetchPricing();
    } catch (err: any) {
      alert(`Failed to update pricing: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-surface-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Cpu className="h-6 w-6 text-primary-400" />
            <span>Model Pricing & Cost Catalog</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configurable token pricing per provider and model for tracking evaluation cost regressions.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary-600 hover:bg-primary-500 px-4 py-2 text-xs font-semibold text-white transition shadow-lg shadow-primary-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>Update Pricing</span>
        </button>
      </div>

      <div className="glass-card rounded-2xl p-6 border border-surface-border">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-surface-border text-slate-400 uppercase font-semibold">
              <tr>
                <th className="py-3 px-4">Provider</th>
                <th className="py-3 px-4">Model Identifier</th>
                <th className="py-3 px-4">Input Tokens (Per 1M)</th>
                <th className="py-3 px-4">Output Tokens (Per 1M)</th>
                <th className="py-3 px-4">Currency</th>
                <th className="py-3 px-4">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-surface-border/40 text-slate-200 font-mono">
              {pricingList.map((p) => (
                <tr key={`${p.provider}-${p.model}`} className="hover:bg-surface-elevated/40 transition">
                  <td className="py-3.5 px-4 font-sans font-medium text-white capitalize">{p.provider}</td>
                  <td className="py-3.5 px-4 text-primary-400 font-bold">{p.model}</td>
                  <td className="py-3.5 px-4">${Number(p.inputTokenCostPerMillion).toFixed(2)}</td>
                  <td className="py-3.5 px-4">${Number(p.outputTokenCostPerMillion).toFixed(2)}</td>
                  <td className="py-3.5 px-4">{p.currency || 'USD'}</td>
                  <td className="py-3.5 px-4 font-sans">
                    <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-semibold text-emerald-400 border border-emerald-500/20">
                      Active
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md rounded-2xl p-6 bg-surface border border-surface-border shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Set Model Pricing Metadata</h3>
            <form onSubmit={handleUpdate} className="space-y-4">
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
                  <option value="mistral">Mistral</option>
                  <option value="deepseek">DeepSeek</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Model Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. gpt-4o-mini"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Input / 1M ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={inputCost}
                    onChange={(e) => setInputCost(parseFloat(e.target.value))}
                    className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">Output / 1M ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    required
                    value={outputCost}
                    onChange={(e) => setOutputCost(parseFloat(e.target.value))}
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
                  className="rounded-lg bg-primary-600 hover:bg-primary-500 px-4 py-2 text-xs font-semibold text-white transition"
                >
                  Save Pricing
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
