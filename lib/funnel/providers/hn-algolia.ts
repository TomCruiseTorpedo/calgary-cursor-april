import type { AggregateFeedItem } from "../types";

const HN_SEARCH = "https://hn.algolia.com/api/v1/search";

type HnHit = {
  objectID: string;
  title: string | null;
  url: string | null;
  points?: number;
  created_at_i?: number;
};

function storyUrl(hit: HnHit): string {
  const u = hit.url?.trim();
  if (u) return u;
  return `https://news.ycombinator.com/item?id=${hit.objectID}`;
}

function stableId(hit: HnHit, idx: number): string {
  return `hn-${hit.objectID}-${idx}`;
}

/**
 * Hacker News via official Algolia search API (no HTML scraping).
 * Default: front page stories (recency + community ranking).
 */
export async function fetchHnAlgoliaHeadlines(): Promise<AggregateFeedItem[]> {
  const hitsPerPage = Math.min(
    30,
    Math.max(5, Number(process.env.HN_ALGOLIA_HITS) || 14),
  );

  const tags =
    process.env.HN_ALGOLIA_TAGS?.trim() || "front_page";
  const query = process.env.HN_ALGOLIA_QUERY?.trim() ?? "";

  const params = new URLSearchParams({
    tags,
    hitsPerPage: String(hitsPerPage),
  });
  if (query) params.set("query", query);

  const ms = Math.min(
    15_000,
    Math.max(5_000, Number(process.env.HN_ALGOLIA_TIMEOUT_MS) || 10_000),
  );

  const ctl = new AbortController();
  const t = setTimeout(() => ctl.abort(), ms);
  try {
    const res = await fetch(`${HN_SEARCH}?${params.toString()}`, {
      headers: { Accept: "application/json" },
      signal: ctl.signal,
    });
    if (!res.ok) return [];

    const data = (await res.json()) as { hits?: HnHit[] };
    const hits = data.hits ?? [];
    const out: AggregateFeedItem[] = [];

    for (let i = 0; i < hits.length; i++) {
      const h = hits[i];
      const title = h.title?.trim();
      if (!title) continue;
      const url = storyUrl(h);
      const publishedAt =
        h.created_at_i != null
          ? new Date(h.created_at_i * 1000).toISOString()
          : undefined;
      out.push({
        id: stableId(h, i),
        title:
          h.points != null ? `${title} (${h.points} pts)` : title,
        url,
        sourceLabel: query
          ? `Hacker News (Algolia · “${query.slice(0, 40)}”)`
          : "Hacker News (front page)",
        publishedAt,
      });
    }
    return out;
  } catch {
    return [];
  } finally {
    clearTimeout(t);
  }
}
