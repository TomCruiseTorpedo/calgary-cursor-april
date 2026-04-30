import type { AggregateFeedItem, AggregateFeedSource } from "./types";
import { getMockAggregateFeed } from "./mock-aggregate-feed";
import { fetchRssHeadlines } from "./providers/rss-headlines";

/**
 * Rivers of headlines for the left column: live RSS when ingest is on,
 * otherwise (or if live returns nothing) curated mock digest so the UI
 * always explains “where signals come from.”
 */
export async function getAggregateFeedItems(): Promise<{
  items: AggregateFeedItem[];
  source: AggregateFeedSource;
}> {
  const mock = getMockAggregateFeed();

  if (process.env.ENABLE_RSS_INGEST !== "true") {
    return { items: mock, source: "curated" };
  }

  const live = await fetchRssHeadlines();
  if (live.length === 0) {
    return { items: mock, source: "curated" };
  }

  const seen = new Set(live.map((i) => i.url));
  const filler = mock.filter((m) => !seen.has(m.url));
  const merged = [...live, ...filler].slice(0, 22);

  return {
    items: merged,
    source: live.length >= 10 ? "live" : "mixed",
  };
}
