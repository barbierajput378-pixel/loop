"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { Megaphone, Check } from "lucide-react";
import { publishChangelog, type ChangelogState } from "@/app/actions/admin";
import { Button } from "@/components/ui/Button";

const initial: ChangelogState = { ok: false };

export function ChangelogForm({
  projectId,
  projectSlug,
}: {
  projectId: string;
  projectSlug: string;
}) {
  const [state, action, pending] = useActionState(publishChangelog, initial);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState(false);
  const ref = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (state.ok) {
      ref.current?.reset();
      setDone(true);
      const t = setTimeout(() => {
        setDone(false);
        setOpen(false);
      }, 1500);
      return () => clearTimeout(t);
    }
  }, [state]);

  if (!open) {
    return (
      <Button variant="outline" onClick={() => setOpen(true)}>
        <Megaphone size={16} /> Publish changelog
      </Button>
    );
  }

  return (
    <form ref={ref} action={action} className="space-y-3 rounded-2xl border border-border bg-surface p-5 shadow-subtle">
      <input type="hidden" name="projectId" value={projectId} />
      <input type="hidden" name="projectSlug" value={projectSlug} />
      <div className="flex gap-2">
        <input
          name="title"
          required
          placeholder="Release title (e.g. Dark mode is here)"
          className="flex-1 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium outline-none focus:border-brand"
        />
        <input
          name="version"
          placeholder="v1.2.0"
          className="w-28 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-mono outline-none focus:border-brand"
        />
      </div>
      <textarea
        name="body"
        rows={4}
        required
        placeholder="What shipped? Markdown-friendly plain text."
        className="w-full resize-y rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-brand"
      />
      {state.error && <p className="text-sm text-danger">{state.error}</p>}
      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
          Cancel
        </Button>
        <Button type="submit" disabled={pending || done}>
          {done ? (
            <>
              <Check size={16} /> Published
            </>
          ) : pending ? (
            "Publishing…"
          ) : (
            "Publish"
          )}
        </Button>
      </div>
    </form>
  );
}
