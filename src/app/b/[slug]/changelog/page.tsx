import { notFound } from "next/navigation";
import { Megaphone } from "lucide-react";
import { getProjectBySlug, getChangelog } from "@/lib/data";
import { formatDate } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

export const dynamic = "force-dynamic";

export default async function ChangelogPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug).catch(() => null);
  if (!project) notFound();

  const entries = await getChangelog(project.id);

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Changelog</h1>
        <p className="mt-1 text-sm text-muted">Everything we&apos;ve shipped, newest first.</p>
      </div>

      {entries.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border py-16 text-center">
          <Megaphone size={32} className="text-muted" />
          <p className="mt-3 font-medium">No releases yet</p>
          <p className="text-sm text-muted">Shipped work will show up here.</p>
        </div>
      ) : (
        <div className="relative space-y-10 before:absolute before:left-[7px] before:top-2 before:h-full before:w-px before:bg-border sm:before:left-[calc(9rem+7px)]">
          {entries.map((entry) => (
            <article key={entry.id} className="relative sm:flex sm:gap-8">
              <div className="mb-2 flex items-center gap-3 sm:mb-0 sm:w-36 sm:shrink-0 sm:justify-end sm:pt-0.5">
                <time className="order-2 text-sm font-medium text-muted sm:order-1">
                  {formatDate(entry.publishedAt)}
                </time>
              </div>
              <div className="relative pl-6 sm:pl-6">
                <span className="absolute left-0 top-1.5 h-3.5 w-3.5 rounded-full border-2 border-brand bg-bg sm:-left-[7px]" />
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="text-lg font-semibold tracking-tight">{entry.title}</h2>
                  {entry.version && (
                    <Badge className="bg-brand-soft text-brand font-mono">{entry.version}</Badge>
                  )}
                </div>
                <div className="mt-2 whitespace-pre-wrap text-[15px] leading-relaxed text-fg/90">
                  {entry.body}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
