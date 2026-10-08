import { prisma } from "@/lib/prisma";
import type { PostStatus, PostType, Prisma } from "@prisma/client";

export type PostSort = "top" | "new" | "trending";

export interface PostFilters {
  status?: PostStatus;
  type?: PostType;
  boardSlug?: string;
  search?: string;
  sort?: PostSort;
}

export async function getProjectBySlug(slug: string) {
  return prisma.project.findUnique({
    where: { slug },
    include: {
      boards: { orderBy: { name: "asc" } },
      owner: { select: { id: true, name: true, image: true } },
    },
  });
}

export async function listProjects() {
  return prisma.project.findMany({
    orderBy: { createdAt: "asc" },
    include: {
      _count: { select: { posts: true } },
    },
  });
}

export async function getPostsForProject(
  projectId: string,
  filters: PostFilters,
  viewerId: string | null,
) {
  const where: Prisma.PostWhereInput = { projectId };
  if (filters.status) where.status = filters.status;
  if (filters.type) where.type = filters.type;
  if (filters.boardSlug) where.board = { slug: filters.boardSlug };
  if (filters.search) {
    where.OR = [
      { title: { contains: filters.search, mode: "insensitive" } },
      { body: { contains: filters.search, mode: "insensitive" } },
    ];
  }

  const posts = await prisma.post.findMany({
    where,
    include: {
      author: { select: { id: true, name: true, image: true, email: true } },
      board: true,
      cluster: { select: { id: true, label: true } },
      _count: { select: { votes: true, comments: true } },
      votes: viewerId ? { where: { userId: viewerId }, select: { id: true } } : false,
    },
    orderBy:
      filters.sort === "new"
        ? [{ pinned: "desc" }, { createdAt: "desc" }]
        : [{ pinned: "desc" }, { votes: { _count: "desc" } }, { createdAt: "desc" }],
  });

  let decorated = posts.map((p) => ({
    ...p,
    voteCount: p._count.votes,
    commentCount: p._count.comments,
    hasVoted: viewerId ? (p.votes?.length ?? 0) > 0 : false,
  }));

  if (filters.sort === "trending") {
    // Simple time-decayed score: votes / (age in days + 2)^1.5
    decorated = decorated.sort((a, b) => trendScore(b) - trendScore(a));
  }

  return decorated;
}

function trendScore(p: { voteCount: number; commentCount: number; createdAt: Date }) {
  const ageDays = (Date.now() - p.createdAt.getTime()) / 86_400_000;
  return (p.voteCount + p.commentCount * 1.5) / Math.pow(ageDays + 2, 1.5);
}

export async function getPostDetail(projectSlug: string, postId: string, viewerId: string | null) {
  const post = await prisma.post.findFirst({
    where: { id: postId, project: { slug: projectSlug } },
    include: {
      author: { select: { id: true, name: true, image: true, email: true } },
      board: true,
      project: { select: { id: true, slug: true, name: true, ownerId: true } },
      cluster: {
        include: {
          posts: {
            where: { id: { not: postId } },
            select: { id: true, title: true, _count: { select: { votes: true } } },
          },
        },
      },
      comments: {
        orderBy: { createdAt: "asc" },
        include: { author: { select: { id: true, name: true, image: true, email: true } } },
      },
      _count: { select: { votes: true, comments: true } },
      votes: viewerId ? { where: { userId: viewerId }, select: { id: true } } : false,
    },
  });
  if (!post) return null;
  return {
    ...post,
    voteCount: post._count.votes,
    commentCount: post._count.comments,
    hasVoted: viewerId ? (post.votes?.length ?? 0) > 0 : false,
  };
}

export async function getRoadmap(projectId: string, viewerId: string | null) {
  const posts = await prisma.post.findMany({
    where: { projectId, status: { in: ["PLANNED", "IN_PROGRESS", "SHIPPED"] } },
    include: {
      board: true,
      _count: { select: { votes: true, comments: true } },
      votes: viewerId ? { where: { userId: viewerId }, select: { id: true } } : false,
    },
    orderBy: [{ votes: { _count: "desc" } }, { updatedAt: "desc" }],
  });
  return posts.map((p) => ({
    ...p,
    voteCount: p._count.votes,
    commentCount: p._count.comments,
    hasVoted: viewerId ? (p.votes?.length ?? 0) > 0 : false,
  }));
}

export async function getChangelog(projectId: string) {
  return prisma.changelogEntry.findMany({
    where: { projectId },
    orderBy: { publishedAt: "desc" },
  });
}

export async function getProjectStats(projectId: string) {
  const [total, shipped, open, votes] = await Promise.all([
    prisma.post.count({ where: { projectId } }),
    prisma.post.count({ where: { projectId, status: "SHIPPED" } }),
    prisma.post.count({ where: { projectId, status: { in: ["OPEN", "UNDER_REVIEW"] } } }),
    prisma.vote.count({ where: { post: { projectId } } }),
  ]);
  return { total, shipped, open, votes };
}
