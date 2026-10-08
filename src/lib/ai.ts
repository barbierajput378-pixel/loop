import Anthropic from "@anthropic-ai/sdk";

/**
 * AI layer for Loop.
 *
 * Every function here calls Claude when `ANTHROPIC_API_KEY` is set, and
 * otherwise falls back to a deterministic local heuristic so the product is
 * always fully functional — demos, CI and offline dev never break.
 */

const MODEL = process.env.ANTHROPIC_MODEL || "claude-haiku-5-5";

export function aiEnabled(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let client: Anthropic | null = null;
function getClient(): Anthropic | null {
  if (!aiEnabled()) return null;
  if (!client) client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
  return client;
}

async function askClaudeJSON<T>(system: string, user: string, fallback: T): Promise<T> {
  const c = getClient();
  if (!c) return fallback;
  try {
    const res = await c.messages.create({
      model: MODEL,
      max_tokens: 1024,
      system,
      messages: [{ role: "user", content: user }],
    });
    const text = res.content
      .filter((b): b is Anthropic.TextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const match = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
    if (!match) return fallback;
    return JSON.parse(match[0]) as T;
  } catch (err) {
    console.error("[ai] Claude call failed, using fallback:", err);
    return fallback;
  }
}

// ---------------------------------------------------------------------------
// Tokenisation helpers (shared by the heuristic fallbacks)
// ---------------------------------------------------------------------------

const STOP_WORDS = new Set([
  "the", "a", "an", "and", "or", "but", "to", "of", "in", "on", "for", "with",
  "is", "are", "be", "it", "this", "that", "i", "we", "you", "would", "could",
  "should", "can", "will", "add", "please", "want", "need", "like", "when",
  "able", "make", "app", "feature", "support", "ability", "option", "allow",
]);

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP_WORDS.has(w));
}

function keywords(text: string, limit = 6): string[] {
  const counts = new Map<string, number>();
  for (const w of tokenize(text)) counts.set(w, (counts.get(w) ?? 0) + 1);
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([w]) => w);
}

function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const x of a) if (b.has(x)) inter++;
  return inter / (a.size + b.size - inter);
}

// ---------------------------------------------------------------------------
// 1. Summarise a single post → one-line summary + themes
// ---------------------------------------------------------------------------

export interface PostSummary {
  summary: string;
  themes: string[];
}

export async function summarizePost(title: string, body: string): Promise<PostSummary> {
  const fallback: PostSummary = {
    summary: title.length > 90 ? title.slice(0, 87) + "…" : title,
    themes: keywords(`${title} ${body}`, 3),
  };

  return askClaudeJSON<PostSummary>(
    "You are a product analyst. Summarise user feedback crisply and neutrally. Respond ONLY with JSON.",
    `Summarise this feedback item in one sentence (max 18 words) and extract up to 3 short theme tags (1-2 words, lowercase).

Title: ${title}
Body: ${body}

Respond with JSON: {"summary": string, "themes": string[]}`,
    fallback,
  );
}

// ---------------------------------------------------------------------------
// 2. Suggest a priority for a post
// ---------------------------------------------------------------------------

export interface PriorityInput {
  title: string;
  body: string;
  type: string;
  votes: number;
  comments: number;
}

export interface PrioritySuggestion {
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  reason: string;
}

export async function suggestPriority(input: PriorityInput): Promise<PrioritySuggestion> {
  // Heuristic: demand (votes/comments) + bug severity.
  const engagement = input.votes + input.comments * 2;
  let level: PrioritySuggestion["priority"] = "LOW";
  if (engagement >= 40 || (input.type === "BUG" && engagement >= 15)) level = "CRITICAL";
  else if (engagement >= 18) level = "HIGH";
  else if (engagement >= 6) level = "MEDIUM";

  const fallback: PrioritySuggestion = {
    priority: level,
    reason: `${input.votes} votes and ${input.comments} comments${
      input.type === "BUG" ? " on a bug report" : ""
    } indicate ${level.toLowerCase()} priority.`,
  };

  return askClaudeJSON<PrioritySuggestion>(
    "You are a pragmatic product manager prioritising a roadmap. Respond ONLY with JSON.",
    `Given this feedback item and its engagement, suggest a priority.

Type: ${input.type}
Title: ${input.title}
Body: ${input.body}
Upvotes: ${input.votes}
Comments: ${input.comments}

Weigh user demand (votes/comments), severity (bugs blocking users are higher), and effort signals.
Respond with JSON: {"priority": "LOW"|"MEDIUM"|"HIGH"|"CRITICAL", "reason": string (max 24 words)}`,
    fallback,
  );
}

