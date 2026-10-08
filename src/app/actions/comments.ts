"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { currentUserId, canAdminProject } from "@/lib/authz";

const schema = z.object({
  postId: z.string().min(1),
  projectId: z.string().min(1),
  projectSlug: z.string().min(1),
  body: z.string().min(1, "Comment cannot be empty.").max(3000),
});

export type CommentState = { ok: boolean; error?: string };

export async function addComment(
  _prev: CommentState,
  formData: FormData,
): Promise<CommentState> {
  const userId = await currentUserId();
  if (!userId) return { ok: false, error: "Sign in to comment." };

  const parsed = schema.safeParse({
    postId: formData.get("postId"),
    projectId: formData.get("projectId"),
    projectSlug: formData.get("projectSlug"),
    body: formData.get("body"),
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid comment." };
  }

  const isAdmin = await canAdminProject(parsed.data.projectId, userId);

  await prisma.comment.create({
    data: {
      postId: parsed.data.postId,
      authorId: userId,
      body: parsed.data.body,
      isOfficial: isAdmin,
    },
  });

  revalidatePath(`/b/${parsed.data.projectSlug}/p/${parsed.data.postId}`);
  return { ok: true };
}
