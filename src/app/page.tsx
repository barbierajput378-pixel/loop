import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  ThumbsUp,
  Map,
  Megaphone,
  Layers,
  Zap,
  ShieldCheck,
} from "lucide-react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";
import { UserMenu } from "@/components/UserMenu";
import { Button } from "@/components/ui/Button";
import { listProjects } from "@/lib/data";

export const dynamic = "force-dynamic";

async function Projects() {
  let projects: Awaited<ReturnType<typeof listProjects>> = [];
  try {
    projects = await listProjects();
  } catch {
    projects = [];
  }
  if (projects.length === 0) {
    return (
      <p className="text-sm text-muted">
        No boards yet. Run <code className="rounded bg-surface-2 px-1.5 py-0.5 font-mono text-xs">npm run db:seed</code> to load demo data.
      </p>
    );
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {projects.map((p) => (
        <Link
          key={p.id}
          href={`/b/${p.slug}`}
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
              <p className="text-xs text-muted">/b/{p.slug}</p>
            </div>
          </div>
          {p.description && (
            <p className="mt-3 line-clamp-2 text-sm text-muted">{p.description}</p>
          )}
          <div className="mt-4 flex items-center justify-between text-xs text-muted">
            <span>{p._count.posts} posts</span>
            <span className="inline-flex items-center gap-1 font-medium text-brand opacity-0 transition-opacity group-hover:opacity-100">
              Open board <ArrowRight size={13} />
            </span>
          </div>
        </Link>
      ))}
    </div>
  );
}

const features = [
  {
    icon: ThumbsUp,
    title: "Public feedback boards",
    body: "Users submit feature requests and bug reports, upvote what matters, and discuss in threads.",
  },
  {
    icon: Sparkles,
    title: "AI that reads the room",
    body: "Clusters near-duplicate requests, summarizes recurring themes, and suggests priority so you triage in minutes.",
  },
  {
    icon: Map,
    title: "Public roadmap",
    body: "Drag feedback onto Planned → In Progress → Shipped. Customers always know what's coming.",
  },
  {
    icon: Megaphone,
    title: "Changelog",
    body: "Close the loop. Publish polished release notes the moment work ships.",
  },
  {
    icon: Layers,
    title: "Multi-tenant",
    body: "Every project gets its own board at /b/[slug] with isolated data and branding.",
  },
  {
    icon: ShieldCheck,
    title: "Auth & roles",
    body: "Email and GitHub sign-in, with role-based admin controls for your team.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-border/70 glass">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
          <Logo />
          <nav className="flex items-center gap-1 sm:gap-2">
            <Link href="#features" className="hidden px-3 text-sm font-medium text-muted hover:text-fg sm:block">
              Features
            </Link>
            <Link href="#boards" className="hidden px-3 text-sm font-medium text-muted hover:text-fg sm:block">
              Live demo
            </Link>
            <ThemeToggle />
            <UserMenu />
          </nav>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 -z-10 bg-grid" aria-hidden />
          <div className="mx-auto max-w-6xl px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-28">
            <div className="animate-fade-in">
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted shadow-subtle">
                <Sparkles size={13} className="text-brand" />
                AI-assisted feedback & roadmaps
              </span>
            </div>
            <h1 className="mx-auto mt-6 max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-6xl">
              Turn scattered feedback into a roadmap you{" "}
              <span className="bg-gradient-to-r from-brand to-violet-400 bg-clip-text text-transparent">
                actually ship
              </span>
              .
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-balance text-lg text-muted">
              Loop collects feature requests, lets users vote, and uses AI to cluster duplicates
              and surface themes — so you always build what matters most.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
              <Link href="#boards">
                <Button size="lg" className="w-full sm:w-auto">
                  Explore a live board <ArrowRight size={18} />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Sign in
                </Button>
              </Link>
            </div>
            <p className="mt-4 text-xs text-muted">
              No credit card. Seeded with real demo data you can vote on right now.
            </p>
          </div>
        </section>

        {/* Features */}
        <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight">Everything to close the feedback loop</h2>
            <p className="mt-3 text-muted">
              From the first upvote to the shipped changelog entry — one connected flow.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-border bg-surface p-6 shadow-subtle transition-all hover:shadow-card"
              >
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-soft text-brand">
                  <f.icon size={20} />
                </span>
                <h3 className="mt-4 font-semibold tracking-tight">{f.title}</h3>
                <p className="mt-1.5 text-sm text-muted">{f.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Live boards */}
        <section id="boards" className="border-y border-border bg-surface-2/40">
          <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
            <div className="flex items-end justify-between gap-4">
              <div>
                <h2 className="flex items-center gap-2 text-3xl font-bold tracking-tight">
                  <Zap size={26} className="text-brand" /> Live demo boards
                </h2>
                <p className="mt-2 text-muted">
                  Real multi-tenant boards backed by Postgres. Jump in and vote.
                </p>
              </div>
            </div>
            <div className="mt-10">
              <Projects />
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:px-6">
          <div className="flex items-center gap-2">
            <Logo />
          </div>
          <p>Built with Next.js, Prisma, Postgres & Claude. © {new Date().getFullYear()} Loop.</p>
        </div>
      </footer>
    </div>
  );
}
