'use client';

import React from 'react';
import { Settings, Shield, Server, Bell, Database, GitPullRequest, CheckCircle2, Lock, GitBranch } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl">
      <div className="border-b border-surface-border pb-6">
        <h1 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
          <Settings className="h-6 w-6 text-primary-400" />
          <span>Platform Settings & Integrations</span>
        </h1>
        <p className="text-sm text-slate-400 mt-1">
          Production architecture, downstream integration contracts, and service credentials.
        </p>
      </div>

      <div className="space-y-6">
        {/* Service Integrations */}
        <div className="glass-card rounded-2xl p-6 border border-surface-border space-y-4">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Server className="h-5 w-5 text-indigo-400" />
            <span>Shared Service Integrations</span>
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
            <div className="rounded-xl border border-surface-border bg-surface-elevated/40 p-4 space-y-2">
              <div className="flex items-center justify-between font-sans">
                <span className="font-bold text-white">AI Platform Gateway</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Responsible for unified model/provider abstraction and AI Judge scoring calls.
              </p>
              <div className="pt-2 text-slate-300">
                Key: <span className="text-indigo-300">AI_PLATFORM_MODEL_REGRESSION_API_KEY</span>
              </div>
            </div>

            <div className="rounded-xl border border-surface-border bg-surface-elevated/40 p-4 space-y-2">
              <div className="flex items-center justify-between font-sans">
                <span className="font-bold text-white">Notification Service</span>
                <span className="text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Connected
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-sans">
                Dispatches regression alerts, severe warnings, and evaluation summaries to Slack/Email.
              </p>
              <div className="pt-2 text-slate-300">
                Key: <span className="text-indigo-300">NOTIFICATION_MODEL_REGRESSION_API_KEY</span>
              </div>
            </div>
          </div>
        </div>

        {/* PR Review Platform Contract */}
        <div className="glass-card rounded-2xl p-6 border border-surface-border space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <GitPullRequest className="h-5 w-5 text-primary-400" />
              <span>Downstream AI PR Review Platform Integration</span>
            </h3>
            <span className="rounded bg-primary-500/10 px-2 py-0.5 text-[10px] font-semibold text-primary-400 border border-primary-500/20">
              STABLE CONTRACT
            </span>
          </div>

          <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-xs text-indigo-200">
            <div className="font-semibold text-white mb-1 flex items-center gap-1.5">
              <GitBranch className="h-4 w-4 text-indigo-400" />
              <span>Architecture Notice: GitHub App Ownership</span>
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              GitHub integration is owned by the <strong>AI PR Review Platform</strong> (<code className="text-indigo-300">ai-pr-review-platform</code>). This service exposes an evaluation API consumed by GitHub-integrated applications and does not require or store its own GitHub App credentials.
            </p>
          </div>

          <p className="text-xs text-slate-400 leading-relaxed">
            Consuming downstream platform <span className="text-slate-200 font-mono">ai-pr-review-platform</span> executes PR checks via:
          </p>

          <div className="rounded-xl bg-surface-elevated/80 p-4 border border-surface-border text-xs font-mono text-slate-300 space-y-2">
            <div className="text-emerald-400 font-bold">POST /api/v1/regression/check</div>
            <pre className="text-[11px] text-slate-400 overflow-x-auto">
{`{
  "project": "ai-pr-review-platform",
  "version": "2.4.1",
  "datasetId": "pr-review-benchmark",
  "model": "gpt-4o",
  "baselineId": "prod-v2-baseline"
}`}
            </pre>
          </div>
        </div>

        {/* Deployment & Environment Info */}
        <div className="glass-card rounded-2xl p-6 border border-surface-border space-y-3">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Shield className="h-5 w-5 text-indigo-400" />
            <span>Deployment & Security Policies</span>
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="rounded-xl bg-surface-elevated/40 p-3 border border-surface-border">
              <span className="text-slate-400 block text-[11px]">Backend Host</span>
              <span className="text-white font-mono font-semibold">Render (0.0.0.0:$PORT)</span>
            </div>
            <div className="rounded-xl bg-surface-elevated/40 p-3 border border-surface-border">
              <span className="text-slate-400 block text-[11px]">Frontend Host</span>
              <span className="text-white font-mono font-semibold">Vercel (Next.js 15)</span>
            </div>
            <div className="rounded-xl bg-surface-elevated/40 p-3 border border-surface-border">
              <span className="text-slate-400 block text-[11px]">Public Access Mode</span>
              <span className="text-emerald-400 font-mono font-semibold">PUBLIC_ACCESS_ENABLED=true</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
