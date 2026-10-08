import { PrismaClient, PostStatus, PostType, Priority } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

type SeedPost = {
  title: string;
  body: string;
  type: PostType;
  status: PostStatus;
  priority?: Priority;
  board?: string;
  votes: number; // target vote count
  comments?: { body: string; official?: boolean }[];
  clusterKey?: string; // posts sharing a key are grouped
};

async function main() {
  console.log("🌱 Seeding Loop…");

  // --- Reset (dev only) ---
  await prisma.$transaction([
    prisma.vote.deleteMany(),
    prisma.comment.deleteMany(),
    prisma.post.deleteMany(),
    prisma.cluster.deleteMany(),
    prisma.changelogEntry.deleteMany(),
    prisma.board.deleteMany(),
    prisma.projectMember.deleteMany(),
    prisma.project.deleteMany(),
    prisma.account.deleteMany(),
    prisma.session.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const passwordHash = await bcrypt.hash("password123", 10);

  const admin = await prisma.user.create({
    data: {
      name: "Avery Admin",
      email: "admin@loop.dev",
      passwordHash,
      role: "ADMIN",
    },
  });

  const voterNames = [
    "Jordan Lee", "Sam Rivera", "Priya Nair", "Diego Costa", "Mei Tanaka",
    "Lena Fischer", "Tom Bauer", "Nadia Haddad", "Chris Okafor", "Isla Murphy",
    "Ravi Patel", "Sofia Rossi", "Ben Carter", "Yuki Sato", "Olga Petrova",
  ];
  const voters = await Promise.all(
    voterNames.map((name, i) =>
      prisma.user.create({
        data: {
          name,
          email: `user${i + 1}@loop.dev`,
          passwordHash,
        },
      }),
    ),
  );
  const allUsers = [admin, ...voters];

  async function seedProject(opts: {
    slug: string;
    name: string;
    description: string;
    accentColor: string;
    boards: { slug: string; name: string; color: string }[];
    posts: SeedPost[];
    changelog: { title: string; body: string; version?: string; daysAgo: number }[];
  }) {
    const project = await prisma.project.create({
      data: {
        slug: opts.slug,
        name: opts.name,
        description: opts.description,
        accentColor: opts.accentColor,
        ownerId: admin.id,
      },
    });

    const boardMap = new Map<string, string>();
    for (const b of opts.boards) {
      const board = await prisma.board.create({
        data: { projectId: project.id, slug: b.slug, name: b.name, color: b.color },
      });
      boardMap.set(b.slug, board.id);
    }

    const clusterMap = new Map<string, string[]>();

    for (const p of opts.posts) {
      const author = pick(allUsers);
      const themes = topWords(`${p.title} ${p.body}`);
      const created = await prisma.post.create({
        data: {
          projectId: project.id,
          boardId: p.board ? boardMap.get(p.board) ?? null : null,
          authorId: author.id,
          title: p.title,
          body: p.body,
          type: p.type,
          status: p.status,
          priority: p.priority ?? null,
          aiSummary: p.body.split(". ")[0].slice(0, 110),
          aiThemes: JSON.stringify(themes),
        },
      });

      // Votes — unique users up to target count.
      const shuffled = [...allUsers].sort(() => Math.random() - 0.5).slice(0, Math.min(p.votes, allUsers.length));
      for (const u of shuffled) {
        await prisma.vote.create({ data: { postId: created.id, userId: u.id } }).catch(() => {});
      }

      for (const c of p.comments ?? []) {
        await prisma.comment.create({
          data: {
            postId: created.id,
            authorId: c.official ? admin.id : pick(voters).id,
            body: c.body,
            isOfficial: Boolean(c.official),
          },
        });
      }

      if (p.clusterKey) {
        const arr = clusterMap.get(p.clusterKey) ?? [];
        arr.push(created.id);
        clusterMap.set(p.clusterKey, arr);
      }
    }

    // Build clusters for keys with 2+ posts.
    for (const [key, ids] of clusterMap) {
      if (ids.length < 2) continue;
      const cluster = await prisma.cluster.create({
        data: {
          projectId: project.id,
          label: key,
          summary: `${ids.length} related requests about ${key.toLowerCase()}.`,
        },
      });
      await prisma.post.updateMany({ where: { id: { in: ids } }, data: { clusterId: cluster.id } });
    }

    for (const c of opts.changelog) {
      await prisma.changelogEntry.create({
        data: {
          projectId: project.id,
          title: c.title,
          body: c.body,
          version: c.version ?? null,
          publishedAt: daysAgo(c.daysAgo),
        },
      });
    }

    console.log(`  ✓ ${opts.name} (/b/${opts.slug}) — ${opts.posts.length} posts`);
    return project;
  }

  await seedProject({
    slug: "nimbus",
    name: "Nimbus",
    description: "The calm project tracker for small teams. Vote on what we build next.",
    accentColor: "#6366f1",
    boards: [
      { slug: "features", name: "Feature Requests", color: "#6366f1" },
      { slug: "bugs", name: "Bugs", color: "#e11d48" },
    ],
    posts: [
      {
        title: "Dark mode for the whole app",
        body: "Working late is rough with the bright white UI. A proper dark theme (not just the editor) would save my eyes. Please respect the OS setting too.",
        type: "FEATURE", status: "IN_PROGRESS", priority: "HIGH", board: "features", votes: 14,
        clusterKey: "Dark mode",
        comments: [
          { body: "Yes please, my eyes are begging." },
          { body: "We're building this right now — shipping in the next release.", official: true },
        ],
      },
      {
        title: "Please add a dark theme",
        body: "The app is blinding at night. Any chance of a dark mode option in settings?",
        type: "FEATURE", status: "PLANNED", board: "features", votes: 9, clusterKey: "Dark mode",
      },
      {
        title: "Keyboard shortcuts for navigation",
        body: "Power users want to move between projects and tasks without the mouse. Cmd+K command palette would be ideal.",
        type: "FEATURE", status: "PLANNED", priority: "MEDIUM", board: "features", votes: 11,
        comments: [{ body: "A command palette would be a game changer." }],
      },
      {
        title: "Slack integration for task updates",
        body: "Post a message to a Slack channel when a task moves to Done. We live in Slack and keep missing updates.",
        type: "FEATURE", status: "UNDER_REVIEW", board: "features", votes: 8, clusterKey: "Integrations",
      },
      {
        title: "GitHub integration — link PRs to tasks",
        body: "Would love to attach a GitHub pull request to a task and have the status sync automatically.",
        type: "FEATURE", status: "OPEN", board: "features", votes: 7, clusterKey: "Integrations",
      },
      {
        title: "Recurring tasks",
        body: "Some chores repeat weekly. Let me set a task to recur every Monday instead of recreating it.",
        type: "FEATURE", status: "OPEN", board: "features", votes: 6,
      },
      {
        title: "CSV export of all tasks",
        body: "For reporting I need to export the full task list with statuses and assignees to a CSV.",
        type: "FEATURE", status: "OPEN", board: "features", votes: 4,
      },
      {
        title: "Drag-and-drop broken on Safari",
        body: "On Safari 17 I can't drag cards between columns — the card just snaps back. Works fine in Chrome.",
        type: "BUG", status: "IN_PROGRESS", priority: "CRITICAL", board: "bugs", votes: 12,
        comments: [{ body: "Confirmed, reproduced on our side. Fix is in review.", official: true }],
      },
      {
        title: "Notification emails sent twice",
        body: "Every assignment triggers two identical emails. Started after the last update.",
        type: "BUG", status: "PLANNED", priority: "HIGH", board: "bugs", votes: 5,
      },
      {
        title: "Mobile layout overflows on small screens",
        body: "On my iPhone SE the sidebar pushes content off-screen and there's a horizontal scroll.",
        type: "BUG", status: "OPEN", board: "bugs", votes: 3,
      },
      {
        title: "Faster board loading for big projects",
        body: "Boards with 500+ tasks take several seconds to load. Virtualize the list?",
        type: "IMPROVEMENT", status: "UNDER_REVIEW", board: "features", votes: 10,
      },
      {
        title: "Two-factor authentication",
        body: "We handle sensitive client work and need 2FA (TOTP) for all accounts before we can roll this out company-wide.",
        type: "FEATURE", status: "SHIPPED", priority: "HIGH", board: "features", votes: 13,
        comments: [{ body: "Shipped in v2.3 — enable it under Security settings.", official: true }],
      },
      {
        title: "Customizable task statuses",
        body: "Our workflow isn't just To-do / Doing / Done. Let us define our own columns and colors.",
        type: "FEATURE", status: "SHIPPED", board: "features", votes: 15,
      },
    ],
    changelog: [
      {
        title: "Custom statuses & board colors",
        version: "v2.4",
        daysAgo: 3,
        body: "You can now define your own task statuses and color-code columns to match your workflow. Head to Project Settings → Workflow to customize.",
      },
      {
        title: "Two-factor authentication",
        version: "v2.3",
        daysAgo: 21,
        body: "TOTP-based 2FA is here. Enable it under Security settings. Admins can require it org-wide.",
      },
      {
        title: "Performance: 40% faster boards",
        version: "v2.2",
        daysAgo: 40,
        body: "We rebuilt board rendering with virtualization. Large projects now load noticeably faster.",
      },
    ],
  });

  await seedProject({
    slug: "postwave",
    name: "Postwave",
    description: "Email marketing that doesn't feel like a spreadsheet. Tell us what to build.",
    accentColor: "#0ea5e9",
    boards: [
      { slug: "features", name: "Features", color: "#0ea5e9" },
      { slug: "bugs", name: "Bugs", color: "#e11d48" },
    ],
    posts: [
      {
        title: "A/B testing for subject lines",
        body: "Let me test two subject lines on a small sample and auto-send the winner to the rest of the list.",
        type: "FEATURE", status: "IN_PROGRESS", priority: "HIGH", board: "features", votes: 16,
        comments: [{ body: "This is top of our list — in active development.", official: true }],
      },
      {
        title: "Drag-and-drop email builder",
        body: "The HTML editor is painful. A visual block-based builder would make campaigns way faster.",
        type: "FEATURE", status: "PLANNED", priority: "HIGH", board: "features", votes: 18,
        clusterKey: "Email builder",
      },
      {
        title: "Visual editor for emails",
        body: "Please add a WYSIWYG editor so non-technical teammates can build emails without touching code.",
        type: "FEATURE", status: "OPEN", board: "features", votes: 9, clusterKey: "Email builder",
      },
      {
        title: "Zapier integration",
        body: "Trigger campaigns from Zapier when a new row is added to a Google Sheet.",
        type: "FEATURE", status: "UNDER_REVIEW", board: "features", votes: 7,
      },
      {
        title: "Schedule sends in subscriber timezone",
        body: "Send at 9am local time for each subscriber instead of one global time.",
        type: "FEATURE", status: "PLANNED", board: "features", votes: 12,
      },
      {
        title: "Unsubscribe link sometimes 404s",
        body: "A few subscribers reported the unsubscribe link leads to a 404. Compliance risk!",
        type: "BUG", status: "IN_PROGRESS", priority: "CRITICAL", board: "bugs", votes: 6,
      },
      {
        title: "Open rate stats seem too high",
        body: "My open rates jumped to 95% overnight which can't be right — maybe bot/proxy opens are counted?",
        type: "BUG", status: "OPEN", board: "bugs", votes: 4,
      },
      {
        title: "Audience segmentation by tags",
        body: "Let me build segments from subscriber tags and activity (opened last 30 days, clicked X).",
        type: "FEATURE", status: "SHIPPED", priority: "HIGH", board: "features", votes: 14,
      },
      {
        title: "Resend to non-openers",
        body: "One click to resend a campaign to everyone who didn't open it, with a new subject line.",
        type: "IMPROVEMENT", status: "OPEN", board: "features", votes: 8,
      },
    ],
    changelog: [
      {
        title: "Audience segmentation is live",
        version: "v1.6",
        daysAgo: 5,
        body: "Build dynamic segments from tags and engagement. Target the right people with far less effort.",
      },
      {
        title: "Deliverability improvements",
        version: "v1.5",
        daysAgo: 30,
        body: "New dedicated IP warmup and DMARC guidance to keep you out of spam folders.",
      },
    ],
  });

  const totalUsers = await prisma.user.count();
  const totalPosts = await prisma.post.count();
  const totalVotes = await prisma.vote.count();
  console.log(`\n✅ Done. ${totalUsers} users, ${totalPosts} posts, ${totalVotes} votes.`);
  console.log("\n🔑 Admin login:  admin@loop.dev  /  password123");
  console.log("👤 Demo user:    user1@loop.dev  /  password123\n");
}

// --- helpers ---
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}
function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}
const STOP = new Set(["the", "a", "an", "and", "or", "to", "of", "in", "on", "for", "with", "my", "is", "it", "me", "let", "would", "please", "add", "like", "can"]);
function topWords(text: string): string[] {
  const counts = new Map<string, number>();
  for (const w of text.toLowerCase().replace(/[^a-z0-9\s]/g, " ").split(/\s+/)) {
    if (w.length > 3 && !STOP.has(w)) counts.set(w, (counts.get(w) ?? 0) + 1);
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3).map(([w]) => w);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
