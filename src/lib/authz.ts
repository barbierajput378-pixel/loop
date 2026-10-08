import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

/** The signed-in user id, or null. */
export async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/**
 * Whether the given user can administer the given project.
 * True for the global ADMIN, the project owner, or an ADMIN member.
 */
export async function canAdminProject(
  projectId: string,
  userId: string | null,
): Promise<boolean> {
  if (!userId) return false;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });
  if (user?.role === "ADMIN") return true;

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    select: { ownerId: true },
  });
  if (project?.ownerId === userId) return true;

  const membership = await prisma.projectMember.findUnique({
    where: { projectId_userId: { projectId, userId } },
    select: { role: true },
  });
  return membership?.role === "ADMIN";
}

/** Throws if the current user may not administer the project. */
export async function requireProjectAdmin(projectId: string): Promise<string> {
  const userId = await currentUserId();
  const ok = await canAdminProject(projectId, userId);
  if (!userId || !ok) {
    throw new Error("Not authorized to manage this project.");
  }
  return userId;
}
