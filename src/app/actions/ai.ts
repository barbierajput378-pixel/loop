"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { requireProjectAdmin } from "@/lib/authz";
import {
  clusterPosts,
  suggestPriority,
  summarizeThemes,
  type ThemeInsight,
  type PrioritySuggestion,
} from "@/lib/ai";

/** Re-run near-duplicate clustering across all open posts in a project. */
export async function runClustering(projectId: string, projectSlug: string) {
  await requireProjectAdmin(projectId);

  const posts = await prisma.post.findMany({
    where: { projectId, status: { in: ["OPEN", "UNDER_REVIEW", "PLANNED"] } },
    select: { id: true, title: true, body: true },
  });

  const clusters = await clusterPosts(posts);

  // Reset existing clusters for this project, then recreate.
  await prisma.$transaction([
    prisma.post.updateMany({ where: { projectId }, data: { clusterId: null } }),
    prisma.cluster.deleteMany({ where: { projectId } }),
  ]);

  for (const c of clusters) {
    const valid = c.postIds.filter((id) => posts.some((p) => p.id === id));
    if (valid.length < 2) continue;
    const created = await prisma.cluster.create({
      data: { projectId, label: c.label, summary: c.summary },
    });
    await prisma.post.updateMany({
      where: { id: { in: valid } },
      data: { clusterId: created.id },
    });
  }

  revalidatePath(`/admin/${projectSlug}`);
  revalidatePath(`/b/${projectSlug}`);
  return { ok: true, clusters: clusters.length };
}

/** Compute theme insights across the project's feedback. */
export async function computeThemes(projectId: string): Promise<ThemeInsight[]> {
  const posts = await prisma.post.findMany({
    where: { projectId },
    select: { title: true, body: true, _count: { select: { votes: true } } },
    take: 200,
    orderBy: { createdAt: "desc" },
  });
  return summarizeThemes(
    posts.map((p) => ({ title: p.title, body: p.body, votes: p._count.votes })),
  );
}

/** Suggest a priority for a single post and persist the hint. */
export async function suggestPostPriority(input: {
  projectId: string;
  projectSlug: string;
  postId: string;
}): Promise<PrioritySuggestion & { ok: boolean }> {
  await requireProjectAdmin(input.projectId);

  const post = await prisma.post.findUnique({
    where: { id: input.postId },
    include: { _count: { select: { votes: true, comments: true } } },
  });
  if (!post) return { ok: false, priority: "LOW", reason: "Post not found." };

  const suggestion = await suggestPriority({
    title: post.title,
    body: post.body,
    type: post.type,
    votes: post._count.votes,
    comments: post._count.comments,
  });

  await prisma.post.update({
    where: { id: post.id },
    data: { aiPriorityHint: `${suggestion.priority}: ${suggestion.reason}` },
  });

  revalidatePath(`/admin/${input.projectSlug}`);
  return { ok: true, ...suggestion };
}
