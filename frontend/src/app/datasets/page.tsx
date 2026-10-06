'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Database, Plus, Hash, Layers, ArrowRight, Tag, Clock } from 'lucide-react';

export default function DatasetsPage() {
  const [datasets, setDatasets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [description, setDescription] = useState('');

  const fetchDatasets = async () => {
    try {
      const list = await apiClient.get<any[]>('/datasets');
      setDatasets(list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDatasets();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiClient.post('/datasets', {
        name,
        slug: slug || name.toLowerCase().replace(/\s+/g, '-'),
        description,
        tags: ['benchmark', 'qa'],
      });
      setShowModal(false);
      setName('');
      setSlug('');
      setDescription('');
      fetchDatasets();
    } catch (err: any) {
      alert(`Failed to create dataset: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between border-b border-surface-border pb-6">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
            <Database className="h-6 w-6 text-primary-400" />
            <span>Evaluation Datasets</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Immutable benchmark datasets and test case versions with SHA-256 content hashes.
          </p>
        </div>

        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 rounded-lg bg-primary-600 hover:bg-primary-500 px-4 py-2 text-xs font-semibold text-white transition shadow-lg shadow-primary-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>New Dataset</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {datasets.map((ds) => {
          const latestVer = ds.versions?.[ds.versions.length - 1] || {};
          const totalCases = latestVer.cases?.length || 0;

          return (
            <div key={ds._id || ds.id} className="glass-card rounded-xl p-5 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="font-mono text-xs text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded border border-primary-500/20">
                    {ds.slug}
                  </span>
                  <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                    <Layers className="h-3.5 w-3.5" /> v{ds.latestVersion}
                  </span>
                </div>

                <h3 className="text-base font-bold text-white mt-1">{ds.name}</h3>
                <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed">
                  {ds.description || 'Standard evaluation test cases dataset for model regression benchmarking.'}
                </p>

                <div className="mt-4 flex flex-wrap gap-1.5">
                  {ds.tags?.map((t: string) => (
                    <span key={t} className="text-[10px] text-slate-400 bg-surface-elevated px-2 py-0.5 rounded flex items-center gap-1 border border-surface-border">
                      <Tag className="h-2.5 w-2.5" /> {t}
                    </span>
                  ))}
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-surface-border/50 flex items-center justify-between text-xs">
                <span className="text-slate-400 font-mono">
                  {totalCases} test cases
                </span>
                <Link
                  href={`/datasets/${ds.slug || ds._id}`}
                  className="flex items-center gap-1 font-semibold text-primary-400 hover:text-primary-300 transition"
                >
                  <span>View Details</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="glass-card w-full max-w-md rounded-2xl p-6 bg-surface border border-surface-border shadow-2xl">
            <h3 className="text-base font-bold text-white mb-4">Create Benchmark Dataset</h3>
            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Dataset Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Code Review Evaluation Benchmark"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Slug Identifier</label>
                <input
                  type="text"
                  placeholder="e.g. code-review-benchmark-v1"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  className="w-full rounded-lg border border-surface-border bg-surface-elevated px-3 py-2 text-sm text-white focus:outline-none focus:border-primary-500 font-mono"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Description</label>
                <textarea
                  rows={3}
                  placeholder="Describe the domain, test case structure, and evaluation objectives..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
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
                  Create Dataset
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
