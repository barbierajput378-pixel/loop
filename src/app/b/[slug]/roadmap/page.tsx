import { notFound } from "next/navigation";
import Link from "next/link";
import type { PostStatus } from "@prisma/client";
import { getProjectBySlug, getRoadmap } from "@/lib/data";
import { currentUserId } from "@/lib/authz";
import { VoteButton } from "@/components/VoteButton";
import { TypeBadge } from "@/components/Badges";
import { VoteRefresher } from "@/components/VoteRefresher";
import { ROADMAP_COLUMNS, STATUS_META } from "@/lib/labels";

export const dynamic = "force-dynamic";

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug).catch(() => null);
  if (!project) notFound();

  const userId = await currentUserId();
  const posts = await getRoadmap(project.id, userId);

  const byColumn = (status: PostStatus) => posts.filter((p) => p.status === status);

  return (
    <div className="space-y-6">
      <VoteRefresher projectId={project.id} />
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Roadmap</h1>
        <p className="mt-1 text-sm text-muted">What we&apos;re planning, building, and have shipped.</p>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {ROADMAP_COLUMNS.map((status) => {
          const items = byColumn(status);
          const meta = STATUS_META[status];
          return (
            <div key={status} className="rounded-2xl border border-border bg-surface-2/40 p-3">
              <div className="mb-3 flex items-center justify-between px-2 pt-1">
                <div className="flex items-center gap-2">
                  <span className={`h-2.5 w-2.5 rounded-full ${meta.dot}`} />
                  <h2 className="font-semibold tracking-tight">{meta.label}</h2>
                </div>
                <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted">
                  {items.length}
                </span>
              </div>
              <div className="space-y-2.5">
                {items.map((post) => (
                  <div
                    key={post.id}
                    className="flex gap-3 rounded-xl border border-border bg-surface p-3 shadow-subtle transition-shadow hover:shadow-card"
                  >
                    <VoteButton
                      postId={post.id}
                      projectSlug={slug}
                      initialCount={post.voteCount}
                      initialVoted={post.hasVoted}
                      isAuthed={Boolean(userId)}
                      size="sm"
                    />
                    <div className="min-w-0 flex-1">
                      <Link
                        href={`/b/${slug}/p/${post.id}`}
                        className="text-sm font-semibold tracking-tight hover:text-brand"
                      >
                        {post.title}
                      </Link>
                      <div className="mt-1.5">
                        <TypeBadge type={post.type} />
                      </div>
                    </div>
                  </div>
                ))}
                {items.length === 0 && (
                  <p className="px-2 py-6 text-center text-sm text-muted">Nothing here yet.</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
