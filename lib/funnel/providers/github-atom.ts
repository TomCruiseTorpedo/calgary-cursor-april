import Parser from "rss-parser";
import type { AggregateFeedItem } from "../types";
import watchConfig from "../config/github-watch.json";

const timeoutMs = Math.min(
  12_000,
  Math.max(3_000, Number(process.env.RSS_FEED_TIMEOUT_MS) || 8_000),
);

const authHeaders: Record<string, string> = {};
if (process.env.GITHUB_TOKEN?.trim()) {
  authHeaders.Authorization = `Bearer ${process.env.GITHUB_TOKEN.trim()}`;
}

const parser = new Parser({
  timeout: timeoutMs,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; ai-dev-tools-funnel/0.1; github-atom)",
    Accept: "application/atom+xml, application/rss+xml, application/xml;q=0.9, */*;q=0.8",
    ...authHeaders,
  },
});

type WatchConfig = {
  releaseRepos: Array<{ owner: string; repo: string; label: string }>;
  publicUsers: Array<{ login: string; label: string }>;
};

const cfg = watchConfig as WatchConfig;

const perFeedLimit = Math.min(
  8,
  Math.max(2, Number(process.env.GITHUB_ATOM_ITEMS_PER_FEED) || 4),
);

let idSeq = 0;

function nextId(prefix: string, url: string): string {
  idSeq += 1;
  return `${prefix}-${idSeq}-${url.slice(0, 36).replace(/\W/g, "")}`;
}

async function parseAtomUrl(
  url: string,
  sourceLabel: string,
  prefix: string,
): Promise<AggregateFeedItem[]> {
  const out: AggregateFeedItem[] = [];
  try {
    const parsed = await parser.parseURL(url);
    let n = 0;
    for (const item of parsed.items ?? []) {
      if (n >= perFeedLimit) break;
      const link = item.link?.trim();
      const title = item.title?.trim();
      if (!link || !title) continue;
      out.push({
        id: nextId(prefix, link),
        title,
        url: link,
        sourceLabel,
        publishedAt: item.isoDate ?? item.pubDate,
      });
      n++;
    }
  } catch {
    // skip blocked / private / renamed repos
  }
  return out;
}

/**
 * GitHub public Atom: per-repo releases + per-user public activity.
 * Curated list: `lib/funnel/config/github-watch.json`.
 */
export async function fetchGithubWatchHeadlines(): Promise<AggregateFeedItem[]> {
  if (process.env.ENABLE_GITHUB_ATOM === "false") {
    return [];
  }

  idSeq = 0;

  const tasks: Promise<AggregateFeedItem[]>[] = [
    ...cfg.releaseRepos.map((r) =>
      parseAtomUrl(
        `https://github.com/${r.owner}/${r.repo}/releases.atom`,
        r.label,
        "gh-rel",
      ),
    ),
    ...cfg.publicUsers.map((u) =>
      parseAtomUrl(`https://github.com/${u.login}.atom`, u.label, "gh-user"),
    ),
  ];

  const batches = await Promise.all(tasks);
  const collected = batches.flat();

  const seen = new Set<string>();
  const deduped: AggregateFeedItem[] = [];
  for (const it of collected) {
    if (seen.has(it.url)) continue;
    seen.add(it.url);
    deduped.push(it);
  }

  const cap = Math.min(
    48,
    Math.max(12, Number(process.env.GITHUB_ATOM_MAX_TOTAL) || 28),
  );
  return deduped.slice(0, cap);
}
