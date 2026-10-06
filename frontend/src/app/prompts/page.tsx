'use client';

import React, { useEffect, useState } from 'react';
import { apiClient } from '@/lib/api-client';
import { FileCode, Plus, Hash, Layers, Tag, Copy, Check } from 'lucide-react';

export default function PromptsPage() {
  const [prompts, setPrompts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [template, setTemplate] = useState('');
  const [systemTemplate, setSystemTemplate] = useState('');
  const [copiedHash, setCopiedHash] = useState<string | null>(null);

  const fetchPrompts = async () => {
    try {
      const data = await apiClient.get<any[]>('/prompts');
      setPrompts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPrompts();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/prompts', {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        initialTemplate: template,
        initialSystemTemplate: systemTemplate,
        tags: ['production'],
      });
      setShowModal(false);
      setName('');
      setSlug('');
      setTemplate('');
      setSystemTemplate('');
      fetchPrompts();
    } catch (err: any) {
      alert(`Failed to create prompt: ${err.message}`);
    }
  };

  const copyHash = (hash: string) => {
    navigator.clipboard.writeText(hash);
    setCopiedHash(hash);
    setTimeout(() => setCopiedHash(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-surface-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <FileCode className="h-6 w-6 text-primary-400" />
            <span>Prompt Versioning & Registry</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Track system prompts, user templates, immutable version history, and cryptographic content hashes.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary-600 hover:bg-primary-500 px-4 py-2 text-xs font-semibold text-white transition shadow-lg shadow-primary-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>New Prompt</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {prompts.map((p) => {
          const latest = p.versions?.[p.versions.length - 1] || {};

          return (
            <div key={p._id || p.id} className="glass-card rounded-2xl p-6 border border-surface-border space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-mono text-xs text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20">
                    {p.slug}
                  </span>
                  <h3 className="text-base font-bold text-white mt-1">{p.name}</h3>
                </div>
                <span className="text-xs font-mono text-slate-400 flex items-center gap-1">
                  <Layers className="h-3.5 w-3.5" /> v{p.latestVersion}
                </span>
              </div>

              {latest.systemTemplate && (
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">System Prompt</span>
                  <div className="rounded-lg bg-surface/90 p-3 text-xs text-indigo-300 font-mono border border-surface-border">
                    {latest.systemTemplate}
                  </div>
                </div>
              )}

              <div>
                <span className="text-[10px] font-bold uppercase text-slate-500 block mb-1">Prompt Template</span>
                <div className="rounded-lg bg-surface/90 p-3 text-xs text-slate-200 font-mono border border-surface-border">
                  {latest.template}
                </div>
              </div>

              <div className="pt-2 border-t border-surface-border/40 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                <div className="flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5 text-indigo-400" />
                  <span>{latest.contentHash}</span>
                  <button
                    onClick={() => copyHash(latest.contentHash)}
                    className="text-slate-500 hover:text-white transition ml-1"
                    title="Copy Hash"
                  >
                    {copiedHash === latest.contentHash ? <Check className="h-3 w-3 text-emerald-400" /> : <Copy className="h-3 w-3" />}
                  </button>
                </div>
                <span>{p.versions?.length || 1} versions recorded</span>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-lg rounded-2xl p-6 bg-surface border border-surface-border shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Register Prompt Template</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Prompt Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Code Review System Prompt"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">System Prompt (Optional)</label>
                <textarea
                  rows={2}
                  placeholder="You are an expert AI code reviewer..."
                  value={systemTemplate}
                  onChange={(e) => setSystemTemplate(e.target.value)}
                  className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Prompt Template</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Review the following diff: {{input}}"
                  value={template}
                  onChange={(e) => setTemplate(e.target.value)}
                  className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 font-mono"
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
                  Register Prompt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
