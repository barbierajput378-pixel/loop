"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { ChevronUp } from "lucide-react";
import { toggleVote } from "@/app/actions/votes";
import { cn } from "@/lib/utils";

export function VoteButton({
  postId,
  projectSlug,
  initialCount,
  initialVoted,
  isAuthed,
  size = "md",
}: {
  postId: string;
  projectSlug: string;
  initialCount: number;
  initialVoted: boolean;
  isAuthed: boolean;
  size?: "sm" | "md";
}) {
  const router = useRouter();
  const [count, setCount] = useState(initialCount);
  const [voted, setVoted] = useState(initialVoted);
  const [pop, setPop] = useState(false);
  const [isPending, startTransition] = useTransition();

  function onClick() {
    if (!isAuthed) {
      router.push(`/login?callbackUrl=/b/${projectSlug}`);
      return;
    }
    // Optimistic update
    const nextVoted = !voted;
    setVoted(nextVoted);
    setCount((c) => c + (nextVoted ? 1 : -1));
    if (nextVoted) {
      setPop(true);
      setTimeout(() => setPop(false), 300);
    }

    startTransition(async () => {
      const res = await toggleVote(postId, projectSlug);
      if (res.ok && typeof res.count === "number") {
        setCount(res.count);
        setVoted(Boolean(res.voted));
      } else {
        // revert on failure
        setVoted(!nextVoted);
        setCount((c) => c + (nextVoted ? -1 : 1));
      }
    });
  }

  const dims = size === "sm" ? "h-14 w-12 text-sm" : "h-16 w-14";

  return (
    <button
      onClick={onClick}
      disabled={isPending}
      aria-pressed={voted}
      aria-label={voted ? "Remove your vote" : "Upvote"}
      className={cn(
        "group flex shrink-0 flex-col items-center justify-center rounded-xl border transition-all duration-150",
        dims,
        voted
          ? "border-brand bg-brand text-brand-fg shadow-subtle"
          : "border-border bg-surface text-fg hover:border-brand/50 hover:bg-brand-soft",
      )}
    >
      <ChevronUp
        size={size === "sm" ? 16 : 18}
        className={cn("transition-transform", pop && "animate-pop", !voted && "group-hover:-translate-y-0.5")}
        strokeWidth={2.5}
      />
      <span className="font-semibold tabular-nums">{count}</span>
    </button>
  );
}
