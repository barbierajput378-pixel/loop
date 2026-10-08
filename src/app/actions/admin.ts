"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { requireProjectAdmin } from "@/lib/authz";

const statusSchema = z.enum([
  "OPEN",
  "UNDER_REVIEW",
  "PLANNED",
  "IN_PROGRESS",
  "SHIPPED",
  "CLOSED",
]);
const prioritySchema = z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]);

export async function updatePostStatus(input: {
  projectId: string;
  projectSlug: string;
  postId: string;
  status: string;
}) {
  await requireProjectAdmin(input.projectId);
  const status = statusSchema.parse(input.status);

  await prisma.post.update({
    where: { id: input.postId },
    data: { status },
  });

  revalidatePath(`/b/${input.projectSlug}`);
  revalidatePath(`/b/${input.projectSlug}/roadmap`);
  revalidatePath(`/admin/${input.projectSlug}`);
  return { ok: true };
}

export async function updatePostPriority(input: {
  projectId: string;
  projectSlug: string;
  postId: string;
  priority: string | null;
}) {
  await requireProjectAdmin(input.projectId);
  const priority = input.priority ? prioritySchema.parse(input.priority) : null;

  await prisma.post.update({
    where: { id: input.postId },
    data: { priority },
  });

  revalidatePath(`/admin/${input.projectSlug}`);
  return { ok: true };
}

export async function togglePinned(input: {
  projectId: string;
  projectSlug: string;
  postId: string;
}) {
  await requireProjectAdmin(input.projectId);
  const post = await prisma.post.findUnique({
    where: { id: input.postId },
    select: { pinned: true },
  });
  await prisma.post.update({
    where: { id: input.postId },
    data: { pinned: !post?.pinned },
  });
  revalidatePath(`/b/${input.projectSlug}`);
  revalidatePath(`/admin/${input.projectSlug}`);
  return { ok: true };
}

const changelogSchema = z.object({
  projectId: z.string().min(1),
  projectSlug: z.string().min(1),
  title: z.string().min(3).max(140),
  body: z.string().min(1).max(10000),
  version: z.string().max(40).optional(),
});

export type ChangelogState = { ok: boolean; error?: string };

export async function publishChangelog(
  _prev: ChangelogState,
  formData: FormData,
): Promise<ChangelogState> {
  const parsed = changelogSchema.safeParse({
    projectId: formData.get("projectId"),
    projectSlug: formData.get("projectSlug"),
    title: formData.get("title"),
    body: formData.get("body"),
    version: formData.get("version") || undefined,
  });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid entry." };
  }

  try {
    await requireProjectAdmin(parsed.data.projectId);
  } catch {
    return { ok: false, error: "Not authorized." };
  }

  await prisma.changelogEntry.create({
    data: {
      projectId: parsed.data.projectId,
      title: parsed.data.title,
      body: parsed.data.body,
      version: parsed.data.version || null,
    },
  });

  revalidatePath(`/b/${parsed.data.projectSlug}/changelog`);
  revalidatePath(`/admin/${parsed.data.projectSlug}`);
  return { ok: true };
}
