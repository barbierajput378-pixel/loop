"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, X } from "lucide-react";
import { createPost, type ActionState } from "@/app/actions/posts";
import { Button } from "@/components/ui/Button";
import { TYPE_META } from "@/lib/labels";
import { cn } from "@/lib/utils";

const initial: ActionState = { ok: false };

export function SubmitForm({
  projectId,
  projectSlug,
  boards,
  isAuthed,
}: {
  projectId: string;
  projectSlug: string;
  boards: { id: string; name: string }[];
  isAuthed: boolean;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<"FEATURE" | "BUG" | "IMPROVEMENT">("FEATURE");
  const [state, formAction, pending] = useActionState(createPost, initial);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok && state.postId) {
      setOpen(false);
      formRef.current?.reset();
      router.push(`/b/${projectSlug}/p/${state.postId}`);
    }
  }, [state, projectSlug, router]);

  if (!open) {
    return (
      <Button
        onClick={() => {
          if (!isAuthed) {
            router.push(`/login?callbackUrl=/b/${projectSlug}`);
            return;
          }
          setOpen(true);
        }}
        className="w-full sm:w-auto"
      >
        <Plus size={18} /> Create post
      </Button>
    );
  }

  return (
    <div className="animate-fade-in rounded-2xl border border-border bg-surface p-5 shadow-card">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-semibold tracking-tight">Share your idea</h3>
        <button
          onClick={() => setOpen(false)}
          className="rounded-lg p-1.5 text-muted hover:bg-surface-2 hover:text-fg"
          aria-label="Close"
        >
          <X size={18} />
        </button>
      </div>

      <form ref={formRef} action={formAction} className="space-y-4">
        <input type="hidden" name="projectId" value={projectId} />
        <input type="hidden" name="projectSlug" value={projectSlug} />
        <input type="hidden" name="type" value={type} />

        <div className="flex flex-wrap gap-2">
          {(Object.keys(TYPE_META) as Array<keyof typeof TYPE_META>).map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setType(t)}
              className={cn(
                "rounded-full border px-3 py-1.5 text-sm font-medium transition-colors",
                type === t
                  ? "border-brand bg-brand-soft text-brand"
                  : "border-border text-muted hover:border-brand/40 hover:text-fg",
              )}
            >
              {TYPE_META[t].emoji} {TYPE_META[t].label}
            </button>
          ))}
        </div>

        {boards.length > 0 && (
          <select
            name="boardId"
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
            defaultValue=""
          >
            <option value="">No board</option>
            {boards.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name}
              </option>
            ))}
          </select>
        )}

        <input
          name="title"
          required
          minLength={4}
          maxLength={140}
          placeholder="Short, descriptive title"
          className="w-full rounded-lg border border-border bg-surface px-3 py-2.5 text-sm font-medium outline-none placeholder:text-muted focus:border-brand"
        />
        <textarea
          name="body"
          rows={4}
          maxLength={5000}
          placeholder="Describe the problem and why it matters. The more context, the better our AI can help us prioritize it."
          className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2.5 text-sm outline-none placeholder:text-muted focus:border-brand"
        />

        {state.error && (
          <p role="alert" className="text-sm text-danger">
            {state.error}
          </p>
        )}

        <div className="flex items-center justify-end gap-2">
          <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button type="submit" disabled={pending}>
            {pending ? "Posting…" : "Post feedback"}
          </Button>
        </div>
      </form>
    </div>
  );
}
