import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { canAdminProject } from "@/lib/authz";
import { aiEnabled } from "@/lib/ai";
import { getProjectStats } from "@/lib/data";
import { AiPanel } from "@/components/admin/AiPanel";
import { ChangelogForm } from "@/components/admin/ChangelogForm";
import { AdminPostRow } from "@/components/admin/AdminPostRow";

export const dynamic = "force-dynamic";

export default async function AdminProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const session = await auth();

  const project = await prisma.project.findUnique({ where: { slug } });
  if (!project) notFound();

  const allowed = await canAdminProject(project.id, session!.user.id);
  if (!allowed) redirect("/admin");

  const [stats, posts] = await Promise.all([
    getProjectStats(project.id),
    prisma.post.findMany({
      where: { projectId: project.id },
      include: {
        cluster: { select: { label: true } },
        _count: { select: { votes: true, comments: true } },
      },
      orderBy: [{ pinned: "desc" }, { votes: { _count: "desc" } }, { createdAt: "desc" }],
    }),
  ]);

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span
            className="flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold text-white"
            style={{ backgroundColor: project.accentColor }}
          >
            {project.name[0]}
          </span>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
            <Link
              href={`/b/${slug}`}
              className="inline-flex items-center gap-1 text-sm text-muted hover:text-brand"
            >
              /b/{slug} <ExternalLink size={12} />
            </Link>
          </div>
        </div>
        <ChangelogForm projectId={project.id} projectSlug={slug} />
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: "Total posts", value: stats.total },
          { label: "Open", value: stats.open },
          { label: "Shipped", value: stats.shipped },
          { label: "Total votes", value: stats.votes },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-surface p-4 shadow-subtle">
            <div className="text-2xl font-bold tabular-nums">{s.value}</div>
            <div className="text-xs text-muted">{s.label}</div>
          </div>
        ))}
      </div>

      <AiPanel projectId={project.id} projectSlug={slug} aiEnabled={aiEnabled()} />

      <div>
        <h2 className="mb-3 text-lg font-semibold tracking-tight">Triage feedback</h2>
        <div className="space-y-3">
          {posts.map((p) => (
            <AdminPostRow
              key={p.id}
              projectId={project.id}
              projectSlug={slug}
              post={{
                id: p.id,
                title: p.title,
                type: p.type,
                status: p.status,
                priority: p.priority,
                pinned: p.pinned,
                voteCount: p._count.votes,
                commentCount: p._count.comments,
                aiPriorityHint: p.aiPriorityHint,
                clusterLabel: p.cluster?.label ?? null,
              }}
            />
          ))}
          {posts.length === 0 && (
            <p className="rounded-xl border border-dashed border-border py-10 text-center text-sm text-muted">
              No feedback yet.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
