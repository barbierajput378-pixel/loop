import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Layers, Sparkles, ShieldCheck } from "lucide-react";
import { getPostDetail } from "@/lib/data";
import { currentUserId } from "@/lib/authz";
import { auth } from "@/auth";
import { VoteButton } from "@/components/VoteButton";
import { StatusBadge, TypeBadge } from "@/components/Badges";
import { Avatar } from "@/components/ui/Avatar";
import { CommentForm } from "@/components/CommentForm";
import { Badge } from "@/components/ui/Badge";
import { timeAgo, formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ slug: string; postId: string }>;
}) {
  const { slug, postId } = await params;
  const userId = await currentUserId();
  const session = await auth();
  const post = await getPostDetail(slug, postId, userId).catch(() => null);
  if (!post) notFound();

  const themes: string[] = post.aiThemes ? safeParse(post.aiThemes) : [];

  return (
    <div className="space-y-6">
      <Link
        href={`/b/${slug}`}
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted hover:text-fg"
      >
        <ArrowLeft size={16} /> Back to board
      </Link>

      <div className="flex gap-5">
        <VoteButton
          postId={post.id}
          projectSlug={slug}
          initialCount={post.voteCount}
          initialVoted={post.hasVoted}
          isAuthed={Boolean(userId)}
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <TypeBadge type={post.type} />
            <StatusBadge status={post.status} />
          </div>
          <h1 className="mt-3 text-2xl font-bold tracking-tight text-balance">{post.title}</h1>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted">
            <Avatar name={post.author?.name} email={post.author?.email} size={20} />
            <span>{post.author?.name ?? "Anonymous"}</span>
            <span>·</span>
            <span>{formatDate(post.createdAt)}</span>
          </div>

          {post.body && (
            <div className="mt-5 whitespace-pre-wrap text-[15px] leading-relaxed text-fg/90">
              {post.body}
            </div>
          )}

          {(post.aiSummary || themes.length > 0) && (
            <div className="mt-5 rounded-xl border border-brand/20 bg-brand-soft/50 p-4">
              <div className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-brand">
                <Sparkles size={13} /> AI summary
              </div>
              {post.aiSummary && <p className="mt-1.5 text-sm text-fg/90">{post.aiSummary}</p>}
              {themes.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {themes.map((t) => (
                    <Badge key={t} className="bg-surface text-muted">
                      #{t}
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          )}

          {post.cluster && post.cluster.posts.length > 0 && (
            <div className="mt-5 rounded-xl border border-border bg-surface-2/50 p-4">
              <div className="flex items-center gap-1.5 text-sm font-semibold">
                <Layers size={15} className="text-brand" /> Related requests · {post.cluster.label}
              </div>
              <ul className="mt-2 space-y-1.5">
                {post.cluster.posts.map((rp) => (
                  <li key={rp.id}>
                    <Link
                      href={`/b/${slug}/p/${rp.id}`}
                      className="flex items-center justify-between gap-2 text-sm text-muted hover:text-brand"
                    >
                      <span className="truncate">{rp.title}</span>
                      <span className="shrink-0 tabular-nums">{rp._count.votes} ▲</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>

      {/* Comments */}
      <section className="border-t border-border pt-6">
        <h2 className="text-lg font-semibold tracking-tight">
          {post.commentCount} {post.commentCount === 1 ? "comment" : "comments"}
        </h2>

        <div className="mt-5 space-y-5">
          {post.comments.map((c) => (
            <div key={c.id} className="flex gap-3">
              <Avatar name={c.author?.name} email={c.author?.email} src={c.author?.image} size={36} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-sm font-medium">{c.author?.name ?? "Anonymous"}</span>
                  {c.isOfficial && (
                    <Badge className="bg-brand text-brand-fg">
                      <ShieldCheck size={11} /> Team
                    </Badge>
                  )}
                  <span className="text-xs text-muted">{timeAgo(c.createdAt)}</span>
                </div>
                <p className="mt-1 whitespace-pre-wrap text-sm text-fg/90">{c.body}</p>
              </div>
            </div>
          ))}
          {post.comments.length === 0 && (
            <p className="text-sm text-muted">No comments yet. Start the discussion.</p>
          )}
        </div>

        <div className="mt-6">
          {session?.user ? (
            <CommentForm postId={post.id} projectId={post.project.id} projectSlug={slug} />
          ) : (
            <Link
              href={`/login?callbackUrl=/b/${slug}/p/${post.id}`}
              className="block rounded-lg border border-dashed border-border py-4 text-center text-sm text-muted hover:border-brand hover:text-brand"
            >
              Sign in to join the discussion
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}

function safeParse(json: string): string[] {
  try {
    const arr = JSON.parse(json);
    return Array.isArray(arr) ? arr.slice(0, 6) : [];
  } catch {
    return [];
  }
}
