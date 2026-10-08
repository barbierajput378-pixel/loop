import type { PostStatus, PostType, Priority } from "@prisma/client";

export const STATUS_META: Record<
  PostStatus,
  { label: string; color: string; dot: string; roadmap: boolean }
> = {
  OPEN: { label: "Open", color: "text-muted bg-surface-2", dot: "bg-muted", roadmap: false },
  UNDER_REVIEW: { label: "Under review", color: "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-500/15", dot: "bg-amber-500", roadmap: false },
  PLANNED: { label: "Planned", color: "text-violet-700 bg-violet-100 dark:text-violet-300 dark:bg-violet-500/15", dot: "bg-violet-500", roadmap: true },
  IN_PROGRESS: { label: "In progress", color: "text-sky-700 bg-sky-100 dark:text-sky-300 dark:bg-sky-500/15", dot: "bg-sky-500", roadmap: true },
  SHIPPED: { label: "Shipped", color: "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-500/15", dot: "bg-emerald-500", roadmap: true },
  CLOSED: { label: "Closed", color: "text-muted bg-surface-2 line-through", dot: "bg-muted", roadmap: false },
};

export const ROADMAP_COLUMNS: PostStatus[] = ["PLANNED", "IN_PROGRESS", "SHIPPED"];

export const ALL_STATUSES: PostStatus[] = [
  "OPEN",
  "UNDER_REVIEW",
  "PLANNED",
  "IN_PROGRESS",
  "SHIPPED",
  "CLOSED",
];

export const TYPE_META: Record<PostType, { label: string; color: string; emoji: string }> = {
  FEATURE: { label: "Feature", color: "text-brand bg-brand-soft", emoji: "✨" },
  BUG: { label: "Bug", color: "text-rose-700 bg-rose-100 dark:text-rose-300 dark:bg-rose-500/15", emoji: "🐞" },
  IMPROVEMENT: { label: "Improvement", color: "text-teal-700 bg-teal-100 dark:text-teal-300 dark:bg-teal-500/15", emoji: "⚡" },
};

export const PRIORITY_META: Record<Priority, { label: string; color: string; weight: number }> = {
  LOW: { label: "Low", color: "text-muted bg-surface-2", weight: 1 },
  MEDIUM: { label: "Medium", color: "text-sky-700 bg-sky-100 dark:text-sky-300 dark:bg-sky-500/15", weight: 2 },
  HIGH: { label: "High", color: "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-500/15", weight: 3 },
  CRITICAL: { label: "Critical", color: "text-rose-700 bg-rose-100 dark:text-rose-300 dark:bg-rose-500/15", weight: 4 },
};
