import { notFound } from "next/navigation";
import { Inbox } from "lucide-react";
import type { PostStatus, PostType } from "@prisma/client";
import { getProjectBySlug, getPostsForProject, getProjectStats } from "@/lib/data";
import { currentUserId } from "@/lib/authz";
import { SubmitForm } from "@/components/SubmitForm";
import { FilterBar } from "@/components/FilterBar";
import { PostCard } from "@/components/PostCard";
import { VoteRefresher } from "@/components/VoteRefresher";

export const dynamic = "force-dynamic";

export default async function BoardPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const { slug } = await params;
  const sp = await searchParams;

  const project = await getProjectBySlug(slug).catch(() => null);
  if (!project) notFound();

  const userId = await currentUserId();
  const [posts, stats] = await Promise.all([
    getPostsForProject(
      project.id,
      {
        status: (sp.status as PostStatus) || undefined,
        type: (sp.type as PostType) || undefined,
        search: sp.search || undefined,
        sort: (sp.sort as "top" | "new" | "trending") || "top",
      },
      userId,
    ),
    getProjectStats(project.id),
  ]);

  return (
    <div className="space-y-6">
      <VoteRefresher projectId={project.id} />

      {/* Intro + stats */}
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Feedback</h1>
          <p className="mt-1 text-sm text-muted">
            {project.description || "Share ideas, report bugs, and vote on what matters."}
          </p>
        </div>
        <SubmitForm
          projectId={project.id}
          projectSlug={slug}
          boards={project.boards}
          isAuthed={Boolean(userId)}
        />
      </div>

      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Posts", value: stats.total },
          { label: "Votes", value: stats.votes },
          { label: "Shipped", value: stats.shipped },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface p-4 text-center shadow-subtle">
            <div className="text-2xl font-bold tabular-nums">{s.value}</div>
            <div className="text-xs text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      <FilterBar />

      {posts.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Inbox size={32} className="text-muted" />
          <p className="mt-3 font-medium">No posts match your filters</p>
          <p className="text-sm text-muted">Be the first to share an idea.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {posts.map((post) => (
            <PostCard key={post.id} post={post} projectSlug={slug} isAuthed={Boolean(userId)} />
          ))}
        </div>
      )}
    </div>
  );
}
