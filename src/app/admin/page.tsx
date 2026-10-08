import Link from "next/link";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const session = await auth();
  const userId = session!.user.id;
  const isGlobalAdmin = session!.user.role === "ADMIN";

  const projects = await prisma.project.findMany({
    where: isGlobalAdmin
      ? undefined
      : {
          OR: [
            { ownerId: userId },
            { members: { some: { userId, role: "ADMIN" } } },
          ],
        },
    include: { _count: { select: { posts: true } } },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
          <LayoutDashboard size={22} />
        </span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Your projects</h1>
          <p className="text-sm text-muted">Manage feedback, roadmap and releases.</p>
        </div>
      </div>

      {projects.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border py-16 text-center">
          <p className="font-medium">You don&apos;t manage any projects yet</p>
          <p className="mt-1 text-sm text-muted">
            Projects you own or administer will appear here.
          </p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {projects.map((p) => (
            <Link
              key={p.id}
              href={`/admin/${p.slug}`}
              className="group rounded-2xl border border-border bg-surface p-5 shadow-subtle transition-all hover:-translate-y-0.5 hover:shadow-card"
            >
              <div className="flex items-center gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-lg font-bold text-white"
                  style={{ backgroundColor: p.accentColor }}
                >
                  {p.name[0]}
                </span>
                <div>
                  <h3 className="font-semibold tracking-tight group-hover:text-brand">{p.name}</h3>
                  <p className="text-xs text-muted">{p._count.posts} posts · /b/{p.slug}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-sm font-medium text-brand">
                Manage <ArrowRight size={14} />
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
