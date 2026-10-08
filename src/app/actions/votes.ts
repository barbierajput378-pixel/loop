"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/authz";

export interface VoteResult {
  ok: boolean;
  voted?: boolean;
  count?: number;
  error?: string;
}

export async function toggleVote(postId: string, projectSlug: string): Promise<VoteResult> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to vote." };

  const existing = await prisma.vote.findUnique({
    where: { postId_userId: { postId, userId } },
  });

  let voted: boolean;
  if (existing) {
    await prisma.vote.delete({ where: { id: existing.id } });
    voted = false;
  } else {
    await prisma.vote.create({ data: { postId, userId } });
    voted = true;
  }

  const count = await prisma.vote.count({ where: { postId } });

  revalidatePath(`/b/${projectSlug}`);
  revalidatePath(`/b/${projectSlug}/p/${postId}`);
  return { ok: true, voted, count };
}

/** Lightweight read used for near-real-time polling of a board's vote counts. */
export async function getVoteCounts(
  projectId: string,
): Promise<Record<string, number>> {
  const groups = await prisma.vote.groupBy({
    by: ["postId"],
    where: { post: { projectId } },
    _count: { postId: true },
  });
  return Object.fromEntries(groups.map((g) => [g.postId, g._count.postId]));
}
