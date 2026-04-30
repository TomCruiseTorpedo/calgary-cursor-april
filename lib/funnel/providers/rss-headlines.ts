import Parser from "rss-parser";
import type { AggregateFeedItem } from "../types";
import feedConfig from "../config/feeds.json";

const timeoutMs = Math.min(
  12_000,
  Math.max(3_000, Number(process.env.RSS_FEED_TIMEOUT_MS) || 8_000),
);

const parser = new Parser({
  timeout: timeoutMs,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; ai-dev-tools-funnel/0.1; aggregate feed)",
    Accept: "application/rss+xml, application/atom+xml, application/xml, text/xml;q=0.9, */*;q=0.8",
  },
});

function stableId(url: string, idx: number): string {
  return `rss-${idx}-${url.slice(0, 48).replace(/\W/g, "")}`;
}

/** Latest headlines from configured feeds — for the aggregate “signal river” UI */
export async function fetchRssHeadlines(): Promise<AggregateFeedItem[]> {
  const feeds = feedConfig.feeds as Array<{
    url: string;
    label: string;
  }>;

  const collected: AggregateFeedItem[] = [];
  let idx = 0;

  for (const feed of feeds) {
    try {
      const parsed = await parser.parseURL(feed.url);
      for (const item of parsed.items ?? []) {
        const link = item.link?.trim();
        const title = item.title?.trim();
        if (!link || !title) continue;
        collected.push({
          id: stableId(link, idx++),
          title,
          url: link,
          sourceLabel: feed.label,
          publishedAt: item.isoDate ?? item.pubDate,
        });
        if (collected.length >= 80) break;
      }
    } catch {
      // skip failed feed
    }
    if (collected.length >= 80) break;
  }

  const seen = new Set<string>();
  const out: AggregateFeedItem[] = [];
  for (const it of collected) {
    if (seen.has(it.url)) continue;
    seen.add(it.url);
    out.push(it);
    if (out.length >= 24) break;
  }
  return out;
}
