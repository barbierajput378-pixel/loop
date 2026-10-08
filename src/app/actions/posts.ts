"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { currentUserId } from "@/lib/authz";
import { summarizePost } from "@/lib/ai";

const createPostSchema = z.object({
  projectId: z.string().min(1),
  projectSlug: z.string().min(1),
  boardId: z.string().optional(),
  title: z.string().min(4, "Give your idea a clearer title.").max(140),
  body: z.string().min(0).max(5000),
  type: z.enum(["FEATURE", "BUG", "IMPROVEMENT"]),
});

export type ActionState = { ok: boolean; error?: string; postId?: string };

export async function createPost(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Please sign in to post feedback." };

  const parsed = createPostSchema.safeParse({
    projectId: formData.get("projectId"),
    projectSlug: formData.get("projectSlug"),
    boardId: formData.get("boardId") || undefined,
    title: formData.get("title"),
    body: formData.get("body") ?? "",
    type: formData.get("type"),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input." };
  }

  const { projectId, projectSlug, boardId, title, body, type } = parsed.data;

  // AI: generate a one-line summary + themes at creation time.
  const summary = await summarizePost(title, body);

  const post = await prisma.post.create({
    data: {
      projectId,
      boardId: boardId || null,
      authorId: userId,
      title,
      body,
      type,
      aiSummary: summary.summary,
      aiThemes: JSON.stringify(summary.themes),
    },
  });

  // Author implicitly upvotes their own request.
  await prisma.vote.create({ data: { postId: post.id, userId } }).catch(() => {});

  revalidatePath(`/b/${projectSlug}`);
  return { ok: true, postId: post.id };
}
