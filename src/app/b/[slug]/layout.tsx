import { notFound } from "next/navigation";
import Link from "next/link";
import { Settings } from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { BoardNav } from "@/components/BoardNav";
import { getProjectBySlug } from "@/lib/data";
import { canAdminProject, currentUserId } from "@/lib/authz";

export const dynamic = "force-dynamic";

export default async function BoardLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = await getProjectBySlug(slug).catch(() => null);
  if (!project) notFound();

  const userId = await currentUserId();
  const isAdmin = await canAdminProject(project.id, userId);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/70 glass">
        <div className="mx-auto max-w-5xl px-4 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-3">
              <Logo />
              <span className="text-border">/</span>
              <div className="flex items-center gap-2">
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-sm font-bold text-white"
                  style={{ backgroundColor: project.accentColor }}
                >
                  {project.name[0]}
                </span>
                <span className="font-semibold tracking-tight">{project.name}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-2">
              {isAdmin && (
                <Link
                  href={`/admin/${slug}`}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted hover:bg-surface-2 hover:text-fg"
                >
                  <Settings size={16} />
                  <span className="hidden sm:inline">Manage</span>
                </Link>
              )}
              <ThemeToggle />
              <UserMenu callbackUrl={`/b/${slug}`} />
            </div>
          </div>
          <BoardNav slug={slug} />
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8 sm:px-6">{children}</main>
    </div>
  );
}
