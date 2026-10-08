import Link from "next/link";
import { MessageSquare, Pin, Layers } from "lucide-react";
import type { PostStatus, PostType } from "@prisma/client";
import { VoteButton } from "@/components/VoteButton";
import { StatusBadge, TypeBadge } from "@/components/Badges";
import { timeAgo } from "@/lib/utils";

export interface PostCardData {
  id: string;
  title: string;
  body: string;
  type: PostType;
  status: PostStatus;
  pinned: boolean;
  createdAt: Date;
  aiSummary: string | null;
  voteCount: number;
  commentCount: number;
  hasVoted: boolean;
  board: { name: string; color: string } | null;
  cluster: { id: string; label: string } | null;
  author: { name: string | null; email: string | null } | null;
}

export function PostCard({
  post,
  projectSlug,
  isAuthed,
}: {
  post: PostCardData;
  projectSlug: string;
  isAuthed: boolean;
}) {
  return (
    <div className="group flex gap-4 rounded-2xl border border-border bg-surface p-4 shadow-subtle transition-all hover:border-brand/30 hover:shadow-card">
      <VoteButton
        postId={post.id}
        projectSlug={projectSlug}
        initialCount={post.voteCount}
        initialVoted={post.hasVoted}
        isAuthed={isAuthed}
      />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          {post.pinned && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-brand">
              <Pin size={12} /> Pinned
            </span>
          )}
          <TypeBadge type={post.type} />
          <StatusBadge status={post.status} />
          {post.board && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              style={{ color: post.board.color, backgroundColor: `${post.board.color}1a` }}
            >
              {post.board.name}
            </span>
          )}
        </div>

        <Link href={`/b/${projectSlug}/p/${post.id}`} className="mt-2 block">
          <h3 className="text-base font-semibold tracking-tight group-hover:text-brand">
            {post.title}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted">
            {post.aiSummary || post.body}
          </p>
        </Link>

        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted">
          <span>{post.author?.name ?? "Anonymous"}</span>
          <span>{timeAgo(post.createdAt)}</span>
          <Link
            href={`/b/${projectSlug}/p/${post.id}`}
            className="inline-flex items-center gap-1 hover:text-fg"
          >
            <MessageSquare size={13} /> {post.commentCount}
          </Link>
          {post.cluster && (
            <span className="inline-flex items-center gap-1 text-brand">
              <Layers size={13} /> {post.cluster.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
