"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Pin, Sparkles, Loader2 } from "lucide-react";
import type { Priority } from "@prisma/client";
import { updatePostStatus, updatePostPriority, togglePinned } from "@/app/actions/admin";
import { suggestPostPriority } from "@/app/actions/ai";
import { ALL_STATUSES, STATUS_META, PRIORITY_META } from "@/lib/labels";
import { TypeBadge } from "@/components/Badges";
import { cn } from "@/lib/utils";

interface Props {
  projectId: string;
  projectSlug: string;
  post: {
    id: string;
    title: string;
    type: "FEATURE" | "BUG" | "IMPROVEMENT";
    status: string;
    priority: Priority | null;
    pinned: boolean;
    voteCount: number;
    commentCount: number;
    aiPriorityHint: string | null;
    clusterLabel: string | null;
  };
}

export function AdminPostRow({ projectId, projectSlug, post }: Props) {
  const [pending, startTransition] = useTransition();
  const [suggesting, setSuggesting] = useState(false);
  const [hint, setHint] = useState(post.aiPriorityHint);
  const [status, setStatus] = useState(post.status);
  const [priority, setPriority] = useState<string>(post.priority ?? "");
  const [pinned, setPinned] = useState(post.pinned);

  function onStatus(value: string) {
    setStatus(value);
    startTransition(() => {
      updatePostStatus({ projectId, projectSlug, postId: post.id, status: value });
    });
  }

  function onPriority(value: string) {
    setPriority(value);
    startTransition(() => {
      updatePostPriority({ projectId, projectSlug, postId: post.id, priority: value || null });
    });
  }

  function onPin() {
    setPinned((p) => !p);
    startTransition(() => {
      togglePinned({ projectId, projectSlug, postId: post.id });
    });
  }

  async function onSuggest() {
    setSuggesting(true);
    const res = await suggestPostPriority({ projectId, projectSlug, postId: post.id });
    setSuggesting(false);
    if (res.ok) {
      setPriority(res.priority);
      setHint(`${res.priority}: ${res.reason}`);
    }
  }

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-subtle">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <TypeBadge type={post.type} />
            <span className="text-xs text-muted tabular-nums">
              ▲ {post.voteCount} · 💬 {post.commentCount}
            </span>
            {post.clusterLabel && (
              <span className="rounded-full bg-brand-soft px-2 py-0.5 text-xs font-medium text-brand">
                {post.clusterLabel}
              </span>
            )}
          </div>
          <Link
            href={`/b/${projectSlug}/p/${post.id}`}
            className="mt-1.5 block font-medium tracking-tight hover:text-brand"
          >
            {post.title}
          </Link>
        </div>
        <button
          onClick={onPin}
          aria-pressed={pinned}
          className={cn(
            "inline-flex h-8 w-8 items-center justify-center rounded-lg transition-colors",
            pinned ? "bg-brand text-brand-fg" : "text-muted hover:bg-surface-2 hover:text-fg",
          )}
          title={pinned ? "Unpin" : "Pin to top"}
        >
          <Pin size={15} />
        </button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <select
          value={status}
          onChange={(e) => onStatus(e.target.value)}
          disabled={pending}
          className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-brand"
        >
          {ALL_STATUSES.map((s) => (
            <option key={s} value={s}>
              {STATUS_META[s].label}
            </option>
          ))}
        </select>

        <select
          value={priority}
          onChange={(e) => onPriority(e.target.value)}
          disabled={pending}
          className="rounded-lg border border-border bg-surface px-2.5 py-1.5 text-sm outline-none focus:border-brand"
        >
          <option value="">No priority</option>
          {(Object.keys(PRIORITY_META) as Priority[]).map((p) => (
            <option key={p} value={p}>
              {PRIORITY_META[p].label}
            </option>
          ))}
        </select>

        <button
          onClick={onSuggest}
          disabled={suggesting}
          className="inline-flex items-center gap-1.5 rounded-lg border border-brand/30 bg-brand-soft px-2.5 py-1.5 text-sm font-medium text-brand transition-colors hover:bg-brand/10 disabled:opacity-60"
        >
          {suggesting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          Suggest priority
        </button>
      </div>

      {hint && (
        <p className="mt-2 rounded-lg bg-surface-2 px-3 py-2 text-xs text-muted">
          <Sparkles size={11} className="mr-1 inline text-brand" />
          {hint}
        </p>
      )}
    </div>
  );
}
