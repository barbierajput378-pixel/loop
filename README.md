# Loop — AI-assisted feedback & roadmap SaaS

> Collect feature requests, let users vote, triage onto a public roadmap, and ship a changelog — with an AI layer that clusters duplicate requests, summarizes themes, and suggests priority.

Loop is a lightweight, multi-tenant [Canny](https://canny.io)-style platform. Every project gets its own public board at `/b/[slug]`, backed by a real Postgres schema.

<!-- Add screenshots / a live link here once deployed:
**Live demo:** https://your-loop.vercel.app
![Board](docs/board.png)
-->

---

## ✨ Features

- **Public feedback boards** — users submit feature requests, bug reports, and improvements, then upvote and comment.
- **Real-time-ish vote counts** — optimistic voting with background revalidation so counts stay fresh across visitors.
- **Public roadmap** — a Planned → In Progress → Shipped kanban that admins triage into.
- **Changelog** — a polished, timeline-style release feed.
- **AI layer (Claude):**
  - **Cluster near-duplicate requests** so demand gets merged into one roadmap item.
  - **Summarize recurring themes** across all feedback.
  - **Suggest priority** per item from engagement + severity signals.
  - Gracefully **falls back to a built-in heuristic** when no API key is set, so the app is always fully functional.
- **Multi-tenant** — isolated projects, boards, and branding per `/b/[slug]`.
- **Auth** — email/password **and** GitHub OAuth (via Auth.js / NextAuth v5).
- **Role-based admin** — global admins, project owners, and project-admin members.
- **Polished, accessible, responsive UI** — light/dark themes, keyboard-focusable controls, semantic markup.
- **Seed script** with realistic demo data across two projects.

## 🧱 Stack

| Layer      | Choice                                             |
| ---------- | -------------------------------------------------- |
| Framework  | Next.js 15 (App Router) + React 19 + TypeScript    |
| Styling    | Tailwind CSS v3 with a token-based theme           |
| Database   | PostgreSQL (Neon / Supabase / local)               |
| ORM        | Prisma 6                                           |
| Auth       | NextAuth v5 (Auth.js) — Credentials + GitHub       |
| AI         | Anthropic Claude (`@anthropic-ai/sdk`) + heuristic |
| Deploy     | Vercel + managed Postgres                          |

## 🚀 Getting started

### 1. Install

```bash
npm install
```

### 2. Configure environment

```bash
cp .env.example .env
```

Fill in `.env`:

- **`DATABASE_URL`** — a Postgres connection string ([Neon](https://neon.tech) or [Supabase](https://supabase.com) both have free tiers).
- **`AUTH_SECRET`** — generate one: `openssl rand -base64 32`.
- **`AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET`** — _optional_. Create a GitHub OAuth app with callback URL `http://localhost:3000/api/auth/callback/github`. If omitted, GitHub sign-in is hidden and email/password still works.
- **`ANTHROPIC_API_KEY`** — _optional_. Without it, AI features use the built-in heuristic.

### 3. Set up the database

```bash
npm run db:push     # create the schema
npm run db:seed     # load demo data (2 projects, users, posts, votes, changelog)
```

### 4. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo credentials (after seeding)

| Role  | Email            | Password      |
| ----- | ---------------- | ------------- |
| Admin | `admin@loop.dev` | `password123` |
| User  | `user1@loop.dev` | `password123` |

Admins see a **Manage** button on any board → triage posts, run AI clustering/themes, and publish changelog entries.

## 🗺️ Routes

| Route                 | Description                                     |
| --------------------- | ----------------------------------------------- |
| `/`                   | Marketing landing + live demo board directory   |
| `/b/[slug]`           | Public feedback board (submit, vote, filter)    |
| `/b/[slug]/p/[id]`    | Post detail + comments + AI summary + duplicates|
| `/b/[slug]/roadmap`   | Public roadmap kanban                           |
| `/b/[slug]/changelog` | Public changelog timeline                       |
| `/login`, `/register` | Auth (email/password + GitHub)                  |
| `/admin`              | Projects you own/administer                     |
| `/admin/[slug]`       | Triage, AI insights, changelog composer         |

## 🧠 How the AI layer works

All AI functions live in [`src/lib/ai.ts`](src/lib/ai.ts). Each one calls Claude when `ANTHROPIC_API_KEY` is present and otherwise runs a deterministic local fallback:

- `summarizePost` — one-line summary + theme tags, computed at post-creation.
- `suggestPriority` — weighs votes, comments, and bug severity.
- `clusterPosts` — groups near-duplicates (fallback: greedy Jaccard over keyword sets).
- `summarizeThemes` — top recurring themes with an insight per theme.

This "always works" design keeps demos, CI, and offline development reliable.

## 🏗️ Project structure

```
prisma/
  schema.prisma        # multi-tenant data model
  seed.ts              # demo data
src/
  auth.ts              # NextAuth v5 config
  lib/                 # prisma, ai, data access, authz, labels, utils
  app/
    actions/           # server actions (posts, votes, comments, admin, ai, auth)
    b/[slug]/           # public board, post, roadmap, changelog
    admin/              # admin dashboard + per-project management
    (auth)/             # login + register
  components/           # UI primitives + feature components
```

## ☁️ Deploying to Vercel

1. Push this repo to GitHub and import it into Vercel.
2. Provision Postgres (Neon/Supabase) and set the env vars from `.env.example` in the Vercel project.
3. Set the GitHub OAuth callback URL to `https://<your-domain>/api/auth/callback/github`.
4. Run `npx prisma db push` and `npm run db:seed` against the production database (or use a migration).

The `build` script runs `prisma generate` automatically.

## 📄 License

MIT — build on it freely.
