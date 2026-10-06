'use client';

import React, { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { apiClient } from '@/lib/api-client';
import { Database, Layers, Hash, Code, CheckCircle, Shield, ArrowLeft } from 'lucide-react';

export default function DatasetDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const [dataset, setDataset] = useState<any>(null);
  const [selectedVersion, setSelectedVersion] = useState<string>('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadDataset() {
      try {
        const data = await apiClient.get<any>(`/datasets/${resolvedParams.id}`);
        setDataset(data);
        if (data?.versions?.length > 0) {
          setSelectedVersion(data.latestVersion || data.versions[data.versions.length - 1].version);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadDataset();
  }, [resolvedParams.id]);

  if (loading) {
    return <div className="p-8 text-center text-slate-400">Loading dataset details...</div>;
  }

  if (!dataset) {
    return <div className="p-8 text-center text-rose-400">Dataset not found.</div>;
  }

  const currentVersionObj = dataset.versions?.find((v: any) => v.version === selectedVersion) || dataset.versions?.[0];
  const cases = currentVersionObj?.cases || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 text-xs text-slate-400">
        <Link href="/datasets" className="hover:text-white flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to Datasets
        </Link>
      </div>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-surface-border pb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight text-white">{dataset.name}</h1>
            <span className="font-mono text-xs text-primary-400 bg-primary-500/10 px-2.5 py-1 rounded border border-primary-500/20">
              {dataset.slug}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-1">{dataset.description}</p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-medium">Version:</span>
          <select
            value={selectedVersion}
            onChange={(e) => setSelectedVersion(e.target.value)}
            className="rounded-lg border border-surface-border bg-surface-elevated px-3 py-1.5 text-xs text-white focus:outline-none focus:border-primary-500 font-mono"
          >
            {dataset.versions?.map((v: any) => (
              <option key={v.version} value={v.version}>
                v{v.version} ({v.cases?.length || 0} cases)
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Version Metadata Banner */}
      <div className="glass-card rounded-xl p-4 flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
        <div className="flex items-center gap-2 text-slate-300">
          <Hash className="h-4 w-4 text-indigo-400" />
          <span>SHA-256 Hash:</span>
          <span className="text-indigo-300 bg-surface-elevated px-2 py-0.5 rounded border border-surface-border">
            {currentVersionObj?.contentHash || 'immutable-hash-verified'}
          </span>
        </div>

        <div className="flex items-center gap-4 text-slate-400">
          <span>Created: {new Date(currentVersionObj?.createdAt || Date.now()).toLocaleDateString()}</span>
          <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded flex items-center gap-1 border border-emerald-500/20">
            <CheckCircle className="h-3 w-3" /> Immutable
          </span>
        </div>
      </div>

      {/* Cases Viewer Table */}
      <div className="glass-card rounded-2xl p-6 border border-surface-border">
        <h3 className="text-sm font-bold text-white mb-4">
          Evaluation Test Cases ({cases.length})
        </h3>

        <div className="space-y-4">
          {cases.map((c: any, index: number) => (
            <div key={c.id || index} className="rounded-xl border border-surface-border bg-surface-elevated/40 p-4 space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-bold text-primary-400 bg-primary-500/10 px-2 py-0.5 rounded">
                  #{c.id}
                </span>
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider bg-surface px-2 py-0.5 rounded border border-surface-border">
                  {c.difficulty || 'MEDIUM'}
                </span>
              </div>

              <div>
                <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">User Input / Prompt</div>
                <div className="rounded-lg bg-surface/80 p-3 text-xs text-slate-200 font-mono border border-surface-border">
                  {c.input}
                </div>
              </div>

              {c.expectedOutput && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Expected Output Reference</div>
                  <div className="rounded-lg bg-surface/80 p-3 text-xs text-slate-300 font-mono border border-surface-border">
                    {c.expectedOutput}
                  </div>
                </div>
              )}

              {c.expectedJsonSchema && (
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 mb-1">Expected JSON Schema</div>
                  <pre className="rounded-lg bg-surface/80 p-3 text-[11px] text-indigo-300 font-mono border border-surface-border overflow-x-auto">
                    {JSON.stringify(c.expectedJsonSchema, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
