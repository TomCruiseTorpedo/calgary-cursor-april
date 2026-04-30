import Parser from "rss-parser";
import type { EvidenceKind, EvidenceSignal, ToolCandidate } from "../types";
import feedConfig from "../config/feeds.json";
import keywordConfig from "../config/keywords.json";

type SourceType =
  | "press"
  | "news"
  | "vendor_blog"
  | "community"
  | "dev_forum";

const SOURCE_MAP: Record<
  SourceType,
  { kind: EvidenceKind; weight: number }
> = {
  press: { kind: "press", weight: 0.72 },
  news: { kind: "news", weight: 0.7 },
  vendor_blog: { kind: "vendor_blog", weight: 0.76 },
  community: { kind: "community", weight: 0.64 },
  dev_forum: { kind: "community", weight: 0.62 },
};

const feedTimeoutMs = (() => {
  const n = Number(process.env.RSS_FEED_TIMEOUT_MS);
  return Number.isFinite(n) && n >= 2_000 ? Math.min(n, 30_000) : 8_000;
})();

const parser = new Parser({
  timeout: feedTimeoutMs,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; ai-dev-tools-funnel/0.1; RSS ingest)",
    Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
  },
});

/** Dedupe stories across feeds */
function canonicalArticleUrl(href: string): string {
  try {
    const u = new URL(href);
    u.hash = "";
    for (const k of [
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_content",
      "utm_term",
    ]) {
      u.searchParams.delete(k);
    }
    return u.toString();
  } catch {
    return href;
  }
}

function isRecent(pubDate: string | undefined, maxDays: number): boolean {
  if (!pubDate) return true;
  const t = new Date(pubDate).getTime();
  if (Number.isNaN(t)) return true;
  return Date.now() - t < maxDays * 86_400_000;
}

function isSourceType(s: string): s is SourceType {
  return (
    s === "press" ||
    s === "news" ||
    s === "vendor_blog" ||
    s === "community" ||
    s === "dev_forum"
  );
}

function keywordsConfigTyped(): Record<string, string[]> {
  return keywordConfig.byToolId as Record<string, string[]>;
}

interface GlobalWithRss {
  __rssMergedCache?: { at: number; candidates: ToolCandidate[] };
}

function maxAgeDays(): number {
  const n = Number(process.env.RSS_MAX_AGE_DAYS ?? 14);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 90) : 14;
}

function maxRssEvidencePerTool(): number {
  const n = Number(process.env.RSS_MAX_EVIDENCE_PER_TOOL ?? 12);
  return Number.isFinite(n) && n > 0 ? Math.min(n, 40) : 12;
}

/**
 * Match RSS text against configured phrases; avoids tiny ambiguous tokens.
 */
function matchesPhrase(haystack: string, phrase: string): boolean {
  const p = phrase.trim().toLowerCase();
  if (p.length < 3) return false;
  if (p.length < 5 && !p.includes(" ") && !p.includes(".")) return false;
  return haystack.includes(p);
}

/**
 * Fetch curated feeds, attach convergence-style evidence + bump mention counts.
 * LinkedIn / JS-only sites stay out of scope (use manual seeds later).
 */
export async function augmentCandidatesFromRss(
  base: ToolCandidate[],
): Promise<ToolCandidate[]> {
  const ttl = Number(process.env.RSS_CACHE_TTL_MS ?? 600_000);
  const g = globalThis as GlobalWithRss;
  const now = Date.now();
  if (
    g.__rssMergedCache &&
    now - g.__rssMergedCache.at < ttl
  ) {
    return g.__rssMergedCache.candidates;
  }

  const keywords = keywordsConfigTyped();
  const feeds = feedConfig.feeds as Array<{
    url: string;
    sourceType: string;
    label: string;
  }>;

  const perToolSeenUrl = new Map<string, Set<string>>();
  const perToolRssEvidence = new Map<string, EvidenceSignal[]>();

  function noteSeen(toolId: string, url: string): boolean {
    const canon = canonicalArticleUrl(url);
    let set = perToolSeenUrl.get(toolId);
    if (!set) {
      set = new Set();
      perToolSeenUrl.set(toolId, set);
    }
    if (set.has(canon)) return false;
    set.add(canon);
    return true;
  }

  const cap = maxRssEvidencePerTool();
  const maxDays = maxAgeDays();

  await Promise.allSettled(
    feeds.map(async (feed) => {
      const st = isSourceType(feed.sourceType)
        ? feed.sourceType
        : "community";
      const meta = SOURCE_MAP[st];

      try {
        const parsed = await parser.parseURL(feed.url);
        const items = parsed.items ?? [];
        for (const item of items) {
          const link = item.link?.trim();
          if (!link) continue;
          if (!isRecent(item.pubDate ?? item.isoDate, maxDays)) continue;

          const blob = `${item.title ?? ""} ${item.contentSnippet ?? ""} ${typeof item.content === "string" ? item.content : ""}`;
          const haystack = blob.toLowerCase();

          for (const [toolId, phrases] of Object.entries(keywords)) {
            const hit = phrases.some((phrase) =>
              matchesPhrase(haystack, phrase),
            );
            if (!hit) continue;

            let list = perToolRssEvidence.get(toolId);
            if (!list) {
              list = [];
              perToolRssEvidence.set(toolId, list);
            }
            if (list.length >= cap) continue;
            if (!noteSeen(toolId, link)) continue;

            list.push({
              kind: meta.kind,
              label: item.title?.slice(0, 140) ?? link,
              source: `${feed.label} · RSS`,
              weight: meta.weight,
            });
          }
        }
      } catch {
        // Feed blocked or invalid — continue others (free ingest should degrade gracefully)
      }
    }),
  );

  const merged: ToolCandidate[] = base.map((c) => {
    const extra = perToolRssEvidence.get(c.id) ?? [];
    return {
      ...c,
      mentionCount: c.mentionCount + extra.length,
      evidence: [...c.evidence, ...extra],
    };
  });

  g.__rssMergedCache = { at: now, candidates: merged };
  return merged;
}
