"use client";

import { useState } from "react";
import { Sparkles, Layers, Loader2, RefreshCw } from "lucide-react";
import { runClustering, computeThemes } from "@/app/actions/ai";
import type { ThemeInsight } from "@/lib/ai";

export function AiPanel({
  projectId,
  projectSlug,
  aiEnabled,
}: {
  projectId: string;
  projectSlug: string;
  aiEnabled: boolean;
}) {
  const [clustering, setClustering] = useState(false);
  const [clusterMsg, setClusterMsg] = useState<string | null>(null);
  const [themesLoading, setThemesLoading] = useState(false);
  const [themes, setThemes] = useState<ThemeInsight[] | null>(null);

  async function onCluster() {
    setClustering(true);
    setClusterMsg(null);
    const res = await runClustering(projectId, projectSlug);
    setClustering(false);
    setClusterMsg(
      res.ok ? `Found ${res.clusters} cluster${res.clusters === 1 ? "" : "s"} of near-duplicates.` : "Something went wrong.",
    );
  }

  async function onThemes() {
    setThemesLoading(true);
    const res = await computeThemes(projectId);
    setThemes(res);
    setThemesLoading(false);
  }

  return (
    <div className="space-y-4 rounded-2xl border border-brand/20 bg-gradient-to-br from-brand-soft/60 to-surface p-5 shadow-subtle">
      <div className="flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand text-brand-fg">
          <Sparkles size={18} />
        </span>
        <div>
          <h2 className="font-semibold tracking-tight">AI insights</h2>
          <p className="text-xs text-muted">
            {aiEnabled
              ? "Powered by Claude."
              : "Running on the built-in heuristic (set ANTHROPIC_API_KEY for Claude)."}
          </p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 font-medium">
            <Layers size={16} className="text-brand" /> Cluster duplicates
          </div>
          <p className="mt-1 text-sm text-muted">
            Group near-identical requests so you can merge demand into one roadmap item.
          </p>
          <button
            onClick={onCluster}
            disabled={clustering}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-brand px-3 py-1.5 text-sm font-medium text-brand-fg hover:bg-brand/90 disabled:opacity-60"
          >
            {clustering ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
            Run clustering
          </button>
          {clusterMsg && <p className="mt-2 text-xs text-muted">{clusterMsg}</p>}
        </div>

        <div className="rounded-xl border border-border bg-surface p-4">
          <div className="flex items-center gap-2 font-medium">
            <Sparkles size={16} className="text-brand" /> Theme summary
          </div>
          <p className="mt-1 text-sm text-muted">
            Distil all feedback into the top recurring themes and what they mean.
          </p>
          <button
            onClick={onThemes}
            disabled={themesLoading}
            className="mt-3 inline-flex items-center gap-1.5 rounded-lg border border-border bg-surface px-3 py-1.5 text-sm font-medium hover:bg-surface-2 disabled:opacity-60"
          >
            {themesLoading ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            Summarize themes
          </button>
        </div>
      </div>

      {themes && themes.length > 0 && (
        <div className="space-y-2">
          {themes.map((t) => (
            <div key={t.theme} className="rounded-lg border border-border bg-surface p-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{t.theme}</span>
                <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">
                  {t.count} items
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">{t.insight}</p>
            </div>
          ))}
        </div>
      )}
      {themes && themes.length === 0 && (
        <p className="text-sm text-muted">Not enough feedback yet to find themes.</p>
      )}
    </div>
  );
}
