"use client";

import { useActionState, useEffect, useRef } from "react";
import { addComment, type CommentState } from "@/app/actions/comments";
import { Button } from "@/components/ui/Button";

const initial: CommentState = { ok: false };

export function CommentForm({
  postId,
  projectId,
  projectSlug,
}: {
  postId: string;
  projectId: string;
  projectSlug: string;
}) {
  const [state, action, pending] = useActionState(addComment, initial);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) ref.current?.reset();
  }, [state]);

  return (
    <form ref={ref} action={action} className="space-y-3">
      <input type="hidden" name="postId" value={postId} />
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="projectSlug" value={projectSlug} />
      <textarea
        name="body"
        rows={3}
        required
        maxLength={3000}
        placeholder="Add a comment…"
        className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none placeholder:text-muted focus:border-brand"
      />
      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      <div className="flex justify-end">
        <Button type="submit" disabled={pending}>
          {pending ? "Posting…" : "Comment"}
        </Button>
      </div>
    </form>
  );
}