// ---------------------------------------------------------------------------
// 3. Cluster near-duplicate posts
// ---------------------------------------------------------------------------

export interface ClusterablePost {
  id: string;
  title: string;
  body: string;
}

export interface ClusterResult {
  label: string;
  summary: string;
  postIds: string[];
}

export async function clusterPosts(posts: ClusterablePost[]): Promise<ClusterResult[]> {
  if (posts.length < 2) return [];

  // --- Heuristic fallback: greedy Jaccard clustering on keyword sets. ---
  const heuristic = (): ClusterResult[] => {
    const sets = posts.map((p) => ({
      post: p,
      tokens: new Set(tokenize(`${p.title} ${p.title} ${p.body}`)),
    }));
    const used = new Set<string>();
    const clusters: ClusterResult[] = [];

    for (let i = 0; i < sets.length; i++) {
      if (used.has(sets[i].post.id)) continue;
      const group = [sets[i]];
      used.add(sets[i].post.id);
      for (let j = i + 1; j < sets.length; j++) {
        if (used.has(sets[j].post.id)) continue;
        if (jaccard(sets[i].tokens, sets[j].tokens) >= 0.3) {
          group.push(sets[j]);
          used.add(sets[j].post.id);
        }
      }
      if (group.length >= 2) {
        const merged = group.flatMap((g) => [...g.tokens]).join(" ");
        const top = keywords(merged, 3);
        clusters.push({
          label: top.map((w) => w[0].toUpperCase() + w.slice(1)).join(" ") || "Related requests",
          summary: `${group.length} related requests about ${top.join(", ")}.`,
          postIds: group.map((g) => g.post.id),
        });
      }
    }
    return clusters;
  };

  return askClaudeJSON<ClusterResult[]>(
    "You are a product analyst grouping near-duplicate user feedback. Respond ONLY with a JSON array.",
    `Group these feedback items into clusters of near-duplicates or the same underlying request. Only group items that are genuinely about the same thing. Leave unique items out.

${posts.map((p) => `[${p.id}] ${p.title} — ${p.body.slice(0, 160)}`).join("\n")}

Respond with a JSON array: [{"label": short cluster name, "summary": one sentence, "postIds": string[] (at least 2 ids)}]`,
    heuristic(),
  );
}

// ---------------------------------------------------------------------------
// 4. Summarise overall themes across a board
// ---------------------------------------------------------------------------

export interface ThemeInsight {
  theme: string;
  count: number;
  insight: string;
}

export async function summarizeThemes(
  posts: { title: string; body: string; votes: number }[],
): Promise<ThemeInsight[]> {
  if (posts.length === 0) return [];

  const heuristic = (): ThemeInsight[] => {
    const counts = new Map<string, { count: number; votes: number }>();
    for (const p of posts) {
      for (const w of new Set(keywords(`${p.title} ${p.body}`, 4))) {
        const cur = counts.get(w) ?? { count: 0, votes: 0 };
        counts.set(w, { count: cur.count + 1, votes: cur.votes + p.votes });
      }
    }
    return [...counts.entries()]
      .filter(([, v]) => v.count >= 2)
      .sort((a, b) => b[1].votes - a[1].votes)
      .slice(0, 5)
      .map(([theme, v]) => ({
        theme: theme[0].toUpperCase() + theme.slice(1),
        count: v.count,
        insight: `${v.count} requests (${v.votes} total votes) mention “${theme}”.`,
      }));
  };

  return askClaudeJSON<ThemeInsight[]>(
    "You are a product strategist distilling feedback into themes. Respond ONLY with a JSON array.",
    `Identify the top recurring themes across this feedback. For each, give the theme name, how many items relate to it, and a one-sentence insight for the product team.

${posts
  .map((p, i) => `${i + 1}. (${p.votes} votes) ${p.title} — ${p.body.slice(0, 140)}`)
  .join("\n")}

Respond with a JSON array (max 5): [{"theme": string, "count": number, "insight": string}]`,
    heuristic(),
  );
}
