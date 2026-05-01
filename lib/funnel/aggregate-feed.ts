import type { AggregateFeedItem, AggregateFeedSource } from "./types";
import { getMockAggregateFeed } from "./mock-aggregate-feed";
import { fetchGithubWatchHeadlines } from "./providers/github-atom";
import { fetchHnAlgoliaHeadlines } from "./providers/hn-algolia";
import { fetchRssHeadlines } from "./providers/rss-headlines";

function canonicalUrl(href: string): string {
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

/** Dedupe by URL; keep newest `publishedAt` when duplicates appear across sources */
function mergeAggregateStreams(streams: AggregateFeedItem[][]): AggregateFeedItem[] {
  const best = new Map<string, AggregateFeedItem>();
  for (const items of streams) {
    for (const it of items) {
      const key = canonicalUrl(it.url);
      const prev = best.get(key);
      const tNew = it.publishedAt ? Date.parse(it.publishedAt) : 0;
      const tPrev = prev?.publishedAt ? Date.parse(prev.publishedAt) : 0;
      if (!prev || tNew >= tPrev) best.set(key, it);
    }
  }
  const arr = [...best.values()];
  arr.sort((a, b) => {
    const ta = a.publishedAt ? Date.parse(a.publishedAt) : 0;
    const tb = b.publishedAt ? Date.parse(b.publishedAt) : 0;
    return tb - ta;
  });
  return arr;
}

async function fetchLiveAggregate(): Promise<AggregateFeedItem[]> {
  const hnOff = process.env.ENABLE_HN_ALGOLIA === "false";
  const ghOff = process.env.ENABLE_GITHUB_ATOM === "false";

  const [rss, hn, gh] = await Promise.all([
    fetchRssHeadlines(),
    hnOff ? Promise.resolve([] as AggregateFeedItem[]) : fetchHnAlgoliaHeadlines(),
    ghOff ? Promise.resolve([] as AggregateFeedItem[]) : fetchGithubWatchHeadlines(),
  ]);

  return mergeAggregateStreams([rss, hn, gh]);
}

/**
 * Rivers of headlines: RSS + HN Algolia + GitHub Atom when ingest is on,
 * otherwise curated mock digest so the UI always shows provenance.
 */
export async function getAggregateFeedItems(): Promise<{
  items: AggregateFeedItem[];
  source: AggregateFeedSource;
}> {
  const mock = getMockAggregateFeed();

  if (process.env.ENABLE_RSS_INGEST !== "true") {
    return { items: mock, source: "curated" };
  }

  const live = await fetchLiveAggregate();
  if (live.length === 0) {
    return { items: mock, source: "curated" };
  }

  const seen = new Set(live.map((i) => canonicalUrl(i.url)));
  const filler = mock.filter((m) => !seen.has(canonicalUrl(m.url)));
  const merged = [...live, ...filler].slice(0, 40);

  return {
    items: merged,
    source: live.length >= 14 ? "live" : "mixed",
  };
}
